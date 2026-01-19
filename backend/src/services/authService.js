const User = require("../models/User");
const { ApiError } = require("../utils/errors");
const {
  createAccessToken,
  createRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
} = require("./tokenService");

const login = async ({ email, password }) => {
  const user = await User.findOne({ email })
    .populate("role")
    .exec();
  if (!user) {
    throw new ApiError(401, "Invalid credentials");
  }
  const ok = await user.comparePassword(password);
  if (!ok) {
    throw new ApiError(401, "Invalid credentials");
  }
  if (user.status !== "ACTIVE") {
    throw new ApiError(403, "User inactive");
  }

  user.lastLoginAt = new Date();
  await user.save();

  const accessToken = createAccessToken(user);
  const refreshToken = await createRefreshToken(user);
  return { user, accessToken, refreshToken };
};

const refresh = async (token) => {
  const rotation = await rotateRefreshToken(token);
  if (!rotation) {
    throw new ApiError(401, "Invalid refresh token");
  }
  const user = await User.findById(rotation.userId)
    .populate("role")
    .exec();
  if (!user) {
    throw new ApiError(401, "Invalid refresh token");
  }
  const accessToken = createAccessToken(user);
  return { accessToken, refreshToken: rotation.token, user };
};

const logout = async (token) => {
  await revokeRefreshToken(token);
};

module.exports = { login, refresh, logout };
