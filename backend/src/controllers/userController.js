const User = require("../models/User");
const Role = require("../models/Role");
const Store = require("../models/Store");
const asyncHandler = require("../utils/asyncHandler");
const { ApiError } = require("../utils/errors");
const { getAccessibleStoreIds } = require("../utils/storeScope");

const assertUserCanAccessStore = async (actor, storeId) => {
  if (!actor) throw new ApiError(401, "Unauthorized");
  if (actor.isMasterAdmin) return true;
  const ids = await getAccessibleStoreIds(actor);
  if (!ids?.includes(String(storeId))) throw new ApiError(403, "Access denied");
  return true;
};

const listUsers = asyncHandler(async (req, res) => {
  const filter = {};
  if (!req.user.isMasterAdmin) {
    const ids = await getAccessibleStoreIds(req.user);
    filter.store = { $in: ids || [] };
  }
  const users = await User.find(filter)
    .select("-passwordHash")
    .populate("role")
    .exec();
  res.json(users);
});

const createUser = asyncHandler(async (req, res) => {
  const { name, email, password, roleId, storeId, isMasterAdmin } = req.body;

  if (isMasterAdmin && !req.user.isMasterAdmin) {
    throw new ApiError(403, "Only master admin can create master users");
  }

  // Enforce store scoping:
  // - master admin can create users for any store
  // - store admin can create users for own store OR descendant stores (if parent admin)
  if (!req.user.isMasterAdmin && !req.user.store) {
    throw new ApiError(403, "Store user cannot create users without an assigned store");
  }
  let resolvedStoreId = storeId || req.user.store;
  if (resolvedStoreId) {
    await assertUserCanAccessStore(req.user, resolvedStoreId);
  }

  const role = roleId ? await Role.findById(roleId).exec() : null;
  if (role && !req.user.isMasterAdmin) {
    // Non-master admins cannot assign GLOBAL roles; they can only assign roles for their store.
    if (role.scope !== "STORE") {
      throw new ApiError(403, "Only master admin can assign global roles");
    }
    if (role.store && String(role.store) !== String(resolvedStoreId)) {
      throw new ApiError(403, "Access denied");
    }
  }

  const store = resolvedStoreId ? await Store.findById(resolvedStoreId).exec() : null;
  if (resolvedStoreId && !store) {
    throw new ApiError(400, "Invalid store");
  }

  const passwordHash = password;
  const user = await User.create({
    name,
    email,
    passwordHash,
    role: role?._id,
    store: store?._id,
    isMasterAdmin: !!isMasterAdmin,
  });

  res.status(201).json({
    id: user._id,
    name: user.name,
    email: user.email,
  });
});

const getUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(id)
    .select("-passwordHash")
    .populate("role")
    .exec();
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (!req.user.isMasterAdmin) {
    if (!user.store) throw new ApiError(403, "Access denied");
    await assertUserCanAccessStore(req.user, user.store);
  }

  res.json(user);
});

const updateUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, email, password, roleId, storeId, isMasterAdmin, status } = req.body;

  const user = await User.findById(id).exec();
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (!req.user.isMasterAdmin) {
    if (!user.store) throw new ApiError(403, "Access denied");
    await assertUserCanAccessStore(req.user, user.store);
  }
  if (isMasterAdmin && !req.user.isMasterAdmin) {
    throw new ApiError(403, "Only master admin can grant master admin");
  }

  if (typeof name === "string") user.name = name;
  if (typeof email === "string") user.email = email;
  if (typeof status === "string") user.status = status;
  if (typeof isMasterAdmin === "boolean") user.isMasterAdmin = isMasterAdmin;

  if (roleId) {
    const role = await Role.findById(roleId).exec();
    if (role && !req.user.isMasterAdmin) {
      if (role.scope !== "STORE") {
        throw new ApiError(403, "Only master admin can assign global roles");
      }
      // Must be a role within the actor's store tree and match the user's store (post-move rules below).
      if (role.store && user.store && String(role.store) !== String(user.store)) {
        throw new ApiError(403, "Access denied");
      }
      if (role.store) {
        await assertUserCanAccessStore(req.user, role.store);
      }
    }
    user.role = role?._id;
  }
  if (storeId) {
    // Allow move only within actor's accessible store tree.
    await assertUserCanAccessStore(req.user, storeId);
    const store = await Store.findById(storeId).exec();
    if (!store) {
      throw new ApiError(400, "Invalid store");
    }
    user.store = store._id;
  }
  if (password) {
    user.passwordHash = password;
  }

  await user.save();
  const hydrated = await User.findById(user._id)
    .select("-passwordHash")
    .populate("role")
    .exec();
  res.json(hydrated);
});

const deleteUser = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const user = await User.findById(id).exec();
  if (!user) {
    throw new ApiError(404, "User not found");
  }

  if (!req.user.isMasterAdmin) {
    if (!user.store) throw new ApiError(403, "Access denied");
    await assertUserCanAccessStore(req.user, user.store);
  }
  if (user.isMasterAdmin && !req.user.isMasterAdmin) {
    throw new ApiError(403, "Only master admin can deactivate master users");
  }

  // Soft delete/deactivate
  user.status = "INACTIVE";
  await user.save();
  res.json({ success: true });
});

module.exports = { listUsers, createUser, getUser, updateUser, deleteUser };
