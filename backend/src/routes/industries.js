const express = require("express");
const { requireAuth } = require("../middlewares/auth");
const { requireMasterAdmin } = require("../middlewares/requireMasterAdmin");
const validate = require("../middlewares/validate");
const { createIndustrySchema } = require("../validators/industryValidators");
const industryController = require("../controllers/industryController");

const router = express.Router();

router.get(
  "/",
  requireAuth,
  requireMasterAdmin,
  industryController.listIndustries
);
router.post(
  "/",
  requireAuth,
  requireMasterAdmin,
  validate(createIndustrySchema),
  industryController.createIndustry
);

module.exports = router;
