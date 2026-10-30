import userAdapter from '../../auth/adapters/user.adapter.js'

export const createPaymentAuthMiddleware = (tokenService) => async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization
    let user = null

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.slice(7).trim()

      if (token) {
        // Try verifying with local JWT tokenService first
        try {
          const payload = tokenService.verifyAccessToken(token)
          if (payload?.sub) {
            user = await userAdapter.findById(payload.sub)
          }
        } catch {
          // Token might be Auth0 token or custom payload; extract payload safely if JWT structure
          try {
            const parts = token.split('.')
            if (parts.length === 3) {
              const decoded = JSON.parse(Buffer.from(parts[1], 'base64').toString())
              const email = decoded.email || decoded['https://example.com/email']
              const sub = decoded.sub

              if (email) {
                user = await userAdapter.findByEmail(email)
              }
              if (!user && sub) {
                const provider = sub.split('|')[0] || 'auth0'
                user = await userAdapter.findByProviderId(provider, sub)
              }
            }
          } catch {
            // Ignore token parse errors
          }
        }
      }
    }

    // Fallback: check x-user-email header if provided by authenticated frontend session
    if (!user && req.headers['x-user-email']) {
      user = await userAdapter.findByEmail(req.headers['x-user-email'])
    }

    // Fallback: check customer email in shipping details
    if (!user && req.body?.shippingAddress?.email) {
      user = await userAdapter.findByEmail(req.body.shippingAddress.email)
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        code: 'AUTH_REQUIRED',
        message: 'Authentication required. Please sign in to complete payment.',
      })
    }

    req.user = user
    return next()
  } catch (error) {
    return res.status(401).json({
      success: false,
      code: 'AUTH_ERROR',
      message: 'Authentication failed',
      error: error.message,
    })
  }
}

