const Category = require("../models/Category");
const asyncHandler = require("../utils/asyncHandler");
const { ApiError } = require("../utils/errors");
const { resolveStoreForRequest } = require("../utils/storeScopeResolve");
const Store = require("../models/Store");

const listCategories = asyncHandler(async (req, res) => {
  const storeId = req.query.storeId;
  const store = await resolveStoreForRequest(req, storeId);
  const rows = await Category.find({ store: store._id, isActive: true })
    .sort({ name: 1 })
    .exec();
  res.json(rows);
});

const createCategory = asyncHandler(async (req, res) => {
  const { storeId, name, code } = req.body;
  const store = await resolveStoreForRequest(req, storeId);
  const storeDoc = await Store.findById(store._id).populate("industry").exec();
  if (!storeDoc?.industry) throw new ApiError(400, "Invalid store/industry");

  const created = await Category.create({
    name,
    code: code || "",
    store: store._id,
    industry: storeDoc.industry._id,
    createdBy: req.user._id,
    updatedBy: req.user._id,
  });
  res.status(201).json(created);
});

const updateCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id).exec();
  if (!category) throw new ApiError(404, "Category not found");

  // Store scoping
  await resolveStoreForRequest(req, String(category.store));

  Object.assign(category, req.body, { updatedBy: req.user._id });
  await category.save();
  res.json(category);
});

const deleteCategory = asyncHandler(async (req, res) => {
  const category = await Category.findById(req.params.id).exec();
  if (!category) throw new ApiError(404, "Category not found");

  await resolveStoreForRequest(req, String(category.store));
  category.isActive = false;
  category.updatedBy = req.user._id;
  await category.save();
  res.json({ success: true });
});

module.exports = { listCategories, createCategory, updateCategory, deleteCategory };

