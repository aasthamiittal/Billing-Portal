const SKU = require("../models/Sku");
const Item = require("../models/Item");
const asyncHandler = require("../utils/asyncHandler");
const { ApiError } = require("../utils/errors");
const { getAccessibleStoreIds } = require("../utils/storeScope");

const listSkus = asyncHandler(async (req, res) => {
  // Scope by store (tenant isolation): non-master users only see SKUs for their store's items.
  const allowedStores = req.user.isMasterAdmin ? null : await getAccessibleStoreIds(req.user);
  const skus = await SKU.find()
    .populate({
      path: "item",
      match: !req.user.isMasterAdmin ? { store: { $in: allowedStores || [] } } : undefined,
    })
    .exec();

  res.json(req.user.isMasterAdmin ? skus : skus.filter((s) => !!s.item));
});

const createSku = asyncHandler(async (req, res) => {
  const { itemId, skuCode, barcode, price, taxRate, discount, attributes } = req.body;
  const item = await Item.findById(itemId).exec();
  if (!item) {
    throw new ApiError(400, "Invalid item");
  }
  if (!req.user.isMasterAdmin) {
    const ids = await getAccessibleStoreIds(req.user);
    if (!ids?.includes(String(item.store))) throw new ApiError(403, "Not allowed");
  }
  const sku = await SKU.create({
    item: itemId,
    skuCode,
    barcode: barcode || "",
    price: Number(price || 0),
    taxRate: Number(taxRate || 0),
    discount: Number(discount || 0),
    attributes: attributes || {},
    // inventoryQty intentionally not set directly (transaction-based inventory only)
  });
  res.status(201).json(sku);
});

module.exports = { listSkus, createSku };
