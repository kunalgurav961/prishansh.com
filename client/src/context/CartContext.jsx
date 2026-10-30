import { createContext, useContext, useEffect, useMemo, useState } from "react";

const CART_STORAGE_KEY = "prishansh:cart";

const CartContext = createContext(null);

const readInitialCart = () => {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

export const CartProvider = ({ children }) => {
  const [cartItems, setCartItems] = useState(readInitialCart);

  useEffect(() => {
    try {
      window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cartItems));
    } catch {
      // Storage unavailable or full
    }
  }, [cartItems]);

  const addToCart = (product, options = {}) => {
    const size = options.size || (product.sizes?.[0] ?? "Free Size");
    const color = options.color || (typeof product.colors?.[0] === "string" ? product.colors[0] : product.colors?.[0]?.name ?? "Default");
    const quantity = Math.max(1, Number(options.quantity) || 1);
    const productId = product._id || product.id;
    const cartItemId = `${productId}-${size}-${color}`;

    setCartItems((prev) => {
      const existingIndex = prev.findIndex((item) => item.cartItemId === cartItemId);

      if (existingIndex > -1) {
        const next = [...prev];
        next[existingIndex] = {
          ...next[existingIndex],
          quantity: next[existingIndex].quantity + quantity,
        };
        return next;
      }

      const image = (Array.isArray(product.images) && product.images[0]) || product.image || "";

      return [
        ...prev,
        {
          cartItemId,
          productId,
          slug: product.slug,
          name: product.name,
          category: product.category,
          price: Number(product.price || 0),
          compareAtPrice: product.compareAtPrice ? Number(product.compareAtPrice) : null,
          image,
          size,
          color,
          quantity,
        },
      ];
    });
  };

  const updateQuantity = (cartItemId, newQuantity) => {
    if (newQuantity <= 0) {
      removeFromCart(cartItemId);
      return;
    }
    setCartItems((prev) =>
      prev.map((item) =>
        item.cartItemId === cartItemId ? { ...item, quantity: newQuantity } : item
      )
    );
  };

  const removeFromCart = (cartItemId) => {
    setCartItems((prev) => prev.filter((item) => item.cartItemId !== cartItemId));
  };

  const clearCart = () => {
    setCartItems([]);
  };

  const totalCount = useMemo(
    () => cartItems.reduce((acc, item) => acc + item.quantity, 0),
    [cartItems]
  );

  const subtotal = useMemo(
    () => cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0),
    [cartItems]
  );

  const shipping = subtotal === 0 || subtotal >= 2999 ? 0 : 199;
  const total = subtotal + shipping;

  const value = {
    cartItems,
    totalCount,
    subtotal,
    shipping,
    total,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
};

export const useCartContext = () => {
  const ctx = useContext(CartContext);
  if (!ctx) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return ctx;
};
