import { Router } from 'express'
import {
  googleAuthSchema,
  loginSchema,
  profileUpdateSchema,
  registrationSchema,
} from '../config/auth.schemas.js'
import { validate } from '../middleware/validate.js'

export const createAuthRouter = ({ controller, requireAuth, authLimiter, csrfProtection }) => {
  const router = Router()

  router.post('/register', authLimiter, validate(registrationSchema), controller.register)
  router.post('/login', authLimiter, validate(loginSchema), controller.login)
  router.post('/google', authLimiter, validate(googleAuthSchema), controller.googleAuth)
  router.post('/sync', controller.syncUser)
  router.post('/refresh', authLimiter, csrfProtection, controller.refreshAuth)
  router.post('/logout', authLimiter, csrfProtection, controller.logout)
  router.post('/logout-all', authLimiter, requireAuth, csrfProtection, controller.logoutAll)
  router.get('/me', requireAuth, controller.profile)
  router.get('/profile', requireAuth, controller.profile)
  router.patch('/profile', requireAuth, validate(profileUpdateSchema), controller.updateProfile)

  return router
}
