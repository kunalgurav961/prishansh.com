import { useState } from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { Link, Navigate, useLocation } from "react-router";
import { ArrowRight, ShieldCheck } from "lucide-react";
import AuthLoading from "../../components/auth/AuthLoading";
import { safeReturnTo } from "../../auth/config";

const Login = ({ signUp = false }) => {
  const { loginWithRedirect, isAuthenticated, isLoading } = useAuth0();
  const location = useLocation();
  const [loginFailed, setLoginFailed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const returnTo = safeReturnTo(location.state?.returnTo);

  if (isLoading) return <AuthLoading />;

  if (isAuthenticated) {
    return <Navigate to={returnTo} replace />;
  }

  const beginLogin = async () => {
    setLoginFailed(false);
    setIsSubmitting(true);

    try {
      await loginWithRedirect({
        appState: { returnTo },
        authorizationParams: signUp ? { screen_hint: "signup" } : undefined,
      });
    } catch {
      setLoginFailed(true);
      setIsSubmitting(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#f2f4f5] p-4 sm:p-6 lg:p-10">
      <div className="mx-auto grid min-h-[calc(100vh-5rem)] max-w-[1200px] overflow-hidden rounded-[28px] border border-neutral-200 bg-white shadow-[0_4px_24px_rgba(0,0,0,0.12)] lg:grid-cols-2">
        {/* Editorial Image */}
        <section className="relative hidden min-h-[650px] overflow-hidden lg:block">
          <img
            src="https://images.unsplash.com/photo-1483985988355-763728e1935b?auto=format&fit=crop&w=1600&q=90"
            alt="Contemporary fashion collection"
            className="absolute inset-0 h-full w-full object-cover"
          />

          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-black/10" />

          <Link
            to="/"
            className="absolute left-10 top-10 text-xl font-semibold tracking-[0.2em] text-white"
          >
            PRISHANSH<span className="text-violet-200">.</span>
          </Link>

          <div className="absolute bottom-12 left-10 right-10 text-white">
            <p className="mb-5 text-xs uppercase tracking-[0.35em] text-white/75">
              The art of everyday dressing
            </p>

            <h2 className="max-w-lg text-5xl font-light leading-[1.15] tracking-tight xl:text-6xl">
              Style that speaks
              <br />
              without saying
              <br />a word.
            </h2>

            <p className="mt-5 max-w-sm text-sm leading-7 text-white/75">
              Discover thoughtfully curated pieces made for your individuality,
              confidence, and everyday life.
            </p>

            <div className="mt-10 flex items-center gap-3">
              <span className="h-px w-10 bg-white" />
              <span className="text-xs tracking-[0.2em] text-white/80">
                YOUR STYLE. YOUR STORY.
              </span>
            </div>
          </div>
        </section>

        {/* Authentication Panel */}
        <section className="flex min-h-[650px] flex-col justify-between px-6 py-8 sm:px-12 sm:py-12 lg:px-16 xl:px-20">
          <header className="flex items-center justify-between">
            <Link
              to="/"
              className="text-lg font-semibold tracking-[0.18em] text-stone-900 lg:hidden"
            >
              PRISHANSH<span className="text-[#5433eb]">.</span>
            </Link>

            <span className="ml-auto text-xs text-stone-500">
              {signUp ? "Already a member?" : "New to Prishansh?"}{" "}
              <Link
                to={signUp ? "/login" : "/register"}
                className="font-medium text-stone-900 underline decoration-stone-300 underline-offset-4 transition hover:text-[#5433eb]"
              >
                {signUp ? "Sign in" : "Join us"}
              </Link>
            </span>
          </header>

          <div className="mx-auto w-full max-w-sm py-12">
            <div className="mb-8 flex h-12 w-12 items-center justify-center rounded-full bg-violet-50 text-[#5433eb]">
              <ShieldCheck size={23} strokeWidth={1.5} />
            </div>

            <p className="mb-3 text-xs font-medium uppercase tracking-[0.12em] text-[#5433eb]">
              {signUp ? "Your journey begins" : "Welcome back"}
            </p>

            <h1 className="text-4xl font-light tracking-tight text-stone-900 sm:text-5xl">
              {signUp ? "Create your account." : "Good to see you."}
            </h1>

            <p className="mt-4 text-sm leading-7 text-stone-500">
              {signUp
                ? "Join our community and discover a more personal approach to style."
                : "Sign in to explore your favourites, manage your orders, and continue your style journey."}
            </p>

            {loginFailed && (
              <div
                className="mt-6 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800"
                role="alert"
              >
                We couldn't start authentication. Please try again.
              </div>
            )}

            <button
              type="button"
              onClick={beginLogin}
              disabled={isSubmitting}
              className="group mt-9 flex w-full items-center justify-between rounded-full bg-[#5433eb] px-6 py-4 text-sm font-medium text-white shadow-[0_4px_24px_rgba(69,36,219,0.34)] transition duration-200 hover:bg-[#4322cf] focus:outline-none focus:ring-2 focus:ring-[#5433eb] focus:ring-offset-4 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span>
                {isSubmitting
                  ? "Connecting securely..."
                  : signUp
                    ? "Create your account"
                    : "Continue to sign in"}
              </span>

              <ArrowRight
                size={18}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </button>

            <div className="my-8 flex items-center gap-4">
              <div className="h-px flex-1 bg-stone-200" />
              <span className="text-[10px] uppercase tracking-[0.2em] text-stone-400">
                Secure authentication
              </span>
              <div className="h-px flex-1 bg-stone-200" />
            </div>

            <div className="flex items-start gap-3 rounded-[20px] border border-neutral-200 bg-[#f2f4f5] p-4">
              <ShieldCheck
                size={19}
                className="mt-0.5 shrink-0 text-stone-500"
                strokeWidth={1.5}
              />

              <p className="text-xs leading-6 text-stone-500">
                Your account is protected by our secure authentication provider.
                Your credentials are handled through the authentication flow.
              </p>
            </div>
          </div>

          <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-100 pt-5 text-[11px] text-stone-400">
            <span>© {new Date().getFullYear()} Prishansh Boutique</span>
            <div className="flex gap-5">
              <Link to="/privacy" className="transition hover:text-stone-900">
                Privacy
              </Link>
              <Link to="/terms" className="transition hover:text-stone-900">
                Terms
              </Link>
            </div>
          </footer>
        </section>
      </div>
    </main>
  );
};

export default Login;
