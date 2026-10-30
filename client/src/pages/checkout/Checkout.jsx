import { useEffect, useState } from "react";
import { Link } from "react-router";
import { useSelector } from "react-redux";
import { useAuth0 } from "@auth0/auth0-react";
import {
  CheckCircle2,
  ShieldCheck,
  Truck,
  ArrowLeft,
  ArrowRight,
  ShoppingBag,
  CreditCard,
  AlertCircle,
  Loader2,
} from "lucide-react";
import useCart from "../../hooks/useCart";
import { loadRazorpayScript, createPaymentOrder, verifyPayment } from "../../services/paymentService";

const formatPrice = (price) =>
  typeof price === "number"
    ? `₹${price.toLocaleString("en-IN")}`
    : `₹${Number(price || 0).toLocaleString("en-IN")}`;

export default function Checkout() {
  const { cartItems, totalCount, subtotal, shipping, total, clearCart } = useCart();
  const storedUser = useSelector((state) => state.user.user);
  const { user: authUser } = useAuth0();

  const [form, setForm] = useState({
    fullName: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    paymentMethod: "online", // Default to Razorpay online payment
  });

  const [orderConfirmed, setOrderConfirmed] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  // Auto-prefill authenticated user info when available
  useEffect(() => {
    const name = storedUser?.name || authUser?.name || "";
    const email = storedUser?.email || authUser?.email || "";
    const phone = storedUser?.mobile || "";

    setForm((prev) => ({
      ...prev,
      fullName: prev.fullName || name,
      email: prev.email || email,
      phone: prev.phone || phone,
    }));
  }, [storedUser, authUser]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (errorMessage) setErrorMessage("");
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    if (!cartItems.length) {
      setErrorMessage("Your bag is empty. Please add items before checking out.");
      return;
    }

    if (
      !form.fullName.trim() ||
      !form.email.trim() ||
      !form.phone.trim() ||
      !form.address.trim() ||
      !form.city.trim() ||
      !form.pincode.trim()
    ) {
      setErrorMessage("Please complete all required delivery details.");
      return;
    }

    setSubmitting(true);

    // 1. Cash on Delivery Flow
    if (form.paymentMethod === "cod") {
      try {
        setStatusMessage("Placing your cash-on-delivery order...");
        const res = await createPaymentOrder({
          items: cartItems.map((item) => ({
            productId: item.productId,
            quantity: item.quantity,
            size: item.size,
            color: item.color,
            name: item.name,
            image: item.image,
          })),
          shippingAddress: {
            fullName: form.fullName,
            email: form.email,
            phone: form.phone,
            address: form.address,
            city: form.city,
            state: form.state,
            pincode: form.pincode,
          },
          paymentMethod: "cod",
        });

        if (res.success && res.order) {
          clearCart();
          setOrderConfirmed(res.order);
        } else {
          setErrorMessage(res.message || "Failed to place order.");
        }
      } catch (err) {
        setErrorMessage(
          err.response?.data?.message || "Failed to place COD order. Please try again."
        );
      } finally {
        setSubmitting(false);
        setStatusMessage("");
      }
      return;
    }

    // 2. Razorpay Online Payment Flow
    try {
      setStatusMessage("Loading secure payment gateway...");
      const isSdkLoaded = await loadRazorpayScript();

      if (!isSdkLoaded) {
        setErrorMessage(
          "Unable to load Razorpay payment gateway. Please check your internet connection."
        );
        setSubmitting(false);
        setStatusMessage("");
        return;
      }

      setStatusMessage("Creating secure order with bank...");
      const orderData = await createPaymentOrder({
        items: cartItems.map((item) => ({
          productId: item.productId,
          quantity: item.quantity,
          size: item.size,
          color: item.color,
          name: item.name,
          image: item.image,
        })),
        shippingAddress: {
          fullName: form.fullName,
          email: form.email,
          phone: form.phone,
          address: form.address,
          city: form.city,
          state: form.state,
          pincode: form.pincode,
        },
        paymentMethod: "razorpay",
      });

      if (!orderData.razorpayOrderId) {
        throw new Error(orderData.message || "Failed to generate Razorpay order ID.");
      }

      setStatusMessage("Awaiting payment completion...");

      const options = {
        key: orderData.keyId || import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: orderData.amount,
        currency: orderData.currency || "INR",
        name: "PRISHANSH BOUTIQUE",
        description: `Order #${orderData.orderNumber}`,
        image: "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=150&q=80",
        order_id: orderData.razorpayOrderId,
        prefill: {
          name: form.fullName,
          email: form.email,
          contact: form.phone,
        },
        theme: {
          color: "#1c1917", // Modern charcoal / stone-900 theme
        },
        modal: {
          ondismiss: () => {
            setSubmitting(false);
            setStatusMessage("");
            setErrorMessage("Payment was cancelled. You can retry whenever you are ready.");
          },
        },
        handler: async (response) => {
          try {
            setStatusMessage("Verifying payment signature with server...");

            const verifyRes = await verifyPayment({
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_order_id: response.razorpay_order_id,
              razorpay_signature: response.razorpay_signature,
              orderId: orderData.orderId,
            });

            if (verifyRes.success && verifyRes.order) {
              clearCart();
              setOrderConfirmed(verifyRes.order);
            } else {
              setErrorMessage(
                verifyRes.message || "Payment verification failed. Please contact customer support."
              );
            }
          } catch (verifyErr) {
            console.error("Payment verification error:", verifyErr);
            setErrorMessage(
              verifyErr.response?.data?.message ||
                "Payment verification failed. If your account was debited, your order will be confirmed shortly."
            );
          } finally {
            setSubmitting(false);
            setStatusMessage("");
          }
        },
      };

      const razorpayInstance = new window.Razorpay(options);

      razorpayInstance.on("payment.failed", (failResponse) => {
        setSubmitting(false);
        setStatusMessage("");
        setErrorMessage(
          failResponse.error?.description ||
            "Payment transaction failed. Please try a different card or UPI method."
        );
      });

      razorpayInstance.open();
    } catch (err) {
      console.error("Razorpay order creation error:", err);
      setErrorMessage(
        err.response?.data?.message || err.message || "Failed to initialize payment. Please try again."
      );
      setSubmitting(false);
      setStatusMessage("");
    }
  };

  // Order Success Screen
  if (orderConfirmed) {
    const isPaid = orderConfirmed.payment?.status === "paid";
    const paymentId = orderConfirmed.payment?.razorpayPaymentId;

    return (
      <main className="boutique-page px-4 py-16 sm:px-6 lg:px-8">
        <div className="boutique-surface mx-auto max-w-2xl p-8 text-center sm:p-12">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-700">
            <CheckCircle2 size={36} />
          </div>

          <h1 className="mt-6 font-serif text-3xl italic text-neutral-900 sm:text-4xl">
            {isPaid ? "Payment Successful & Order Booked" : "Order Confirmed"}
          </h1>
          <p className="mt-2 text-sm text-neutral-600">
            Thank you for choosing PRISHANSH. Your booking order{" "}
            <span className="font-semibold text-black">{orderConfirmed.orderNumber}</span> has been confirmed.
          </p>

          <div className="mt-8 border-t border-b border-neutral-200 py-6 text-left">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-500">
                Order Summary
              </h2>
              <span
                className={`rounded px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider ${
                  isPaid ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                }`}
              >
                {isPaid ? "PAID VIA RAZORPAY" : "COD (PENDING)"}
              </span>
            </div>

            {paymentId && (
              <p className="mt-2 text-xs text-neutral-500">
                Transaction ID: <span className="font-mono text-neutral-800">{paymentId}</span>
              </p>
            )}

            <div className="mt-5 space-y-3">
              {orderConfirmed.items?.map((item, idx) => (
                <div key={item._id || idx} className="flex justify-between text-sm">
                  <span className="truncate pr-4 text-neutral-700">
                    {item.name}{" "}
                    <span className="text-xs text-neutral-400">
                      ({item.size} • {item.color}) x{item.quantity}
                    </span>
                  </span>
                  <span className="font-medium text-neutral-900">
                    {formatPrice(item.price * item.quantity)}
                  </span>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-between border-t border-neutral-100 pt-4 text-base font-semibold">
              <span>Total Amount</span>
              <span>{formatPrice(orderConfirmed.pricing?.total)}</span>
            </div>

            <div className="mt-4 rounded-xl bg-[#f2f4f5] p-3 text-xs text-neutral-600 leading-relaxed">
              <p>
                Delivering to: <strong className="text-neutral-900">{orderConfirmed.shippingAddress?.fullName}</strong>
              </p>
              <p>
                {orderConfirmed.shippingAddress?.address}, {orderConfirmed.shippingAddress?.city},{" "}
                {orderConfirmed.shippingAddress?.pincode}
              </p>
              <p>Contact: {orderConfirmed.shippingAddress?.phone} • {orderConfirmed.shippingAddress?.email}</p>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
            <Link
              to="/shop"
              className="boutique-action px-6 py-3.5"
            >
              Continue Shopping <ArrowRight size={14} />
            </Link>
          </div>
        </div>
      </main>
    );
  }

  // Empty Bag Screen
  if (cartItems.length === 0) {
    return (
      <main className="boutique-page flex min-h-[70vh] items-center px-4 py-20 text-center">
        <div className="mx-auto max-w-md">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-neutral-200/60 text-neutral-600">
            <ShoppingBag size={28} />
          </div>
          <h1 className="mt-6 font-serif text-3xl italic text-neutral-900">No items to checkout</h1>
          <p className="mt-3 text-sm text-neutral-500">
            Please add pieces to your shopping bag before proceeding to checkout.
          </p>
          <Link
            to="/shop"
            className="boutique-action mt-8 px-8 py-3.5"
          >
            Go to Shop <ArrowRight size={14} />
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="boutique-page">
      <div className="mx-auto max-w-[1200px] px-4 py-8 sm:px-8 lg:px-0 lg:py-12">
        <div className="mb-8">
          <Link
            to="/cart"
            className="inline-flex items-center gap-2 text-xs text-neutral-500 hover:text-black"
          >
            <ArrowLeft size={14} /> Return to Shopping Bag
          </Link>
          <h1 className="boutique-heading mt-3 text-3xl sm:text-4xl">Booking Checkout</h1>
        </div>

        {/* Error Notification Alert */}
        {errorMessage && (
          <div className="mb-8 flex items-start gap-3 rounded-lg border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
            <AlertCircle size={18} className="mt-0.5 shrink-0" />
            <div>
              <p className="font-medium">{errorMessage}</p>
              <p className="mt-0.5 text-xs text-rose-600">
                Please check the notice above or choose another payment method.
              </p>
            </div>
          </div>
        )}

        <form onSubmit={handlePayment} className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-16">
          {/* Shipping Form & Payment Selection */}
          <div className="space-y-8 lg:col-span-7">
            {/* Delivery Details */}
            <div className="boutique-surface p-6 sm:p-8">
              <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-900">
                1. Delivery Details
              </h2>

              <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-neutral-700">Full Name *</label>
                  <input
                    type="text"
                    name="fullName"
                    required
                    value={form.fullName}
                    onChange={handleChange}
                    placeholder="e.g. Aditi Sharma"
                    className="boutique-control mt-1.5 w-full px-4 py-2.5 text-sm outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-700">Email Address *</label>
                  <input
                    type="email"
                    name="email"
                    required
                    value={form.email}
                    onChange={handleChange}
                    placeholder="aditi@example.com"
                    className="boutique-control mt-1.5 w-full px-4 py-2.5 text-sm outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-700">Phone Number *</label>
                  <input
                    type="tel"
                    name="phone"
                    required
                    value={form.phone}
                    onChange={handleChange}
                    placeholder="+91 98765 43210"
                    className="boutique-control mt-1.5 w-full px-4 py-2.5 text-sm outline-none"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-neutral-700">Street Address *</label>
                  <input
                    type="text"
                    name="address"
                    required
                    value={form.address}
                    onChange={handleChange}
                    placeholder="House / Apartment, Road, Landmark"
                    className="boutique-control mt-1.5 w-full px-4 py-2.5 text-sm outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-700">City *</label>
                  <input
                    type="text"
                    name="city"
                    required
                    value={form.city}
                    onChange={handleChange}
                    placeholder="Mumbai"
                    className="boutique-control mt-1.5 w-full px-4 py-2.5 text-sm outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-neutral-700">PIN Code *</label>
                  <input
                    type="text"
                    name="pincode"
                    required
                    value={form.pincode}
                    onChange={handleChange}
                    placeholder="400001"
                    className="boutique-control mt-1.5 w-full px-4 py-2.5 text-sm outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Payment Method Selection */}
            <div className="boutique-surface p-6 sm:p-8">
              <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-900">
                2. Payment Method
              </h2>

              <div className="mt-4 space-y-3">
                {/* Razorpay Online */}
                <label
                  className={`flex cursor-pointer items-center justify-between border p-4 transition ${
                    form.paymentMethod === "online"
                      ? "border-[#5433eb] bg-violet-50/40"
                      : "border-neutral-200 hover:border-[#5433eb]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="online"
                      checked={form.paymentMethod === "online"}
                      onChange={handleChange}
                      className="accent-black h-4 w-4"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-xs font-semibold uppercase tracking-wider">
                          Razorpay (UPI / Card / NetBanking)
                        </p>
                        <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[9px] font-semibold text-emerald-800">
                          Recommended
                        </span>
                      </div>
                      <p className="text-[11px] text-neutral-500">
                        Instant confirmation via Google Pay, PhonePe, Paytm, Cards & NetBanking
                      </p>
                    </div>
                  </div>
                  <CreditCard size={18} className="text-neutral-500" />
                </label>

                {/* Cash on Delivery */}
                <label
                  className={`flex cursor-pointer items-center justify-between border p-4 transition ${
                    form.paymentMethod === "cod"
                      ? "border-[#5433eb] bg-violet-50/40"
                      : "border-neutral-200 hover:border-[#5433eb]"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cod"
                      checked={form.paymentMethod === "cod"}
                      onChange={handleChange}
                      className="accent-black h-4 w-4"
                    />
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider">Cash on Delivery</p>
                      <p className="text-[11px] text-neutral-500">
                        Pay cash or scan QR when your parcel arrives at your doorstep
                      </p>
                    </div>
                  </div>
                  <Truck size={18} className="text-neutral-500" />
                </label>
              </div>
            </div>
          </div>

          {/* Booking Summary Box */}
          <div className="lg:col-span-5 lg:sticky lg:top-28 lg:self-start">
            <div className="boutique-surface p-6 sm:p-8">
              <h2 className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-900">
                Items in Booking ({totalCount})
              </h2>

              <div className="mt-4 max-h-72 space-y-3.5 overflow-y-auto border-b border-neutral-200 pb-5">
                {cartItems.map((item) => (
                  <div key={item.cartItemId} className="flex items-center gap-3">
                    <img
                      src={
                        item.image ||
                        "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=200&q=80"
                      }
                      alt={item.name}
                      className="h-14 w-12 object-cover bg-neutral-100"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-medium">{item.name}</p>
                      <p className="text-[10px] text-neutral-500">
                        {item.size} • {item.color} • Qty {item.quantity}
                      </p>
                    </div>
                    <p className="text-xs font-semibold">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>

              <div className="mt-4 space-y-2 border-b border-neutral-200 pb-4 text-xs">
                <div className="flex justify-between text-neutral-600">
                  <span>Subtotal</span>
                  <span className="font-medium text-neutral-900">{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span>Standard Shipping</span>
                  <span className="font-medium text-neutral-900">
                    {shipping === 0 ? "Complimentary" : formatPrice(shipping)}
                  </span>
                </div>
              </div>

              <div className="flex justify-between py-4 text-base font-semibold">
                <span>Total Amount</span>
                <span>{formatPrice(total)}</span>
              </div>

              {/* Action Button */}
              <button
                type="submit"
                disabled={submitting}
                className="boutique-action mt-2 w-full py-4 disabled:bg-neutral-400"
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>{statusMessage || "Processing..."}</span>
                  </>
                ) : form.paymentMethod === "online" ? (
                  `Pay with Razorpay ${formatPrice(total)}`
                ) : (
                  "Confirm & Book Order"
                )}
              </button>

              <div className="mt-6 flex items-center justify-center gap-2 text-center text-xs text-neutral-400">
                <ShieldCheck size={14} />
                <span>256-Bit SSL Encrypted Razorpay Checkout</span>
              </div>
            </div>
          </div>
        </form>
      </div>
    </main>
  );
}
