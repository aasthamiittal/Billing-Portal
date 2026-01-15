const SKU = require("../models/Sku");
const asyncHandler = require("../utils/asyncHandler");

const listSkus = asyncHandler(async (req, res) => {
  const skus = await SKU.find().populate("item").exec();
  res.json(skus);
});

const createSku = asyncHandler(async (req, res) => {
  const { itemId, ...rest } = req.body;
  const sku = await SKU.create({ item: itemId, ...rest });
  res.status(201).json(sku);
});

module.exports = { listSkus, createSku };
