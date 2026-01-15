const express = require("express");
const { requireAuth } = require("../middlewares/auth");
const { requirePermission } = require("../middlewares/permissions");
const PERMISSIONS = require("../utils/permissions");
const validate = require("../middlewares/validate");
const { createUserSchema } = require("../validators/userValidators");
const userController = require("../controllers/userController");

const router = express.Router();

router.get(
  "/",
  requireAuth,
  requirePermission(PERMISSIONS.USERS_READ),
  userController.listUsers
);
router.post(
  "/",
  requireAuth,
  requirePermission(PERMISSIONS.USERS_CREATE),
  validate(createUserSchema),
  userController.createUser
);

module.exports = router;
