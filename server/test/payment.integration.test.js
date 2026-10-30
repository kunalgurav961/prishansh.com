import assert from 'node:assert/strict'
import test from 'node:test'
import crypto from 'node:crypto'
import {
  validatePaymentVerification,
  validateWebhookSignature,
} from 'razorpay/dist/utils/razorpay-utils.js'

test('Razorpay payment signature verification works as expected', () => {
  const secret = 'test_secret_key_12345'
  const orderId = 'order_test_987654'
  const paymentId = 'pay_test_123456'

  // Generate valid signature using HMAC SHA256
  const validSignature = crypto
    .createHmac('sha256', secret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex')

  const isValid = validatePaymentVerification(
    { order_id: orderId, payment_id: paymentId },
    validSignature,
    secret
  )

  assert.equal(isValid, true, 'Valid signature should return true')

  // Invalid signature
  const isInvalid = validatePaymentVerification(
    { order_id: orderId, payment_id: paymentId },
    'tampered_or_invalid_signature',
    secret
  )

  assert.equal(isInvalid, false, 'Tampered signature should return false')
})

test('Razorpay webhook signature verification works as expected', () => {
  const webhookSecret = 'whsec_sample_secret_key'
  const payload = JSON.stringify({
    event: 'payment.captured',
    payload: {
      payment: {
        entity: {
          id: 'pay_captured_123',
          order_id: 'order_captured_456',
          amount: 299900,
        },
      },
    },
  })

  // Generate valid webhook signature
  const validWebhookSignature = crypto
    .createHmac('sha256', webhookSecret)
    .update(payload)
    .digest('hex')

  const isValid = validateWebhookSignature(payload, validWebhookSignature, webhookSecret)
  assert.equal(isValid, true, 'Valid webhook signature should pass verification')

  // Tampered payload
  const isInvalid = validateWebhookSignature(
    payload + 'tampered',
    validWebhookSignature,
    webhookSecret
  )
  assert.equal(isInvalid, false, 'Tampered webhook payload should fail verification')
})

