const mongoose = require("mongoose");

const industrySchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    code: { type: String, required: true, unique: true, index: true },
    config: { type: mongoose.Schema.Types.Mixed, default: {} },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Industry", industrySchema);
