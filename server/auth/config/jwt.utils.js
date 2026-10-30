import jwt from 'jsonwebtoken'
import { randomUUID } from 'node:crypto'

const subjectFor = (user) => String(user._id ?? user.id)

export const createTokenService = (config) => {
  const sign = (user, type, secret, expiresIn) => jwt.sign(
    { sub: subjectFor(user), type },
    secret,
    {
      algorithm: 'HS256',
      expiresIn,
      issuer: config.issuer,
      audience: config.audience,
      ...(type === 'refresh' ? { jwtid: randomUUID() } : {}),
    },
  )

  const verify = (token, type, secret) => {
    const payload = jwt.verify(token, secret, {
      algorithms: ['HS256'],
      issuer: config.issuer,
      audience: config.audience,
    })

    if (typeof payload === 'string' || payload.type !== type || !payload.sub) {
      throw new Error('Invalid token type')
    }

    return payload
  }

  return {
    generateAccessToken: (user) => sign(user, 'access', config.accessSecret, config.accessExpiresIn),
    generateRefreshToken: (user) => sign(user, 'refresh', config.refreshSecret, config.refreshExpiresIn),
    verifyAccessToken: (token) => verify(token, 'access', config.accessSecret),
    verifyRefreshToken: (token) => verify(token, 'refresh', config.refreshSecret),
  }
}
