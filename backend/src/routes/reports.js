const express = require("express");
const { requireAuth } = require("../middlewares/auth");
const { requirePermission } = require("../middlewares/permissions");
const PERMISSIONS = require("../utils/permissions");
const reportController = require("../controllers/reportController");

const router = express.Router();

router.get(
  "/sales/excel",
  requireAuth,
  requirePermission(PERMISSIONS.REPORTS_VIEW),
  reportController.downloadSalesReportExcel
);
router.get(
  "/sales/pdf",
  requireAuth,
  requirePermission(PERMISSIONS.REPORTS_VIEW),
  reportController.downloadSalesReportPdf
);

module.exports = router;
