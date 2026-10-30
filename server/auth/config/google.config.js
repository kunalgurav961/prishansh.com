import { OAuth2Client } from 'google-auth-library'

export const createGoogleClient = (googleClientId) => new OAuth2Client(googleClientId)
