const express = require("express");
const { requireAuth } = require("../middlewares/auth");
const { checkPermission } = require("../middlewares/permissions");
const reportController = require("../controllers/reportController");

const router = express.Router();

router.get(
  "/sales",
  requireAuth,
  checkPermission("reports", "sales_report", "show"),
  reportController.listSalesReport
);
router.get(
  "/sales/excel",
  requireAuth,
  checkPermission("reports", "sales_report", "download"),
  reportController.downloadSalesReportExcel
);
router.get(
  "/sales/pdf",
  requireAuth,
  checkPermission("reports", "sales_report", "download"),
  reportController.downloadSalesReportPdf
);
router.get(
  "/tax",
  requireAuth,
  checkPermission("reports", "tax_report", "show"),
  reportController.listTaxReport
);
router.get(
  "/tax/excel",
  requireAuth,
  checkPermission("reports", "tax_report", "download"),
  reportController.downloadTaxReportExcel
);
router.get(
  "/tax/pdf",
  requireAuth,
  checkPermission("reports", "tax_report", "download"),
  reportController.downloadTaxReportPdf
);
router.get(
  "/invoices",
  requireAuth,
  checkPermission("reports", "invoice_report", "show"),
  reportController.listInvoiceReport
);
router.get(
  "/invoices/excel",
  requireAuth,
  checkPermission("reports", "invoice_report", "download"),
  reportController.downloadInvoiceReportExcel
);
router.get(
  "/invoices/pdf",
  requireAuth,
  checkPermission("reports", "invoice_report", "download"),
  reportController.downloadInvoiceReportPdf
);

module.exports = router;
