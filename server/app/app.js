import cookieParser from 'cookie-parser'
import express from 'express'
import helmet from 'helmet'
import productsRouter from '../products/products.routes.js'
import { createPaymentRouter } from '../payment/payment.routes.js'

export const createApp = (auth) => {
  const app = express()

  if (auth.appOptions.trustProxy) app.set('trust proxy', auth.appOptions.trustProxy)

  app.use(helmet({
    crossOriginOpenerPolicy: { policy: 'same-origin-allow-popups' },
  }))
  app.use(auth.middleware.cors)
  app.use(cookieParser())

  // Webhook needs raw body buffer preserved for Razorpay signature verification
  app.use(
    express.json({
      limit: '64kb',
      verify: (req, res, buf) => {
        req.rawBody = buf
      },
    })
  )

  app.use('/api/auth', auth.router)
  /*
    Product router 
    /api/products -> get all products
    /api/product/:id -> get product by id
    /api/products/category/:category -> get products by category
    /api/products/category/:category/:subCategory -> get products by category and sub category
  */
  app.use('/api/products', productsRouter)

  /*
    Payment & Order router
    /api/payment/create-order -> create order & initialize Razorpay order
    /api/payment/verify -> verify payment signature & confirm order
    /api/payment/webhook -> Razorpay webhook handler
    /api/payment/orders -> list user orders
  */
  app.use('/api/payment', createPaymentRouter(auth.tokenService))

  app.get('/', (req, res) => res.type('text').send('SUCHETA KOTHARI API is running!'))
  app.use(auth.errorHandler)

  return app
}
