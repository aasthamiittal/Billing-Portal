const mongoose = require("mongoose");

const permissionSchema = new mongoose.Schema(
  {
    key: { type: String, required: true, unique: true, index: true },
    description: { type: String, default: "" },
    module: { type: String, default: "general" },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Permission", permissionSchema);
