const Store = require("../models/Store");
const { ApiError } = require("./errors");
const { getAccessibleStoreIds } = require("./storeScope");

async function resolveStoreForRequest(req, storeId) {
  if (req.user?.isMasterAdmin) {
    if (!storeId) throw new ApiError(400, "storeId is required");
    const store = await Store.findById(storeId).exec();
    if (!store) throw new ApiError(400, "Invalid store");
    return store;
  }

  const ids = await getAccessibleStoreIds(req.user);
  const resolved = storeId || req.user.store;
  if (!resolved) throw new ApiError(403, "Access denied");
  if (!ids?.includes(String(resolved))) throw new ApiError(403, "Access denied");

  const store = await Store.findById(resolved).exec();
  if (!store) throw new ApiError(400, "Invalid store");
  return store;
}

module.exports = { resolveStoreForRequest };

