const mongoose = require("mongoose");

const invoiceItemSchema = new mongoose.Schema(
  {
    invoice: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Invoice",
      required: true,
      index: true,
    },
    item: { type: mongoose.Schema.Types.ObjectId, ref: "Item" },
    sku: { type: mongoose.Schema.Types.ObjectId, ref: "SKU" },
    description: { type: String, default: "" },
    quantity: { type: Number, default: 1 },
    unitPrice: { type: Number, default: 0 },
    taxRate: { type: Number, default: 0 },
    discount: { type: Number, default: 0 },
    lineTotal: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("InvoiceItem", invoiceItemSchema);
