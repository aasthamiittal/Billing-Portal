const { ApiError } = require("../utils/errors");
const PERMISSION_KEYS = require("../config/permissionKeys");

const LEVELS = {
  show: 1,
  read_only: 2,
  download: 2,
  read_write: 3,
};

const hasMatrixPermission = (matrix, category, action, requiredLevel) => {
  if (!category || !action) return false;
  const userLevel = matrix?.[category]?.[action];
  const userRank = LEVELS[userLevel] || 0;
  const requiredRank = LEVELS[requiredLevel] || 0;
  return userRank >= requiredRank;
};

const getUserPermissions = (user) => user?.role?.permissions || {};

const resolvePermissionKey = (key) => {
  const entry = PERMISSION_KEYS?.[key];
  if (!entry) return null;
  if (entry.allOf && Array.isArray(entry.allOf)) return { allOf: entry.allOf };
  return entry;
};

const requirePermission = (permissionOrDescriptor) => (req, res, next) => {
  const user = req.user;
  if (!user) {
    return next(new ApiError(401, "Unauthorized"));
  }
  if (user.isMasterAdmin) {
    return next();
  }

  // Key style: "store_list_and_update"
  if (typeof permissionOrDescriptor === "string") {
    const resolved = resolvePermissionKey(permissionOrDescriptor);
    if (!resolved) return next(new ApiError(400, "Unknown permission key"));
    const perms = getUserPermissions(user);

    if (resolved.allOf) {
      const ok = resolved.allOf.every((d) =>
        hasMatrixPermission(perms, d.category, d.action, d.level || "read_only")
      );
      if (!ok) return next(new ApiError(403, "Insufficient permissions"));
      return next();
    }

    const ok = hasMatrixPermission(perms, resolved.category, resolved.action, resolved.level || "read_only");
    if (!ok) return next(new ApiError(403, "Insufficient permissions"));
    return next();
  }

  // { category, action, level }
  if (typeof permissionOrDescriptor === "object" && permissionOrDescriptor) {
    const { category, action, level = "read_only" } = permissionOrDescriptor;
    const perms = getUserPermissions(user);
    const allowed = hasMatrixPermission(perms, category, action, level);
    if (!allowed) {
      return next(new ApiError(403, "Insufficient permissions"));
    }
    return next();
  }

  return next(new ApiError(400, "Invalid permission descriptor"));
};

// Alias matching the naming in the requested RBAC flow
const checkPermission = (category, action, level = "read_only") =>
  requirePermission({ category, action, level });

const checkPermissionKey = (key) => requirePermission(key);

module.exports = { requirePermission, checkPermission, checkPermissionKey, LEVELS };
