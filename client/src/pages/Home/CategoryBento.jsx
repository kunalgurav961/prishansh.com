import { Link } from "react-router";
import { motion } from "framer-motion";

const containerVariants = {
  hidden: {},
  visible: {
    transition: {
      staggerChildren: 0.08,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: "easeOut" },
  },
};

const categories = [
  {
    title: "New Arrivals",
    image: "https://images.unsplash.com/photo-1483985988355-763728e1935b",
    link: "/category/new-arrivals",
  },
  {
    title: "Men's Clothing",
    image: "https://images.unsplash.com/photo-1618354691373-d851c5c3a990",
    link: "/category/mens",
  },
  {
    title: "Women's Clothing",
    image: "https://images.unsplash.com/photo-1485230895905-ec40ba36b9bc",
    link: "/category/womens",
  },
  {
    title: "T-Shirts",
    image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab",
    link: "/category/t-shirts",
  },
  {
    title: "Shirts",
    image: "https://images.unsplash.com/photo-1596755094514-f87e34085b2c",
    link: "/category/shirts",
  },
  {
    title: "Jeans & Denim",
    image: "https://images.unsplash.com/photo-1542272604-787c3835535d",
    link: "/category/jeans",
  },
  {
    title: "Dresses",
    image: "https://images.unsplash.com/photo-1539008835657-9e8e9680c956",
    link: "/category/dresses",
  },
  {
    title: "Jackets",
    image: "https://images.unsplash.com/photo-1551028719-00167b16eac5",
    link: "/category/jackets",
  },
  {
    title: "Ethnic Wear",
    image: "https://images.unsplash.com/photo-1610030469983-98e550d6193c",
    link: "/category/ethnic",
  },
  {
    title: "Footwear",
    image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff",
    link: "/category/footwear",
  },
  {
    title: "Bags & Accessories",
    image: "https://images.unsplash.com/photo-1548036328-c9fa89d128fa",
    link: "/category/accessories",
  },
  {
    title: "Sale",
    image: "https://images.unsplash.com/photo-1483985988355-763728e1935b",
    link: "/category/sale",
  },
];
const collections = [
  {
    title: "Street Snug",
    subtitle: "Laid-back cool layers",
    image:
      "https://images.unsplash.com/photo-1539109136881-3be0616acf4b?auto=format&fit=crop&w=1000&q=85",
    link: "/shop?style=streetwear",
  },
  {
    title: "Quiet Heritage",
    subtitle: "A refined expression of modern old-money style",
    image:
      "https://images.unsplash.com/photo-1617137968427-85924c800a22?auto=format&fit=crop&w=1000&q=85",
    link: "/shop?style=quiet-luxury",
  }
];

export default function CategoryBento() {
  return (
    <section className="bg-white px-4 py-14 sm:px-8 sm:py-16 lg:px-8 lg:py-20">
      <div className="mx-auto mb-10 max-w-[1200px] sm:mb-12">
        <p className="boutique-eyebrow">A different way in</p>
        <div className="mt-3 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
          <div>
            <h2 className="boutique-heading text-3xl text-neutral-900 sm:text-4xl">
              Choose a direction, then make it yours.
            </h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-neutral-500">
              Start with the part of the collection that feels most like you.
            </p>
          </div>
          <Link
            to="/shop"
            className="inline-flex w-fit items-center gap-1.5 border-b border-[#5433eb] pb-1 text-sm font-semibold text-neutral-900 transition-colors hover:text-[#5433eb]"
          >
            Browse the full collection <span aria-hidden="true">↗</span>
          </Link>
        </div>
      </div>

      {/* Category Grid */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.1 }}
        className="mx-auto grid max-w-[1200px] grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 sm:gap-x-5 sm:gap-y-8 lg:grid-cols-4 xl:grid-cols-6 lg:gap-x-6"
      >
        {categories.map((category) => (
          <motion.div key={category.title} variants={itemVariants}>
            <Link
              to={category.link}
              className="group block min-w-0 text-center"
            >
              <motion.div
                whileHover={{ y: -4 }}
                transition={{ duration: 0.3 }}
                className="aspect-[1.06/1] overflow-hidden rounded-[20px] border border-neutral-200 bg-[#f2f4f5] shadow-[0_2px_8px_rgba(0,0,0,0.06)]"
              >
                <motion.img
                  src={category.image}
                  alt={category.title}
                  loading="lazy"
                  whileHover={{ scale: 1.08 }}
                  transition={{ duration: 0.6, ease: "easeOut" }}
                  className="h-full w-full object-cover"
                />
              </motion.div>

              <h3 className="mt-3 text-xs font-medium tracking-[0.02em] text-neutral-900 transition-colors duration-300 group-hover:text-[#5433eb] sm:text-sm">
                {category.title}
              </h3>
            </Link>
          </motion.div>
        ))}
      </motion.div>

      {/* Featured Collections */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.15 }}
        className="mx-auto mt-16 grid max-w-[1200px] grid-cols-1 gap-8 sm:grid-cols-2 sm:gap-10 lg:mt-20"
      >
        {collections.map((collection) => (
          <motion.div key={collection.title} variants={itemVariants}>
            <Link to={collection.link} className="group relative block pb-16">
              <motion.div
                whileHover={{ y: -5 }}
                transition={{ duration: 0.35 }}
                className="h-72 overflow-hidden rounded-[28px] bg-neutral-100 sm:h-80"
              >
                <motion.img
                  src={collection.image}
                  alt={collection.title}
                  loading="lazy"
                  whileHover={{ scale: 1.06 }}
                  transition={{ duration: 0.7, ease: "easeOut" }}
                  className="h-full w-full object-cover"
                />
              </motion.div>

              <motion.div
                whileHover={{ y: -4 }}
                transition={{ duration: 0.3 }}
                className="absolute bottom-0 left-3 right-3 rounded-[20px] border border-neutral-100 bg-white p-4 shadow-[0_4px_24px_rgba(0,0,0,0.12)] sm:left-4 sm:right-4 sm:p-5"
              >
                <h3 className="font-serif text-2xl leading-tight tracking-tight text-neutral-900">
                  {collection.title}
                </h3>

                <p className="mt-1 text-sm text-neutral-600">
                  {collection.subtitle}
                </p>

                <span className="mt-3 inline-block text-xs font-semibold uppercase tracking-[0.08em] text-[#5433eb] underline-offset-4 group-hover:underline">
                  SHOP NOW ↗
                </span>
              </motion.div>
            </Link>
          </motion.div>
        ))}
      </motion.div>
    </section>
  );
}
