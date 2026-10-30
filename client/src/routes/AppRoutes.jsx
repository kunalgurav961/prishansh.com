import { createBrowserRouter, RouterProvider } from 'react-router'
import PublicLayout from '../layouts/PublicLayout'

import Shop from '../pages/Shop'
import Category from '../pages/shop/Category'
import ProductDetails from '../pages/shop/ProductDetails'
import Login from '../pages/Auth/Login'
import Register from '../pages/Auth/Register'
import Home from '../pages/Home'
import Profile from '../pages/account/Profile'
import UserOrders from '../pages/orders/UserOrders'
import Wishlist from '../pages/cart/Wishlist'
import Cart from '../pages/cart/Cart'
import Checkout from '../pages/checkout/Checkout'
import Dashboard from '../pages/admin/Dashboard'
import NotFound from '../pages/NotFound'
import ProtectedRoute from './ProtectedRoute'
import AdminRoute from './AdminRoute'

const router = createBrowserRouter([
  {
    path: "/",
    element: <PublicLayout />,
    children: [
      {
        path: "",
        element: <Home />,
      },
      {
        path: "shop",
        element: <Shop />,
      },
      {
        path: "login",
        element: <Login />,
      },
      {
        path: "register",
        element: <Register />,
      },
      {
        path: "callback",
        element: <Login />,
      },
      {
        path: 'category/:categoryName',
        element: <Category />
      },
      {
        path: 'product/:id',
        element: <ProductDetails />
      },
      {
        path: "account/profile",
        element: (
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        ),
      },
      {
        path: "account/orders",
        element: (
          <ProtectedRoute>
            <UserOrders />
          </ProtectedRoute>
        ),
      },
      {
        path: "orders",
        element: (
          <ProtectedRoute>
            <UserOrders />
          </ProtectedRoute>
        ),
      },
      {
        path: "account/profile/edit",
        element: (
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        ),
      },
      {
        path: "wishlist",
        element: (
          <ProtectedRoute>
            <Wishlist />
          </ProtectedRoute>
        ),
      },
      {
        path: "cart",
        element: <Cart />,
      },
      {
        path: "checkout",
        element: <Checkout />,
      },
      {
        path: "admin",
        element: (
          <AdminRoute>
            <Dashboard />
          </AdminRoute>
        ),
      },
      {
        path: "*",
        element: <NotFound />,
      },
    ],
  },
]);

const AppRoutes = () => {
  return <RouterProvider router={router} />
}

export default AppRoutes
