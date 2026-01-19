const Supplier = require("../models/Supplier");
const Buyer = require("../models/Buyer");
const StockTransaction = require("../models/StockTransaction");
const Item = require("../models/Item");
const asyncHandler = require("../utils/asyncHandler");
const { ApiError } = require("../utils/errors");
const { resolveStoreForRequest } = require("../utils/storeScopeResolve");
const Store = require("../models/Store");
const { buildStockReportExcel, buildStockReportPdf } = require("../services/reportService");

const listSuppliers = asyncHandler(async (req, res) => {
  const store = await resolveStoreForRequest(req, req.query.storeId);
  const rows = await Supplier.find({ store: store._id }).sort({ name: 1 }).exec();
  res.json(rows);
});

const createSupplier = asyncHandler(async (req, res) => {
  const store = await resolveStoreForRequest(req, req.body.storeId);
  const created = await Supplier.create({
    ...req.body,
    store: store._id,
    createdBy: req.user._id,
    updatedBy: req.user._id,
  });
  res.status(201).json(created);
});

const updateSupplier = asyncHandler(async (req, res) => {
  const row = await Supplier.findById(req.params.id).exec();
  if (!row) throw new ApiError(404, "Supplier not found");
  await resolveStoreForRequest(req, String(row.store));
  Object.assign(row, req.body, { updatedBy: req.user._id });
  await row.save();
  res.json(row);
});

const deleteSupplier = asyncHandler(async (req, res) => {
  const row = await Supplier.findById(req.params.id).exec();
  if (!row) throw new ApiError(404, "Supplier not found");
  await resolveStoreForRequest(req, String(row.store));
  row.isActive = false;
  row.updatedBy = req.user._id;
  await row.save();
  res.json({ success: true });
});

const listBuyers = asyncHandler(async (req, res) => {
  const store = await resolveStoreForRequest(req, req.query.storeId);
  const rows = await Buyer.find({ store: store._id }).sort({ name: 1 }).exec();
  res.json(rows);
});

const createBuyer = asyncHandler(async (req, res) => {
  const store = await resolveStoreForRequest(req, req.body.storeId);
  const created = await Buyer.create({
    ...req.body,
    store: store._id,
    createdBy: req.user._id,
    updatedBy: req.user._id,
  });
  res.status(201).json(created);
});

const updateBuyer = asyncHandler(async (req, res) => {
  const row = await Buyer.findById(req.params.id).exec();
  if (!row) throw new ApiError(404, "Buyer not found");
  await resolveStoreForRequest(req, String(row.store));
  Object.assign(row, req.body, { updatedBy: req.user._id });
  await row.save();
  res.json(row);
});

const deleteBuyer = asyncHandler(async (req, res) => {
  const row = await Buyer.findById(req.params.id).exec();
  if (!row) throw new ApiError(404, "Buyer not found");
  await resolveStoreForRequest(req, String(row.store));
  row.isActive = false;
  row.updatedBy = req.user._id;
  await row.save();
  res.json({ success: true });
});

const listPurchases = asyncHandler(async (req, res) => {
  const store = await resolveStoreForRequest(req, req.query.storeId);
  const rows = await StockTransaction.find({ store: store._id, type: "PURCHASE", isActive: true })
    .populate("item")
    .populate("supplier")
    .sort({ occurredAt: -1 })
    .exec();
  res.json(rows);
});

const createPurchase = asyncHandler(async (req, res) => {
  const store = await resolveStoreForRequest(req, req.body.storeId);
  const item = await Item.findById(req.body.itemId).exec();
  if (!item) throw new ApiError(400, "Invalid item");

  // Tenant isolation: item must belong to store (or be accessible to master for that store)
  if (String(item.store) !== String(store._id)) throw new ApiError(400, "Item does not belong to store");

  if (req.body.supplierId) {
    const supplier = await Supplier.findById(req.body.supplierId).exec();
    if (!supplier) throw new ApiError(400, "Invalid supplier");
    if (String(supplier.store) !== String(store._id)) {
      throw new ApiError(400, "Supplier does not belong to store");
    }
  }

  const created = await StockTransaction.create({
    type: "PURCHASE",
    store: store._id,
    item: item._id,
    quantity: req.body.quantity,
    unitCost: req.body.unitCost || 0,
    supplier: req.body.supplierId || undefined,
    occurredAt: req.body.occurredAt || new Date(),
    notes: req.body.notes || "",
    createdBy: req.user._id,
  });
  res.status(201).json(created);
});

const listWastage = asyncHandler(async (req, res) => {
  const store = await resolveStoreForRequest(req, req.query.storeId);
  const rows = await StockTransaction.find({ store: store._id, type: "WASTAGE", isActive: true })
    .populate("item")
    .sort({ occurredAt: -1 })
    .exec();
  res.json(rows);
});

const createWastage = asyncHandler(async (req, res) => {
  const store = await resolveStoreForRequest(req, req.body.storeId);
  const item = await Item.findById(req.body.itemId).exec();
  if (!item) throw new ApiError(400, "Invalid item");
  if (String(item.store) !== String(store._id)) throw new ApiError(400, "Item does not belong to store");

  const created = await StockTransaction.create({
    type: "WASTAGE",
    store: store._id,
    item: item._id,
    quantity: req.body.quantity,
    reasonCode: req.body.reasonCode || "",
    occurredAt: req.body.occurredAt || new Date(),
    notes: req.body.notes || "",
    createdBy: req.user._id,
  });
  res.status(201).json(created);
});

const listSold = asyncHandler(async (req, res) => {
  const store = await resolveStoreForRequest(req, req.query.storeId);
  const rows = await StockTransaction.find({ store: store._id, type: "SOLD", isActive: true })
    .populate("item")
    .populate("buyer")
    .populate("invoice")
    .sort({ occurredAt: -1 })
    .exec();
  res.json(rows);
});

const getStockReport = asyncHandler(async (req, res) => {
  const result = await computeStockReport(req);
  res.json(result);
});

const computeStockReport = async (req) => {
  const storeId = req.query.storeId;
  const store = await resolveStoreForRequest(req, storeId);

  const from = req.query.from ? new Date(req.query.from) : null;
  const to = req.query.to ? new Date(req.query.to) : null;

  const matchStore = { store: store._id, isActive: true };
  const matchInRange = { ...matchStore };
  if (from || to) {
    matchInRange.occurredAt = {};
    if (from) matchInRange.occurredAt.$gte = from;
    if (to) matchInRange.occurredAt.$lte = to;
  }

  // Opening = net movement before 'from'
  let openingAgg = [];
  if (from) {
    openingAgg = await StockTransaction.aggregate([
      { $match: { ...matchStore, occurredAt: { $lt: from } } },
      {
        $group: {
          _id: "$item",
          purchased: {
            $sum: { $cond: [{ $eq: ["$type", "PURCHASE"] }, "$quantity", 0] },
          },
          sold: { $sum: { $cond: [{ $eq: ["$type", "SOLD"] }, "$quantity", 0] } },
          wasted: { $sum: { $cond: [{ $eq: ["$type", "WASTAGE"] }, "$quantity", 0] } },
        },
      },
    ]).exec();
  }

  const rangeAgg = await StockTransaction.aggregate([
    { $match: matchInRange },
    {
      $group: {
        _id: "$item",
        purchased: { $sum: { $cond: [{ $eq: ["$type", "PURCHASE"] }, "$quantity", 0] } },
        sold: { $sum: { $cond: [{ $eq: ["$type", "SOLD"] }, "$quantity", 0] } },
        wasted: { $sum: { $cond: [{ $eq: ["$type", "WASTAGE"] }, "$quantity", 0] } },
      },
    },
  ]).exec();

  const openingByItem = new Map();
  for (const r of openingAgg) {
    const opening = (r.purchased || 0) - (r.sold || 0) - (r.wasted || 0);
    openingByItem.set(String(r._id), opening);
  }

  const allItemIds = new Set([...rangeAgg.map((r) => String(r._id)), ...Array.from(openingByItem.keys())]);

  const items = await Item.find({ _id: { $in: Array.from(allItemIds) } })
    .select("name store category categoryName")
    .exec();
  const itemById = new Map(items.map((i) => [String(i._id), i]));

  const rows = Array.from(allItemIds).map((id) => {
    const r = rangeAgg.find((x) => String(x._id) === id) || {};
    const opening = openingByItem.get(id) || 0;
    const purchased = r.purchased || 0;
    const sold = r.sold || 0;
    const wasted = r.wasted || 0;
    const closing = opening + purchased - sold - wasted;
    const item = itemById.get(id);
    return {
      itemId: id,
      itemName: item?.name || "-",
      opening,
      purchased,
      sold,
      wasted,
      closing,
    };
  });

  rows.sort((a, b) => a.itemName.localeCompare(b.itemName));
  const storeDoc = await Store.findById(store._id).select("name").lean().exec();

  return {
    storeId: String(store._id),
    storeName: storeDoc?.name || "",
    from: from ? from.toISOString().slice(0, 10) : "",
    to: to ? to.toISOString().slice(0, 10) : "",
    rows,
  };
};

const downloadStockReportExcel = asyncHandler(async (req, res) => {
  const result = await computeStockReport(req);
  const buffer = await buildStockReportExcel(result);
  res.setHeader(
    "Content-Type",
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
  );
  res.setHeader("Content-Disposition", `attachment; filename=stock-report.xlsx`);
  res.send(buffer);
});

const downloadStockReportPdf = asyncHandler(async (req, res) => {
  const result = await computeStockReport(req);
  const buffer = await buildStockReportPdf(result);
  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename=stock-report.pdf`);
  res.send(buffer);
});

module.exports = {
  listSuppliers,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  listBuyers,
  createBuyer,
  updateBuyer,
  deleteBuyer,
  listPurchases,
  createPurchase,
  listWastage,
  createWastage,
  listSold,
  getStockReport,
  downloadStockReportExcel,
  downloadStockReportPdf,
};

