import { Link } from "react-router";
import { Trash2, Plus, Minus, ArrowRight, ArrowLeft, ShoppingBag, ShieldCheck } from "lucide-react";
import useCart from "../../hooks/useCart";

const formatPrice = (price) =>
  typeof price === "number"
    ? `₹${price.toLocaleString("en-IN")}`
    : `₹${Number(price || 0).toLocaleString("en-IN")}`;

export default function Cart() {
  const { cartItems, totalCount, subtotal, shipping, total, updateQuantity, removeFromCart, clearCart } = useCart();

  if (cartItems.length === 0) {
    return (
      <main className="boutique-page flex min-h-[70vh] items-center px-4 py-20 text-center">
        <div className="mx-auto max-w-md">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-neutral-200/60 text-neutral-600">
            <ShoppingBag size={28} />
          </div>
          <h1 className="mt-6 font-serif text-3xl italic text-neutral-900">Your bag is empty</h1>
          <p className="mt-3 text-sm text-neutral-500">
            Explore our curated edits and find signature pieces to build your timeless wardrobe.
          </p>
          <Link
            to="/shop"
            className="boutique-action mt-8 px-8 py-3.5"
          >
            Explore Collection <ArrowRight size={14} />
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="boutique-page">
      <div className="mx-auto max-w-[1200px] px-4 py-8 sm:px-8 lg:px-0 lg:py-12">
        {/* Header */}
        <div className="flex flex-col justify-between gap-4 border-b border-neutral-200 pb-6 sm:flex-row sm:items-baseline">
          <div>
            <h1 className="boutique-heading text-3xl sm:text-4xl">Shopping Bag</h1>
            <p className="mt-1 text-xs text-neutral-500">
              {totalCount} {totalCount === 1 ? "item" : "items"} selected for booking
            </p>
          </div>
          <button
            type="button"
            onClick={clearCart}
            className="text-xs text-neutral-500 underline underline-offset-4 hover:text-black self-start sm:self-auto"
          >
            Clear bag
          </button>
        </div>

        <div className="mt-8 grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
          {/* Cart Items List */}
          <div className="divide-y divide-neutral-200 lg:col-span-7">
            {cartItems.map((item) => (
              <div key={item.cartItemId} className="flex gap-4 py-6 sm:gap-6">
                <Link
                  to={`/product/${item.slug || item.productId}`}
                  className="relative aspect-[3/4] w-24 shrink-0 overflow-hidden rounded-[20px] bg-neutral-100 sm:w-28"
                >
                  <img
                    src={item.image || "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=400&q=80"}
                    alt={item.name}
                    className="h-full w-full object-cover"
                  />
                </Link>

                <div className="flex flex-1 flex-col justify-between">
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500">
                          {item.category}
                        </p>
                        <h2 className="mt-1 text-sm font-medium sm:text-base">
                          <Link to={`/product/${item.slug || item.productId}`} className="hover:underline">
                            {item.name}
                          </Link>
                        </h2>
                      </div>
                      <p className="text-sm font-semibold">{formatPrice(item.price * item.quantity)}</p>
                    </div>

                    <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-neutral-500">
                      <span>Size: <strong className="font-medium text-neutral-800">{item.size}</strong></span>
                      <span>•</span>
                      <span>Color: <strong className="font-medium text-neutral-800">{item.color}</strong></span>
                    </div>
                  </div>

                  <div className="mt-4 flex items-center justify-between">
                    {/* Quantity Selector */}
                    <div className="flex items-center border border-neutral-300 bg-white">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.cartItemId, item.quantity - 1)}
                        className="flex min-h-9 min-w-9 items-center justify-center text-neutral-600 transition-colors hover:bg-[#f2f4f5] hover:text-[#5433eb]"
                        aria-label="Decrease quantity"
                      >
                        <Minus size={13} />
                      </button>
                      <span className="w-8 text-center text-xs font-medium">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.cartItemId, item.quantity + 1)}
                        className="flex min-h-9 min-w-9 items-center justify-center text-neutral-600 transition-colors hover:bg-[#f2f4f5] hover:text-[#5433eb]"
                        aria-label="Increase quantity"
                      >
                        <Plus size={13} />
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={() => removeFromCart(item.cartItemId)}
                      className="flex items-center gap-1 text-xs text-neutral-400 transition hover:text-[#5433eb]"
                    >
                      <Trash2 size={14} /> Remove
                    </button>
                  </div>
                </div>
              </div>
            ))}

            <div className="pt-6">
              <Link
                to="/shop"
                className="inline-flex items-center gap-2 text-xs font-medium text-neutral-600 hover:text-black"
              >
                <ArrowLeft size={14} /> Continue Shopping
              </Link>
            </div>
          </div>

          {/* Order Summary & Booking CTA */}
          <div className="lg:col-span-5 lg:sticky lg:top-28 lg:self-start">
            <div className="boutique-surface p-6 sm:p-8">
              <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-900">
                Order Summary
              </h2>

              <div className="mt-6 space-y-3.5 border-b border-neutral-200 pb-6 text-sm">
                <div className="flex justify-between text-neutral-600">
                  <span>Subtotal</span>
                  <span className="font-medium text-neutral-900">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span>Standard Delivery</span>
                  <span className="font-medium text-neutral-900">
                    {shipping === 0 ? "Complimentary" : formatPrice(shipping)}
                  </span>
                </div>
                {shipping === 0 && (
                  <p className="text-[11px] text-emerald-700">Eligible for free express delivery</p>
                )}
              </div>

              <div className="flex justify-between py-5 text-base font-medium">
                <span>Estimated Total</span>
                <span className="font-semibold">{formatPrice(total)}</span>
              </div>

              <Link
                to="/checkout"
                className="boutique-action mt-2 w-full py-4"
              >
                Proceed to Checkout <ArrowRight size={14} />
              </Link>

              <div className="mt-6 flex items-center justify-center gap-2 text-center text-xs text-neutral-400">
                <ShieldCheck size={14} />
                <span>Secure SSL encrypted checkout</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
