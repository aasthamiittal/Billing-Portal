const jwt = require("jsonwebtoken");
const { nanoid } = require("nanoid");
const env = require("../config/env");
const RefreshToken = require("../models/RefreshToken");
const { parseDurationMs } = require("../utils/time");

const createAccessToken = (user) => {
  const roleId =
    typeof user.role === "object" && user.role
      ? user.role._id?.toString?.() || String(user.role)
      : user.role
      ? String(user.role)
      : null;

  return jwt.sign(
    {
      sub: user._id.toString(),
      // Role id reference, similar to "r_id" in the simpler model.
      r_id: roleId,
      store: user.store ? String(user.store) : null,
    },
    env.jwtAccessSecret,
    { expiresIn: env.jwtAccessExpiresIn }
  );
};

const createRefreshToken = async (user) => {
  const token = nanoid(64);
  const expiresMs = parseDurationMs(env.jwtRefreshExpiresIn);
  const expiresAt = new Date(Date.now() + expiresMs);
  await RefreshToken.create({ user: user._id, token, expiresAt });
  return token;
};

const rotateRefreshToken = async (token) => {
  const existing = await RefreshToken.findOne({ token }).exec();
  if (!existing || existing.revokedAt || existing.expiresAt < new Date()) {
    return null;
  }
  existing.revokedAt = new Date();
  await existing.save();
  const user = { _id: existing.user };
  const nextToken = await createRefreshToken(user);
  return { userId: existing.user, token: nextToken };
};

const revokeRefreshToken = async (token) => {
  await RefreshToken.updateOne(
    { token },
    { $set: { revokedAt: new Date() } }
  ).exec();
};

module.exports = {
  createAccessToken,
  createRefreshToken,
  rotateRefreshToken,
  revokeRefreshToken,
};
