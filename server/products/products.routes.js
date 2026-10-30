import express from "express";
import mongoose from "mongoose";
import Product from "./model/products.model.js";

const productsRouter = express.Router();

// Get all products (with search, filters, sorting, pagination)
productsRouter.get("/", async (req, res) => {
  try {
    const products = await Product.find({ isActive: { $ne: false } }).sort({ createdAt: -1 });
    res.json({ products });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch products" });
  }
});

// Get featured products
productsRouter.get("/featured", async (req, res) => {
  try {
    const products = await Product.find({ isFeatured: true, isActive: { $ne: false } });
    res.json({ products });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch featured products" });
  }
});

// Get new arrivals
productsRouter.get("/new-arrivals", async (req, res) => {
  try {
    const products = await Product.find({ isNewArrival: true, isActive: { $ne: false } });
    res.json({ products });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch new arrivals" });
  }
});

// Get best-selling products
productsRouter.get("/best-sellers", async (req, res) => {
  try {
    const products = await Product.find({ isBestSeller: true, isActive: { $ne: false } });
    res.json({ products });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch best sellers" });
  }
});

// Get product categories
productsRouter.get("/categories", async (req, res) => {
  try {
    const categories = await Product.distinct("category", { isActive: { $ne: false } });
    res.json({ categories });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch categories" });
  }
});

// Get product filters (available sizes, colors, price range)
productsRouter.get("/filters", async (req, res) => {
  res.json({ message: "Product filters" });
});

// Get single product by ID or slug
productsRouter.get("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const isObjectId = mongoose.Types.ObjectId.isValid(id) && id.length === 24;
    const product = isObjectId
      ? await Product.findById(id)
      : await Product.findOne({ slug: id, isActive: { $ne: false } });

    if (!product) return res.status(404).json({ message: "Product not found" });
    res.json({ product });
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch product" });
  }
});

// Create product (Admin)
productsRouter.post("/", async (req, res) => {
  res.status(201).json({ message: "Product created" });
});

// Update product (Admin)
productsRouter.patch("/:id", async (req, res) => {
  res.json({ message: "Product updated", id: req.params.id });
});

// Delete product (Admin)
productsRouter.delete("/:id", async (req, res) => {
  res.json({ message: "Product deleted", id: req.params.id });
});

export default productsRouter;