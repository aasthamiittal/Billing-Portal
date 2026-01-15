const mongoose = require("mongoose");

const skuSchema = new mongoose.Schema(
  {
    item: { type: mongoose.Schema.Types.ObjectId, ref: "Item", required: true },
    skuCode: { type: String, required: true },
    barcode: { type: String, default: "" },
    price: { type: Number, default: 0 },
    taxRate: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    inventoryQty: { type: Number, default: 0 },
    attributes: { type: mongoose.Schema.Types.Mixed, default: {} },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

skuSchema.index({ skuCode: 1, item: 1 }, { unique: true });

module.exports = mongoose.model("SKU", skuSchema);
