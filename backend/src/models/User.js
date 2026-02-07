const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    role: { type: mongoose.Schema.Types.ObjectId, ref: "Role" },
    store: { type: mongoose.Schema.Types.ObjectId, ref: "Store" },
    isMasterAdmin: { type: Boolean, default: false },
    // Hierarchical access: parent admins can manage their store hierarchy.
    isParentAdmin: { type: Boolean, default: false },
    // Explicitly granted store access (similar to access_store_info concept).
    accessibleStores: [{ type: mongoose.Schema.Types.ObjectId, ref: "Store", index: true }],
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE"],
      default: "ACTIVE",
    },
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

userSchema.methods.comparePassword = function comparePassword(password) {
  return password === this.passwordHash;
};

userSchema.statics.hashPassword = async (password) => {
  return password;
};

module.exports = mongoose.model("User", userSchema);
