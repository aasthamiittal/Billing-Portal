const express = require("express");
const { requireAuth } = require("../middlewares/auth");
const { checkPermission } = require("../middlewares/permissions");
const validate = require("../middlewares/validate");
const catalogController = require("../controllers/catalogController");
const {
  createCatalogEntrySchema,
  updateCatalogEntrySchema,
} = require("../validators/catalogValidators");

const router = express.Router();

const permissionForKind = (kind, verb) => {
  // verb: "read" | "write"
  // We map catalog entries to role permission matrix actions.
  const map = {
    taxes: { category: "store_management", action: "tax_info" },
    discounts: { category: "store_management", action: "discount" },
    "order-types": { category: "store_management", action: "order_type" },
    "payment-types": { category: "store_management", action: "payment_type" },
    "store-configuration": { category: "store_management", action: "store_config" },
  };
  const base = map[kind];
  if (!base) return { category: "store_management", action: "store_config", level: "read_only" };
  return { ...base, level: verb === "write" ? "read_write" : "read_only" };
};

router.get(
  "/:kind",
  requireAuth,
  (req, res, next) => {
    const p = permissionForKind(req.params.kind, "read");
    return checkPermission(p.category, p.action, p.level)(req, res, next);
  },
  catalogController.listCatalog
);

router.post(
  "/:kind",
  requireAuth,
  (req, res, next) => {
    const p = permissionForKind(req.params.kind, "write");
    return checkPermission(p.category, p.action, p.level)(req, res, next);
  },
  validate(createCatalogEntrySchema),
  catalogController.createCatalog
);

router.put(
  "/:kind/:id",
  requireAuth,
  (req, res, next) => {
    const p = permissionForKind(req.params.kind, "write");
    return checkPermission(p.category, p.action, p.level)(req, res, next);
  },
  validate(updateCatalogEntrySchema),
  catalogController.updateCatalog
);

router.delete(
  "/:kind/:id",
  requireAuth,
  (req, res, next) => {
    const p = permissionForKind(req.params.kind, "write");
    return checkPermission(p.category, p.action, p.level)(req, res, next);
  },
  catalogController.deleteCatalog
);

module.exports = router;

