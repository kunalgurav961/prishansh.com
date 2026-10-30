import { Link } from 'react-router'

const AccessDenied = () => (
  <main className="mx-auto flex min-h-56 max-w-xl items-center px-6 py-12">
    <section className="w-full rounded-lg border border-stone-200 bg-stone-50 p-6 text-stone-800" role="alert">
      <h1 className="text-lg font-semibold">Access denied</h1>
      <p className="mt-2 text-sm leading-6">
        Your account does not have permission to view this page.
      </p>
      <Link to="/" className="mt-4 inline-block text-sm font-medium text-[#5433eb] underline">
        Return to the shop
      </Link>
    </section>
  </main>
)

export default AccessDenied
