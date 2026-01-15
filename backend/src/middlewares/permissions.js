const { ApiError } = require("../utils/errors");

const requirePermission = (permissionKey) => (req, res, next) => {
  const user = req.user;
  if (!user) {
    return next(new ApiError(401, "Unauthorized"));
  }
  if (user.isMasterAdmin) {
    return next();
  }

  const permissions = user.role?.permissions || [];
  const allowed = permissions.some((perm) => perm.key === permissionKey);

  if (!allowed) {
    return next(new ApiError(403, "Insufficient permissions"));
  }

  return next();
};

module.exports = { requirePermission };
