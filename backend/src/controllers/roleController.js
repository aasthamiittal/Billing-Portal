const Role = require("../models/Role");
const asyncHandler = require("../utils/asyncHandler");
const { ApiError } = require("../utils/errors");
const { getAccessibleStoreIds } = require("../utils/storeScope");
const permissionSchema = require("../config/permissionSchema");

const LEVELS = { show: 1, read_only: 2, download: 2, read_write: 3 };

const isMasterRole = (role) =>
  role?.scope === "GLOBAL" && String(role?.name || "").toLowerCase() === "master admin";

const buildAllowed = () => {
  const modules = permissionSchema?.modules || {};
  const allowedByModule = {};
  const defByModule = {};
  Object.entries(modules).forEach(([m, defs]) => {
    allowedByModule[m] = new Set((defs || []).map((d) => d.action));
    defByModule[m] = new Map((defs || []).map((d) => [d.action, d]));
  });
  return { allowedByModule, defByModule };
};

const { allowedByModule, defByModule } = buildAllowed();

const normalizeLevel = (def, level) => {
  const allowed = new Set(def?.levels || []);
  if (!allowed.size) return level;
  if (allowed.has(level)) return level;

  // Coerce legacy/invalid levels into the closest supported level.
  if (allowed.has("download") && (level === "read_write" || level === "read_only")) return "show";
  if (allowed.has("download") && level) return "download";
  if (allowed.has("read_write") && (level === "download")) return "read_write";
  if (allowed.has("read_only") && (level === "read_write")) return "read_only";
  if (allowed.has("read_only") && level) return "read_only";
  if (allowed.has("show")) return "show";

  return Array.from(allowed)[0];
};

const sanitizePermissions = (raw) => {
  if (!raw || typeof raw !== "object") return {};
  if (Array.isArray(raw)) return {};

  const out = {};
  for (const [category, actions] of Object.entries(raw)) {
    // Drop legacy array-like keys: {"0": "...", "1": "..."}
    if (/^\d+$/.test(category)) continue;

    // Allow UI-only feature flags
    if (category === "functionality_access") {
      if (actions && typeof actions === "object" && !Array.isArray(actions)) {
        out[category] = {};
        for (const [k, v] of Object.entries(actions)) {
          if (/^\d+$/.test(k)) continue;
          out[category][k] = v === "read_write" ? "read_write" : "show";
        }
      }
      continue;
    }

    if (!allowedByModule?.[category]) continue;
    if (!actions || typeof actions !== "object" || Array.isArray(actions)) continue;

    const allowedActions = allowedByModule[category];
    const defMap = defByModule[category];
    out[category] = {};
    for (const [action, level] of Object.entries(actions)) {
      if (/^\d+$/.test(action)) continue;
      if (!allowedActions.has(action)) continue;
      const def = defMap.get(action);
      out[category][action] = normalizeLevel(def, level);
    }
  }

  return out;
};

const sanitizeRoleOut = (roleDoc) => {
  const obj = roleDoc?.toObject ? roleDoc.toObject() : { ...(roleDoc || {}) };
  delete obj.permissionMatrix;
  delete obj.capabilities;
  if (obj.permissions) obj.permissions = sanitizePermissions(obj.permissions);
  return obj;
};

const assertRoleWithinActorScope = async (actor, role) => {
  if (!actor) throw new ApiError(401, "Unauthorized");
  if (actor.isMasterAdmin) return true;
  if (role.scope === "GLOBAL") throw new ApiError(403, "Access denied");
  const ids = await getAccessibleStoreIds(actor);
  if (!role.store || !ids?.includes(String(role.store))) throw new ApiError(403, "Access denied");
  return true;
};

// Bounded delegation: non-master admins cannot create/update a role with permissions above their own.
const assertMatrixNotAboveActor = (actorMatrix = {}, requestedMatrix = {}) => {
  const entries = requestedMatrix && typeof requestedMatrix === "object" ? requestedMatrix : {};
  for (const [category, actions] of Object.entries(entries)) {
    if (!actions || typeof actions !== "object") continue;
    for (const [action, level] of Object.entries(actions)) {
      const reqRank = LEVELS[level] || 0;
      const actorLevel = actorMatrix?.[category]?.[action];
      const actorRank = LEVELS[actorLevel] || 0;
      if (reqRank > actorRank) {
        throw new ApiError(403, `Cannot grant higher permissions than your own: ${category}.${action}`);
      }
    }
  }
};

const listRoles = asyncHandler(async (req, res) => {
  const filter = {};
  if (!req.user.isMasterAdmin) {
    const ids = await getAccessibleStoreIds(req.user);
    filter.scope = "STORE";
    filter.store = { $in: ids || [] };
  }
  const roles = await Role.find(filter).exec();
  res.json((roles || []).map(sanitizeRoleOut));
});

const createRole = asyncHandler(async (req, res) => {
  const { name, description, scope, permissions, storeId, isActive } = req.body;

  if (scope === "GLOBAL" && !req.user.isMasterAdmin) {
    throw new ApiError(403, "Only master admin can create global roles");
  }
  if (scope === "GLOBAL" && String(name || "").toLowerCase() === "master admin") {
    throw new ApiError(403, "Master Admin role is system-managed and cannot be created via API");
  }

  // Enforce store scoping: non-master admins can only create roles for their own store.
  // Also guard root users (who may not have req.user.store) when creating STORE roles.
  let resolvedStoreId = scope === "STORE" ? (storeId || req.user.store) : undefined;
  if (scope === "STORE") {
    if (!req.user.isMasterAdmin) {
      if (!req.user.store) {
        throw new ApiError(403, "Store user cannot create roles without an assigned store");
      }
      const ids = await getAccessibleStoreIds(req.user);
      const target = String(resolvedStoreId || "");
      if (!target || !ids?.includes(target)) {
        throw new ApiError(403, "Access denied");
      }
    } else {
      if (!resolvedStoreId) {
        throw new ApiError(400, "storeId is required for STORE roles");
      }
    }
  }

  const cleanPermissions = sanitizePermissions(permissions || {});

  if (!req.user.isMasterAdmin) {
    // Bounded delegation: cannot create a role more powerful than yourself
    assertMatrixNotAboveActor(req.user.role?.permissions || {}, cleanPermissions);
  }

  const role = await Role.create({
    name,
    description: description || "",
    scope,
    permissions: cleanPermissions,
    store: scope === "STORE" ? resolvedStoreId : undefined,
    isActive: typeof isActive === "boolean" ? isActive : true,
  });

  res.status(201).json(sanitizeRoleOut(role));
});

const getRole = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const role = await Role.findById(id).exec();
  if (!role) {
    throw new ApiError(404, "Role not found");
  }

  if (!req.user.isMasterAdmin) {
    await assertRoleWithinActorScope(req.user, role);
  }

  res.json(sanitizeRoleOut(role));
});

const updateRole = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, description, permissions, isActive } = req.body;

  const role = await Role.findById(id).exec();
  if (!role) {
    throw new ApiError(404, "Role not found");
  }
  if (isMasterRole(role)) {
    throw new ApiError(403, "Master Admin role is immutable (managed only via DB)");
  }

  if (role.scope === "GLOBAL" && !req.user.isMasterAdmin) {
    throw new ApiError(403, "Only master admin can modify global roles");
  }
  if (role.scope === "STORE" && !req.user.isMasterAdmin) {
    await assertRoleWithinActorScope(req.user, role);
  }

  if (typeof name === "string") role.name = name;
  if (typeof description === "string") role.description = description;
  if (permissions && typeof permissions === "object") {
    const cleanPermissions = sanitizePermissions(permissions);
    if (!req.user.isMasterAdmin) {
      assertMatrixNotAboveActor(req.user.role?.permissions || {}, cleanPermissions);
    }
    role.permissions = cleanPermissions;
  }
  if (typeof isActive === "boolean") role.isActive = isActive;

  await role.save();
  // Clean legacy fields on disk if they exist from older versions.
  await Role.updateOne(
    { _id: role._id },
    { $unset: { permissionMatrix: 1, capabilities: 1 } },
    { strict: false }
  ).exec();
  const hydrated = await Role.findById(role._id).exec();
  res.json(sanitizeRoleOut(hydrated));
});

const deleteRole = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const role = await Role.findById(id).exec();
  if (!role) {
    throw new ApiError(404, "Role not found");
  }
  if (isMasterRole(role)) {
    throw new ApiError(403, "Master Admin role cannot be disabled via API (managed only via DB)");
  }

  if (role.scope === "GLOBAL" && !req.user.isMasterAdmin) {
    throw new ApiError(403, "Only master admin can delete global roles");
  }
  if (role.scope === "STORE" && !req.user.isMasterAdmin) {
    await assertRoleWithinActorScope(req.user, role);
  }

  // Soft disable (matches UI "Available/Not Available")
  role.isActive = false;
  await role.save();
  res.json({ success: true });
});

module.exports = { listRoles, createRole, getRole, updateRole, deleteRole };
