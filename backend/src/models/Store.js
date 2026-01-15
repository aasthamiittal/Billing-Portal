const mongoose = require("mongoose");

const storeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    code: { type: String, required: true },
    industry: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Industry",
      required: true,
      index: true,
    },
    parentStore: { type: mongoose.Schema.Types.ObjectId, ref: "Store" },
    settings: { type: mongoose.Schema.Types.Mixed, default: {} },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

storeSchema.index({ code: 1, industry: 1 }, { unique: true });

module.exports = mongoose.model("Store", storeSchema);
