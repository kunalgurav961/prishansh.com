const readEnvironmentValue = (name) => import.meta.env[name]?.trim()

export const auth0Config = {
  domain: readEnvironmentValue('VITE_AUTH0_DOMAIN'),
  clientId: readEnvironmentValue('VITE_AUTH0_CLIENT_ID'),
  audience: readEnvironmentValue('VITE_AUTH0_AUDIENCE'),
  rolesClaim: readEnvironmentValue('VITE_AUTH0_ROLES_CLAIM'),
}

export const missingAuth0Configuration = [
  ['VITE_AUTH0_DOMAIN', auth0Config.domain],
  ['VITE_AUTH0_CLIENT_ID', auth0Config.clientId],
]
  .filter(([, value]) => !value)
  .map(([name]) => name)

export const isAuth0Configured = missingAuth0Configuration.length === 0

const AUTH_ROUTE_PATHS = new Set(['/login', '/register', '/callback'])

/**
 * Auth0 appState is returned from a third-party redirect. Only allow this SPA's
 * own relative paths before placing it in browser history.
 */
export const safeReturnTo = (value, fallback = '/account/profile') => {
  if (typeof value !== 'string' || !value.startsWith('/') || value.startsWith('//')) {
    return fallback
  }

  try {
    const parsed = new URL(value, window.location.origin)

    if (parsed.origin !== window.location.origin || AUTH_ROUTE_PATHS.has(parsed.pathname)) {
      return fallback
    }

    return `${parsed.pathname}${parsed.search}${parsed.hash}`
  } catch {
    return fallback
  }
}

export const hasRole = (user, role) => {
  if (!auth0Config.rolesClaim || !user || typeof user !== 'object') {
    return false
  }

  const roles = user[auth0Config.rolesClaim]
  return Array.isArray(roles) && roles.includes(role)
}
