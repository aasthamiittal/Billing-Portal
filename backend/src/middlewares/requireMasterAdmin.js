const { ApiError } = require("../utils/errors");

const requireMasterAdmin = (req, res, next) => {
  if (!req.user) return next(new ApiError(401, "Unauthorized"));
  if (!req.user.isMasterAdmin) return next(new ApiError(403, "Master admin required"));
  return next();
};

module.exports = { requireMasterAdmin };

