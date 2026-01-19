const mongoose = require("mongoose");

const categorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    code: { type: String, default: "" },
    store: { type: mongoose.Schema.Types.ObjectId, ref: "Store", required: true, index: true },
    industry: { type: mongoose.Schema.Types.ObjectId, ref: "Industry", required: true, index: true },
    isActive: { type: Boolean, default: true, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

categorySchema.index({ store: 1, name: 1 }, { unique: true });

module.exports = mongoose.model("Category", categorySchema);

