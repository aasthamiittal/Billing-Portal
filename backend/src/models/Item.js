const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    // Store-scoped category (required for store-centric lifecycle)
    categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category", index: true },
    categoryIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Category", index: true }],
    // Denormalized for faster listing/search (kept in sync on write)
    categoryName: { type: String, default: "" },
    categoryNames: [{ type: String }],
    taxIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "CatalogEntry", index: true }],
    taxNames: [{ type: String }],
    description: { type: String, default: "" },
    industry: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Industry",
      required: true,
      index: true,
    },
    store: { type: mongoose.Schema.Types.ObjectId, ref: "Store", index: true },
    defaultPrice: { type: Number, default: 0 },
    taxRates: [{ type: Number }],
    taxRate: { type: Number, default: 0 }, // derived from selected taxes (sum)
    isActive: { type: Boolean, default: true },
    attributes: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

itemSchema.index({ name: 1, store: 1 });

module.exports = mongoose.model("Item", itemSchema);
