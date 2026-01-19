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
    // Flow metadata (root vs regular store creator)
    isCreatedByRoot: { type: Boolean, default: false, index: true },
    initialLogin: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
    storeType: { type: String, default: "Individual" },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

storeSchema.index({ code: 1, industry: 1 }, { unique: true });

module.exports = mongoose.model("Store", storeSchema);
