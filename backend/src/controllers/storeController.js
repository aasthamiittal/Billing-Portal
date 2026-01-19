const Store = require("../models/Store");
const Industry = require("../models/Industry");
const asyncHandler = require("../utils/asyncHandler");
const { ApiError } = require("../utils/errors");
const { checkPermission } = require("../middlewares/permissions");
const { createDefaultUsersForStore } = require("../services/storeProvisioningService");
const { getAccessibleStoreIds } = require("../utils/storeScope");

const defaultStoreSettingsForRootCreated = () => ({
  inventory: { enabled: true },
  printing: { enabled: true },
  notifications: { sms: false, email: false },
});

const listStores = asyncHandler(async (req, res) => {
  const filter = {};
  if (!req.user.isMasterAdmin) {
    const ids = await getAccessibleStoreIds(req.user);
    filter._id = { $in: ids || [] };
  }
  const stores = await Store.find(filter).populate("industry").exec();
  res.json(stores);
});

const createStore = asyncHandler(async (req, res) => {
  const { industryId, parentStoreId, defaultUserPassword, ...rest } = req.body;
  const industry = await Industry.findById(industryId).exec();
  if (!industry) {
    throw new ApiError(400, "Invalid industry");
  }

  const creatorIsRoot = !!req.user.isMasterAdmin;

  // Regular store users can only create child stores if explicitly allowed.
  // Root users can create any store type.
  let resolvedParentStoreId = parentStoreId || undefined;
  if (!creatorIsRoot) {
    // must have a store to attach children to
    if (!req.user.store) {
      throw new ApiError(403, "Store user cannot create stores without an assigned store");
    }

    // permission gate: able_to_create_child_store (flow), kept in current naming style
    // We reuse middleware logic by calling the checker directly for a soft "gate" here.
    const mw = checkPermission("store_management", "add_child_store", "read_write");
    await new Promise((resolve, reject) =>
      mw(req, res, (err) => (err ? reject(err) : resolve()))
    );

    resolvedParentStoreId = req.user.store;
  }

  const store = await Store.create({
    ...rest,
    industry: industry._id,
    parentStore: resolvedParentStoreId,
    createdBy: req.user._id,
    isCreatedByRoot: creatorIsRoot,
    initialLogin: creatorIsRoot,
    storeType: "Individual",
    settings: creatorIsRoot ? defaultStoreSettingsForRootCreated() : rest.settings || {},
  });

  // Post-save logic: only root-created stores are auto-provisioned.
  let defaultUsers = [];
  if (creatorIsRoot) {
    defaultUsers = await createDefaultUsersForStore(store, {
      createdByUserId: req.user._id,
      defaultPassword: typeof defaultUserPassword === "string" && defaultUserPassword ? defaultUserPassword : undefined,
    });
  }

  res.status(201).json({ store, defaultUsers });
});

const getStore = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const store = await Store.findById(id).populate("industry").exec();
  if (!store) {
    throw new ApiError(404, "Store not found");
  }
  if (!req.user.isMasterAdmin && String(store._id) !== String(req.user.store)) {
    throw new ApiError(403, "Access denied");
  }
  res.json(store);
});

const updateStore = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { industryId, parentStoreId, name, code, settings, isActive } = req.body;

  const store = await Store.findById(id).exec();
  if (!store) {
    throw new ApiError(404, "Store not found");
  }
  if (!req.user.isMasterAdmin && String(store._id) !== String(req.user.store)) {
    throw new ApiError(403, "Access denied");
  }

  if (industryId) {
    const industry = await Industry.findById(industryId).exec();
    store.industry = industry._id;
  }
  if (typeof name === "string") store.name = name;
  if (typeof code === "string") store.code = code;
  if (typeof settings === "object") store.settings = settings;
  if (typeof isActive === "boolean") store.isActive = isActive;
  store.parentStore = parentStoreId ? parentStoreId : undefined;

  await store.save();
  const hydrated = await Store.findById(store._id).populate("industry").exec();
  res.json(hydrated);
});

const deleteStore = asyncHandler(async (req, res) => {
  const { id } = req.params;
  const store = await Store.findById(id).exec();
  if (!store) {
    throw new ApiError(404, "Store not found");
  }
  if (!req.user.isMasterAdmin && String(store._id) !== String(req.user.store)) {
    throw new ApiError(403, "Access denied");
  }
  // Soft delete
  store.isActive = false;
  await store.save();
  res.json({ success: true });
});

module.exports = { listStores, createStore, getStore, updateStore, deleteStore };
