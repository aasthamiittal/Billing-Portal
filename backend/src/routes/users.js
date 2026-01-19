const express = require("express");
const { requireAuth } = require("../middlewares/auth");
const { checkPermission } = require("../middlewares/permissions");
const validate = require("../middlewares/validate");
const { createUserSchema } = require("../validators/userValidators");
const userController = require("../controllers/userController");

const router = express.Router();

router.get(
  "/",
  requireAuth,
  checkPermission("users", "users", "read_only"),
  userController.listUsers
);
router.post(
  "/",
  requireAuth,
  checkPermission("users", "users", "read_write"),
  validate(createUserSchema),
  userController.createUser
);
router.get(
  "/:id",
  requireAuth,
  checkPermission("users", "users", "read_only"),
  userController.getUser
);
router.put(
  "/:id",
  requireAuth,
  checkPermission("users", "users", "read_write"),
  userController.updateUser
);
router.delete(
  "/:id",
  requireAuth,
  checkPermission("users", "users", "read_write"),
  userController.deleteUser
);

module.exports = router;
