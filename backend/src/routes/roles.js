const express = require("express");
const { requireAuth } = require("../middlewares/auth");
const { requirePermission } = require("../middlewares/permissions");
const PERMISSIONS = require("../utils/permissions");
const validate = require("../middlewares/validate");
const { createRoleSchema } = require("../validators/roleValidators");
const roleController = require("../controllers/roleController");

const router = express.Router();

router.get(
  "/",
  requireAuth,
  requirePermission(PERMISSIONS.ROLES_READ),
  roleController.listRoles
);
router.post(
  "/",
  requireAuth,
  requirePermission(PERMISSIONS.ROLES_CREATE),
  validate(createRoleSchema),
  roleController.createRole
);

module.exports = router;
