
import { useAuth0 } from '@auth0/auth0-react'
import { Navigate, useLocation } from 'react-router'
import AuthLoading from '../components/auth/AuthLoading'

const ProtectedRoute = ({ children }) => {
  const { isLoading, isAuthenticated } = useAuth0()
  const location = useLocation()

  if (isLoading) {
    return <AuthLoading />
  }

  if (!isAuthenticated) {
    const returnTo = `${location.pathname}${location.search}${location.hash}`
    return <Navigate to="/login" replace state={{ returnTo }} />
  }

  return children
}

export default ProtectedRoute
