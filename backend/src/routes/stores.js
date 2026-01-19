const express = require("express");
const { requireAuth } = require("../middlewares/auth");
const { checkPermission } = require("../middlewares/permissions");
const validate = require("../middlewares/validate");
const { createStoreSchema } = require("../validators/storeValidators");
const storeController = require("../controllers/storeController");

const router = express.Router();

router.get(
  "/",
  requireAuth,
  checkPermission("store_management", "store_list", "read_only"),
  storeController.listStores
);
router.post(
  "/",
  requireAuth,
  checkPermission("store_management", "add_store", "read_write"),
  validate(createStoreSchema),
  storeController.createStore
);
router.get(
  "/:id",
  requireAuth,
  checkPermission("store_management", "store_list", "read_only"),
  storeController.getStore
);
router.put(
  "/:id",
  requireAuth,
  checkPermission("store_management", "edit_store", "read_write"),
  storeController.updateStore
);
router.delete(
  "/:id",
  requireAuth,
  checkPermission("store_management", "delete_store", "read_write"),
  storeController.deleteStore
);

module.exports = router;
