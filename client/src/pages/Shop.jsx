import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import {
  Search,
  SlidersHorizontal,
  X,
  ArrowUpRight,
  ChevronDown,
  RotateCcw,
} from "lucide-react";
import useProductHook from "../hooks/useProductsHook";
import Pagination from "../components/common/Pagination";

const categories = ["T-Shirts", "Shirts", "Jeans", "Dresses", "Jackets"];

const sizes = ["XS", "S", "M", "L", "XL", "XXL"];

const PRODUCTS_PER_PAGE = 12;

const colors = [
  { name: "Black", value: "#171717" },
  { name: "White", value: "#ffffff" },
  { name: "Beige", value: "#d7c3a5" },
  { name: "Blue", value: "#536e9b" },
];

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

function FilterGroup({ title, children, defaultOpen = true }) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div className="border-b border-neutral-200 py-5 last:border-b-0">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex min-h-7 w-full items-center justify-between text-sm font-semibold text-neutral-800"
      >
        {title}
        <ChevronDown
          size={16}
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>

      {open && <div className="mt-4">{children}</div>}
    </div>
  );
}

export default function Shop() {
  const {
    products = [],
    isLoading,
    status,
    error,
    refreshProducts,
  } = useProductHook();

  const [searchParams, setSearchParams] = useSearchParams();

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [selectedCategories, setSelectedCategories] = useState(
    searchParams.get("category") ? [searchParams.get("category")] : [],
  );
  const [selectedSizes, setSelectedSizes] = useState([]);
  const [selectedColors, setSelectedColors] = useState([]);
  const [gender, setGender] = useState("All");
  const [maxPrice, setMaxPrice] = useState(5000);
  const [sort, setSort] = useState("featured");
  const [mobileFilters, setMobileFilters] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);

  const filteredProducts = useMemo(() => {
    const list = Array.isArray(products) ? products : [];

    let result = list.filter((product) => {
      if (!product) return false;

      const productName = product.name || "";
      const productCategory = product.category || "";
      const productGender = product.gender || "";

      const matchesSearch =
        `${productName} ${productCategory} ${productGender}`
          .toLowerCase()
          .includes(search.trim().toLowerCase());

      const badge = getProductBadge(product);

      const matchesCategory =
        selectedCategories.length === 0 ||
        selectedCategories.some((category) => {
          const lower = category.toLowerCase();
          return (
            lower === productCategory.toLowerCase() ||
            (lower === "new-arrivals" && badge === "NEW") ||
            (lower === "best-sellers" && badge === "BESTSELLER") ||
            (lower === "sale" && badge === "SALE") ||
            (lower === "mens" && productGender === "Men") ||
            (lower === "womens" && productGender === "Women")
          );
        });

      const productSizes = Array.isArray(product.sizes) ? product.sizes : [];
      const matchesSize =
        selectedSizes.length === 0 ||
        selectedSizes.some((size) => productSizes.includes(size));

      const productColors = Array.isArray(product.colors) ? product.colors : [];
      const matchesColor =
        selectedColors.length === 0 ||
        selectedColors.some((selectedColor) =>
          productColors.some((color) => {
            const colorName =
              typeof color === "string" ? color : color?.name;
            return (
              colorName?.toLowerCase() === selectedColor.toLowerCase()
            );
          })
        );

      const matchesGender =
        gender === "All" ||
        productGender.toLowerCase() === gender.toLowerCase();

      const price = Number(product.price || 0);
      const matchesPrice = price <= maxPrice;

      return (
        matchesSearch &&
        matchesCategory &&
        matchesSize &&
        matchesColor &&
        matchesGender &&
        matchesPrice
      );
    });

    if (sort === "price-low") {
      result.sort((a, b) => Number(a.price || 0) - Number(b.price || 0));
    } else if (sort === "price-high") {
      result.sort((a, b) => Number(b.price || 0) - Number(a.price || 0));
    } else if (sort === "newest") {
      result.sort((a, b) => {
        const dateB = new Date(b.createdAt || 0).getTime();
        const dateA = new Date(a.createdAt || 0).getTime();
        if (dateB !== dateA) return dateB - dateA;
        const badgeB = getProductBadge(b);
        const badgeA = getProductBadge(a);
        return Number(badgeB === "NEW") - Number(badgeA === "NEW");
      });
    } else if (sort === "discount") {
      result.sort((a, b) => {
        const oldB = b.compareAtPrice ?? b.oldPrice ?? 0;
        const oldA = a.compareAtPrice ?? a.oldPrice ?? 0;
        const discountB = oldB > b.price ? oldB - b.price : 0;
        const discountA = oldA > a.price ? oldA - a.price : 0;
        return discountB - discountA;
      });
    }

    return result;
  }, [
    products,
    search,
    selectedCategories,
    selectedSizes,
    selectedColors,
    gender,
    maxPrice,
    sort,
  ]);

  const toggleValue = (value, setter, selected) => {
    setter(
      selected.includes(value)
        ? selected.filter((item) => item !== value)
        : [...selected, value],
    );
    setCurrentPage(1);
  };

  const clearFilters = () => {
    setSearch("");
    setSelectedCategories([]);
    setSelectedSizes([]);
    setSelectedColors([]);
    setGender("All");
    setMaxPrice(5000);
    setSort("featured");
    setCurrentPage(1);
    setSearchParams({});
  };

  const totalPages = Math.max(
    1,
    Math.ceil(filteredProducts.length / PRODUCTS_PER_PAGE),
  );
  const activePage = Math.min(currentPage, totalPages);
  const firstProductIndex = filteredProducts.length
    ? (activePage - 1) * PRODUCTS_PER_PAGE + 1
    : 0;
  const lastProductIndex = Math.min(
    activePage * PRODUCTS_PER_PAGE,
    filteredProducts.length,
  );
  const paginatedProducts = filteredProducts.slice(
    (activePage - 1) * PRODUCTS_PER_PAGE,
    activePage * PRODUCTS_PER_PAGE,
  );

  const activeFilters = [
    ...selectedCategories.map((value) => ({
      label: value,
      remove: () => {
        setSelectedCategories((old) => old.filter((item) => item !== value));
        setCurrentPage(1);
      },
    })),
    ...selectedSizes.map((value) => ({
      label: `Size: ${value}`,
      remove: () => {
        setSelectedSizes((old) => old.filter((item) => item !== value));
        setCurrentPage(1);
      },
    })),
    ...selectedColors.map((value) => ({
      label: value,
      remove: () => {
        setSelectedColors((old) => old.filter((item) => item !== value));
        setCurrentPage(1);
      },
    })),
    ...(gender !== "All"
      ? [
          {
            label: gender,
            remove: () => {
              setGender("All");
              setCurrentPage(1);
            },
          },
        ]
      : []),
    ...(maxPrice < 5000
      ? [
          {
            label: `Under ${formatPrice(maxPrice)}`,
            remove: () => {
              setMaxPrice(5000);
              setCurrentPage(1);
            },
          },
        ]
      : []),
  ];

  const filterPanel = (
    <div>
      <div className="flex items-center justify-between">
        <h2 className="text-xs font-semibold uppercase tracking-[0.2em]">
          Refine Selection
        </h2>

        <button
          type="button"
          onClick={clearFilters}
          className="flex items-center gap-1 text-xs text-neutral-500 hover:text-black"
        >
          <RotateCcw size={12} /> Reset
        </button>
      </div>

      <FilterGroup title="Collection">
        <div className="space-y-3">
          {categories.map((category) => (
            <label
              key={category}
            className="flex cursor-pointer items-center gap-3 text-sm text-neutral-600 transition-colors hover:text-[#5433eb]"
            >
              <input
                type="checkbox"
                checked={selectedCategories.includes(category)}
                onChange={() =>
                  toggleValue(
                    category,
                    setSelectedCategories,
                    selectedCategories,
                  )
                }
                className="h-4 w-4 accent-[#5433eb]"
              />
              {category}
            </label>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Gender">
        <div className="flex flex-wrap gap-2">
          {["All", "Men", "Women"].map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => {
                setGender(item);
                setCurrentPage(1);
              }}
              className={`boutique-chip border px-4 py-2 text-xs font-medium ${
                gender === item
                  ? "boutique-chip-selected"
                  : "hover:border-[#5433eb]"
              }`}
            >
              {item === "All" ? "All" : item}
            </button>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Price Range">
        <div className="flex items-center justify-between text-sm">
          <span className="text-neutral-500">Up to</span>
          <span className="font-medium">{formatPrice(maxPrice)}</span>
        </div>

        <input
          type="range"
          min="500"
          max="5000"
          step="100"
          value={maxPrice}
          onChange={(event) => {
            setMaxPrice(Number(event.target.value));
            setCurrentPage(1);
          }}
          className="mt-4 w-full cursor-pointer accent-[#5433eb]"
          aria-label="Maximum price"
        />

        <div className="mt-1 flex justify-between text-xs text-neutral-400">
          <span>₹500</span>
          <span>₹5,000+</span>
        </div>
      </FilterGroup>

      <FilterGroup title="Size">
        <div className="grid grid-cols-3 gap-2">
          {sizes.map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => toggleValue(size, setSelectedSizes, selectedSizes)}
              className={`boutique-chip border py-2.5 text-xs font-medium ${
                selectedSizes.includes(size)
                  ? "boutique-chip-selected"
                  : "hover:border-[#5433eb]"
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </FilterGroup>

      <FilterGroup title="Color">
        <div className="flex flex-wrap gap-3">
          {colors.map((color) => (
            <button
              key={color.name}
              type="button"
              title={color.name}
              aria-label={color.name}
              onClick={() =>
                toggleValue(color.name, setSelectedColors, selectedColors)
              }
              className={`flex h-9 w-9 items-center justify-center rounded-full border-2 ${
                selectedColors.includes(color.name)
                  ? "border-[#5433eb]"
                  : "border-transparent"
              }`}
            >
              <span
                className="h-7 w-7 rounded-full border border-black/10"
                style={{ backgroundColor: color.value }}
              />
            </button>
          ))}
        </div>

        {selectedColors.length > 0 && (
          <p className="mt-3 text-xs text-neutral-500">
            {selectedColors.join(", ")}
          </p>
        )}
      </FilterGroup>
    </div>
  );

  return (
    <main className="boutique-page">
      {/* Editorial Header */}
      <section className="border-b border-neutral-200 bg-white px-4 py-12 sm:px-8 sm:py-16 lg:px-8 lg:py-20">
        <div className="mx-auto max-w-[1200px]">
          <p className="boutique-eyebrow">
            The wardrobe edit / 01
          </p>

          <div className="mt-4 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <h1 className="boutique-heading text-5xl sm:text-7xl">
                Find your <span className="italic">form.</span>
              </h1>

              <p className="mt-4 max-w-lg text-sm leading-6 text-neutral-500">
                Thoughtfully selected pieces. Everyday essentials. Styles that
                feel unmistakably you.
              </p>
            </div>

            <p className="text-xs uppercase tracking-[0.16em] text-neutral-500">
              Considered style, everyday.
            </p>
          </div>
        </div>
      </section>

      <div className="mx-auto max-w-[1200px] px-4 py-8 sm:px-8 lg:px-0 lg:py-12">
        {/* Search & Toolbar */}
        <div className="mb-8 flex flex-col gap-4 border-b border-neutral-200 pb-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="boutique-search relative w-full sm:max-w-md">
            <Search
              size={18}
              className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-500"
            />

            <input
              type="search"
              value={search}
              onChange={(event) => {
                const value = event.target.value;
                setSearch(value);
                setCurrentPage(1);

                if (value) {
                  setSearchParams(
                    (previous) => {
                      const next = new URLSearchParams(previous);
                      next.set("search", value);
                      return next;
                    },
                    { replace: true },
                  );
                } else {
                  setSearchParams(
                    (previous) => {
                      const next = new URLSearchParams(previous);
                      next.delete("search");
                      return next;
                    },
                    { replace: true },
                  );
                }
              }}
              placeholder="Search your next favourite..."
              className="w-full rounded-full bg-transparent py-3 pl-11 pr-4 text-sm outline-none"
            />
          </div>

          <div className="flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => setMobileFilters(true)}
              className="boutique-chip flex items-center gap-2 px-4 py-3 text-xs font-semibold hover:border-[#5433eb] lg:hidden"
            >
              <SlidersHorizontal size={15} />
              Filters
              {activeFilters.length > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#5433eb] text-[10px] text-white">
                  {activeFilters.length}
                </span>
              )}
            </button>

            <p className="hidden text-xs text-neutral-500 sm:block">
              {filteredProducts.length} pieces to discover
            </p>

            <div className="flex items-center gap-2">
              <span className="hidden text-xs text-neutral-500 sm:inline">
                Sort by
              </span>

              <select
                value={sort}
                onChange={(event) => {
                  setSort(event.target.value);
                  setCurrentPage(1);
                }}
                className="boutique-control max-w-[180px] px-4 py-3 text-xs outline-none"
                aria-label="Sort products"
              >
                <option value="featured">Featured</option>
                <option value="newest">Newest arrivals</option>
                <option value="price-low">Price: Low to High</option>
                <option value="price-high">Price: High to Low</option>
                <option value="discount">Biggest savings</option>
              </select>
            </div>
          </div>
        </div>

        {/* Active Filters */}
        {activeFilters.length > 0 && (
          <div className="mb-6 flex flex-wrap items-center gap-2">
            {activeFilters.map((filter, index) => (
              <button
                key={`${filter.label}-${index}`}
                type="button"
                onClick={filter.remove}
                className="boutique-chip flex items-center gap-2 px-3 py-2 text-xs hover:border-[#5433eb]"
              >
                {filter.label}
                <X size={12} />
              </button>
            ))}

            <button
              type="button"
              onClick={clearFilters}
              className="px-2 py-2 text-xs underline underline-offset-4"
            >
              Clear all
            </button>
          </div>
        )}

        <div className="flex items-start gap-10">
          {/* Desktop Sidebar */}
          <aside className="boutique-surface hidden w-60 shrink-0 p-5 lg:sticky lg:top-28 lg:block">
            {filterPanel}
          </aside>

          {/* Product Results */}
          <section className="min-w-0 flex-1">
            <div className="mb-5 flex items-center justify-between">
              <p className="text-xs text-neutral-500">
                Showing {firstProductIndex}–{lastProductIndex} of {filteredProducts.length} pieces
              </p>

              <span className="font-serif text-sm italic text-neutral-500">
                Curated, not crowded.
              </span>
            </div>

            {/* Pinterest Masonry Grid */}
            {isLoading ? (
              <div className="flex min-h-[350px] flex-col items-center justify-center text-center">
                <div className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-900 border-t-transparent" />
                <p className="mt-4 text-xs uppercase tracking-[0.2em] text-neutral-500">
                  Loading collection...
                </p>
              </div>
            ) : status === "failed" ? (
              <div className="flex min-h-[350px] flex-col items-center justify-center text-center">
                <p className="font-serif text-2xl italic text-neutral-800">
                  Could not load products
                </p>
                <p className="mt-2 max-w-sm text-sm text-neutral-500">
                  {error || "An error occurred while fetching products from the server."}
                </p>
                <button
                  type="button"
                  onClick={() => refreshProducts()}
                  className="boutique-action mt-6 px-6 py-3"
                >
                  Retry
                </button>
              </div>
            ) : filteredProducts.length > 0 ? (
              <>
              <div className="grid grid-cols-2 gap-x-3 gap-y-8 sm:grid-cols-3 sm:gap-x-5 xl:grid-cols-4">
                {paginatedProducts.map((product) => {
                  const productId = product._id || product.id;
                  const productBadge = getProductBadge(product);
                  const productImage =
                    (Array.isArray(product.images) && product.images[0]) ||
                    product.image ||
                    "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=85";
                  const productRatio = product.ratio || "aspect-[3/4]";
                  const comparePrice = product.compareAtPrice ?? product.oldPrice;

                  return (
                    <article
                      key={productId}
                      className="product-tile group"
                    >
                      <Link
                        to={`/product/${product.slug || productId}`}
                        className="relative block overflow-hidden bg-[#f2f4f5]"
                      >
                        <div className={`${productRatio} overflow-hidden`}>
                          <img
                            src={productImage}
                            alt={product.name}
                            loading="lazy"
                            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-[1.045]"
                          />
                        </div>

                        {productBadge && (
                          <span className="absolute left-2 top-2 rounded-xl bg-white/95 px-2 py-1 text-[9px] font-semibold tracking-[0.08em] text-[#5433eb] sm:left-3 sm:top-3 sm:px-3 sm:text-[10px]">
                            {productBadge}
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

                          <h2 className="mt-1 text-xs font-medium leading-5 text-neutral-800 sm:text-sm">
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
                          {(product.colors || []).map((color, index) => {
                            const colorName =
                              typeof color === "string" ? color : color?.name;
                            const colorValue =
                              (typeof color === "object" && color?.hex) ||
                              colors.find(
                                (item) =>
                                  item.name.toLowerCase() ===
                                  colorName?.toLowerCase()
                              )?.value ||
                              "#ddd";

                            return (
                              <span
                                key={colorName ? `${colorName}-${index}` : index}
                                title={colorName}
                                className="h-3 w-3 rounded-full border border-black/10"
                                style={{
                                  backgroundColor: colorValue,
                                }}
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
                onPageChange={setCurrentPage}
              />
              </>
            ) : (
              <div className="flex min-h-[350px] flex-col items-center justify-center text-center">
                <p className="font-serif text-3xl italic">Nothing found.</p>

                <p className="mt-3 max-w-sm text-sm leading-6 text-neutral-500">
                  Try another search or clear your filters to discover more
                  pieces from the collection.
                </p>

                <button
                  type="button"
                  onClick={clearFilters}
                  className="boutique-action mt-6 px-6 py-3"
                >
                  Clear filters
                </button>
              </div>
            )}
          </section>
        </div>
      </div>

      {/* Mobile Filter Drawer */}
      {mobileFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            aria-label="Close filters"
            onClick={() => setMobileFilters(false)}
            className="absolute inset-0 bg-black/40"
          />

          <div className="absolute inset-y-0 right-0 flex w-full max-w-sm flex-col bg-[#fdfbf8] shadow-2xl">
            <div className="flex items-center justify-between border-b border-neutral-200 px-5 py-5">
              <h2 className="font-serif text-2xl">Filters</h2>

              <button
                type="button"
                onClick={() => setMobileFilters(false)}
                aria-label="Close filters"
                className="flex h-10 w-10 items-center justify-center"
              >
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-5 py-4">
              {filterPanel}
            </div>

            <div className="flex gap-3 border-t border-neutral-200 bg-white p-4">
              <button
                type="button"
                onClick={clearFilters}
                className="boutique-outline-action flex-1 py-3 text-xs"
              >
                Reset
              </button>

              <button
                type="button"
                onClick={() => setMobileFilters(false)}
                className="boutique-action flex-1 py-3 text-xs"
              >
                Show {filteredProducts.length} items
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
