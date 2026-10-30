import { missingAuth0Configuration } from '../../auth/config'

const AuthConfigurationError = () => (
  <main className="mx-auto flex min-h-screen max-w-xl items-center px-6 py-12">
    <section className="w-full rounded-lg border border-amber-200 bg-amber-50 p-6 text-stone-800">
      <h1 className="text-lg font-semibold">Authentication is not configured</h1>
      <p className="mt-2 text-sm leading-6">
        Add the required Auth0 public configuration before using account features.
      </p>
      <p className="mt-3 rounded bg-white px-3 py-2 font-mono text-xs text-stone-700">
        {missingAuth0Configuration.join(', ')}
      </p>
    </section>
  </main>
)

export default AuthConfigurationError
