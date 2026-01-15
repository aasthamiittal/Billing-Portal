const mongoose = require("mongoose");

const roleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    scope: {
      type: String,
      enum: ["GLOBAL", "STORE"],
      default: "STORE",
      index: true,
    },
    permissions: [{ type: mongoose.Schema.Types.ObjectId, ref: "Permission" }],
    store: { type: mongoose.Schema.Types.ObjectId, ref: "Store" },
  },
  { timestamps: true }
);

roleSchema.index({ name: 1, scope: 1, store: 1 }, { unique: true });

module.exports = mongoose.model("Role", roleSchema);
