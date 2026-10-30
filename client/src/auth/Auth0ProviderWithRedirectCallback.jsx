import { Auth0Provider } from '@auth0/auth0-react'
import { auth0Config, isAuth0Configured, safeReturnTo } from './config'
import AuthConfigurationError from '../components/auth/AuthConfigurationError'

const redirectUri = `${window.location.origin}/callback`

const Auth0ProviderWithRedirectCallback = ({ children }) => {
  if (!isAuth0Configured) {
    return <AuthConfigurationError />
  }

  const authorizationParams = {
    redirect_uri: redirectUri,
    scope: 'openid profile email',
    ...(auth0Config.audience ? { audience: auth0Config.audience } : {}),
  }

  return (
    <Auth0Provider
      domain={auth0Config.domain}
      clientId={auth0Config.clientId}
      authorizationParams={authorizationParams}
      cacheLocation="memory"
      useRefreshTokens={false}
      useRefreshTokensFallback={false}
      onRedirectCallback={(appState) => {
        const returnTo = safeReturnTo(appState?.returnTo)

        // Preserve the SDK's in-memory token cache while notifying React Router
        // about the post-login location. `safeReturnTo` prevents open redirects.
        window.history.replaceState({}, document.title, returnTo)
        window.dispatchEvent(new PopStateEvent('popstate'))
      }}
    >
      {children}
    </Auth0Provider>
  )
}

export default Auth0ProviderWithRedirectCallback
