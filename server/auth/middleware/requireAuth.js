export const createRequireAuth = (tokenService) => (req, res, next) => {
  try {
    const authHeader = req.headers.authorization

    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        code: 'AUTH_REQUIRED',
        message: 'Access token is required',
      })
    }

    const token = authHeader.slice(7).trim()
    if (!token) throw new Error('Missing token')

    const payload = tokenService.verifyAccessToken(token)
    req.user = { id: payload.sub }
    return next()
  } catch {
    return res.status(401).json({
      success: false,
      code: 'INVALID_ACCESS_TOKEN',
      message: 'Invalid or expired access token',
    })
  }
}
