import rateLimit from 'express-rate-limit'

export const createAuthLimiter = ({ windowMs = 15 * 60 * 1_000, limit = 20 } = {}) => rateLimit({
  windowMs,
  limit,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  message: {
    success: false,
    code: 'AUTH_RATE_LIMITED',
    message: 'Too many authentication requests. Try again later.',
  },
})
