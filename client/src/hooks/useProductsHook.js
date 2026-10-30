
import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
  fetchProducts,
  fetchProductById,
  fetchFeaturedProducts,
  invalidateProductCache,
} from '../store/productSlice';

const DEFAULT_FILTERS = {
  search: "",
  category: "",
  gender: "",
  minPrice: 0,
  maxPrice: Infinity,
  size: "",
  color: "",
  sort: "newest",
};

export default function useProductHook() {
  const dispatch = useDispatch();

  const {
    products = [],
    product = null,
    featuredProducts = [],
    status = "idle",
    productStatus = "idle",
    error = null,
    cachedAt = null,
  } = useSelector((state) => state.products || {});

  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(12);

  // Fetch all products
  const loadProducts = useCallback(
    (params = {}) => dispatch(fetchProducts(params)),
    [dispatch]
  );

  // Fetch a single product
  const loadProduct = useCallback(
    (id) => dispatch(fetchProductById(id)),
    [dispatch]
  );

  // Fetch featured products
  const loadFeaturedProducts = useCallback(
    () => dispatch(fetchFeaturedProducts()),
    [dispatch]
  );

  // Refresh product cache
  const refreshProducts = useCallback(() => {
    dispatch(invalidateProductCache());
    return dispatch(fetchProducts());
  }, [dispatch]);

  // Fetch products on first use
  useEffect(() => {
    if (status === "idle") {
      dispatch(fetchProducts());
    }
  }, [dispatch, status]);

  // Update any filter
  const updateFilter = useCallback((key, value) => {
    setFilters((previous) => ({
      ...previous,
      [key]: value,
    }));
    setPage(1);
  }, []);

  // Search products
  const searchProducts = useCallback(
    (search) => updateFilter("search", search),
    [updateFilter]
  );

  // Category filter
  const filterByCategory = useCallback(
    (category) => updateFilter("category", category),
    [updateFilter]
  );

  // Gender filter
  const filterByGender = useCallback(
    (gender) => updateFilter("gender", gender),
    [updateFilter]
  );

  // Price range filter
  const filterByPrice = useCallback(
    (minPrice, maxPrice) => {
      setFilters((previous) => ({
        ...previous,
        minPrice: Number(minPrice) || 0,
        maxPrice:
          maxPrice === "" || maxPrice == null
            ? Infinity
            : Number(maxPrice),
      }));
      setPage(1);
    },
    []
  );

  // Size filter
  const filterBySize = useCallback(
    (size) => updateFilter("size", size),
    [updateFilter]
  );

  // Color filter
  const filterByColor = useCallback(
    (color) => updateFilter("color", color),
    [updateFilter]
  );

  // Sorting
  const sortProducts = useCallback(
    (sort) => updateFilter("sort", sort),
    [updateFilter]
  );

  // Reset filters
  const clearFilters = useCallback(() => {
    setFilters(DEFAULT_FILTERS);
    setPage(1);
  }, []);

  // Filter and sort products locally
  const filteredProducts = useMemo(() => {
    const list = Array.isArray(products) ? products : [];
    let result = list.filter((item) => {
      const query = filters.search.trim().toLowerCase();

      const searchableText = [
        item.name,
        item.description,
        item.category,
        item.gender,
        ...(item.tags || []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      const matchesSearch =
        !query || searchableText.includes(query);

      const matchesCategory =
        !filters.category ||
        item.category?.toLowerCase() ===
          filters.category.toLowerCase();

      const matchesGender =
        !filters.gender ||
        item.gender?.toLowerCase() ===
          filters.gender.toLowerCase();

      const matchesPrice =
        item.price >= filters.minPrice &&
        item.price <= filters.maxPrice;

      const matchesSize =
        !filters.size ||
        item.sizes?.some(
          (size) =>
            size.toLowerCase() === filters.size.toLowerCase()
        );

      const matchesColor =
        !filters.color ||
        item.colors?.some((color) => {
          const colorName =
            typeof color === "string" ? color : color.name;

          return (
            colorName?.toLowerCase() ===
            filters.color.toLowerCase()
          );
        });

      return (
        matchesSearch &&
        matchesCategory &&
        matchesGender &&
        matchesPrice &&
        matchesSize &&
        matchesColor
      );
    });

    switch (filters.sort) {
      case "price-low":
        result.sort((a, b) => a.price - b.price);
        break;

      case "price-high":
        result.sort((a, b) => b.price - a.price);
        break;

      case "name":
        result.sort((a, b) =>
          a.name.localeCompare(b.name)
        );
        break;

      case "newest":
        result.sort(
          (a, b) =>
            new Date(b.createdAt || 0) -
            new Date(a.createdAt || 0)
        );
        break;

      case "featured":
        result.sort(
          (a, b) =>
            Number(b.isFeatured) - Number(a.isFeatured)
        );
        break;

      default:
        break;
    }

    return result;
  }, [products, filters]);

  // Pagination
  const totalProducts = filteredProducts.length;
  const totalPages = Math.ceil(totalProducts / limit);

  const paginatedProducts = useMemo(() => {
    const start = (page - 1) * limit;
    return filteredProducts.slice(start, start + limit);
  }, [filteredProducts, page, limit]);

  const nextPage = useCallback(() => {
    setPage((previous) =>
      Math.min(previous + 1, totalPages || 1)
    );
  }, [totalPages]);

  const previousPage = useCallback(() => {
    setPage((previous) => Math.max(previous - 1, 1));
  }, []);

  // Product collections
  const newArrivals = useMemo(
    () => products.filter((item) => item.isNewArrival),
    [products]
  );

  const bestSellers = useMemo(
    () => products.filter((item) => item.isBestSeller),
    [products]
  );

  const onSale = useMemo(
    () =>
      products.filter(
        (item) =>
          item.compareAtPrice != null &&
          item.compareAtPrice > item.price
      ),
    [products]
  );

  // Available filter options
  const categories = useMemo(
    () => [
      ...new Set(
        products.map((item) => item.category).filter(Boolean)
      ),
    ],
    [products]
  );

  const sizes = useMemo(
    () => [
      ...new Set(products.flatMap((item) => item.sizes || [])),
    ],
    [products]
  );

  const colors = useMemo(
    () => [
      ...new Set(
        products.flatMap((item) =>
          (item.colors || [])
            .map((color) =>
              typeof color === "string" ? color : color.name
            )
            .filter(Boolean)
        )
      ),
    ],
    [products]
  );

  const priceRange = useMemo(() => {
    const prices = products
      .map((item) => item.price)
      .filter((price) => Number.isFinite(price));

    return {
      min: prices.length ? Math.min(...prices) : 0,
      max: prices.length ? Math.max(...prices) : 0,
    };
  }, [products]);

  return {
    // Data
    products,
    product,
    featuredProducts,
    filteredProducts,
    paginatedProducts,
    newArrivals,
    bestSellers,
    onSale,

    // Status
    status,
    productStatus,
    error,
    cachedAt,
    isLoading: status === "loading",
    isProductLoading: productStatus === "loading",

    // Filters
    filters,
    updateFilter,
    searchProducts,
    filterByCategory,
    filterByGender,
    filterByPrice,
    filterBySize,
    filterByColor,
    sortProducts,
    clearFilters,

    // Filter options
    categories,
    sizes,
    colors,
    priceRange,

    // Pagination
    page,
    setPage,
    limit,
    setLimit,
    totalProducts,
    totalPages,
    nextPage,
    previousPage,

    // Actions
    loadProducts,
    loadProduct,
    loadFeaturedProducts,
    refreshProducts,
  };
}
