
import { auth0Config } from '../auth/config'

const apiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim()

const apiUrl = (path) => {
  if (!apiBaseUrl) {
    throw new Error('VITE_API_BASE_URL is required before making API requests.')
  }

  const baseUrl = new URL(apiBaseUrl)
  const targetUrl = new URL(path, baseUrl)

  if (targetUrl.origin !== baseUrl.origin) {
    throw new Error('API requests must target the configured API origin.')
  }

  return targetUrl
}

/**
 * Creates an API client for a real backend. The SDK returns an access token only;
 * the API must validate its signature, issuer, audience, expiry and permissions.
 */
export const createAuthenticatedApiClient = (getAccessTokenSilently) => ({
  async request(path, options = {}) {
    if (!auth0Config.audience) {
      throw new Error('VITE_AUTH0_AUDIENCE is required for authenticated API requests.')
    }

    const token = await getAccessTokenSilently({
      authorizationParams: { audience: auth0Config.audience },
    })
    const headers = new Headers(options.headers)
    headers.set('Authorization', `Bearer ${token}`)

    return fetch(apiUrl(path), {
      ...options,
      headers,
      // This SPA uses bearer tokens for APIs; do not send ambient cookies cross-origin.
      credentials: 'omit',
    })
  },
})
