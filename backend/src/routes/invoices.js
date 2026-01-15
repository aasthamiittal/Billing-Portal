const express = require("express");
const { requireAuth } = require("../middlewares/auth");
const { requirePermission } = require("../middlewares/permissions");
const PERMISSIONS = require("../utils/permissions");
const validate = require("../middlewares/validate");
const { createInvoiceSchema } = require("../validators/invoiceValidators");
const invoiceController = require("../controllers/invoiceController");

const router = express.Router();

router.get(
  "/",
  requireAuth,
  requirePermission(PERMISSIONS.INVOICES_READ),
  invoiceController.listInvoices
);
router.post(
  "/",
  requireAuth,
  requirePermission(PERMISSIONS.INVOICES_CREATE),
  validate(createInvoiceSchema),
  invoiceController.createInvoiceHandler
);
router.get(
  "/:id/pdf",
  requireAuth,
  requirePermission(PERMISSIONS.INVOICES_READ),
  invoiceController.downloadInvoicePdf
);
router.get(
  "/:id/excel",
  requireAuth,
  requirePermission(PERMISSIONS.INVOICES_READ),
  invoiceController.downloadInvoiceExcel
);

module.exports = router;
