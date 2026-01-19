const express = require("express");
const { requireAuth } = require("../middlewares/auth");
const { checkPermission } = require("../middlewares/permissions");
const validate = require("../middlewares/validate");
const {
  createCategorySchema,
  updateCategorySchema,
} = require("../validators/categoryValidators");
const categoryController = require("../controllers/categoryController");

const router = express.Router();

router.get(
  "/",
  requireAuth,
  checkPermission("items", "categories", "read_only"),
  categoryController.listCategories
);

router.post(
  "/",
  requireAuth,
  checkPermission("items", "categories", "read_write"),
  validate(createCategorySchema),
  categoryController.createCategory
);

router.put(
  "/:id",
  requireAuth,
  checkPermission("items", "categories", "read_write"),
  validate(updateCategorySchema),
  categoryController.updateCategory
);

router.delete(
  "/:id",
  requireAuth,
  checkPermission("items", "categories", "read_write"),
  categoryController.deleteCategory
);

module.exports = router;

