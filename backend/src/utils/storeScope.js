const Store = require("../models/Store");

async function getDescendantStoreIds(rootStoreId) {
  if (!rootStoreId) return [];
  const visited = new Set([String(rootStoreId)]);
  let frontier = [rootStoreId];

  while (frontier.length) {
    const children = await Store.find({ parentStore: { $in: frontier } })
      .select("_id")
      .lean()
      .exec();
    const next = [];
    for (const c of children) {
      const id = String(c._id);
      if (!visited.has(id)) {
        visited.add(id);
        next.push(c._id);
      }
    }
    frontier = next;
  }

  return Array.from(visited);
}

async function getAccessibleStoreIds(user) {
  if (!user) return [];
  if (user.isMasterAdmin) return null; // null = unrestricted

  const ids = new Set();
  if (user.store) ids.add(String(user.store));
  (user.accessibleStores || []).forEach((s) => ids.add(String(s)));

  if (user.isParentAdmin && user.store) {
    const descendants = await getDescendantStoreIds(user.store);
    descendants.forEach((id) => ids.add(String(id)));
  }

  return Array.from(ids);
}

module.exports = { getAccessibleStoreIds, getDescendantStoreIds };

