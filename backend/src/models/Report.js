const mongoose = require("mongoose");

const reportSchema = new mongoose.Schema(
  {
    type: { type: String, required: true },
    store: { type: mongoose.Schema.Types.ObjectId, ref: "Store" },
    industry: { type: mongoose.Schema.Types.ObjectId, ref: "Industry" },
    filters: { type: mongoose.Schema.Types.Mixed, default: {} },
    generatedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    fileMeta: {
      fileName: { type: String, default: "" },
      format: { type: String, default: "" },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Report", reportSchema);
