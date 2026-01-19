import { PERMISSION_KEYS } from "./permissionKeys";

const LEVELS = {
  show: 1,
  read_only: 2,
  download: 2,
  read_write: 3,
};

export function hasPermissionMatrix(permissions, category, action, requiredLevel = "read_only") {
  const userLevel = permissions?.[category]?.[action];
  const userRank = LEVELS[userLevel] || 0;
  const requiredRank = LEVELS[requiredLevel] || 0;
  return userRank >= requiredRank;
}

export function hasPermission(user, category, action, requiredLevel = "read_only") {
  if (!user) return false;
  if (user.isMasterAdmin) return true;

  const permissions = user.permissions || {};
  return hasPermissionMatrix(permissions, category, action, requiredLevel);
}

// Backwards-compatible alias used throughout the UI.
export const can = hasPermission;

export function hasPermissionKey(user, key) {
  const entry = PERMISSION_KEYS?.[key];
  if (!entry) return false;
  if (entry.allOf) {
    return entry.allOf.every((d) => hasPermission(user, d.category, d.action, d.level || "read_only"));
  }
  return hasPermission(user, entry.category, entry.action, entry.level || "read_only");
}


