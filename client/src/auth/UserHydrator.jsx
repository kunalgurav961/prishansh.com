import { useEffect } from 'react'
import { useAuth0 } from '@auth0/auth0-react'
import { useDispatch } from 'react-redux'
import axios from 'axios'
import { clearUser, hydrateUser } from '../store/userSlice'

const UserHydrator = ({ children }) => {
  const dispatch = useDispatch()
  const { isAuthenticated, isLoading, user, getAccessTokenSilently } = useAuth0()

  useEffect(() => {
    if (isLoading) return

    if (!isAuthenticated || !user?.sub) {
      dispatch(clearUser())
      return
    }

    if (user?.email) {
      axios
        .post('/api/auth/sync', {
          name: user.name,
          email: user.email,
          picture: user.picture,
          sub: user.sub,
        })
        .then((res) => {
          if (res.data?.accessToken) {
            localStorage.setItem('prishansh:auth_token', res.data.accessToken)
          }
        })
        .catch(() => {
          // Non-blocking sync error
        })
    }

    // The thunk condition prevents duplicate requests from Strict Mode and remounts.
    dispatch(hydrateUser({
      subject: user.sub,
      authUser: user,
      getAccessTokenSilently,
    }))
  }, [dispatch, getAccessTokenSilently, isAuthenticated, isLoading, user])

  return children
}

export default UserHydrator
