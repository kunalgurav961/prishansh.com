import { useEffect, useState } from "react";
import { useParams, Link } from "react-router";
import { ArrowLeft, Check, ShoppingBag, ShieldCheck, Truck, RefreshCw } from "lucide-react";
import useProductHook from "../../hooks/useProductsHook";
import useCart from "../../hooks/useCart";

const formatPrice = (price) =>
  typeof price === "number"
    ? `₹${price.toLocaleString("en-IN")}`
    : `₹${Number(price || 0).toLocaleString("en-IN")}`;

export default function ProductDetails() {
  const { id } = useParams();
  const { product, isProductLoading, productStatus, error, loadProduct } = useProductHook();
  const { addToCart } = useCart();

  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState("");
  const [selectedColor, setSelectedColor] = useState("");
  const [added, setAdded] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    if (id) {
      loadProduct(id);
    }
  }, [id, loadProduct]);

  useEffect(() => {
    if (product) {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
      if (product.sizes?.length) setSelectedSize(product.sizes[0]);
      if (product.colors?.length) {
        const firstColor = product.colors[0];
        setSelectedColor(typeof firstColor === "string" ? firstColor : firstColor.name);
      }
      setSelectedImage(0);
    }
  }, [product]);

  if (isProductLoading) {
    return (
      <main className="boutique-page flex flex-col items-center justify-center py-24">
        <div className="h-9 w-9 animate-spin rounded-full border-2 border-neutral-900 border-t-transparent" />
        <p className="mt-4 text-xs font-medium uppercase tracking-[0.2em] text-neutral-500">
          Loading piece...
        </p>
      </main>
    );
  }

  if (productStatus === "failed" || !product) {
    return (
      <main className="boutique-page px-6 py-24 text-center">
        <p className="font-serif text-3xl italic text-neutral-900">Piece not found</p>
        <p className="mt-3 text-sm text-neutral-500">
          {error || "The item you are looking for is currently unavailable."}
        </p>
        <Link
          to="/shop"
          className="boutique-action mt-6 px-6 py-3"
        >
          <ArrowLeft size={14} /> Back to Collection
        </Link>
      </main>
    );
  }

  const images = Array.isArray(product.images) && product.images.length
    ? product.images
    : [product.image || "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=800&q=85"];

  const currentImage = images[selectedImage] || images[0];
  const oldPrice = product.compareAtPrice ?? product.oldPrice;
  const badge =
    product.badge ||
    (product.isNewArrival
      ? "NEW"
      : product.isBestSeller
      ? "BESTSELLER"
      : oldPrice && oldPrice > product.price
      ? "SALE"
      : null);

  const handleAddToCart = () => {
    if (!product) return;
    addToCart(product, { size: selectedSize, color: selectedColor, quantity: 1 });
    setAdded(true);
    setTimeout(() => setAdded(false), 2200);
  };

  return (
    <main className="boutique-page">
      <div className="mx-auto max-w-[1200px] px-4 py-8 sm:px-8 lg:px-0 lg:py-14">
        {/* Breadcrumb Navigation */}
        <nav className="mb-8 flex items-center gap-2 text-xs text-neutral-500">
          <Link to="/shop" className="hover:text-black">
            Shop
          </Link>
          <span>/</span>
          <span className="capitalize">{product.category || "Collection"}</span>
          <span>/</span>
          <span className="truncate font-medium text-black">{product.name}</span>
        </nav>

        <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
          {/* Product Media Gallery */}
          <div className="lg:col-span-7">
            <div className="flex flex-col-reverse gap-4 sm:flex-row">
              {/* Thumbnails */}
              {images.length > 1 && (
                <div className="flex gap-3 overflow-x-auto sm:flex-col sm:overflow-visible">
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setSelectedImage(idx)}
                      className={`relative h-20 w-16 shrink-0 overflow-hidden rounded-xl bg-neutral-200 transition ${
                        selectedImage === idx ? "ring-2 ring-[#5433eb] ring-offset-2" : "opacity-70 hover:opacity-100"
                      }`}
                    >
                      <img src={img} alt="" className="h-full w-full object-cover" />
                    </button>
                  ))}
                </div>
              )}

              {/* Main Image Display */}
              <div className="relative aspect-[3/4] w-full overflow-hidden rounded-[28px] bg-[#f2f4f5] shadow-[0_4px_24px_rgba(0,0,0,0.12)]">
                <img
                  src={currentImage}
                  alt={product.name}
                  className="h-full w-full object-cover transition duration-500"
                />
                {badge && (
                  <span className="absolute left-4 top-4 rounded-xl bg-white/95 px-3 py-1.5 text-[10px] font-semibold tracking-[0.08em] text-[#5433eb]">
                    {badge}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Product Meta & Actions */}
          <div className="flex flex-col lg:col-span-5 lg:sticky lg:top-28 lg:self-start">
            <div className="border-b border-neutral-200 pb-6">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
                {product.category} {product.gender ? `• ${product.gender}` : ""}
              </p>
              <h1 className="boutique-heading mt-2 text-3xl sm:text-4xl">
                {product.name}
              </h1>

              <div className="mt-4 flex items-baseline gap-3">
                <span className="text-xl font-medium sm:text-2xl">
                  {formatPrice(product.price)}
                </span>
                {oldPrice && oldPrice > product.price && (
                  <span className="text-sm text-neutral-400 line-through">
                    {formatPrice(oldPrice)}
                  </span>
                )}
              </div>
            </div>

            {/* Description */}
            <p className="mt-6 text-sm leading-relaxed text-neutral-600">
              {product.description || "Crafted with refined silhouettes and premium textiles tailored for everyday poise."}
            </p>

            {/* Color Selector */}
            {product.colors?.length > 0 && (
              <div className="mt-6">
                <label className="text-xs font-semibold uppercase tracking-wider text-neutral-700">
                  Color: <span className="font-normal text-neutral-900">{selectedColor}</span>
                </label>
                <div className="mt-2.5 flex flex-wrap gap-2.5">
                  {product.colors.map((c, i) => {
                    const cName = typeof c === "string" ? c : c.name;
                    const cHex = typeof c === "object" ? c.hex : "#111";
                    const isSelected = selectedColor.toLowerCase() === cName.toLowerCase();

                    return (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setSelectedColor(cName)}
                        title={cName}
                        className={`flex h-8 w-8 items-center justify-center rounded-full border-2 transition ${
                          isSelected ? "border-[#5433eb]" : "border-transparent"
                        }`}
                      >
                        <span
                          className="h-6 w-6 rounded-full border border-black/10"
                          style={{ backgroundColor: cHex || "#ddd" }}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Size Selector */}
            {product.sizes?.length > 0 && (
              <div className="mt-6">
                <div className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-neutral-700">
                  <span>Size</span>
                  <span className="text-neutral-400 font-normal">True to fit</span>
                </div>
                <div className="mt-2.5 grid grid-cols-4 gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setSelectedSize(size)}
                      className={`boutique-chip border py-2.5 text-xs font-medium uppercase tracking-wider ${
                        selectedSize === size
                          ? "boutique-chip-selected"
                          : "hover:border-[#5433eb]"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Add to Bag CTA */}
            <div className="mt-8 flex flex-col gap-3">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={product.stock === 0}
                className={`flex w-full items-center justify-center gap-2 py-4 text-xs font-semibold uppercase tracking-widest transition ${
                  product.stock === 0
                    ? "cursor-not-allowed bg-neutral-300 text-neutral-500"
                    : added
                    ? "bg-emerald-700 text-white"
                    : "boutique-action"
                }`}
              >
                {product.stock === 0 ? (
                  "Out of Stock"
                ) : added ? (
                  <>
                    <Check size={16} /> Added to Bag
                  </>
                ) : (
                  <>
                    <ShoppingBag size={16} /> Add to Bag
                  </>
                )}
              </button>
            </div>

            {/* Highlights */}
            <div className="mt-10 border-t border-neutral-200 pt-6 space-y-3.5 text-xs text-neutral-500">
              <div className="flex items-center gap-3">
                <Truck size={16} className="text-neutral-700" />
                <span>Complimentary express delivery on orders over ₹2,999</span>
              </div>
              <div className="flex items-center gap-3">
                <RefreshCw size={16} className="text-neutral-700" />
                <span>Hassle-free 7-day returns & exchanges</span>
              </div>
              <div className="flex items-center gap-3">
                <ShieldCheck size={16} className="text-neutral-700" />
                <span>100% authentic materials, tailored craftsmanship</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
