const Store = require("../models/Store");
const Industry = require("../models/Industry");
const asyncHandler = require("../utils/asyncHandler");

const listStores = asyncHandler(async (req, res) => {
  const filter = {};
  if (!req.user.isMasterAdmin) {
    filter._id = req.user.store;
  }
  const stores = await Store.find(filter).populate("industry").exec();
  res.json(stores);
});

const createStore = asyncHandler(async (req, res) => {
  const { industryId, parentStoreId, ...rest } = req.body;
  const industry = await Industry.findById(industryId).exec();

  const store = await Store.create({
    ...rest,
    industry: industry._id,
    parentStore: parentStoreId || undefined,
  });

  res.status(201).json(store);
});

module.exports = { listStores, createStore };
