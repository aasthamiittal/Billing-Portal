const express = require("express");
const { requireAuth } = require("../middlewares/auth");
const { checkPermission } = require("../middlewares/permissions");
const validate = require("../middlewares/validate");
const { createItemSchema, updateItemSchema } = require("../validators/itemValidators");
const itemController = require("../controllers/itemController");

const router = express.Router();

router.get(
  "/search",
  requireAuth,
  checkPermission("items", "item_master", "read_only"),
  itemController.searchItems
);
router.get(
  "/",
  requireAuth,
  checkPermission("items", "item_master", "read_only"),
  itemController.listItems
);
router.post(
  "/",
  requireAuth,
  checkPermission("items", "item_master", "read_write"),
  validate(createItemSchema),
  itemController.createItem
);
router.put(
  "/:id",
  requireAuth,
  checkPermission("items", "item_master", "read_write"),
  validate(updateItemSchema),
  itemController.updateItem
);

module.exports = router;
