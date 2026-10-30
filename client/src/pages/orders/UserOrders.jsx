import { useState, useEffect } from "react";
import { Package, ArrowUpRight, Search, Loader2 } from "lucide-react";
import { Link } from "react-router";
import { fetchUserOrders } from "../../services/paymentService";

const statusStyles = {
  delivered: "bg-neutral-100 text-neutral-700",
  shipped: "bg-blue-50 text-blue-700",
  processing: "border border-neutral-300 text-neutral-600",
  confirmed: "bg-emerald-50 text-emerald-700",
  created: "border border-neutral-300 text-neutral-600",
  cancelled: "bg-red-50 text-red-700",
  paid: "bg-emerald-50 text-emerald-700",
  pending: "bg-amber-50 text-amber-700",
  failed: "bg-red-50 text-red-700",
};

export default function UserOrders() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedOrderId, setExpandedOrderId] = useState(null);

  useEffect(() => {
    let isMounted = true;

    const loadOrders = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchUserOrders();
        if (isMounted) {
          setOrders(data.orders || []);
        }
      } catch (err) {
        if (isMounted) {
          setError(
            err.response?.data?.message ||
              err.message ||
              "Failed to load orders."
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadOrders();
    return () => {
      isMounted = false;
    };
  }, []);

  const totalItemsCount = orders.reduce((total, order) => {
    const items = order.items || [];
    return (
      total +
      items.reduce((sum, item) => sum + (Number(item.quantity) || 1), 0)
    );
  }, 0);

  const totalSpent = orders.reduce((total, order) => {
    return total + (Number(order.pricing?.total) || Number(order.total) || 0);
  }, 0);

  const filteredOrders = orders.filter((order) => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    const orderNum = (order.orderNumber || order._id || "").toLowerCase();
    const matchesItems = (order.items || []).some((item) =>
      (item.name || "").toLowerCase().includes(query)
    );
    return orderNum.includes(query) || matchesItems;
  });

  return (
    <main className="boutique-page px-4 py-10 sm:px-8 lg:px-8 lg:py-16">
      <div className="mx-auto max-w-[1200px]">
        {/* Header */}
        <div className="border-b border-neutral-200 pb-8">
          <p className="text-[10px] font-medium uppercase tracking-[0.3em] text-neutral-500">
            <Link to="/account/profile" className="hover:underline">
              Your account
            </Link>{" "}
            / Orders
          </p>

          <div className="mt-5 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
            <div>
              <h1 className="boutique-heading text-4xl sm:text-5xl">
                Your orders<span className="text-neutral-400">.</span>
              </h1>
              <p className="mt-3 text-sm text-neutral-500">
                A little overview of everything you've ordered.
              </p>
            </div>

            <Link
              to="/shop"
              className="inline-flex w-fit items-center gap-2 border-b border-[#5433eb] pb-1 text-sm font-medium transition-colors hover:text-[#5433eb]"
            >
              Continue shopping <ArrowUpRight size={16} />
            </Link>
          </div>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-2 gap-4 border-b border-neutral-200 py-7 sm:grid-cols-3 sm:gap-8">
          <div>
            <p className="text-xs text-neutral-500">Total orders</p>
            <p className="mt-2 font-serif text-3xl">{orders.length}</p>
          </div>

          <div>
            <p className="text-xs text-neutral-500">Items purchased</p>
            <p className="mt-2 font-serif text-3xl">{totalItemsCount}</p>
          </div>

          <div className="col-span-2 sm:col-span-1">
            <p className="text-xs text-neutral-500">Total spent</p>
            <p className="mt-2 font-serif text-3xl">
              ₹{totalSpent.toLocaleString("en-IN")}
            </p>
          </div>
        </div>

        {/* Search */}
        <div className="flex flex-col gap-4 py-6 sm:flex-row sm:items-center sm:justify-between">
          <div className="boutique-search flex items-center gap-3 px-4 sm:w-80">
            <Search size={17} className="text-neutral-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by order ID or item..."
              className="w-full bg-transparent py-3 text-sm outline-none placeholder:text-neutral-400"
            />
          </div>
        </div>

        {/* State Display: Loading, Error, Empty, or List */}
        {loading ? (
          <div className="flex min-h-[300px] flex-col items-center justify-center gap-3 text-neutral-500">
            <Loader2 className="h-8 w-8 animate-spin text-neutral-700" />
            <p className="text-sm">Fetching your orders...</p>
          </div>
        ) : error ? (
          <div className="border border-red-200 bg-red-50 p-6 text-center text-sm text-red-700">
            <p>{error}</p>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="rounded-[28px] border border-neutral-200 bg-white p-12 text-center shadow-sm">
            <Package className="mx-auto h-12 w-12 text-neutral-300" />
            <h3 className="mt-4 font-serif text-xl">No orders found</h3>
            <p className="mt-2 text-sm text-neutral-500">
              {searchQuery
                ? "No orders match your search query."
                : "You haven't placed any orders yet."}
            </p>
            <Link
              to="/shop"
              className="boutique-action mt-6 px-6 py-3"
            >
              Start shopping <ArrowUpRight size={14} />
            </Link>
          </div>
        ) : (
          <div className="space-y-6">
            {filteredOrders.map((order) => {
              const orderId = order.orderNumber || order._id;
              const dateStr = order.createdAt
                ? new Date(order.createdAt).toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })
                : "Recent";

              const status = order.orderStatus || order.payment?.status || "created";
              const statusClass =
                statusStyles[status.toLowerCase()] ||
                "border border-neutral-300 text-neutral-600";
              const totalAmount =
                order.pricing?.total ?? order.total ?? 0;
              const isExpanded = expandedOrderId === orderId;

              return (
                <article
                  key={orderId}
                  className="overflow-hidden rounded-[28px] border border-neutral-200 bg-white shadow-sm transition-all hover:border-violet-200 hover:shadow-[0_4px_24px_rgba(0,0,0,0.12)]"
                >
                  {/* Order Header */}
                  <div className="flex flex-wrap items-center justify-between gap-4 border-b border-neutral-100 px-4 py-5 sm:px-6">
                    <div className="grid grid-cols-2 gap-x-8 gap-y-3 sm:flex sm:items-center sm:gap-10">
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-neutral-400">
                          Order ID
                        </p>
                        <p className="mt-1 text-xs font-semibold">{orderId}</p>
                      </div>

                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-neutral-400">
                          Placed on
                        </p>
                        <p className="mt-1 text-xs font-medium">{dateStr}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {order.payment?.method && (
                        <span className="text-[10px] uppercase tracking-wider text-neutral-400">
                          {order.payment.method}
                        </span>
                      )}
                      <span
                        className={`inline-flex items-center px-3 py-1.5 text-[10px] font-medium uppercase tracking-wider ${statusClass}`}
                      >
                        {status}
                      </span>
                    </div>
                  </div>

                  {/* Product Items */}
                  <div className="divide-y divide-neutral-100 px-4 sm:px-6">
                    {(order.items || []).map((item, idx) => {
                      const variantParts = [item.color, item.size].filter(Boolean);
                      const variantStr =
                        variantParts.length > 0
                          ? variantParts.join(" / ")
                          : item.quantity > 1
                          ? `Qty: ${item.quantity}`
                          : "";

                      return (
                        <div
                          key={item.product || idx}
                          className="flex items-center gap-4 py-5"
                        >
                          <div className="h-24 w-20 shrink-0 overflow-hidden bg-[#f3f1ed] sm:h-28 sm:w-24">
                            <img
                              src={
                                item.image ||
                                "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?auto=format&fit=crop&w=200&q=80"
                              }
                              alt={item.name}
                              loading="lazy"
                              className="h-full w-full object-cover"
                            />
                          </div>

                          <div className="min-w-0 flex-1">
                            <h3 className="text-sm font-medium">{item.name}</h3>
                            {variantStr && (
                              <p className="mt-1 text-xs text-neutral-500">
                                {variantStr}
                              </p>
                            )}
                            <p className="mt-1 text-xs text-neutral-400">
                              Qty: {item.quantity || 1}
                            </p>
                            <p className="mt-3 text-sm font-medium">
                              ₹{(Number(item.price) || 0).toLocaleString("en-IN")}
                            </p>
                          </div>

                          {item.product && (
                            <Link
                              to={`/product/${item.slug || item.product}`}
                              className="hidden items-center gap-1 text-xs text-neutral-500 transition-colors hover:text-black sm:flex"
                            >
                              View item <ArrowUpRight size={13} />
                            </Link>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Optional Expanded Order Details */}
                  {isExpanded && (
                    <div className="border-t border-neutral-100 bg-[#f9f8f5] px-4 py-5 text-xs text-neutral-600 sm:px-6">
                      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                        <div>
                          <p className="font-semibold uppercase tracking-wider text-neutral-900">
                            Shipping Address
                          </p>
                          <p className="mt-1">{order.shippingAddress?.fullName}</p>
                          <p>{order.shippingAddress?.address}</p>
                          <p>
                            {order.shippingAddress?.city},{" "}
                            {order.shippingAddress?.state}{" "}
                            {order.shippingAddress?.pincode}
                          </p>
                          <p className="mt-1 text-neutral-500">
                            Phone: {order.shippingAddress?.phone}
                          </p>
                        </div>
                        <div>
                          <p className="font-semibold uppercase tracking-wider text-neutral-900">
                            Payment Details
                          </p>
                          <p className="mt-1">
                            Method:{" "}
                            <span className="uppercase">
                              {order.payment?.method || "Online"}
                            </span>
                          </p>
                          <p>Payment Status: {order.payment?.status}</p>
                          {order.payment?.razorpayPaymentId && (
                            <p className="font-mono text-[11px] text-neutral-500">
                              Payment ID: {order.payment.razorpayPaymentId}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Order Footer */}
                  <div className="flex flex-col gap-4 border-t border-neutral-100 bg-[#fcfbf9] px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6">
                    <div className="flex items-center gap-2 text-xs text-neutral-500">
                      <Package size={16} />
                      {(order.items || []).length}{" "}
                      {(order.items || []).length === 1 ? "item" : "items"} in
                      this order
                    </div>

                    <div className="flex items-center justify-between gap-6 sm:justify-end">
                      <div>
                        <p className="text-[10px] uppercase tracking-widest text-neutral-400">
                          Order total
                        </p>
                        <p className="mt-1 text-lg font-semibold">
                          ₹{totalAmount.toLocaleString("en-IN")}
                        </p>
                      </div>

                      <button
                        type="button"
                        onClick={() =>
                          setExpandedOrderId(isExpanded ? null : orderId)
                        }
                        className="border border-neutral-300 px-4 py-2.5 text-xs font-medium transition-colors hover:border-black hover:bg-black hover:text-white"
                      >
                        {isExpanded ? "Hide details" : "Order details"}
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}

        {/* Bottom Note */}
        <div className="mt-10 flex flex-col justify-between gap-3 border-t border-neutral-200 pt-6 text-xs text-neutral-500 sm:flex-row">
          <p>Need help with an order?</p>
          <Link
            to="/contact"
            className="flex w-fit items-center gap-1 font-medium text-neutral-900 hover:underline"
          >
            Contact support <ArrowUpRight size={13} />
          </Link>
        </div>
      </div>
    </main>
  );
}
