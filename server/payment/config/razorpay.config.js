import Razorpay from 'razorpay'

export const getRazorpayInstance = () => {
  const key_id = process.env.RAZORPAY_KEY_ID
  const key_secret = process.env.RAZORPAY_KEY_SECRET

  return new Razorpay({
    key_id: key_id || '',
    key_secret: key_secret || '',
  })
}

export const getRazorpayKeyId = () => process.env.RAZORPAY_KEY_ID || ''

