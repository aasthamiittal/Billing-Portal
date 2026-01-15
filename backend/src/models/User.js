const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, index: true },
    passwordHash: { type: String, required: true },
    role: { type: mongoose.Schema.Types.ObjectId, ref: "Role" },
    store: { type: mongoose.Schema.Types.ObjectId, ref: "Store" },
    isMasterAdmin: { type: Boolean, default: false },
    status: {
      type: String,
      enum: ["ACTIVE", "INACTIVE"],
      default: "ACTIVE",
    },
    lastLoginAt: { type: Date },
  },
  { timestamps: true }
);

userSchema.methods.comparePassword = async function comparePassword(password) {
  return bcrypt.compare(password, this.passwordHash);
};

userSchema.statics.hashPassword = async (password) => {
  const salt = await bcrypt.genSalt(10);
  return bcrypt.hash(password, salt);
};

module.exports = mongoose.model("User", userSchema);
