import { Link } from 'react-router'

const AuthError = () => (
  <main className="mx-auto flex min-h-56 max-w-xl items-center px-6 py-12">
    <section className="w-full rounded-lg border border-rose-200 bg-rose-50 p-6 text-stone-800" role="alert">
      <h1 className="text-lg font-semibold">We couldn’t complete sign-in</h1>
      <p className="mt-2 text-sm leading-6">
        Your account was not signed in. Please try again, or return to the shop.
      </p>
      <Link to="/login" className="mt-4 inline-block text-sm font-medium text-[#5433eb] underline">
        Try signing in again
      </Link>
    </section>
  </main>
)

export default AuthError
