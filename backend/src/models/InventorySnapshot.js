const mongoose = require("mongoose");

const inventorySnapshotSchema = new mongoose.Schema(
  {
    store: { type: mongoose.Schema.Types.ObjectId, ref: "Store", required: true, index: true },
    item: { type: mongoose.Schema.Types.ObjectId, ref: "Item", required: true, index: true },
    date: { type: String, required: true, index: true }, // YYYY-MM-DD

    opening: { type: Number, default: 0 },
    purchased: { type: Number, default: 0 },
    sold: { type: Number, default: 0 },
    wasted: { type: Number, default: 0 },
    closing: { type: Number, default: 0 },
  },
  { timestamps: true }
);

inventorySnapshotSchema.index({ store: 1, item: 1, date: 1 }, { unique: true });

module.exports = mongoose.model("InventorySnapshot", inventorySnapshotSchema);

