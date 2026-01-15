const express = require("express");
const { requireAuth } = require("../middlewares/auth");
const { requirePermission } = require("../middlewares/permissions");
const PERMISSIONS = require("../utils/permissions");
const validate = require("../middlewares/validate");
const { createItemSchema } = require("../validators/itemValidators");
const itemController = require("../controllers/itemController");

const router = express.Router();

router.get(
  "/",
  requireAuth,
  requirePermission(PERMISSIONS.ITEMS_READ),
  itemController.listItems
);
router.post(
  "/",
  requireAuth,
  requirePermission(PERMISSIONS.ITEMS_CREATE),
  validate(createItemSchema),
  itemController.createItem
);

module.exports = router;
