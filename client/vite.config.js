import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import tailwindcss from '@tailwindcss/vite'

const securityHeaders = (auth0Domain, allowDevInlineScripts = false, extraConnectSrc = '') => ({
  'Content-Security-Policy': [
    "default-src 'self'",
    "base-uri 'self'",
    "object-src 'none'",
    "frame-ancestors 'self'",
    "form-action 'self'",
    `script-src 'self' https://checkout.razorpay.com${allowDevInlineScripts ? " 'unsafe-inline'" : ''}`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https:",
    `connect-src 'self' ws: wss: https://${auth0Domain} https://api.razorpay.com https://lumberjack.razorpay.com ${extraConnectSrc}`.trim(),
    `frame-src https://${auth0Domain} https://api.razorpay.com`,
  ].join('; '),
  'Permissions-Policy': 'camera=(), geolocation=(), microphone=()',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'X-Content-Type-Options': 'nosniff',
})

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '')
  const auth0Domain = env.VITE_AUTH0_DOMAIN || '*.auth0.com'
  const devConnect = 'http://localhost:3000 http://127.0.0.1:3000'
  const headers = securityHeaders(auth0Domain)

  return {
    plugins: [react(), tailwindcss()],
    // Vite injects its React Fast Refresh preamble inline during development.
    // Preview keeps the production-equivalent CSP without unsafe-inline scripts.
    server: {
      headers: securityHeaders(auth0Domain, true, devConnect),
      proxy: {
        '/api': {
          target: 'http://localhost:3000',
          changeOrigin: true,
        },
      },
    },
    preview: { headers },
  }
})
