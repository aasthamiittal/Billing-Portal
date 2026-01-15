const express = require("express");
const { requireAuth } = require("../middlewares/auth");
const { requirePermission } = require("../middlewares/permissions");
const PERMISSIONS = require("../utils/permissions");
const validate = require("../middlewares/validate");
const { createIndustrySchema } = require("../validators/industryValidators");
const industryController = require("../controllers/industryController");

const router = express.Router();

router.get(
  "/",
  requireAuth,
  requirePermission(PERMISSIONS.INDUSTRIES_READ),
  industryController.listIndustries
);
router.post(
  "/",
  requireAuth,
  requirePermission(PERMISSIONS.INDUSTRIES_CREATE),
  validate(createIndustrySchema),
  industryController.createIndustry
);

module.exports = router;
