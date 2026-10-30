import { configureStore, createListenerMiddleware, isAnyOf } from '@reduxjs/toolkit'
import userReducer, {
  clearUser,
  hydrateUser,
  persistUserCache,
  profileUpdated,
} from './userSlice'
import productReducer, { persistProductCache } from './productSlice'

const persistence = createListenerMiddleware()

persistence.startListening({
  matcher: isAnyOf(hydrateUser.fulfilled, profileUpdated, clearUser),
  effect: (_, listenerApi) => {
    persistUserCache(listenerApi.getState().user)
  },
})

persistence.startListening({
  predicate: (action) => typeof action.type === 'string' && action.type.startsWith('products/'),
  effect: (_, listenerApi) => {
    if (listenerApi.getState().products) {
      persistProductCache(listenerApi.getState().products)
    }
  },
})

export const store = configureStore({
  reducer: {
    user: userReducer,
    products: productReducer,
  },
  middleware: (getDefaultMiddleware) => getDefaultMiddleware({
    serializableCheck: {
      ignoredActionPaths: ['meta.arg.getAccessTokenSilently'],
    },
  }).prepend(persistence.middleware),
})
