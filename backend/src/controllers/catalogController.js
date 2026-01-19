const CatalogEntry = require("../models/CatalogEntry");
const Store = require("../models/Store");
const Industry = require("../models/Industry");
const asyncHandler = require("../utils/asyncHandler");
const { ApiError } = require("../utils/errors");
const { audit } = require("../services/auditService");

const resolveContext = async (req) => {
  if (!req.user.isMasterAdmin) {
    if (!req.user.store) throw new ApiError(403, "Access denied");
    const store = await Store.findById(req.user.store).populate("industry").exec();
    if (!store) throw new ApiError(400, "Invalid store");
    return { store, industry: store.industry };
  }

  const storeId = req.query.storeId || req.body.storeId;
  if (!storeId) throw new ApiError(400, "storeId is required for master admin");
  const store = await Store.findById(storeId).populate("industry").exec();
  if (!store) throw new ApiError(400, "Invalid store");

  const industryId = req.query.industryId || req.body.industryId;
  const industry = industryId ? await Industry.findById(industryId).exec() : store.industry;
  if (!industry) throw new ApiError(400, "Invalid industry");
  return { store, industry };
};

const listCatalog = asyncHandler(async (req, res) => {
  const kind = req.params.kind;
  const { store } = await resolveContext(req);
  const rows = await CatalogEntry.find({ kind, store: store._id }).sort({ name: 1 }).exec();
  res.json(rows);
});

const createCatalog = asyncHandler(async (req, res) => {
  const kind = req.params.kind;
  const { store, industry } = await resolveContext(req);
  const { name, code, value, config } = req.body;

  const entry = await CatalogEntry.create({
    kind,
    name,
    code: code || "",
    value: value || 0,
    config: config || {},
    store: store._id,
    industry: industry._id,
    createdBy: req.user._id,
    updatedBy: req.user._id,
  });

  await audit({
    actorId: req.user._id,
    action: "catalog.create",
    entityType: "CatalogEntry",
    entityId: entry._id,
    metadata: { kind, store: store._id },
  });

  res.status(201).json(entry);
});

const updateCatalog = asyncHandler(async (req, res) => {
  const kind = req.params.kind;
  const { store } = await resolveContext(req);
  const entry = await CatalogEntry.findById(req.params.id).exec();
  if (!entry) throw new ApiError(404, "Not found");
  if (entry.kind !== kind) throw new ApiError(400, "Kind mismatch");
  if (String(entry.store) !== String(store._id)) throw new ApiError(403, "Access denied");

  Object.assign(entry, req.body, { updatedBy: req.user._id });
  await entry.save();

  await audit({
    actorId: req.user._id,
    action: "catalog.update",
    entityType: "CatalogEntry",
    entityId: entry._id,
    metadata: { kind, store: store._id },
  });

  res.json(entry);
});

const deleteCatalog = asyncHandler(async (req, res) => {
  const kind = req.params.kind;
  const { store } = await resolveContext(req);
  const entry = await CatalogEntry.findById(req.params.id).exec();
  if (!entry) throw new ApiError(404, "Not found");
  if (entry.kind !== kind) throw new ApiError(400, "Kind mismatch");
  if (String(entry.store) !== String(store._id)) throw new ApiError(403, "Access denied");

  entry.isActive = false;
  entry.updatedBy = req.user._id;
  await entry.save();

  await audit({
    actorId: req.user._id,
    action: "catalog.deactivate",
    entityType: "CatalogEntry",
    entityId: entry._id,
    metadata: { kind, store: store._id },
  });

  res.json({ success: true });
});

module.exports = { listCatalog, createCatalog, updateCatalog, deleteCatalog };

