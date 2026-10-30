const durationPattern = /^(\d+)(ms|s|m|h|d)$/
const durationUnits = {
  ms: 1,
  s: 1_000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000,
}

const required = (value, name) => {
  if (typeof value !== 'string' || value.trim() === '') {
    throw new Error(`Missing required configuration: ${name}`)
  }

  return value.trim()
}

const parseOrigins = (value) => value
  ? value.split(',').map((origin) => origin.trim()).filter(Boolean)
  : []

export const durationToMs = (value, name) => {
  if (typeof value === 'number' && Number.isInteger(value) && value > 0) {
    return value * 1_000
  }

  const match = typeof value === 'string' && value.match(durationPattern)
  if (!match) {
    throw new Error(`${name} must be a positive duration such as 15m or 7d`)
  }

  const milliseconds = Number(match[1]) * durationUnits[match[2]]
  if (!Number.isSafeInteger(milliseconds) || milliseconds < 1_000) {
    throw new Error(`${name} must be at least one second`)
  }

  return milliseconds
}

const normalizeOrigins = (origins) => {
  if (!Array.isArray(origins)) {
    throw new Error('corsOrigins must be an array of origins')
  }

  return [...new Set(origins.map((origin) => {
    if (typeof origin !== 'string' || origin === '*' || origin.includes('*')) {
      throw new Error('corsOrigins must contain explicit origins, never wildcards')
    }

    try {
      const parsed = new URL(origin)
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        throw new Error('Origin must use HTTP or HTTPS')
      }
      return parsed.origin
    } catch {
      throw new Error(`Invalid CORS origin: ${origin}`)
    }
  }))]
}

const normalizeCookie = (cookie, isProduction) => {
  const sameSite = (cookie?.sameSite ?? 'lax').toLowerCase()
  if (!['lax', 'strict', 'none'].includes(sameSite)) {
    throw new Error('cookie.sameSite must be lax, strict, or none')
  }

  const normalized = {
    name: cookie?.name ?? 'refreshToken',
    httpOnly: true,
    secure: cookie?.secure ?? isProduction,
    sameSite,
    path: cookie?.path ?? '/api/auth',
    ...(cookie?.domain ? { domain: cookie.domain } : {}),
  }

  if (typeof normalized.name !== 'string' || normalized.name.length === 0
    || typeof normalized.path !== 'string' || !normalized.path.startsWith('/')) {
    throw new Error('cookie.name and an absolute cookie.path are required')
  }
  if (isProduction && !normalized.secure) {
    throw new Error('Secure cookies are required in production')
  }
  if (normalized.sameSite === 'none' && !normalized.secure) {
    throw new Error('SameSite=None requires a Secure cookie')
  }

  return normalized
}

export const validateAuthOptions = (options) => {
  if (!options || typeof options !== 'object') {
    throw new Error('Auth configuration is required')
  }

  const isProduction = options.isProduction === true
  const jwt = options.jwt ?? {}
  const accessSecret = required(jwt.accessSecret, 'jwt.accessSecret')
  const refreshSecret = required(jwt.refreshSecret, 'jwt.refreshSecret')
  const accessExpiresIn = jwt.accessExpiresIn ?? '15m'
  const refreshExpiresIn = jwt.refreshExpiresIn ?? '7d'
  const accessTtlMs = durationToMs(accessExpiresIn, 'jwt.accessExpiresIn')
  const refreshTtlMs = durationToMs(refreshExpiresIn, 'jwt.refreshExpiresIn')

  if (accessSecret.length < 32 || refreshSecret.length < 32) {
    throw new Error('JWT secrets must each be at least 32 characters long')
  }
  if (accessSecret === refreshSecret) {
    throw new Error('Access and refresh JWT secrets must be different')
  }
  if (accessTtlMs > 3_600_000) {
    throw new Error('Access tokens must expire within one hour')
  }
  if (refreshTtlMs > 90 * durationUnits.d) {
    throw new Error('Refresh tokens must expire within 90 days')
  }

  return {
    googleClientId: required(options.googleClientId, 'googleClientId'),
    jwt: {
      accessSecret,
      refreshSecret,
      accessExpiresIn,
      refreshExpiresIn,
      accessTtlMs,
      refreshTtlMs,
      issuer: jwt.issuer ?? 'sucheta-kothari-api',
      audience: jwt.audience ?? 'sucheta-kothari-web',
    },
    cookie: normalizeCookie(options.cookie, isProduction),
    corsOrigins: normalizeOrigins(options.corsOrigins ?? []),
    isProduction,
    trustProxy: options.trustProxy === 1 ? 1 : false,
  }
}

export const createAuthOptionsFromEnv = (env = process.env) => {
  const isProduction = env.NODE_ENV === 'production'
  const corsOrigins = parseOrigins(env.CORS_ORIGINS)

  if (isProduction && corsOrigins.length === 0) {
    throw new Error('CORS_ORIGINS is required in production')
  }

  const localOrigins = [
    'http://127.0.0.1:5173',
    'http://localhost:5173',
    'http://127.0.0.1:4173',
    'http://localhost:4173',
  ]

  return validateAuthOptions({
    googleClientId: env.GOOGLE_CLIENT_ID,
    jwt: {
      accessSecret: env.JWT_ACCESS_SECRET,
      refreshSecret: env.JWT_REFRESH_SECRET,
      accessExpiresIn: env.ACCESS_TOKEN_EXPIRES_IN ?? '15m',
      refreshExpiresIn: env.REFRESH_TOKEN_EXPIRES_IN ?? '7d',
      issuer: env.JWT_ISSUER ?? 'sucheta-kothari-api',
      audience: env.JWT_AUDIENCE ?? 'sucheta-kothari-web',
    },
    cookie: {
      name: env.REFRESH_COOKIE_NAME ?? 'refreshToken',
      secure: isProduction,
      sameSite: env.REFRESH_COOKIE_SAME_SITE ?? 'lax',
      path: env.REFRESH_COOKIE_PATH ?? '/api/auth',
      ...(env.REFRESH_COOKIE_DOMAIN ? { domain: env.REFRESH_COOKIE_DOMAIN } : {}),
    },
    corsOrigins: corsOrigins.length > 0 ? corsOrigins : localOrigins,
    isProduction,
    trustProxy: env.TRUST_PROXY === '1' ? 1 : false,
  })
}
