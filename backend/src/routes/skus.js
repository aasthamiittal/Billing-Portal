const express = require("express");
const { requireAuth } = require("../middlewares/auth");
const { requirePermission } = require("../middlewares/permissions");
const PERMISSIONS = require("../utils/permissions");
const validate = require("../middlewares/validate");
const { createSkuSchema } = require("../validators/skuValidators");
const skuController = require("../controllers/skuController");

const router = express.Router();

router.get(
  "/",
  requireAuth,
  requirePermission(PERMISSIONS.SKUS_READ),
  skuController.listSkus
);
router.post(
  "/",
  requireAuth,
  requirePermission(PERMISSIONS.SKUS_CREATE),
  validate(createSkuSchema),
  skuController.createSku
);

module.exports = router;
