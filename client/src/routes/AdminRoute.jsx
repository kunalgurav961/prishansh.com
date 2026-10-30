
import { useAuth0 } from '@auth0/auth0-react'
import { Navigate, useLocation } from 'react-router'
import { hasRole } from '../auth/config'
import AccessDenied from '../components/auth/AccessDenied'
import AuthLoading from '../components/auth/AuthLoading'

const AdminRoute = ({ children }) => {
  const { isLoading, isAuthenticated, user } = useAuth0()
  const location = useLocation()

  if (isLoading) {
    return <AuthLoading />
  }

  if (!isAuthenticated) {
    const returnTo = `${location.pathname}${location.search}${location.hash}`
    return <Navigate to="/login" replace state={{ returnTo }} />
  }

  // This protects navigation only. A server must independently validate the
  // access token and permissions before permitting an administrative operation.
  return hasRole(user, 'admin') ? children : <AccessDenied />
}

export default AdminRoute
