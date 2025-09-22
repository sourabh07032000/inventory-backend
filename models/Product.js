// models/Product.js
const mongoose = require("mongoose");

const productSchema = new mongoose.Schema(
  {
    wholesaler: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // or "User" depending on your auth model
      required: true,
    },
    productName: {
      type: String,
      required: true,
      trim: true,
    },
    brand: {
      type: String,
      required: true,
      trim: true,
    },
    category: {
      type: String,
      required: true,
    },
    unit: {
      type: String,
      required: true
    },
    quantity: {
      type: Number,
      required: true,
      default: 0,
      min: 0,
    },
    costPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    sellingPrice: {
      type: Number,
      required: true,
      min: 0,
    },
    expiryDate: {
      type: Date,
      required: true,
    },
    supplier: {
      type: String,
      trim: true,
    },
    status: {
      type: String,
      enum: ["in-stock", "low-stock", "critical"],
      default: "in-stock",
    },

  },
  { timestamps: true }
);

module.exports = mongoose.model("Product", productSchema);
