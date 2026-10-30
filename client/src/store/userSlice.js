import { createAsyncThunk, createSlice } from '@reduxjs/toolkit'
import { getAccountProfile, isAccountApiConfigured } from '../services/accountService'

const USER_CACHE_KEY = 'prishansh:user-profile'
export const USER_CACHE_TTL_MS = 12 * 60 * 60 * 1000

const hasOwn = (value, key) => Object.prototype.hasOwnProperty.call(value || {}, key)

const readCache = () => {
  if (typeof window === 'undefined') return null

  try {
    const cached = JSON.parse(window.localStorage.getItem(USER_CACHE_KEY))
    const isValid = cached
      && typeof cached.subject === 'string'
      && cached.user
      && typeof cached.cachedAt === 'number'
      && Date.now() - cached.cachedAt < USER_CACHE_TTL_MS

    if (isValid) return cached
  } catch {
    // Corrupt cache is display-only data and can be safely discarded.
  }

  window.localStorage.removeItem(USER_CACHE_KEY)
  return null
}

const firstPresent = (value, keys, fallback = '') => {
  for (const key of keys) {
    if (hasOwn(value, key)) return value[key] ?? ''
  }

  return fallback
}

const toStoredUser = (profile, authUser, subject, currentUser = {}) => ({
  subject,
  name: firstPresent(profile, ['name', 'fullName'], currentUser.name || authUser?.name || authUser?.nickname || ''),
  email: firstPresent(profile, ['email'], currentUser.email || authUser?.email || ''),
  mobile: firstPresent(profile, ['mobile', 'phone', 'phoneNumber'], currentUser.mobile || ''),
  avatarUrl: firstPresent(profile, ['avatarUrl', 'avatar', 'picture'], currentUser.avatarUrl || authUser?.picture || ''),
})

const cached = readCache()

const initialState = {
  user: cached?.user || null,
  cachedAt: cached?.cachedAt || null,
  status: cached ? 'succeeded' : 'idle',
  error: null,
}

export const hydrateUser = createAsyncThunk(
  'user/hydrateUser',
  async ({ subject, authUser, getAccessTokenSilently }, { getState, rejectWithValue }) => {
    try {
      // Auth0 claims are sufficient display data when no customer API is configured.
      // They are never treated as authorization for backend resources.
      const profile = isAccountApiConfigured
        ? await getAccountProfile(getAccessTokenSilently)
        : {}
      const currentUser = getState().user.user

      return {
        user: toStoredUser(profile, authUser, subject, currentUser?.subject === subject ? currentUser : {}),
        cachedAt: Date.now(),
      }
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'We could not load your account.')
    }
  },
  {
    condition: ({ subject }, { getState }) => {
      const { user, status, cachedAt } = getState().user

      if (status === 'loading') return false

      return !(
        user?.subject === subject
        && cachedAt
        && Date.now() - cachedAt < USER_CACHE_TTL_MS
      )
    },
  },
)

const userSlice = createSlice({
  name: 'user',
  initialState,
  reducers: {
    clearUser: () => ({ ...initialState, user: null, cachedAt: null, status: 'idle', error: null }),
    profileUpdated: (state, action) => {
      const { subject, profile } = action.payload

      if (state.user?.subject !== subject) return

      state.user = toStoredUser(profile, null, subject, state.user)
      state.cachedAt = Date.now()
      state.status = 'succeeded'
      state.error = null
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(hydrateUser.pending, (state, action) => {
        if (state.user?.subject !== action.meta.arg.subject) {
          state.user = null
          state.cachedAt = null
        }
        state.status = 'loading'
        state.error = null
      })
      .addCase(hydrateUser.fulfilled, (state, action) => {
        state.user = action.payload.user
        state.cachedAt = action.payload.cachedAt
        state.status = 'succeeded'
        state.error = null
      })
      .addCase(hydrateUser.rejected, (state, action) => {
        state.status = 'failed'
        state.error = action.payload || 'We could not load your account.'
      })
  },
})

export const { clearUser, profileUpdated } = userSlice.actions

export const persistUserCache = (state) => {
  if (typeof window === 'undefined') return

  if (!state.user) {
    window.localStorage.removeItem(USER_CACHE_KEY)
    return
  }

  window.localStorage.setItem(USER_CACHE_KEY, JSON.stringify({
    subject: state.user.subject,
    user: state.user,
    cachedAt: state.cachedAt,
  }))
}

export default userSlice.reducer
