const Item = require("../models/Item");
const Industry = require("../models/Industry");
const asyncHandler = require("../utils/asyncHandler");

const listItems = asyncHandler(async (req, res) => {
  const filter = {};
  if (req.user?.store && !req.user.isMasterAdmin) {
    filter.store = req.user.store;
  }
  const items = await Item.find(filter).exec();
  res.json(items);
});

const createItem = asyncHandler(async (req, res) => {
  const { industryId, storeId, ...rest } = req.body;
  const industry = await Industry.findById(industryId).exec();
  const item = await Item.create({
    ...rest,
    industry: industry._id,
    store: storeId || req.user.store,
  });
  res.status(201).json(item);
});

module.exports = { listItems, createItem };
