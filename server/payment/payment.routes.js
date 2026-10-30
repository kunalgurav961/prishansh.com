import express from 'express'
import {
  createOrder,
  verifyPayment,
  handleWebhook,
  getMyOrders,
  getOrderById,
} from './controllers/payment.controller.js'
import { createPaymentAuthMiddleware } from './middleware/paymentAuth.js'

export const createPaymentRouter = (tokenService) => {
  const router = express.Router()
  const requirePaymentAuth = createPaymentAuthMiddleware(tokenService)

  // Webhook endpoint (Signature verified via Razorpay HMAC, no bearer token)
  router.post('/webhook', handleWebhook)

  // Authenticated payment endpoints
  router.post('/create-order', requirePaymentAuth, createOrder)
  router.post('/verify', requirePaymentAuth, verifyPayment)

  // Order management
  router.get('/orders', requirePaymentAuth, getMyOrders)
  router.get('/order/:id', requirePaymentAuth, getOrderById)

  return router
}

export default createPaymentRouter

