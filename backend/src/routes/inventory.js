const express = require("express");
const { requireAuth } = require("../middlewares/auth");
const { checkPermission } = require("../middlewares/permissions");
const validate = require("../middlewares/validate");
const inventoryController = require("../controllers/inventoryController");
const {
  createSupplierSchema,
  updateSupplierSchema,
  createBuyerSchema,
  updateBuyerSchema,
  createPurchaseSchema,
  createWastageSchema,
} = require("../validators/inventoryValidators");

const router = express.Router();

// Suppliers
router.get(
  "/suppliers",
  requireAuth,
  checkPermission("inventory", "suppliers", "read_only"),
  inventoryController.listSuppliers
);
router.post(
  "/suppliers",
  requireAuth,
  checkPermission("inventory", "suppliers", "read_write"),
  validate(createSupplierSchema),
  inventoryController.createSupplier
);
router.put(
  "/suppliers/:id",
  requireAuth,
  checkPermission("inventory", "suppliers", "read_write"),
  validate(updateSupplierSchema),
  inventoryController.updateSupplier
);
router.delete(
  "/suppliers/:id",
  requireAuth,
  checkPermission("inventory", "suppliers", "read_write"),
  inventoryController.deleteSupplier
);

// Buyers
router.get(
  "/buyers",
  requireAuth,
  checkPermission("inventory", "buyers", "read_only"),
  inventoryController.listBuyers
);
router.post(
  "/buyers",
  requireAuth,
  checkPermission("inventory", "buyers", "read_write"),
  validate(createBuyerSchema),
  inventoryController.createBuyer
);
router.put(
  "/buyers/:id",
  requireAuth,
  checkPermission("inventory", "buyers", "read_write"),
  validate(updateBuyerSchema),
  inventoryController.updateBuyer
);
router.delete(
  "/buyers/:id",
  requireAuth,
  checkPermission("inventory", "buyers", "read_write"),
  inventoryController.deleteBuyer
);

// Stock Purchase (transactions)
router.get(
  "/purchases",
  requireAuth,
  checkPermission("inventory", "stock_purchase", "read_only"),
  inventoryController.listPurchases
);
router.post(
  "/purchases",
  requireAuth,
  checkPermission("inventory", "stock_purchase", "read_write"),
  validate(createPurchaseSchema),
  inventoryController.createPurchase
);

// Wastage (transactions)
router.get(
  "/wastage",
  requireAuth,
  checkPermission("inventory", "wastage", "read_only"),
  inventoryController.listWastage
);
router.post(
  "/wastage",
  requireAuth,
  checkPermission("inventory", "wastage", "read_write"),
  validate(createWastageSchema),
  inventoryController.createWastage
);

// Stock Sold (read-only; created by billing)
router.get(
  "/sold",
  requireAuth,
  checkPermission("inventory", "stock_sold", "read_only"),
  inventoryController.listSold
);

// Stock Report
router.get(
  "/stock-report",
  requireAuth,
  checkPermission("inventory", "stock_report", "show"),
  inventoryController.getStockReport
);

router.get(
  "/stock-report/excel",
  requireAuth,
  checkPermission("inventory", "stock_report", "download"),
  inventoryController.downloadStockReportExcel
);

router.get(
  "/stock-report/pdf",
  requireAuth,
  checkPermission("inventory", "stock_report", "download"),
  inventoryController.downloadStockReportPdf
);

module.exports = router;

