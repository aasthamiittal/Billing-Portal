const mongoose = require("mongoose");

const totalsSchema = new mongoose.Schema(
  {
    subtotal: { type: Number, default: 0 },
    tax: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    total: { type: Number, default: 0 },
  },
  { _id: false }
);

const invoiceSchema = new mongoose.Schema(
  {
    invoiceNumber: { type: String, required: true, index: true },
    store: { type: mongoose.Schema.Types.ObjectId, ref: "Store", required: true },
    industry: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Industry",
      required: true,
    },
    status: {
      type: String,
      enum: ["DRAFT", "ISSUED", "CANCELLED"],
      default: "ISSUED",
    },
    customerName: { type: String, default: "" },
    customerEmail: { type: String, default: "" },
    currency: { type: String, default: "INR" },
    orderTypeId: { type: mongoose.Schema.Types.ObjectId, ref: "CatalogEntry" },
    orderTypeName: { type: String, default: "" },
    paymentTypeId: { type: mongoose.Schema.Types.ObjectId, ref: "CatalogEntry" },
    paymentTypeName: { type: String, default: "" },
    discountId: { type: mongoose.Schema.Types.ObjectId, ref: "CatalogEntry" },
    discountName: { type: String, default: "" },
    discountValue: { type: Number, default: 0 },
    totals: totalsSchema,
    issuedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    issuedAt: { type: Date, default: Date.now },
    notes: { type: String, default: "" },
  },
  { timestamps: true }
);

invoiceSchema.index({ invoiceNumber: 1, store: 1 }, { unique: true });

module.exports = mongoose.model("Invoice", invoiceSchema);
