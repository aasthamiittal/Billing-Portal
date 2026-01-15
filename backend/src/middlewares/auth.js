const jwt = require("jsonwebtoken");
const env = require("../config/env");
const User = require("../models/User");
const { ApiError } = require("../utils/errors");

const requireAuth = async (req, res, next) => {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return next(new ApiError(401, "Missing auth token"));
  }

  try {
    const payload = jwt.verify(token, env.jwtAccessSecret);
    const user = await User.findById(payload.sub)
      .populate({ path: "role", populate: { path: "permissions" } })
      .exec();

    if (!user || user.status !== "ACTIVE") {
      return next(new ApiError(401, "Invalid user"));
    }

    req.user = user;
    return next();
  } catch (err) {
    return next(new ApiError(401, "Invalid or expired token"));
  }
};

module.exports = { requireAuth };
