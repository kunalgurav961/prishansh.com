import { useMemo, useEffect, useState } from "react";
import { useParams, Link } from "react-router";
import { ArrowLeft, ArrowUpRight, Loader2 } from "lucide-react";
import useProductHook from "../../hooks/useProductsHook";
import Pagination from "../../components/common/Pagination";

const PRODUCTS_PER_PAGE = 12;

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

// Map URL slugs to display titles and matching logic
const categoryMeta = {
  "t-shirts":       { title: "T-Shirts",           match: (p) => /t-?shirts?/i.test(p.category) },
  "tshirts":        { title: "T-Shirts",           match: (p) => /t-?shirts?/i.test(p.category) },
  "shirts":         { title: "Shirts",             match: (p) => /^shirts?$/i.test(p.category) },
  "jeans":          { title: "Jeans & Denim",       match: (p) => /jeans|denim/i.test(p.category) },
  "dresses":        { title: "Dresses",            match: (p) => /dress/i.test(p.category) },
  "jackets":        { title: "Jackets",            match: (p) => /jacket|outerwear/i.test(p.category) },
  "ethnic":         { title: "Ethnic Wear",        match: (p) => /ethnic|kurta|saree|lehenga/i.test(p.category) },
  "footwear":       { title: "Footwear",           match: (p) => /footwear|shoes|sneakers|sandals/i.test(p.category) },
  "accessories":    { title: "Bags & Accessories", match: (p) => /accessor|bags?/i.test(p.category) },
  "mens":           { title: "Men's Clothing",     match: (p) => p.gender === "Men" },
  "womens":         { title: "Women's Clothing",   match: (p) => p.gender === "Women" },
  "new-arrivals":   { title: "New Arrivals",       match: (p) => !!p.isNewArrival },
  "sale":           { title: "Sale",               match: (p) => p.compareAtPrice != null && p.compareAtPrice > p.price },
};

const prettifySlug = (slug) =>
  slug
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());

export default function Category() {
  const { categoryName } = useParams();
  const { products = [], isLoading, status, loadProducts } = useProductHook();
  const [pagination, setPagination] = useState(() => ({
    category: categoryName,
    page: 1,
  }));
  const currentPage = pagination.category === categoryName ? pagination.page : 1;

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, [categoryName]);

  useEffect(() => {
    if (products.length === 0 && status !== "loading") {
      loadProducts();
    }
  }, [products.length, status, loadProducts]);

  const meta = categoryMeta[categoryName?.toLowerCase()];
  const displayTitle = meta?.title || prettifySlug(categoryName || "");

  const filtered = useMemo(() => {
    const list = Array.isArray(products) ? products : [];
    if (meta?.match) return list.filter(meta.match);
    // Fallback: match category field case-insensitively
    const slug = (categoryName || "").toLowerCase();
    return list.filter(
      (p) => p.category?.toLowerCase().replace(/[^a-z0-9]/g, "") === slug.replace(/[^a-z0-9]/g, "")
    );
  }, [products, categoryName, meta]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PRODUCTS_PER_PAGE));
  const activePage = Math.min(currentPage, totalPages);
  const firstProductIndex = filtered.length
    ? (activePage - 1) * PRODUCTS_PER_PAGE + 1
    : 0;
  const lastProductIndex = Math.min(
    activePage * PRODUCTS_PER_PAGE,
    filtered.length,
  );
  const paginatedProducts = filtered.slice(
    (activePage - 1) * PRODUCTS_PER_PAGE,
    activePage * PRODUCTS_PER_PAGE,
  );

  return (
    <main className="boutique-page">
      {/* Header */}
      <section className="border-b border-neutral-200 bg-white px-4 py-12 sm:px-8 sm:py-16 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-[1200px]">
          <nav className="mb-4 flex items-center gap-2 text-[10px] font-medium uppercase tracking-[0.25em] text-neutral-500">
            <Link to="/" className="hover:text-black">Home</Link>
            <span>/</span>
            <Link to="/shop" className="hover:text-black">Shop</Link>
            <span>/</span>
            <span className="text-neutral-900">{displayTitle}</span>
          </nav>

          <div className="flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <h1 className="boutique-heading text-4xl sm:text-6xl">
                {displayTitle}<span className="text-neutral-400">.</span>
              </h1>
              <p className="mt-3 max-w-lg text-sm leading-6 text-neutral-500">
                {filtered.length > 0
                  ? `${filtered.length} piece${filtered.length !== 1 ? "s" : ""} in this collection.`
                  : "Explore our curated selection."}
              </p>
            </div>

            <Link
              to="/shop"
              className="inline-flex w-fit items-center gap-2 text-xs uppercase tracking-[0.16em] text-neutral-500 transition-colors hover:text-black"
            >
              <ArrowLeft size={14} /> All collections
            </Link>
          </div>
        </div>
      </section>

      {/* Products Grid */}
      <div className="mx-auto max-w-[1200px] px-4 py-8 sm:px-8 lg:px-0 lg:py-12">
        {isLoading && products.length === 0 ? (
          <div className="flex min-h-[350px] flex-col items-center justify-center gap-3 text-neutral-500">
            <Loader2 className="h-8 w-8 animate-spin" />
            <p className="text-xs uppercase tracking-[0.2em]">Loading collection...</p>
          </div>
        ) : filtered.length === 0 ? (
          <div className="flex min-h-[350px] flex-col items-center justify-center text-center">
            <p className="font-serif text-3xl italic text-neutral-800">Nothing here yet.</p>
            <p className="mt-3 max-w-sm text-sm text-neutral-500">
              No products found under "{displayTitle}". Check back soon or explore other collections.
            </p>
            <Link
              to="/shop"
              className="boutique-action mt-6 px-6 py-3"
            >
              Browse all products
            </Link>
          </div>
        ) : (
          <>
            <p className="mb-6 text-xs text-neutral-500">
              Showing {firstProductIndex}–{lastProductIndex} of {filtered.length} piece{filtered.length !== 1 ? "s" : ""}
            </p>

            <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 sm:gap-x-5 xl:grid-cols-4">
              {paginatedProducts.map((product) => {
                const productId = product._id || product.id;
                const productSlug = product.slug || productId;
                const badge = getProductBadge(product);
                const productImage =
                  (Array.isArray(product.images) && product.images[0]) ||
                  product.image ||
                  "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=85";
                const comparePrice = product.compareAtPrice ?? product.oldPrice;

                return (
                  <article key={productId} className="product-tile group">
                    <Link
                      to={`/product/${productSlug}`}
                      className="relative block overflow-hidden bg-[#f2f4f5]"
                    >
                      <div className="aspect-[3/4] overflow-hidden">
                        <img
                          src={productImage}
                          alt={product.name}
                          loading="lazy"
                          className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.045]"
                        />
                      </div>

                      {badge && (
                        <span className="absolute left-2 top-2 rounded-xl bg-white/95 px-2 py-1 text-[9px] font-semibold tracking-[0.08em] text-[#5433eb] sm:left-3 sm:top-3 sm:px-3 sm:text-[10px]">
                          {badge}
                        </span>
                      )}

                      <span className="absolute bottom-3 right-3 flex translate-y-2 items-center gap-2 bg-white px-3 py-2 text-[10px] font-semibold uppercase tracking-wider opacity-0 shadow-sm transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100 max-sm:hidden">
                        Discover <ArrowUpRight size={13} />
                      </span>
                    </Link>

                    <div className="pt-3">
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0">
                          <p className="text-[10px] uppercase tracking-[0.12em] text-neutral-500 sm:text-xs">
                            {product.category}
                          </p>
                          <h2 className="mt-1 text-xs font-medium leading-5 sm:text-sm">
                            {product.name}
                          </h2>
                        </div>

                        <div className="shrink-0 text-right">
                          <p className="text-xs font-medium sm:text-sm">
                            {formatPrice(product.price)}
                          </p>
                          {comparePrice && comparePrice > product.price && (
                            <p className="mt-1 text-[10px] text-neutral-400 line-through sm:text-xs">
                              {formatPrice(comparePrice)}
                            </p>
                          )}
                        </div>
                      </div>

                      <div className="mt-3 flex flex-wrap gap-1.5">
                        {(product.colors || []).map((color, idx) => {
                          const hex =
                            (typeof color === "object" && color?.hex) || "#ddd";
                          const name =
                            typeof color === "string" ? color : color?.name;
                          return (
                            <span
                              key={name ? `${name}-${idx}` : idx}
                              title={name}
                              className="h-3 w-3 rounded-full border border-black/10"
                              style={{ backgroundColor: hex }}
                            />
                          );
                        })}
                      </div>
                    </div>
                  </article>
                );
              })}
            </div>
            <Pagination
              page={activePage}
              totalPages={totalPages}
              onPageChange={(page) => setPagination({ category: categoryName, page })}
            />
          </>
        )}
      </div>
    </main>
  );
}
