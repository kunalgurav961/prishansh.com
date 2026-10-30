import { createGoogleClient } from '../config/google.config.js'

export const createGoogleVerifier = ({
  googleClientId,
  googleClient = createGoogleClient(googleClientId),
}) => async (idToken) => {
  const ticket = await googleClient.verifyIdToken({
    idToken,
    audience: googleClientId,
  })
  const payload = ticket.getPayload()

  if (!payload?.sub || !payload.email || payload.email_verified !== true) {
    throw new Error('Invalid Google account information')
  }

  return {
    provider: 'google',
    providerId: payload.sub,
    email: payload.email.toLowerCase().trim(),
    emailVerified: true,
    name: payload.name?.trim() || payload.email,
    picture: typeof payload.picture === 'string' ? payload.picture : null,
  }
}
