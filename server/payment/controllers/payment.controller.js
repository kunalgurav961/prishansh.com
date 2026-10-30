import crypto from 'crypto'
import { validatePaymentVerification, validateWebhookSignature } from 'razorpay/dist/utils/razorpay-utils.js'
import Order from '../../orders/model/order.model.js'
import Product from '../../products/model/products.model.js'
import { getRazorpayInstance, getRazorpayKeyId } from '../config/razorpay.config.js'

/**
 * 1. POST /api/payment/create-order
 * Validates products and stock against DB, creates Razorpay order and saves pending Order.
 */
export const createOrder = async (req, res) => {
  try {
    const user = req.user
    const { items, shippingAddress, paymentMethod = 'razorpay' } = req.body

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        success: false,
        code: 'EMPTY_CART',
        message: 'Your shopping bag is empty. Please add items before checking out.',
      })
    }

    if (
      !shippingAddress ||
      !shippingAddress.fullName ||
      !shippingAddress.email ||
      !shippingAddress.phone ||
      !shippingAddress.address ||
      !shippingAddress.city ||
      !shippingAddress.pincode
    ) {
      return res.status(400).json({
        success: false,
        code: 'INVALID_SHIPPING_DETAILS',
        message: 'Complete shipping address is required.',
      })
    }

    // Server-side validation against Product database
    const validatedItems = []
    let calculatedSubtotal = 0

    for (const item of items) {
      const productId = item.productId || item.product || item._id
      const quantity = Math.max(1, parseInt(item.quantity, 10) || 1)

      if (!productId) {
        return res.status(400).json({
          success: false,
          code: 'INVALID_ITEM',
          message: 'Invalid product item supplied.',
        })
      }

      const product = await Product.findById(productId)
      if (!product || product.isActive === false) {
        return res.status(400).json({
          success: false,
          code: 'PRODUCT_UNAVAILABLE',
          message: `Product "${item.name || 'Selected item'}" is no longer available.`,
        })
      }

      // Check stock availability
      if (typeof product.stock === 'number' && product.stock < quantity) {
        return res.status(400).json({
          success: false,
          code: 'INSUFFICIENT_STOCK',
          message: `Only ${product.stock} items left in stock for "${product.name}".`,
        })
      }

      // Server-verified price from DB
      const verifiedPrice = Number(product.price || 0)
      calculatedSubtotal += verifiedPrice * quantity

      const itemImage =
        (Array.isArray(product.images) && product.images[0]) ||
        product.image ||
        item.image ||
        ''

      validatedItems.push({
        product: product._id,
        name: product.name,
        slug: product.slug || '',
        price: verifiedPrice,
        quantity,
        size: item.size || 'Free Size',
        color: item.color || 'Default',
        image: itemImage,
      })
    }

    // Delivery charge calculation
    const calculatedShipping =
      calculatedSubtotal === 0 || calculatedSubtotal >= 2999 ? 0 : 199
    const calculatedTotal = calculatedSubtotal + calculatedShipping
    const amountInPaise = Math.round(calculatedTotal * 100)

    const orderNumber = `PK-${Date.now()}-${Math.floor(1000 + Math.random() * 9000)}`

    // COD Checkout flow
    if (paymentMethod === 'cod') {
      const order = await Order.create({
        orderNumber,
        user: user._id,
        items: validatedItems,
        shippingAddress: {
          fullName: shippingAddress.fullName.trim(),
          email: shippingAddress.email.trim(),
          phone: shippingAddress.phone.trim(),
          address: shippingAddress.address.trim(),
          city: shippingAddress.city.trim(),
          state: shippingAddress.state?.trim() || '',
          pincode: shippingAddress.pincode.trim(),
        },
        pricing: {
          subtotal: calculatedSubtotal,
          shipping: calculatedShipping,
          total: calculatedTotal,
          currency: 'INR',
        },
        payment: {
          method: 'cod',
          status: 'pending',
        },
        orderStatus: 'confirmed',
        stockDeducted: true,
      })

      // Deduct stock for COD
      for (const item of validatedItems) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: -item.quantity },
        })
      }

      return res.status(201).json({
        success: true,
        orderId: order._id,
        orderNumber: order.orderNumber,
        paymentMethod: 'cod',
        order,
      })
    }

    // Razorpay Online Payment Flow
    const razorpay = getRazorpayInstance()
    const keyId = getRazorpayKeyId()

    let razorpayOrder
    try {
      razorpayOrder = await razorpay.orders.create({
        amount: amountInPaise,
        currency: 'INR',
        receipt: orderNumber,
        notes: {
          userId: user._id.toString(),
          userEmail: user.email,
          orderNumber,
        },
      })
    } catch (rzpError) {
      console.error('[Razorpay Order Creation Error]:', rzpError)
      const isAuthError =
        rzpError?.statusCode === 401 ||
        rzpError?.error?.description === 'Authentication failed'
      const description = isAuthError
        ? 'Razorpay API keys authentication failed. Please verify RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in server/.env and restart the server.'
        : rzpError?.error?.description ||
          'Failed to initialize payment with Razorpay. Please verify keys or try again.'

      return res.status(502).json({
        success: false,
        code: 'GATEWAY_ERROR',
        message: description,
      })
    }

    // Save pending Order record in database
    const order = await Order.create({
      orderNumber,
      user: user._id,
      items: validatedItems,
      shippingAddress: {
        fullName: shippingAddress.fullName.trim(),
        email: shippingAddress.email.trim(),
        phone: shippingAddress.phone.trim(),
        address: shippingAddress.address.trim(),
        city: shippingAddress.city.trim(),
        state: shippingAddress.state?.trim() || '',
        pincode: shippingAddress.pincode.trim(),
      },
      pricing: {
        subtotal: calculatedSubtotal,
        shipping: calculatedShipping,
        total: calculatedTotal,
        currency: 'INR',
      },
      payment: {
        method: 'razorpay',
        status: 'pending',
        razorpayOrderId: razorpayOrder.id,
      },
      orderStatus: 'created',
      stockDeducted: false,
    })

    return res.status(201).json({
      success: true,
      orderId: order._id,
      orderNumber: order.orderNumber,
      razorpayOrderId: razorpayOrder.id,
      amount: razorpayOrder.amount,
      currency: razorpayOrder.currency,
      keyId,
      order,
    })
  } catch (error) {
    console.error('[createOrder Error]:', error)
    return res.status(500).json({
      success: false,
      code: 'SERVER_ERROR',
      message: error.message || 'Failed to process order creation',
    })
  }
}

/**
 * 2. POST /api/payment/verify
 * Verifies razorpay_signature using the server secret, updates order status, and deducts stock safely.
 */
export const verifyPayment = async (req, res) => {
  try {
    const user = req.user
    const {
      razorpay_payment_id,
      razorpay_order_id,
      razorpay_signature,
      orderId,
    } = req.body

    if (!razorpay_payment_id || !razorpay_order_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        code: 'MISSING_PAYMENT_DETAILS',
        message: 'Payment ID, Order ID, and Signature are required for verification.',
      })
    }

    const secret = process.env.RAZORPAY_KEY_SECRET

    // Official Razorpay signature verification
    let isSignatureValid = false
    try {
      isSignatureValid = validatePaymentVerification(
        { order_id: razorpay_order_id, payment_id: razorpay_payment_id },
        razorpay_signature,
        secret
      )
    } catch {
      // Fallback manual HMAC SHA256 check
      const expected = crypto
        .createHmac('sha256', secret || '')
        .update(`${razorpay_order_id}|${razorpay_payment_id}`)
        .digest('hex')
      isSignatureValid = expected === razorpay_signature
    }

    if (!isSignatureValid) {
      // Update order to failed if found
      if (orderId) {
        await Order.findByIdAndUpdate(orderId, {
          'payment.status': 'failed',
          'payment.failureReason': 'Invalid payment signature',
          'payment.failedAt': new Date(),
        })
      }
      return res.status(400).json({
        success: false,
        code: 'INVALID_SIGNATURE',
        message: 'Payment verification failed: invalid signature.',
      })
    }

    // Find the matching order by DB id or Razorpay order id
    const query = orderId
      ? { _id: orderId, 'payment.razorpayOrderId': razorpay_order_id }
      : { 'payment.razorpayOrderId': razorpay_order_id }

    const order = await Order.findOne(query)

    if (!order) {
      return res.status(404).json({
        success: false,
        code: 'ORDER_NOT_FOUND',
        message: 'Order matching this payment was not found.',
      })
    }

    // Ensure user ownership
    if (order.user.toString() !== user._id.toString()) {
      return res.status(403).json({
        success: false,
        code: 'FORBIDDEN',
        message: 'You are not authorized to verify this order.',
      })
    }

    // Idempotency: Prevent duplicate processing if already paid
    if (order.payment.status === 'paid') {
      return res.status(200).json({
        success: true,
        message: 'Payment was already verified and processed.',
        order,
      })
    }

    // Update payment & order state
    order.payment.status = 'paid'
    order.payment.razorpayPaymentId = razorpay_payment_id
    order.payment.razorpaySignature = razorpay_signature
    order.payment.paidAt = new Date()
    order.orderStatus = 'confirmed'

    // Deduct stock safely
    if (!order.stockDeducted) {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(item.product, {
          $inc: { stock: -item.quantity },
        })
      }
      order.stockDeducted = true
    }

    await order.save()

    return res.status(200).json({
      success: true,
      message: 'Payment verified and order confirmed successfully.',
      order,
    })
  } catch (error) {
    console.error('[verifyPayment Error]:', error)
    return res.status(500).json({
      success: false,
      code: 'VERIFICATION_ERROR',
      message: error.message || 'An error occurred during payment verification.',
    })
  }
}

/**
 * 3. POST /api/payment/webhook
 * Handles Razorpay webhook notifications using raw body for signature verification.
 */
export const handleWebhook = async (req, res) => {
  try {
    const webhookSecret = process.env.RAZORPAY_WEBHOOK_SECRET
    const webhookSignature = req.headers['x-razorpay-signature']

    if (!webhookSecret) {
      console.warn('[Razorpay Webhook] RAZORPAY_WEBHOOK_SECRET is not configured.')
      return res.status(200).json({ status: 'ignored_unconfigured' })
    }

    if (!webhookSignature) {
      return res.status(400).json({ error: 'Missing x-razorpay-signature header' })
    }

    // Retrieve raw body buffer
    const rawBodyBuffer = req.rawBody || (Buffer.isBuffer(req.body) ? req.body : Buffer.from(JSON.stringify(req.body || {})))

    let isWebhookValid = false
    try {
      isWebhookValid = validateWebhookSignature(
        rawBodyBuffer.toString('utf8'),
        webhookSignature,
        webhookSecret
      )
    } catch {
      const expected = crypto
        .createHmac('sha256', webhookSecret)
        .update(rawBodyBuffer)
        .digest('hex')
      isWebhookValid = expected === webhookSignature
    }

    if (!isWebhookValid) {
      console.warn('[Razorpay Webhook] Signature verification failed')
      return res.status(400).json({ error: 'Invalid webhook signature' })
    }

    const payload = typeof req.body === 'object' && req.body !== null && !Buffer.isBuffer(req.body)
      ? req.body
      : JSON.parse(rawBodyBuffer.toString('utf8'))

    const event = payload.event
    console.log(`[Razorpay Webhook Event Received]: ${event}`)

    // Idempotent event handling
    if (event === 'payment.captured' || event === 'order.paid') {
      const paymentEntity = payload.payload?.payment?.entity
      const razorpayOrderId = paymentEntity?.order_id

      if (razorpayOrderId) {
        const order = await Order.findOne({ 'payment.razorpayOrderId': razorpayOrderId })

        if (order && order.payment.status !== 'paid') {
          order.payment.status = 'paid'
          order.payment.razorpayPaymentId = paymentEntity.id
          order.payment.paidAt = new Date()
          order.orderStatus = 'confirmed'

          if (!order.stockDeducted) {
            for (const item of order.items) {
              await Product.findByIdAndUpdate(item.product, {
                $inc: { stock: -item.quantity },
              })
            }
            order.stockDeducted = true
          }

          await order.save()
          console.log(`[Razorpay Webhook]: Order ${order.orderNumber} marked as paid`)
        }
      }
    } else if (event === 'payment.failed') {
      const paymentEntity = payload.payload?.payment?.entity
      const razorpayOrderId = paymentEntity?.order_id

      if (razorpayOrderId) {
        const order = await Order.findOne({ 'payment.razorpayOrderId': razorpayOrderId })

        if (order && order.payment.status === 'pending') {
          order.payment.status = 'failed'
          order.payment.failureReason =
            paymentEntity.error_description || 'Payment failed via webhook notification'
          order.payment.failedAt = new Date()
          order.orderStatus = 'cancelled'
          await order.save()
          console.log(`[Razorpay Webhook]: Order ${order.orderNumber} marked as failed`)
        }
      }
    }

    return res.status(200).json({ status: 'ok' })
  } catch (error) {
    console.error('[handleWebhook Error]:', error)
    return res.status(500).json({ error: 'Webhook processing error' })
  }
}

/**
 * 4. GET /api/payment/orders
 * Returns orders placed by the current authenticated user.
 */
export const getMyOrders = async (req, res) => {
  try {
    const user = req.user
    const orders = await Order.find({ user: user._id }).sort({ createdAt: -1 })
    return res.status(200).json({ success: true, orders })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve orders',
      error: error.message,
    })
  }
}

/**
 * 5. GET /api/payment/order/:id
 * Returns a specific order belonging to the current user.
 */
export const getOrderById = async (req, res) => {
  try {
    const user = req.user
    const order = await Order.findOne({ _id: req.params.id, user: user._id })

    if (!order) {
      return res.status(404).json({ success: false, message: 'Order not found' })
    }

    return res.status(200).json({ success: true, order })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve order',
      error: error.message,
    })
  }
}

