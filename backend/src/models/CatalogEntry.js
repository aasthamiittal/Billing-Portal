const mongoose = require("mongoose");

const catalogEntrySchema = new mongoose.Schema(
  {
    kind: {
      type: String,
      required: true,
      index: true,
      enum: [
        "taxes",
        "discounts",
        "order-types",
        "payment-types",
        "store-configuration",
      ],
    },
    name: { type: String, required: true },
    code: { type: String, default: "" },
    store: { type: mongoose.Schema.Types.ObjectId, ref: "Store", required: true, index: true },
    industry: { type: mongoose.Schema.Types.ObjectId, ref: "Industry", required: true, index: true },
    value: { type: Number, default: 0 }, // e.g., discount amount or tax rate
    config: { type: mongoose.Schema.Types.Mixed, default: {} },
    isActive: { type: Boolean, default: true, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

catalogEntrySchema.index({ kind: 1, store: 1, name: 1 }, { unique: true });

module.exports = mongoose.model("CatalogEntry", catalogEntrySchema);

