import bcrypt from 'bcryptjs'
import hashToken from '../config/token-hash.js'

const PASSWORD_COST = 12

const publicUser = (user) => ({
  id: String(user._id ?? user.id),
  name: user.name,
  email: user.email,
  picture: user.picture ?? null,
})

const send = (res, status, code, message, extra = {}) => res.status(status).json({
  success: status < 400,
  ...(code ? { code } : {}),
  message,
  ...extra,
})

const isDuplicateKey = (error) => error?.code === 11000

const cookieOptions = (cookie, maxAge) => ({
  httpOnly: true,
  secure: cookie.secure,
  sameSite: cookie.sameSite,
  path: cookie.path,
  ...(cookie.domain ? { domain: cookie.domain } : {}),
  ...(maxAge === undefined ? {} : { maxAge }),
})

const clearRefreshCookie = (res, cookie) => res.clearCookie(
  cookie.name,
  cookieOptions(cookie),
)

const setRefreshCookie = (res, cookie, token, payload) => {
  const maxAge = Math.max(0, (payload.exp * 1_000) - Date.now())
  res.cookie(cookie.name, token, cookieOptions(cookie, maxAge))
}

export const createAuthController = ({
  userAdapter,
  sessionAdapter,
  tokenService,
  googleVerifier,
  cookie,
}) => {
  const createSession = async (res, user, status, message, extra = {}) => {
    const accessToken = tokenService.generateAccessToken(user)
    const refreshToken = tokenService.generateRefreshToken(user)
    const refreshPayload = tokenService.verifyRefreshToken(refreshToken)

    await sessionAdapter.create({
      userId: user._id ?? user.id,
      tokenHash: hashToken(refreshToken),
      expiresAt: new Date(refreshPayload.exp * 1_000),
    })
    setRefreshCookie(res, cookie, refreshToken, refreshPayload)
    return send(res, status, null, message, { ...extra, accessToken, user: publicUser(user) })
  }

  const register = async (req, res) => {
    const { name, email, password } = req.body

    try {
      if (await userAdapter.findByEmail(email)) {
        return send(res, 409, 'EMAIL_ALREADY_REGISTERED', 'An account with this email already exists')
      }

      const passwordHash = await bcrypt.hash(password, PASSWORD_COST)
      const user = await userAdapter.create({
        name,
        email,
        passwordHash,
        providers: [{ provider: 'password', providerId: email }],
      })

      return await createSession(res, user, 201, 'Registration successful', { isNewUser: true })
    } catch (error) {
      if (isDuplicateKey(error)) {
        return send(res, 409, 'EMAIL_ALREADY_REGISTERED', 'An account with this email already exists')
      }
      return send(res, 500, 'DATABASE_ERROR', 'Authentication service is temporarily unavailable')
    }
  }

  const login = async (req, res) => {
    const { email, password } = req.body

    try {
      const user = await userAdapter.findByEmailWithPassword(email)
      const credentialsValid = Boolean(user?.passwordHash)
        && await bcrypt.compare(password, user.passwordHash)

      if (!credentialsValid) {
        return send(res, 401, 'INVALID_CREDENTIALS', 'Email or password is incorrect')
      }

      return await createSession(res, user, 200, 'Login successful', { isNewUser: false })
    } catch {
      return send(res, 500, 'DATABASE_ERROR', 'Authentication service is temporarily unavailable')
    }
  }

  const googleAuth = async (req, res) => {
    let googleUser
    try {
      googleUser = await googleVerifier(req.body.idToken)
    } catch {
      return send(res, 401, 'INVALID_GOOGLE_TOKEN', 'Google token is invalid or expired')
    }

    if (googleUser.provider !== 'google' || !googleUser.providerId || googleUser.emailVerified !== true) {
      return send(res, 403, 'UNVERIFIED_GOOGLE_EMAIL', 'Google email is not verified')
    }

    let user
    let isNewUser = false
    try {
      user = await userAdapter.findByProviderId('google', googleUser.providerId)
      if (!user) {
        const emailOwner = await userAdapter.findByEmail(googleUser.email)
        if (emailOwner) {
          return send(
            res,
            409,
            'EMAIL_ALREADY_REGISTERED',
            'An account with this email already exists. Sign in using its existing method.',
          )
        }

        try {
          user = await userAdapter.create({
            name: googleUser.name,
            email: googleUser.email,
            picture: googleUser.picture,
            providers: [{ provider: 'google', providerId: googleUser.providerId }],
          })
          isNewUser = true
        } catch (error) {
          if (!isDuplicateKey(error)) throw error

          user = await userAdapter.findByProviderId('google', googleUser.providerId)
          if (!user) {
            return send(res, 409, 'ACCOUNT_CONFLICT', 'An account with this identity already exists.')
          }
        }
      }

      return await createSession(
        res,
        user,
        200,
        isNewUser ? 'Google sign-up successful' : 'Google sign-in successful',
        { isNewUser },
      )
    } catch (error) {
      if (isDuplicateKey(error)) {
        return send(res, 409, 'SESSION_CONFLICT', 'Please sign in again')
      }
      return send(res, 500, 'DATABASE_ERROR', 'Authentication service is temporarily unavailable')
    }
  }

  const refreshAuth = async (req, res) => {
    const refreshToken = req.cookies?.[cookie.name]
    if (!refreshToken) {
      return send(res, 401, 'REFRESH_TOKEN_REQUIRED', 'Refresh token is required')
    }

    let payload
    try {
      payload = tokenService.verifyRefreshToken(refreshToken)
    } catch {
      clearRefreshCookie(res, cookie)
      return send(res, 401, 'INVALID_REFRESH_TOKEN', 'Refresh token is invalid or expired')
    }

    let user
    try {
      user = await userAdapter.findById(payload.sub)
    } catch {
      return send(res, 500, 'DATABASE_ERROR', 'Authentication service is temporarily unavailable')
    }
    if (!user) {
      clearRefreshCookie(res, cookie)
      return send(res, 401, 'INVALID_REFRESH_SESSION', 'Refresh session is invalid or expired')
    }

    try {
      const accessToken = tokenService.generateAccessToken(user)
      const nextRefreshToken = tokenService.generateRefreshToken(user)
      const nextPayload = tokenService.verifyRefreshToken(nextRefreshToken)
      const session = await sessionAdapter.rotateByTokenHash({
        tokenHash: hashToken(refreshToken),
        newTokenHash: hashToken(nextRefreshToken),
        userId: user._id ?? user.id,
        expiresAt: new Date(nextPayload.exp * 1_000),
      })

      if (!session) {
        clearRefreshCookie(res, cookie)
        return send(res, 401, 'INVALID_REFRESH_SESSION', 'Refresh session is invalid or expired')
      }

      setRefreshCookie(res, cookie, nextRefreshToken, nextPayload)
      return send(res, 200, null, 'Tokens refreshed successfully', { accessToken })
    } catch (error) {
      if (isDuplicateKey(error)) {
        return send(res, 503, 'SESSION_ROTATION_RETRY', 'Please retry the refresh request')
      }
      return send(res, 500, 'DATABASE_ERROR', 'Authentication service is temporarily unavailable')
    }
  }

  const logout = async (req, res) => {
    const refreshToken = req.cookies?.[cookie.name]
    try {
      if (refreshToken) await sessionAdapter.deleteByTokenHash(hashToken(refreshToken))
      clearRefreshCookie(res, cookie)
      return send(res, 200, null, 'Logged out successfully')
    } catch {
      return send(res, 500, 'DATABASE_ERROR', 'Logout could not be completed')
    }
  }

  const logoutAll = async (req, res) => {
    try {
      await sessionAdapter.deleteByUserId(req.user.id)
      clearRefreshCookie(res, cookie)
      return send(res, 200, null, 'All sessions have been logged out')
    } catch {
      return send(res, 500, 'DATABASE_ERROR', 'Logout could not be completed')
    }
  }

  const profile = async (req, res) => {
    try {
      const user = await userAdapter.findById(req.user.id)
      if (!user) return send(res, 401, 'ACCOUNT_NOT_FOUND', 'User account not found')
      return send(res, 200, null, 'Profile retrieved', { user: publicUser(user) })
    } catch {
      return send(res, 500, 'DATABASE_ERROR', 'Profile service is temporarily unavailable')
    }
  }

  const updateProfile = async (req, res) => {
    try {
      const user = await userAdapter.updateProfile(req.user.id, req.body)
      if (!user) return send(res, 401, 'ACCOUNT_NOT_FOUND', 'User account not found')
      return send(res, 200, null, 'Profile updated', { user: publicUser(user) })
    } catch {
      return send(res, 500, 'DATABASE_ERROR', 'Profile service is temporarily unavailable')
    }
  }

  const syncUser = async (req, res) => {
    try {
      const { name, email, picture, sub } = req.body
      if (!email) {
        return send(res, 400, 'VALIDATION_ERROR', 'Email is required')
      }

      const providerName = (sub && typeof sub === 'string' && sub.includes('|'))
        ? sub.split('|')[0]
        : 'auth0'
      const providerId = sub || email

      let user = await userAdapter.findByEmail(email)

      if (user) {
        const hasProvider = user.providers?.some(
          (p) => p.provider === providerName && p.providerId === providerId,
        )
        if (!hasProvider) {
          user.providers.push({ provider: providerName, providerId })
        }
        if (name && (!user.name || user.name === email.split('@')[0])) {
          user.name = name
        }
        if (picture && !user.picture) {
          user.picture = picture
        }
        await user.save()
      } else {
        user = await userAdapter.create({
          name: name || email.split('@')[0],
          email,
          picture: picture ?? null,
          providers: [{ provider: providerName, providerId }],
        })
      }

      const accessToken = tokenService.generateAccessToken(user)
      return send(res, 200, null, 'User synced successfully', {
        user: publicUser(user),
        accessToken,
      })
    } catch (error) {
      return send(res, 500, 'DATABASE_ERROR', 'Failed to sync user')
    }
  }

  return { register, login, googleAuth, refreshAuth, logout, logoutAll, profile, updateProfile, syncUser }
}
