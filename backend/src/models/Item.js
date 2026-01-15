const mongoose = require("mongoose");

const itemSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    category: { type: String, default: "" },
    description: { type: String, default: "" },
    industry: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Industry",
      required: true,
      index: true,
    },
    store: { type: mongoose.Schema.Types.ObjectId, ref: "Store", index: true },
    defaultPrice: { type: Number, default: 0 },
    taxRate: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
    attributes: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
);

itemSchema.index({ name: 1, store: 1 });

module.exports = mongoose.model("Item", itemSchema);
