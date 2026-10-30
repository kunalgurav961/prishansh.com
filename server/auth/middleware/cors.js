import cors from 'cors'

export const createCorsMiddleware = (allowedOrigins) => cors({
  credentials: true,
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true)
    }

    const error = new Error('CORS origin rejected')
    error.code = 'CORS_ORIGIN_REJECTED'
    error.status = 403
    return callback(error)
  },
})
