const mongoose = require("mongoose");

const roleSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    description: { type: String, default: "" },
    scope: {
      type: String,
      enum: ["GLOBAL", "STORE"],
      default: "STORE",
      index: true,
    },
    // Simplified RBAC: nested permissions object, e.g.
    // { store_management: { add_store: "read_write", store_list: "read_only" } }
    // Levels: show | read_only | download | read_write
    permissions: { type: mongoose.Schema.Types.Mixed, default: {} },
    store: { type: mongoose.Schema.Types.ObjectId, ref: "Store" },
    isActive: { type: Boolean, default: true, index: true },
  },
  { timestamps: true }
);

roleSchema.index({ name: 1, scope: 1, store: 1 }, { unique: true });

module.exports = mongoose.model("Role", roleSchema);
