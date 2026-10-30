import { validateAuthOptions } from './config/auth.config.js'
import { createTokenService } from './config/jwt.utils.js'
import { createAuthController } from './controllers/auth.controller.js'
import { createAuthLimiter } from './middleware/authLimiter.js'
import { createCorsMiddleware } from './middleware/cors.js'
import { createCookieCsrfProtection } from './middleware/csrf.js'
import { createRequireAuth } from './middleware/requireAuth.js'
import { createGoogleVerifier } from './providers/google.provider.js'
import { createAuthRouter } from './routes/auth.routes.js'

const requiredAdapterMethods = {
  userAdapter: ['findByProviderId', 'findByEmail', 'findByEmailWithPassword', 'create', 'findById', 'updateProfile'],
  sessionAdapter: ['create', 'rotateByTokenHash', 'deleteByTokenHash', 'deleteByUserId'],
}

const assertAdapter = (name, adapter) => {
  for (const method of requiredAdapterMethods[name]) {
    if (typeof adapter?.[method] !== 'function') {
      throw new Error(`${name}.${method} must be a function`)
    }
  }
}

const errorHandler = (error, req, res, next) => {
  if (res.headersSent) return next(error)

  const status = error?.status === 403 ? 403 : error?.type === 'entity.parse.failed' ? 400 : 500
  const code = error?.code === 'CORS_ORIGIN_REJECTED'
    ? 'CORS_ORIGIN_REJECTED'
    : status === 400 ? 'INVALID_JSON' : 'INTERNAL_ERROR'
  const message = status === 403
    ? 'Request origin is not allowed'
    : status === 400 ? 'Invalid request body' : 'Unexpected server error'

  return res.status(status).json({ success: false, code, message })
}

export const createAuth = (options) => {
  const config = validateAuthOptions(options)
  const { userAdapter, sessionAdapter } = options
  assertAdapter('userAdapter', userAdapter)
  assertAdapter('sessionAdapter', sessionAdapter)

  const tokenService = createTokenService(config.jwt)
  const googleVerifier = options.googleVerifier ?? createGoogleVerifier({
    googleClientId: config.googleClientId,
    googleClient: options.googleClient,
  })
  if (typeof googleVerifier !== 'function') {
    throw new Error('googleVerifier must be a function')
  }

  const requireAuth = createRequireAuth(tokenService)
  const csrfProtection = createCookieCsrfProtection(config.corsOrigins)
  const authLimiter = createAuthLimiter(options.rateLimit)
  const controller = createAuthController({
    userAdapter,
    sessionAdapter,
    tokenService,
    googleVerifier,
    cookie: config.cookie,
  })

  return {
    router: createAuthRouter({ controller, requireAuth, authLimiter, csrfProtection }),
    middleware: {
      cors: createCorsMiddleware(config.corsOrigins),
      requireAuth,
      csrfProtection,
    },
    errorHandler,
    appOptions: { trustProxy: config.trustProxy },
    tokenService,
  }
}

export { createGoogleVerifier } from './providers/google.provider.js'
