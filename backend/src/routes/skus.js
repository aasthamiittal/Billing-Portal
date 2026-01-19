const express = require("express");
const { requireAuth } = require("../middlewares/auth");
const { checkPermission } = require("../middlewares/permissions");
const validate = require("../middlewares/validate");
const { createSkuSchema } = require("../validators/skuValidators");
const skuController = require("../controllers/skuController");

const router = express.Router();

router.get(
  "/",
  requireAuth,
  checkPermission("inventory", "skus", "read_only"),
  skuController.listSkus
);
router.post(
  "/",
  requireAuth,
  checkPermission("inventory", "skus", "read_write"),
  validate(createSkuSchema),
  skuController.createSku
);

module.exports = router;
