import dotenv from 'dotenv'
import { createApp } from './app/app.js'
import userAdapter from './auth/adapters/user.adapter.js'
import sessionAdapter from './auth/adapters/session.adapter.js'
import { createAuthOptionsFromEnv } from './auth/config/auth.config.js'
import connectDB from './auth/config/database.config.js'
import { createAuth } from './auth/index.js'

dotenv.config({ quiet: true })

const parsePort = (value) => {
  const port = Number(value ?? 3000)
  if (!Number.isInteger(port) || port < 1 || port > 65_535) {
    throw new Error('PORT must be a valid TCP port')
  }
  return port
}

const startServer = async () => {
  const authOptions = createAuthOptionsFromEnv()
  await connectDB(process.env.MONGODB_URI)
  await Promise.all([userAdapter.ensureIndexes(), sessionAdapter.ensureIndexes()])

  const auth = createAuth({
    ...authOptions,
    userAdapter,
    sessionAdapter,
  })
  const app = createApp(auth)
  const port = parsePort(process.env.PORT)

  app.listen(port, () => console.log(`Server running on port ${port}`))
}

startServer().catch(() => {
  console.error('Server startup failed. Check configuration and database connectivity.')
  process.exitCode = 1
})
