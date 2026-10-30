import { auth0Config } from '../auth/config'
import { createAuthenticatedApiClient } from './api'

const configuredApiBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim()

// These routes deliberately identify the customer from the validated bearer token.
// The browser must never send a user id to select a profile or orders.
const profilePath = import.meta.env.VITE_ACCOUNT_PROFILE_PATH?.trim() || '/v1/me'
const ordersPath = import.meta.env.VITE_ACCOUNT_ORDERS_PATH?.trim() || '/v1/me/orders'
const avatarPath = import.meta.env.VITE_ACCOUNT_AVATAR_PATH?.trim() || '/v1/me/avatar'

export const isAccountApiConfigured = Boolean(configuredApiBaseUrl && auth0Config.audience)

export const accountApiConfigurationMessage =
  'Account details and orders need VITE_API_BASE_URL and VITE_AUTH0_AUDIENCE, plus a backend that resolves the authenticated customer from the bearer token.'

const requireAccountApi = () => {
  if (!isAccountApiConfigured) {
    throw new Error(accountApiConfigurationMessage)
  }
}

const readResponse = async (response) => {
  const contentType = response.headers.get('content-type') || ''
  const body = contentType.includes('application/json') ? await response.json() : null

  if (!response.ok) {
    throw new Error(body?.message || body?.error || 'We could not complete that account request.')
  }

  return body
}

const profileFromResponse = (body) => body?.profile || body?.user || body?.data || body || {}

const ordersFromResponse = (body) => {
  const orders = body?.orders || body?.data || body
  return Array.isArray(orders) ? orders : []
}

export const getAccountProfile = async (getAccessTokenSilently) => {
  requireAccountApi()
  const response = await createAuthenticatedApiClient(getAccessTokenSilently).request(profilePath)
  return profileFromResponse(await readResponse(response))
}

export const getMyOrders = async (getAccessTokenSilently) => {
  requireAccountApi()
  const response = await createAuthenticatedApiClient(getAccessTokenSilently).request(ordersPath)
  return ordersFromResponse(await readResponse(response))
}

export const updateAccountProfile = async (getAccessTokenSilently, values) => {
  requireAccountApi()
  const response = await createAuthenticatedApiClient(getAccessTokenSilently).request(profilePath, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(values),
  })

  return profileFromResponse(await readResponse(response))
}

export const uploadAccountAvatar = async (getAccessTokenSilently, file) => {
  requireAccountApi()
  const formData = new FormData()
  formData.append('avatar', file)

  const response = await createAuthenticatedApiClient(getAccessTokenSilently).request(avatarPath, {
    method: 'POST',
    body: formData,
  })

  return profileFromResponse(await readResponse(response))
}
