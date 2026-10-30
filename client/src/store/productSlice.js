
import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const PRODUCT_CACHE_KEY = "prishansh:products";
export const PRODUCT_CACHE_TTL_MS = 5 * 60 * 1000;

const API_BASE =
  import.meta.env.VITE_API_URL ||
  import.meta.env.VITE_API_BASE_URL ||
  "/api";
const API_URL = `${API_BASE.replace(/\/$/, "")}/products`;

const readCache = () => {
  if (typeof window === "undefined") return null;

  try {
    const cached = JSON.parse(
      window.localStorage.getItem(PRODUCT_CACHE_KEY)
    );

    if (
      cached &&
      Array.isArray(cached.products) &&
      cached.products.length > 0 &&
      typeof cached.cachedAt === "number" &&
      Date.now() - cached.cachedAt < PRODUCT_CACHE_TTL_MS
    ) {
      return cached;
    }
  } catch {
    // Ignore invalid cache.
  }

  window.localStorage.removeItem(PRODUCT_CACHE_KEY);
  return null;
};

const cached = readCache();

const initialState = {
  products: cached?.products || [],
  product: null,
  cachedAt: cached?.cachedAt || null,
  status: cached ? "succeeded" : "idle",
  productStatus: "idle",
  error: null,
};

export const fetchProducts = createAsyncThunk(
  "products/fetchProducts",
  async (params = {}, { rejectWithValue }) => {
    try {
      const response = await axios.get(API_URL, { params });
      const raw = response.data;
      const products = Array.isArray(raw)
        ? raw
        : Array.isArray(raw?.products)
        ? raw.products
        : [];

      return {
        products,
        cachedAt: Date.now(),
      };
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to load products."
      );
    }
  },
  {
    condition: (_, { getState }) => {
      const { status, cachedAt, products = [] } = getState().products || {};

      if (status === "loading") return false;

      return !(
        status === "succeeded" &&
        products.length > 0 &&
        cachedAt &&
        Date.now() - cachedAt < PRODUCT_CACHE_TTL_MS
      );
    },
  }
);

export const fetchProductById = createAsyncThunk(
  "products/fetchProductById",
  async (id, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/${id}`);
      return response.data.product || response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message || "Failed to load product."
      );
    }
  }
);

export const fetchFeaturedProducts = createAsyncThunk(
  "products/fetchFeaturedProducts",
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get(`${API_URL}/featured`);
      return response.data.products || response.data;
    } catch (error) {
      return rejectWithValue(
        error.response?.data?.message ||
          "Failed to load featured products."
      );
    }
  }
);

const productSlice = createSlice({
  name: "products",
  initialState,

  reducers: {
    clearProducts: (state) => {
      state.products = [];
      state.product = null;
      state.cachedAt = null;
      state.status = "idle";
      state.productStatus = "idle";
      state.error = null;

      if (typeof window !== "undefined") {
        window.localStorage.removeItem(PRODUCT_CACHE_KEY);
      }
    },

    productUpdated: (state, action) => {
      const updatedProduct = action.payload;

      state.products = state.products.map((product) =>
        product._id === updatedProduct._id
          ? updatedProduct
          : product
      );

      if (state.product?._id === updatedProduct._id) {
        state.product = updatedProduct;
      }

      state.cachedAt = Date.now();
      state.status = "succeeded";
    },

    invalidateProductCache: (state) => {
      state.cachedAt = null;
      state.status = "idle";
    },
  },

  extraReducers: (builder) => {
    builder
      .addCase(fetchProducts.pending, (state) => {
        state.status = "loading";
        state.error = null;
      })
      .addCase(fetchProducts.fulfilled, (state, action) => {
        state.products = action.payload.products;
        state.cachedAt = action.payload.cachedAt;
        state.status = "succeeded";
        state.error = null;
      })
      .addCase(fetchProducts.rejected, (state, action) => {
        state.status = "failed";
        state.error =
          action.payload || "Failed to load products.";
      })

      .addCase(fetchProductById.pending, (state) => {
        state.productStatus = "loading";
      })
      .addCase(fetchProductById.fulfilled, (state, action) => {
        state.product = action.payload;
        state.productStatus = "succeeded";
      })
      .addCase(fetchProductById.rejected, (state, action) => {
        state.productStatus = "failed";
        state.error =
          action.payload || "Failed to load product.";
      })

      .addCase(
        fetchFeaturedProducts.fulfilled,
        (state, action) => {
          state.featuredProducts = action.payload;
        }
      );
  },
});

export const {
  clearProducts,
  productUpdated,
  invalidateProductCache,
} = productSlice.actions;

export const persistProductCache = (state) => {
  if (typeof window === "undefined") return;

  if (!state.products.length || !state.cachedAt) {
    window.localStorage.removeItem(PRODUCT_CACHE_KEY);
    return;
  }

  window.localStorage.setItem(
    PRODUCT_CACHE_KEY,
    JSON.stringify({
      products: state.products,
      cachedAt: state.cachedAt,
    })
  );
};

export default productSlice.reducer;
