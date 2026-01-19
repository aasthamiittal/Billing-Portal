const mongoose = require("mongoose");

const stockTransactionSchema = new mongoose.Schema(
  {
    type: {
      type: String,
      enum: ["PURCHASE", "SOLD", "WASTAGE"],
      required: true,
      index: true,
    },
    store: { type: mongoose.Schema.Types.ObjectId, ref: "Store", required: true, index: true },
    item: { type: mongoose.Schema.Types.ObjectId, ref: "Item", required: true, index: true },

    quantity: { type: Number, required: true, min: 0 },

    // PURCHASE metadata
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: "Supplier" },
    unitCost: { type: Number, default: 0 },

    // SOLD metadata
    buyer: { type: mongoose.Schema.Types.ObjectId, ref: "Buyer" },
    buyerName: { type: String, default: "" }, // fallback from invoice customerName
    unitPrice: { type: Number, default: 0 },
    invoice: { type: mongoose.Schema.Types.ObjectId, ref: "Invoice", index: true },

    // WASTAGE metadata
    reasonCode: { type: String, default: "" },
    notes: { type: String, default: "" },

    occurredAt: { type: Date, default: Date.now, index: true },
    isActive: { type: Boolean, default: true, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

// Prevent duplicate SOLD rows for the same invoice+item within a store.
stockTransactionSchema.index(
  { store: 1, invoice: 1, item: 1, type: 1 },
  {
    unique: true,
    partialFilterExpression: { type: "SOLD", invoice: { $type: "objectId" } },
  }
);

module.exports = mongoose.model("StockTransaction", stockTransactionSchema);

