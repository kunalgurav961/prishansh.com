
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import './index.css'
import App from './App.jsx'
import Auth0ProviderWithRedirectCallback from './auth/Auth0ProviderWithRedirectCallback'
import UserHydrator from './auth/UserHydrator'
import { store } from './store/store'

createRoot(document.getElementById('root')).render(
  <Auth0ProviderWithRedirectCallback>
    <Provider store={store}>
      <UserHydrator>
        <App />
      </UserHydrator>
    </Provider>
  </Auth0ProviderWithRedirectCallback>
)
