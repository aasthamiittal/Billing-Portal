const express = require("express");
const { requireAuth } = require("../middlewares/auth");
const { checkPermission } = require("../middlewares/permissions");
const validate = require("../middlewares/validate");
const { createRoleSchema, updateRoleSchema } = require("../validators/roleValidators");
const roleController = require("../controllers/roleController");

const router = express.Router();

router.get(
  "/",
  requireAuth,
  checkPermission("users", "role", "read_only"),
  roleController.listRoles
);
router.post(
  "/",
  requireAuth,
  checkPermission("users", "role", "read_write"),
  validate(createRoleSchema),
  roleController.createRole
);
router.get(
  "/:id",
  requireAuth,
  checkPermission("users", "role", "read_only"),
  roleController.getRole
);
router.put(
  "/:id",
  requireAuth,
  checkPermission("users", "role", "read_write"),
  validate(updateRoleSchema),
  roleController.updateRole
);
router.delete(
  "/:id",
  requireAuth,
  checkPermission("users", "role", "read_write"),
  roleController.deleteRole
);

module.exports = router;
