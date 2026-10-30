const originMatchesRequest = (req, origin) => {
  const host = req.get('host')
  if (!host) return false

  return origin === `${req.protocol}://${host}`
}

export const createCookieCsrfProtection = (allowedOrigins) => (req, res, next) => {
  const origin = req.get('origin')

  if (!origin || allowedOrigins.includes(origin) || originMatchesRequest(req, origin)) {
    return next()
  }

  return res.status(403).json({
    success: false,
    code: 'CSRF_ORIGIN_REJECTED',
    message: 'Request origin is not allowed',
  })
}
