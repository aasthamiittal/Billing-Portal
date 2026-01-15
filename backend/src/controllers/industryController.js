const Industry = require("../models/Industry");
const asyncHandler = require("../utils/asyncHandler");

const listIndustries = asyncHandler(async (req, res) => {
  const industries = await Industry.find({ isActive: true }).exec();
  res.json(industries);
});

const createIndustry = asyncHandler(async (req, res) => {
  const industry = await Industry.create(req.body);
  res.status(201).json(industry);
});

module.exports = { listIndustries, createIndustry };
