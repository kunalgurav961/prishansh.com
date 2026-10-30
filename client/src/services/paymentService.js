import axios from 'axios'

/**
 * Dynamically loads the official Razorpay Checkout SDK script on demand.
 */
export const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') return resolve(false)
    if (window.Razorpay) return resolve(true)

    const existingScript = document.querySelector('script[src="https://checkout.razorpay.com/v1/checkout.js"]')
    if (existingScript) {
      existingScript.addEventListener('load', () => resolve(true))
      existingScript.addEventListener('error', () => resolve(false))
      return
    }

    const script = document.createElement('script')
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'
    script.async = true
    script.onload = () => resolve(true)
    script.onerror = () => resolve(false)
    document.body.appendChild(script)
  })
}

const getAuthHeaders = () => {
  const token = typeof window !== 'undefined' ? localStorage.getItem('prishansh:auth_token') : null
  const headers = { 'Content-Type': 'application/json' }
  if (token) {
    headers['Authorization'] = `Bearer ${token}`
  }
  return headers
}

/**
 * 1. Creates order on backend (verifying prices and stock against database).
 */
export const createPaymentOrder = async (orderPayload) => {
  const response = await axios.post('/api/payment/create-order', orderPayload, {
    headers: getAuthHeaders(),
  })
  return response.data
}

/**
 * 2. Submits Razorpay payment ID, order ID, and signature to server for verification.
 */
export const verifyPayment = async (verificationPayload) => {
  const response = await axios.post('/api/payment/verify', verificationPayload, {
    headers: getAuthHeaders(),
  })
  return response.data
}

/**
 * 3. Retrieves orders placed by the current user.
 */
export const fetchUserOrders = async () => {
  const response = await axios.get('/api/payment/orders', {
    headers: getAuthHeaders(),
  })
  return response.data
}
