import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUpRight, Sparkles } from "lucide-react";
import useProductHook from "../../hooks/useProductsHook";

const formatPrice = (price) =>
  typeof price === "number"
    ? `₹${price.toLocaleString("en-IN")}`
    : `₹${Number(price || 0).toLocaleString("en-IN")}`;

const getProductBadge = (product) => {
  if (product.badge) return product.badge;
  if (product.isNewArrival) return "NEW";
  if (product.isBestSeller) return "BESTSELLER";
  if (product.compareAtPrice && product.compareAtPrice > product.price) return "SALE";
  return null;
};

export default function FeaturedClothes() {
  const { products = [], isLoading, status, loadProducts } = useProductHook();
  const [activeCategory, setActiveCategory] = useState("All");

  useEffect(() => {
    if (products.length === 0 && status !== "loading") {
      loadProducts();
    }
  }, [products.length, status, loadProducts]);

  // Extract unique categories dynamically from the loaded database products
  const categories = useMemo(() => {
    const list = Array.isArray(products) ? products : [];
    const unique = new Set(list.map((p) => p.category).filter(Boolean));
    return ["All", ...Array.from(unique)];
  }, [products]);

  // Filter products by selected category
  const displayedProducts = useMemo(() => {
    const list = Array.isArray(products) ? products : [];
    if (activeCategory === "All") return list;
    return list.filter(
      (p) => p.category?.toLowerCase() === activeCategory.toLowerCase()
    );
  }, [products, activeCategory]);

  return (
    <section className="bg-white py-14 sm:py-16 lg:py-20">
      <div className="mx-auto max-w-[1200px] px-4 sm:px-8 lg:px-0">
      {/* Header */}
      <div className="mb-8 flex flex-col justify-between gap-4 sm:flex-row sm:items-end">
        <div>
          <div className="boutique-eyebrow mb-2 flex items-center gap-1.5">
            <Sparkles size={14} />
            <span>The boutique edit</span>
          </div>
          <h2 className="boutique-heading text-3xl text-neutral-900 sm:text-4xl">
            Pieces worth a closer look<span className="text-neutral-400">.</span>
          </h2>
          <p className="mt-2 text-sm text-neutral-500">
            A considered selection from the collection, chosen to make discovery feel effortless.
          </p>
        </div>

        <Link
          to="/shop"
          className="inline-flex w-fit items-center gap-1.5 border-b border-[#5433eb] pb-1 text-sm font-semibold text-neutral-900 transition-colors hover:text-[#5433eb]"
        >
          Shop every piece <ArrowUpRight size={15} />
        </Link>
      </div>

      {/* Dynamic Category Filter Pills */}
      {categories.length > 2 && (
        <div className="mb-8 flex flex-wrap items-center gap-2">
          {categories.map((category) => {
            const isActive = activeCategory === category;
            return (
              <button
                key={category}
                type="button"
                onClick={() => setActiveCategory(category)}
                className={`boutique-chip px-4 py-1.5 text-xs font-medium ${
                  isActive
                    ? "boutique-chip-selected"
                    : "text-neutral-600 hover:border-[#5433eb] hover:text-neutral-900"
                }`}
              >
                {category}
              </button>
            );
          })}
        </div>
      )}

      {/* Loading Skeleton */}
      {isLoading && products.length === 0 ? (
        <div className="columns-2 gap-3 space-y-3 sm:columns-3 sm:gap-5 sm:space-y-5 lg:columns-4">
          {Array.from({ length: 8 }).map((_, index) => (
            <div
              key={index}
            className="mb-4 break-inside-avoid overflow-hidden rounded-[28px] bg-neutral-100 animate-pulse"
            >
              <div className="aspect-[3/4] w-full bg-neutral-200" />
              <div className="p-3 space-y-2">
                <div className="h-3 w-1/3 bg-neutral-200 rounded" />
                <div className="h-4 w-3/4 bg-neutral-200 rounded" />
                <div className="h-3 w-1/4 bg-neutral-200 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : displayedProducts.length === 0 ? (
        /* Empty State */
        <div className="my-12 rounded-[28px] border border-dashed border-neutral-200 bg-[#f2f4f5] py-16 text-center">
          <p className="font-serif text-2xl text-neutral-800">
            No products available
          </p>
          <p className="mt-2 text-sm text-neutral-500">
            {activeCategory !== "All"
              ? `No items found under "${activeCategory}".`
              : "Our catalog is being updated. Please check back shortly."}
          </p>
          <Link
            to="/shop"
            className="mt-6 inline-flex items-center gap-2 bg-neutral-900 px-6 py-2.5 text-xs font-medium uppercase tracking-wider text-white transition hover:bg-neutral-800"
          >
            Visit Shop <ArrowUpRight size={14} />
          </Link>
        </div>
      ) : (
        /* Dynamic Products Grid */
        <motion.div
          layout
          className="grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4"
        >
          <AnimatePresence>
            {displayedProducts.map((product, index) => {
              const productId = product._id || product.id || product.slug;
              const productSlug = product.slug || productId;
              const badge = getProductBadge(product);

              const mainImage =
                (Array.isArray(product.images) && product.images[0]) ||
                product.image ||
                "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=700&q=85";
              const hoverImage =
                Array.isArray(product.images) && product.images[1]
                  ? product.images[1]
                  : null;

              const hasDiscount =
                product.compareAtPrice && product.compareAtPrice > product.price;

              return (
                <motion.article
                  layout
                  key={productId}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.08 }}
                  transition={{ duration: 0.45, delay: (index % 4) * 0.06 }}
                  className="product-tile group"
                >
                  <Link
                    to={`/product/${productSlug}`}
                    className="relative block overflow-hidden bg-[#f2f4f5]"
                  >
                    {/* Badge */}
                    {badge && (
                      <span className="absolute left-3 top-3 z-10 rounded-xl bg-white/95 px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-[#5433eb] shadow-sm backdrop-blur-sm">
                        {badge}
                      </span>
                    )}

                    {/* Product Image */}
                    <div className="relative aspect-[3/4] w-full overflow-hidden">
                      <img
                        src={mainImage}
                        alt={product.name}
                        loading="lazy"
                        className={`h-full w-full object-cover transition-transform duration-700 group-hover:scale-105 ${
                          hoverImage
                            ? "transition-opacity duration-500 group-hover:opacity-0"
                            : ""
                        }`}
                      />

                      {hoverImage && (
                        <img
                          src={hoverImage}
                          alt={`${product.name} alternate view`}
                          loading="lazy"
                          className="absolute inset-0 h-full w-full object-cover opacity-0 transition-all duration-500 group-hover:scale-105 group-hover:opacity-100"
                        />
                      )}
                    </div>

                    {/* Hover Overlay */}
                    <div className="absolute inset-0 flex flex-col justify-between bg-black/0 p-3 transition-colors duration-300 group-hover:bg-black/20 sm:p-4">
                      <div className="flex justify-end">
                        <span className="translate-y-2 rounded-full bg-white px-3.5 py-1.5 text-xs font-semibold text-black opacity-0 shadow-md transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                          View Piece ↗
                        </span>
                      </div>

                      <div className="translate-y-2 text-white opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
                        <p className="text-xs uppercase tracking-wider text-white/90">
                          {product.category || "Apparel"}
                        </p>
                        <p className="mt-0.5 text-base font-semibold">
                          {formatPrice(product.price)}
                        </p>
                      </div>
                    </div>
                  </Link>

                  {/* Product Details Underneath */}
                  <div className="px-1 pt-3">
                    <p className="text-[11px] uppercase tracking-wider text-neutral-400">
                      {product.category || "Apparel"}
                    </p>
                    <h3 className="mt-0.5 text-sm font-medium text-neutral-900 line-clamp-1">
                      <Link
                        to={`/product/${productSlug}`}
                        className="hover:underline"
                      >
                        {product.name}
                      </Link>
                    </h3>

                    <div className="mt-1 flex items-center gap-2">
                      <span className="text-sm font-semibold text-neutral-900">
                        {formatPrice(product.price)}
                      </span>
                      {hasDiscount && (
                        <span className="text-xs text-neutral-400 line-through">
                          {formatPrice(product.compareAtPrice)}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.article>
              );
            })}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Mobile Shop Link */}
      <div className="mt-8 text-center sm:hidden">
        <Link
          to="/shop"
          className="inline-block border-b border-black pb-1 text-sm font-medium"
        >
          Explore All Products ↗
        </Link>
      </div>
      </div>
    </section>
  );
}
