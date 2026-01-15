const express = require("express");
const { requireAuth } = require("../middlewares/auth");
const { requirePermission } = require("../middlewares/permissions");
const PERMISSIONS = require("../utils/permissions");
const validate = require("../middlewares/validate");
const { createStoreSchema } = require("../validators/storeValidators");
const storeController = require("../controllers/storeController");

const router = express.Router();

router.get(
  "/",
  requireAuth,
  requirePermission(PERMISSIONS.STORES_READ),
  storeController.listStores
);
router.post(
  "/",
  requireAuth,
  requirePermission(PERMISSIONS.STORES_CREATE),
  validate(createStoreSchema),
  storeController.createStore
);

module.exports = router;
