import { createPaymentOrder, verifyPayment, fetchUserOrders } from './paymentService'

export const createOrder = createPaymentOrder
export const verifyOrderPayment = verifyPayment
export const getMyOrders = fetchUserOrders

export default {
  createOrder,
  verifyOrderPayment,
  getMyOrders,
}
