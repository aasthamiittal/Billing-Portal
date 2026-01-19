const mongoose = require("mongoose");

const buyerSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    phone: { type: String, default: "" },
    email: { type: String, default: "" },
    address: { type: String, default: "" },
    store: { type: mongoose.Schema.Types.ObjectId, ref: "Store", required: true, index: true },
    isActive: { type: Boolean, default: true, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

buyerSchema.index({ store: 1, name: 1 }, { unique: true });

module.exports = mongoose.model("Buyer", buyerSchema);

