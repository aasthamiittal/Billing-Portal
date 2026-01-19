const express = require("express");
const { requireAuth } = require("../middlewares/auth");
const { checkPermission } = require("../middlewares/permissions");
const validate = require("../middlewares/validate");
const { createInvoiceSchema } = require("../validators/invoiceValidators");
const invoiceController = require("../controllers/invoiceController");

const router = express.Router();

router.get(
  "/",
  requireAuth,
  checkPermission("store_management", "invoice_list", "read_only"),
  invoiceController.listInvoices
);
router.post(
  "/draft",
  requireAuth,
  checkPermission("store_management", "save_draft", "read_write"),
  validate(createInvoiceSchema),
  invoiceController.createInvoiceDraftHandler
);
router.post(
  "/",
  requireAuth,
  checkPermission("store_management", "quick_bill", "read_write"),
  validate(createInvoiceSchema),
  invoiceController.createInvoiceHandler
);
router.get(
  "/:id/pdf",
  requireAuth,
  checkPermission("store_management", "invoice_download", "download"),
  invoiceController.downloadInvoicePdf
);
router.get(
  "/:id/excel",
  requireAuth,
  checkPermission("store_management", "invoice_download", "download"),
  invoiceController.downloadInvoiceExcel
);

module.exports = router;
