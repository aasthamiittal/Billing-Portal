const Item = require("../models/Item");
const Category = require("../models/Category");
const CatalogEntry = require("../models/CatalogEntry");
const Industry = require("../models/Industry");
const StockTransaction = require("../models/StockTransaction");
const asyncHandler = require("../utils/asyncHandler");
const Store = require("../models/Store");
const { ApiError } = require("../utils/errors");
const { getAccessibleStoreIds } = require("../utils/storeScope");

const getStockMap = async (itemIds, storeIds = null) => {
  if (!itemIds?.length) return new Map();
  const match = { item: { $in: itemIds }, isActive: true };
  if (storeIds?.length) {
    match.store = { $in: storeIds };
  }
  const agg = await StockTransaction.aggregate([
    { $match: match },
    {
      $group: {
        _id: "$item",
        purchased: { $sum: { $cond: [{ $eq: ["$type", "PURCHASE"] }, "$quantity", 0] } },
        sold: { $sum: { $cond: [{ $eq: ["$type", "SOLD"] }, "$quantity", 0] } },
        wasted: { $sum: { $cond: [{ $eq: ["$type", "WASTAGE"] }, "$quantity", 0] } },
      },
    },
  ]).exec();

  const map = new Map();
  agg.forEach((row) => {
    const qty = (row.purchased || 0) - (row.sold || 0) - (row.wasted || 0);
    map.set(String(row._id), qty);
  });
  return map;
};

const listItems = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.user?.store && !req.user.isMasterAdmin) {
    const ids = await getAccessibleStoreIds(req.user);
    filter.store = { $in: ids || [] };
  }
  const items = await Item.find(filter).lean().exec();
  const stockMap = await getStockMap(
    items.map((i) => i._id),
    [...new Set(items.map((i) => i.store).filter(Boolean))]
  );
  const enriched = items.map((item) => {
    const stockQty = stockMap.get(String(item._id)) || 0;
    return { ...item, stockQty, isOutOfStock: stockQty <= 0 };
  });
  res.json(enriched);
});

const createItem = asyncHandler(async (req, res) => {
  const { industryId, storeId, ...rest } = req.body;
  const { categoryId, categoryIds, taxIds } = req.body;
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

  const selectedCategoryIds = (categoryIds && categoryIds.length ? categoryIds : categoryId ? [categoryId] : [])
    .filter(Boolean);
  if (!selectedCategoryIds.length) throw new ApiError(400, "Category is required");
  const categories = await Category.find({ _id: { $in: selectedCategoryIds } }).exec();
  if (!categories.length || categories.length !== selectedCategoryIds.length) {
    throw new ApiError(400, "Invalid category");
  }
  if (categories.some((c) => String(c.store) !== String(resolvedStoreId))) {
    throw new ApiError(400, "Category does not belong to store");
  }
  const categoryNames = categories.map((c) => c.name);
  const primaryCategory = categories[0];

  const taxes = await CatalogEntry.find({ _id: { $in: taxIds || [] } }).exec();
  if (!taxes.length || taxes.some((t) => t.kind !== "taxes")) {
    throw new ApiError(400, "Invalid tax");
  }
  if (taxes.some((t) => String(t.store) !== String(resolvedStoreId))) {
    throw new ApiError(400, "Tax does not belong to store");
  }
  const taxNames = taxes.map((t) => t.name);
  const taxRates = taxes.map((t) => Number(t.value || 0));
  const taxRate = taxRates.reduce((sum, val) => sum + val, 0);

  const item = await Item.create({
    ...rest,
    categoryId: primaryCategory._id,
    categoryIds: categories.map((c) => c._id),
    categoryName: primaryCategory.name,
    categoryNames,
    taxIds: taxes.map((t) => t._id),
    taxNames,
    taxRates,
    taxRate,
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

  if (req.body.categoryId || req.body.categoryIds) {
    const selectedCategoryIds = (req.body.categoryIds && req.body.categoryIds.length
      ? req.body.categoryIds
      : req.body.categoryId
        ? [req.body.categoryId]
        : []).filter(Boolean);
    if (!selectedCategoryIds.length) throw new ApiError(400, "Category is required");
    const categories = await Category.find({ _id: { $in: selectedCategoryIds } }).exec();
    if (!categories.length || categories.length !== selectedCategoryIds.length) {
      throw new ApiError(400, "Invalid category");
    }
    if (categories.some((c) => String(c.store) !== String(item.store))) {
      throw new ApiError(400, "Category does not belong to store");
    }
    const primaryCategory = categories[0];
    item.categoryId = primaryCategory._id;
    item.categoryIds = categories.map((c) => c._id);
    item.categoryName = primaryCategory.name;
    item.categoryNames = categories.map((c) => c.name);
  }

  if (req.body.taxIds) {
    const taxes = await CatalogEntry.find({ _id: { $in: req.body.taxIds || [] } }).exec();
    if (!taxes.length || taxes.some((t) => t.kind !== "taxes")) {
      throw new ApiError(400, "Invalid tax");
    }
    if (taxes.some((t) => String(t.store) !== String(item.store))) {
      throw new ApiError(400, "Tax does not belong to store");
    }
    item.taxIds = taxes.map((t) => t._id);
    item.taxNames = taxes.map((t) => t.name);
    item.taxRates = taxes.map((t) => Number(t.value || 0));
    item.taxRate = item.taxRates.reduce((sum, val) => sum + val, 0);
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
      { categoryNames: { $regex: q, $options: "i" } },
      { description: { $regex: q, $options: "i" } },
    ];
  }

  const items = await Item.find(filter).sort({ name: 1 }).limit(limit).exec();
  const lean = items.map((i) => i.toObject());
  const stockMap = await getStockMap(
    lean.map((i) => i._id),
    [...new Set(lean.map((i) => i.store).filter(Boolean))]
  );
  const enriched = lean.map((item) => {
    const stockQty = stockMap.get(String(item._id)) || 0;
    return { ...item, stockQty, isOutOfStock: stockQty <= 0 };
  });
  res.json(enriched);
});

module.exports = { listItems, searchItems, createItem, updateItem };
