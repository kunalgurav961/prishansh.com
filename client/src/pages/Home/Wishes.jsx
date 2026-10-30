
import { motion } from "framer-motion";
import { Sparkles, Heart, ArrowRight } from "lucide-react";
import { Link } from "react-router";

export default function Wishes() {
  return (
    <section className="relative flex min-h-screen items-center justify-center overflow-hidden bg-[#f2f4f5] px-4 py-20 sm:px-8 lg:px-8">

      <div className="relative z-10 mx-auto w-full max-w-[1200px]">
        {/* Section Heading */}
        <motion.div
          initial={{ opacity: 0, y: 35 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.8 }}
          className="mb-12 text-center"
        >
          <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[#5433eb]">
            <Sparkles size={15} />
            A little something for you
          </span>

          <h2 className="boutique-heading mt-5 text-4xl text-neutral-900 sm:text-6xl">
            Wear what makes
            <br />
            <span className="italic">you feel beautiful.</span>
          </h2>

          <p className="mx-auto mt-5 max-w-lg text-sm leading-7 text-neutral-600 sm:text-base">
            Fashion is more than what you wear. It is how you express
            yourself, celebrate your individuality, and show the world
            the person you are.
          </p>
        </motion.div>

        {/* Animated Message Tile */}
        <motion.div
          initial={{ opacity: 0, y: 150, scale: 0.94 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true, amount: 0.25 }}
          transition={{
            duration: 1,
            ease: [0.22, 1, 0.36, 1],
          }}
          className="relative mx-auto max-w-3xl"
        >
          <div className="relative overflow-hidden rounded-[28px] border border-neutral-200 bg-white px-6 py-12 shadow-[0_4px_24px_rgba(0,0,0,0.12)] sm:px-14 sm:py-16">
            {/* Decorative Corners */}
            <div className="absolute left-4 top-4 h-8 w-8 border-l border-t border-violet-200" />
            <div className="absolute right-4 top-4 h-8 w-8 border-r border-t border-violet-200" />
            <div className="absolute bottom-4 left-4 h-8 w-8 border-b border-l border-violet-200" />
            <div className="absolute bottom-4 right-4 h-8 w-8 border-b border-r border-violet-200" />

            <motion.div
              initial={{ opacity: 0, scale: 0.6 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.45, duration: 0.6 }}
              className="mb-6 flex justify-center"
            >
              <div className="flex h-14 w-14 items-center justify-center rounded-full bg-violet-50 text-[#5433eb]">
                <Heart size={24} strokeWidth={1.4} />
              </div>
            </motion.div>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.6, duration: 0.7 }}
              className="text-center text-xs font-semibold uppercase tracking-[0.12em] text-[#5433eb]"
            >
              A wish from us to you
            </motion.p>

            <motion.h3
              initial={{ opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.75, duration: 0.8 }}
              className="boutique-heading mt-6 text-center text-3xl text-neutral-900 sm:text-5xl"
            >
              May you always feel
              <br />
              <span className="italic text-[#5433eb]">
                confident, beautiful,
              </span>
              <br />
              and uniquely you.
            </motion.h3>

            <motion.div
              initial={{ scaleX: 0 }}
              whileInView={{ scaleX: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.9, duration: 0.7 }}
              className="mx-auto my-8 h-px w-20 origin-center bg-[#5433eb]"
            />

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 1, duration: 0.8 }}
              className="mx-auto max-w-xl text-center text-sm leading-8 text-neutral-600 sm:text-base"
            >
              May every outfit tell your story, every new style bring
              a little joy, and every day remind you that the best
              thing you can wear is confidence. Thank you for being
              part of our journey. Here's to expressing yourself,
              embracing your style, and making every moment yours.
            </motion.p>

            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 1.3, duration: 0.8 }}
              className="mt-8 text-center text-xl italic text-neutral-800"
            >
              With love, always. ♡
            </motion.p>
          </div>
        </motion.div>

        {/* Closing action */}
        <div className="mt-10 flex flex-col items-center gap-3 text-neutral-500">
          <Link to="/shop" className="boutique-action px-6 py-3">
            Continue to the collection <ArrowRight size={15} strokeWidth={1.8} />
          </Link>
        </div>
      </div>
    </section>
  );
}
