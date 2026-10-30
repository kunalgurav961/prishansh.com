import assert from 'node:assert/strict'
import { once } from 'node:events'
import http from 'node:http'
import test from 'node:test'
import jwt from 'jsonwebtoken'
import { createApp } from '../app/app.js'
import { createAuth, createGoogleVerifier } from '../auth/index.js'

const accessSecret = 'a'.repeat(48)
const refreshSecret = 'b'.repeat(48)
const password = 'this is a valid password'

const duplicateKey = () => Object.assign(new Error('duplicate key'), { code: 11000 })

const createAdapters = () => {
  const users = new Map()
  const emailIndex = new Map()
  const providerIndex = new Map()
  const sessions = new Map()
  let nextId = 1
  let failUserLookup = false

  const userAdapter = {
    async findByProviderId(provider, providerId) {
      if (failUserLookup) throw new Error('database unavailable')
      return users.get(providerIndex.get(`${provider}:${providerId}`)) ?? null
    },
    async findByEmail(email) {
      if (failUserLookup) throw new Error('database unavailable')
      return users.get(emailIndex.get(email.toLowerCase())) ?? null
    },
    async findByEmailWithPassword(email) {
      if (failUserLookup) throw new Error('database unavailable')
      return users.get(emailIndex.get(email.toLowerCase())) ?? null
    },
    async create(input) {
      const email = input.email.toLowerCase()
      if (emailIndex.has(email)) throw duplicateKey()

      for (const provider of input.providers ?? []) {
        if (providerIndex.has(`${provider.provider}:${provider.providerId}`)) throw duplicateKey()
      }

      const user = { _id: String(nextId++), ...input, email }
      users.set(user._id, user)
      emailIndex.set(email, user._id)
      for (const provider of input.providers ?? []) {
        providerIndex.set(`${provider.provider}:${provider.providerId}`, user._id)
      }
      return user
    },
    async findById(id) {
      if (failUserLookup) throw new Error('database unavailable')
      return users.get(String(id)) ?? null
    },
    async updateProfile(id, profile) {
      const user = users.get(String(id))
      if (!user) return null
      Object.assign(user, profile)
      return user
    },
  }

  const sessionAdapter = {
    async create(session) {
      if (sessions.has(session.tokenHash)) throw duplicateKey()
      sessions.set(session.tokenHash, { ...session })
    },
    async rotateByTokenHash({ tokenHash, newTokenHash, userId, expiresAt }) {
      const session = sessions.get(tokenHash)
      if (!session || String(session.userId) !== String(userId) || session.expiresAt <= new Date()) return null
      if (sessions.has(newTokenHash)) throw duplicateKey()
      sessions.delete(tokenHash)
      const next = { ...session, tokenHash: newTokenHash, expiresAt }
      sessions.set(newTokenHash, next)
      return next
    },
    async deleteByTokenHash(tokenHash) {
      sessions.delete(tokenHash)
    },
    async deleteByUserId(userId) {
      for (const [tokenHash, session] of sessions) {
        if (String(session.userId) === String(userId)) sessions.delete(tokenHash)
      }
    },
  }

  return {
    userAdapter,
    sessionAdapter,
    users,
    sessions,
    setFailUserLookup: (value) => { failUserLookup = value },
  }
}

const fakeGoogleVerifier = async (idToken) => {
  if (idToken === 'invalid') throw new Error('bad signature')
  if (idToken === 'unverified') {
    return { provider: 'google', providerId: 'unverified', email: 'unverified@example.com', emailVerified: false }
  }

  const providerId = idToken === 'same-email-different-sub' ? 'other-sub' : idToken
  return {
    provider: 'google',
    providerId,
    email: idToken === 'same-email-different-sub' ? 'valid@example.com' : `${providerId}@example.com`,
    emailVerified: true,
    name: 'Test User',
    picture: 'https://example.com/avatar.png',
  }
}

const startApp = async () => {
  const adapters = createAdapters()
  const auth = createAuth({
    googleClientId: 'test-client.apps.googleusercontent.com',
    ...adapters,
    googleVerifier: fakeGoogleVerifier,
    jwt: {
      accessSecret,
      refreshSecret,
      accessExpiresIn: '15m',
      refreshExpiresIn: '7d',
    },
    cookie: { path: '/api/auth', secure: false },
    corsOrigins: ['https://app.example.test'],
    rateLimit: { limit: 100 },
  })
  const server = http.createServer(createApp(auth))
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')
  const { port } = server.address()

  return {
    ...adapters,
    baseUrl: `http://127.0.0.1:${port}`,
    close: () => new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve())),
  }
}

const request = async (ctx, path, options = {}) => {
  const response = await fetch(`${ctx.baseUrl}${path}`, options)
  const contentType = response.headers.get('content-type') ?? ''
  return {
    status: response.status,
    body: contentType.includes('application/json') ? await response.json() : await response.text(),
    cookie: response.headers.get('set-cookie'),
    headers: response.headers,
  }
}

const cookieValue = (cookie) => cookie?.match(/^refreshToken=([^;]+)/)?.[1]
const cookieHeader = (cookie) => `refreshToken=${cookieValue(cookie)}`
const register = (ctx, body = {}) => request(ctx, '/api/auth/register', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ name: 'Test User', email: 'valid@example.com', password, ...body }),
})
const login = (ctx, body = {}) => request(ctx, '/api/auth/login', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ email: 'valid@example.com', password, ...body }),
})
const googleLogin = (ctx, idToken = 'valid') => request(ctx, '/api/auth/google', {
  method: 'POST',
  headers: { 'content-type': 'application/json' },
  body: JSON.stringify({ idToken }),
})

test('Google verifier sends the configured audience and requires a verified email', async () => {
  let args
  const verifier = createGoogleVerifier({
    googleClientId: 'client-id',
    googleClient: {
      verifyIdToken: async (value) => {
        args = value
        return { getPayload: () => ({ sub: 'google-sub', email: 'USER@example.com', email_verified: true }) }
      },
    },
  })

  const user = await verifier('signed-google-token')
  assert.deepEqual(args, { idToken: 'signed-google-token', audience: 'client-id' })
  assert.equal(user.providerId, 'google-sub')
  assert.equal(user.email, 'user@example.com')

  const unverified = createGoogleVerifier({
    googleClientId: 'client-id',
    googleClient: { verifyIdToken: async () => ({ getPayload: () => ({ sub: 'x', email: 'x@example.com', email_verified: false }) }) },
  })
  await assert.rejects(unverified('token'))
})

test('registration hashes passwords, creates a session, and validates input', async (t) => {
  const ctx = await startApp()
  t.after(ctx.close)

  const invalid = await register(ctx, { password: 'short' })
  assert.equal(invalid.status, 400)
  assert.equal(invalid.body.code, 'INVALID_REQUEST')

  const signedUp = await register(ctx)
  assert.equal(signedUp.status, 201)
  assert.equal(signedUp.body.success, true)
  assert.equal(signedUp.body.user.email, 'valid@example.com')
  assert.equal('password' in signedUp.body.user, false)
  assert.equal('passwordHash' in signedUp.body.user, false)
  assert.match(signedUp.cookie, /HttpOnly/)
  assert.equal(ctx.users.get(signedUp.body.user.id).passwordHash === password, false)
  assert.match(ctx.users.get(signedUp.body.user.id).passwordHash, /^\$2[aby]\$/)

  const duplicate = await register(ctx)
  assert.equal(duplicate.status, 409)
  assert.equal(duplicate.body.code, 'EMAIL_ALREADY_REGISTERED')
})

test('login validates credentials and access tokens protect current-user routes', async (t) => {
  const ctx = await startApp()
  t.after(ctx.close)
  await register(ctx)

  assert.equal((await login(ctx, { password: 'wrong password' })).status, 401)
  assert.equal((await login(ctx, { email: 'missing@example.com' })).status, 401)

  const signedIn = await login(ctx)
  assert.equal(signedIn.status, 200)
  assert.ok(signedIn.body.accessToken)
  assert.equal((await request(ctx, '/api/auth/me')).status, 401)
  assert.equal((await request(ctx, '/api/auth/me', {
    headers: { authorization: `Bearer ${signedIn.body.accessToken}` },
  })).status, 200)
  assert.equal((await request(ctx, '/api/auth/profile', {
    method: 'PATCH',
    headers: {
      authorization: `Bearer ${signedIn.body.accessToken}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ email: 'attacker@example.com' }),
  })).status, 400)
  const updated = await request(ctx, '/api/auth/profile', {
    method: 'PATCH',
    headers: {
      authorization: `Bearer ${signedIn.body.accessToken}`,
      'content-type': 'application/json',
    },
    body: JSON.stringify({ name: 'Updated User' }),
  })
  assert.equal(updated.status, 200)
  assert.equal(updated.body.user.name, 'Updated User')

  const expired = jwt.sign({ sub: signedIn.body.user.id, type: 'access' }, accessSecret, {
    algorithm: 'HS256', expiresIn: -1, issuer: 'sucheta-kothari-api', audience: 'sucheta-kothari-web',
  })
  assert.equal((await request(ctx, '/api/auth/me', {
    headers: { authorization: `Bearer ${expired}` },
  })).status, 401)
})

test('Google sign-up validates identity, avoids unsafe email linking, and returns sessions', async (t) => {
  const ctx = await startApp()
  t.after(ctx.close)

  assert.equal((await request(ctx, '/api/auth/google', {
    method: 'POST', headers: { 'content-type': 'application/json' }, body: '{}',
  })).status, 400)
  assert.equal((await googleLogin(ctx, 'invalid')).status, 401)
  assert.equal((await googleLogin(ctx, 'unverified')).status, 403)

  const concurrent = await Promise.all([googleLogin(ctx), googleLogin(ctx)])
  assert.deepEqual(concurrent.map((result) => result.status), [200, 200])
  assert.deepEqual(concurrent.map((result) => result.body.isNewUser).sort(), [false, true])
  assert.equal(ctx.users.size, 1)

  const conflict = await googleLogin(ctx, 'same-email-different-sub')
  assert.equal(conflict.status, 409)
  assert.equal(conflict.body.code, 'EMAIL_ALREADY_REGISTERED')
})

test('refresh rotation is single-use and logout revokes the current session', async (t) => {
  const ctx = await startApp()
  t.after(ctx.close)
  const signedUp = await register(ctx)
  const firstCookie = signedUp.cookie

  assert.equal((await request(ctx, '/api/auth/refresh', { method: 'POST' })).status, 401)
  const refreshed = await request(ctx, '/api/auth/refresh', {
    method: 'POST', headers: { cookie: cookieHeader(firstCookie) },
  })
  assert.equal(refreshed.status, 200)
  assert.ok(cookieValue(refreshed.cookie))
  assert.equal((await request(ctx, '/api/auth/refresh', {
    method: 'POST', headers: { cookie: cookieHeader(firstCookie) },
  })).status, 401)

  const logout = await request(ctx, '/api/auth/logout', {
    method: 'POST', headers: { cookie: cookieHeader(refreshed.cookie) },
  })
  assert.equal(logout.status, 200)
  assert.equal((await request(ctx, '/api/auth/refresh', {
    method: 'POST', headers: { cookie: cookieHeader(refreshed.cookie) },
  })).status, 401)
})

test('logout-all revokes every refresh session and CORS never accepts untrusted origins', async (t) => {
  const ctx = await startApp()
  t.after(ctx.close)
  const signedUp = await register(ctx)
  const signedIn = await login(ctx)
  assert.equal(ctx.sessions.size, 2)

  const logoutAll = await request(ctx, '/api/auth/logout-all', {
    method: 'POST',
    headers: { authorization: `Bearer ${signedUp.body.accessToken}` },
  })
  assert.equal(logoutAll.status, 200)
  assert.equal(ctx.sessions.size, 0)
  assert.equal((await request(ctx, '/api/auth/refresh', {
    method: 'POST', headers: { cookie: cookieHeader(signedIn.cookie) },
  })).status, 401)

  const rejected = await request(ctx, '/api/auth/login', {
    method: 'POST',
    headers: { origin: 'https://untrusted.example', 'content-type': 'application/json' },
    body: JSON.stringify({ email: 'valid@example.com', password }),
  })
  assert.equal(rejected.status, 403)
  assert.equal(rejected.body.code, 'CORS_ORIGIN_REJECTED')
})

test('configuration and database errors do not expose internals', async (t) => {
  assert.throws(() => createAuth({
    googleClientId: 'x',
    jwt: { accessSecret, refreshSecret },
  }), /userAdapter/)
  assert.throws(() => createAuth({
    googleClientId: 'x',
    ...createAdapters(),
    googleVerifier: fakeGoogleVerifier,
    jwt: { accessSecret, refreshSecret: accessSecret },
  }), /different/)

  const ctx = await startApp()
  t.after(ctx.close)
  ctx.setFailUserLookup(true)
  const response = await login(ctx)
  assert.equal(response.status, 500)
  assert.equal(response.body.code, 'DATABASE_ERROR')
  assert.equal(response.body.message.includes('database unavailable'), false)
})
