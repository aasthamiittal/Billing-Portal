const Item = require("../models/Item");
const Category = require("../models/Category");
const CatalogEntry = require("../models/CatalogEntry");
const Industry = require("../models/Industry");
const asyncHandler = require("../utils/asyncHandler");
const Store = require("../models/Store");
const { ApiError } = require("../utils/errors");
const { getAccessibleStoreIds } = require("../utils/storeScope");

const listItems = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.user?.store && !req.user.isMasterAdmin) {
    const ids = await getAccessibleStoreIds(req.user);
    filter.store = { $in: ids || [] };
  }
  const items = await Item.find(filter).exec();
  res.json(items);
});

const createItem = asyncHandler(async (req, res) => {
  const { industryId, storeId, ...rest } = req.body;
  const { categoryId } = req.body;
  const { taxId } = req.body;
  const industry = await Industry.findById(industryId).exec();
  if (!industry) {
    throw new ApiError(400, "Invalid industry");
  }

  let resolvedStoreId = storeId || req.user.store;
  if (!req.user.isMasterAdmin) {
    const ids = await getAccessibleStoreIds(req.user);
    if (!ids?.length) throw new ApiError(403, "Access denied");
    if (storeId && !ids.includes(String(storeId))) throw new ApiError(403, "Not allowed");
    resolvedStoreId = storeId || req.user.store;
  }

  if (resolvedStoreId) {
    const store = await Store.findById(resolvedStoreId).exec();
    if (!store) throw new ApiError(400, "Invalid store");
  }

  const category = await Category.findById(categoryId).exec();
  if (!category) throw new ApiError(400, "Invalid category");
  if (String(category.store) !== String(resolvedStoreId)) {
    throw new ApiError(400, "Category does not belong to store");
  }

  const tax = await CatalogEntry.findById(taxId).exec();
  if (!tax || tax.kind !== "taxes") throw new ApiError(400, "Invalid tax");
  if (String(tax.store) !== String(resolvedStoreId)) {
    throw new ApiError(400, "Tax does not belong to store");
  }

  const item = await Item.create({
    ...rest,
    categoryId: category._id,
    categoryName: category.name,
    taxId: tax._id,
    taxName: tax.name,
    taxRate: Number(tax.value || 0),
    industry: industry._id,
    store: resolvedStoreId,
  });
  res.status(201).json(item);
});

const updateItem = asyncHandler(async (req, res) => {
  const { industryId, storeId, ...rest } = req.body;
  const item = await Item.findById(req.params.id).exec();

  if (!item) {
    throw new ApiError(404, "Item not found");
  }
  if (!req.user.isMasterAdmin) {
    const ids = await getAccessibleStoreIds(req.user);
    if (!ids?.includes(String(item.store))) throw new ApiError(403, "Not allowed");
  }

  if (industryId) {
    const industry = await Industry.findById(industryId).exec();
    if (!industry) {
      throw new ApiError(400, "Invalid industry");
    }
    item.industry = industry._id;
  }
  if (storeId) {
    if (!req.user.isMasterAdmin) {
      // non-root can only move items within allowed stores
      const ids = await getAccessibleStoreIds(req.user);
      if (!ids?.includes(String(storeId))) throw new ApiError(403, "Not allowed");
    }
    const store = await Store.findById(storeId).exec();
    if (!store) {
      throw new ApiError(400, "Invalid store");
    }
    item.store = storeId;
  }

  if (req.body.categoryId) {
    const category = await Category.findById(req.body.categoryId).exec();
    if (!category) throw new ApiError(400, "Invalid category");
    if (String(category.store) !== String(item.store)) {
      throw new ApiError(400, "Category does not belong to store");
    }
    item.categoryId = category._id;
    item.categoryName = category.name;
  }

  if (req.body.taxId) {
    const tax = await CatalogEntry.findById(req.body.taxId).exec();
    if (!tax || tax.kind !== "taxes") throw new ApiError(400, "Invalid tax");
    if (String(tax.store) !== String(item.store)) {
      throw new ApiError(400, "Tax does not belong to store");
    }
    item.taxId = tax._id;
    item.taxName = tax.name;
    item.taxRate = Number(tax.value || 0);
  }

  Object.assign(item, rest);
  await item.save();
  res.json(item);
});

const searchItems = asyncHandler(async (req, res) => {
  const q = String(req.query.q || "").trim();
  const limit = Math.min(Number(req.query.limit || 20), 50);

  const filter = { isActive: true };
  if (!req.user.isMasterAdmin) {
    filter.store = req.user.store;
  } else if (req.query.storeId) {
    filter.store = req.query.storeId;
  }

  if (q) {
    filter.$or = [
      { name: { $regex: q, $options: "i" } },
      { categoryName: { $regex: q, $options: "i" } },
      { description: { $regex: q, $options: "i" } },
    ];
  }

  const items = await Item.find(filter).sort({ name: 1 }).limit(limit).exec();
  res.json(items);
});

module.exports = { listItems, searchItems, createItem, updateItem };
