
import { Link } from "react-router";
import { FaInstagram, FaFacebookF, FaXTwitter } from "react-icons/fa6";
import { ArrowUpRight, ArrowUp } from "lucide-react";

const footerLinks = {
  Explore: [
    { name: "New Arrivals", link: "/shop?category=new-arrivals" },
    { name: "Men's Collection", link: "/shop?category=mens" },
    { name: "Women's Collection", link: "/shop?category=womens" },
    { name: "Best Sellers", link: "/shop?category=best-sellers" },
  ],
  Support: [
    { name: "Contact Us", link: "/contact" },
    { name: "FAQs", link: "/faq" },
    { name: "Shipping & Returns", link: "/shipping" },
    { name: "Track Your Order", link: "/orders" },
  ],
  Information: [
    { name: "Our Story", link: "/about" },
    { name: "Privacy Policy", link: "/privacy" },
    { name: "Terms & Conditions", link: "/terms" },
    { name: "Refund Policy", link: "/refund" },
  ],
};

export default function Footer() {
  return (
    <footer className="overflow-hidden bg-stone-950 text-white">
      {/* Newsletter */}
      <div className="border-b border-white/15 px-4 py-14 sm:px-8 sm:py-16 lg:px-8 lg:py-20">
        <div className="mx-auto grid max-w-[1200px] gap-10 lg:grid-cols-2 lg:items-end">
          <div>
            <p className="text-[10px] font-medium uppercase tracking-[0.18em] text-violet-200/80 sm:text-xs">
              The Style Letter
            </p>

            <h2 className="mt-4 font-serif text-4xl leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
              Good taste.
              <br />
              <span className="italic text-white/60">
                Great discoveries.
              </span>
            </h2>

            <p className="mt-5 max-w-md text-sm leading-7 text-white/60">
              Discover new collections, thoughtful edits, and inspiration for
              your everyday style. Delivered occasionally, always with
              intention.
            </p>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const email = new FormData(e.currentTarget).get("email");

              window.location.href = `mailto:hello@example.com?subject=${encodeURIComponent(
                "Newsletter Subscription"
              )}&body=${encodeURIComponent(
                `Please subscribe ${email} to the newsletter.`
              )}`;
            }}
            className="flex border-b border-white/40 pb-2 transition-colors focus-within:border-violet-200"
          >
            <input
              type="email"
              name="email"
              placeholder="Your email address"
              required
              className="min-w-0 flex-1 bg-transparent py-3 text-sm text-white outline-none placeholder:text-white/40"
            />

            <button
              type="submit"
              className="ml-3 flex min-h-11 items-center gap-2 text-xs font-medium uppercase tracking-widest transition-colors hover:text-violet-100"
            >
              Subscribe <ArrowUpRight size={16} />
            </button>
          </form>
        </div>
      </div>

      {/* Main Footer */}
      <div className="mx-auto max-w-[1200px] px-4 py-14 sm:px-8 lg:px-0 lg:py-18">
        <div className="grid grid-cols-2 gap-10 md:grid-cols-4 lg:gap-16">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <Link
              to="/"
              className="inline-block text-xl font-semibold tracking-[0.16em] transition-opacity hover:opacity-75"
            >
              PRISHANSH<span className="text-violet-200/80">.</span>
            </Link>

            <p className="mt-5 max-w-xs text-sm leading-7 text-white/55">
              Thoughtfully curated fashion for those who find beauty in
              simplicity and confidence in individuality.
            </p>

            <div className="mt-7 flex items-center gap-5">
              {[
                {
                  Icon: FaInstagram,
                  label: "Instagram",
                  url: "https://instagram.com",
                },
                {
                  Icon: FaFacebookF,
                  label: "Facebook",
                  url: "https://facebook.com",
                },
                {
                  Icon: FaXTwitter,
                  label: "X",
                  url: "https://x.com",
                },
              ].map(({ Icon, label, url }) => (
                <a
                  key={label}
                  href={url}
                  target="_blank"
                  rel="noreferrer"
                  aria-label={label}
                  className="text-white/50 transition-colors hover:text-white"
                >
                  <Icon size={19} />
                </a>
              ))}
            </div>
          </div>

          {Object.entries(footerLinks).map(([title, links]) => (
            <div key={title}>
              <h3 className="mb-6 text-[11px] font-semibold uppercase tracking-[0.16em] text-white">
                {title}
              </h3>

              <ul className="space-y-4">
                {links.map((item) => (
                  <li key={item.name}>
                    <Link
                      to={item.link}
                      className="text-sm text-white/55 transition-colors duration-200 hover:text-violet-100"
                    >
                      {item.name}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Editorial Brand Statement */}
        <div className="mt-20 border-t border-white/15 pt-10 sm:mt-24">
          <p className="select-none text-center font-serif text-[clamp(2.5rem,10vw,9rem)] leading-none tracking-[-0.06em] text-white/[0.08]">
            YOUR OWN STYLE.
          </p>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 flex flex-col gap-5 border-t border-white/15 pt-6 text-xs text-white/45 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} PRISHANSH BOUTIQUE. All rights reserved.
          </p>

          <p className="font-serif text-sm italic tracking-wide text-white/65">
            Made for the way you feel.
          </p>

          <button
            onClick={() =>
              window.scrollTo({ top: 0, behavior: "smooth" })
            }
            className="flex min-h-10 items-center gap-2 transition-colors hover:text-violet-100"
          >
            Back to top <ArrowUp size={14} />
          </button>
        </div>
      </div>
    </footer>
  );
}
