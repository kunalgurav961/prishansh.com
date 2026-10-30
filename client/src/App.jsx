import { useAuth0 } from '@auth0/auth0-react'
import AppRoutes from './routes/AppRoutes'
import AuthError from './components/auth/AuthError'
import { CartProvider } from './context/CartContext'

const App = () => {
  const { error } = useAuth0()

  if (error) {
    return <AuthError />
  }

  return (
    <CartProvider>
      <AppRoutes />
    </CartProvider>
  )
}

export default App
