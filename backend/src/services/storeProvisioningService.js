const Role = require("../models/Role");
const User = require("../models/User");

const LEVELS = { show: 1, read_only: 2, download: 2, read_write: 3 };

// Default permissions for a Store Admin: full access for store operations,
// while keeping master-only/global controls excluded.
const defaultStorePermissionMatrix = () => ({
  store_management: {
    store_list: "read_write",
    add_store: "read_write",
    edit_store: "read_write",
    delete_store: "read_write",
    add_child_store: "read_write",
    store_config: "read_write",
    tax_info: "read_write",
    discount: "read_write",
    order_type: "read_write",
    payment_type: "read_write",
    quick_bill: "read_write",
    save_draft: "read_write",
    invoice_list: "read_write",
    invoice_download: "download",
    payments: "read_write",
  },
  items: {
    item_master: "read_write",
    categories: "read_write",
  },
  inventory: {
    suppliers: "read_write",
    buyers: "read_write",
    stock_purchase: "read_write",
    stock_sold: "read_only",
    wastage: "read_write",
    stock_report: "download",
    skus: "show",
  },
  users: {
    users: "read_write",
    role: "read_write",
  },
  reports: {
    sales_report: "download",
    tax_report: "download",
    invoice_report: "download",
  },
});

const mergeMaxMatrix = (base = {}, upgrade = {}) => {
  const out = { ...(base || {}) };
  Object.entries(upgrade || {}).forEach(([cat, actions]) => {
    out[cat] = { ...(out[cat] || {}) };
    Object.entries(actions || {}).forEach(([action, level]) => {
      const cur = out[cat][action];
      const next = (LEVELS[cur] || 0) >= (LEVELS[level] || 0) ? cur : level;
      out[cat][action] = next;
    });
  });
  return out;
};

const buildDefaultUsers = (store, defaultPassword) => {
  const password = defaultPassword || "ChangeMe@123";
  const code = (store.code || "store").toLowerCase().replace(/[^a-z0-9]+/g, "");
  return [
    {
      name: "Store Admin",
      email: `storeadmin${code}@gmail.com`,
      password,
    },
    {
      name: "Cashier",
      email: `cashier${code}@gmail.com`,
      password,
    },
  ];
};

async function ensureStoreAdminRole(storeId) {
  let role = await Role.findOne({ name: "Store Admin", scope: "STORE", store: storeId }).exec();
  if (role) {
    // Upgrade-in-place without clobbering existing customizations:
    // Store Admin defaults should be "max" for store operations.
    role.permissions = mergeMaxMatrix(role.permissions || {}, defaultStorePermissionMatrix());
    await role.save();
    return role;
  }

  // Inheritance: if this store has a parent store and that parent has a Store Admin role,
  // clone its permissions for the child store.
  const Store = require("../models/Store");
  const storeDoc = await Store.findById(storeId).select("parentStore").lean().exec();
  if (storeDoc?.parentStore) {
    const parentRole = await Role.findOne({
      name: "Store Admin",
      scope: "STORE",
      store: storeDoc.parentStore,
    }).exec();

    if (parentRole) {
      role = await Role.create({
        name: "Store Admin",
        scope: "STORE",
        store: storeId,
        permissions: mergeMaxMatrix(parentRole.permissions || {}, defaultStorePermissionMatrix()),
      });
      return role;
    }
  }

  role = await Role.create({
    name: "Store Admin",
    scope: "STORE",
    store: storeId,
    permissions: defaultStorePermissionMatrix(),
  });
  return role;
}

async function createDefaultUsersForStore(store, { createdByUserId, defaultPassword } = {}) {
  const role = await ensureStoreAdminRole(store._id);
  const defaults = buildDefaultUsers(store, defaultPassword);

  const created = [];
  for (const u of defaults) {
    const existing = await User.findOne({ email: u.email }).exec();
    if (existing) continue;
    const passwordHash = await User.hashPassword(u.password);
    const user = await User.create({
      name: u.name,
      email: u.email,
      passwordHash,
      role: role._id,
      store: store._id,
      isMasterAdmin: false,
      status: "ACTIVE",
    });
    created.push({ id: user._id, name: u.name, email: u.email, tempPassword: u.password });
  }

  // Optionally: could audit with createdByUserId (AuditLog model exists) later.
  return created;
}

module.exports = { createDefaultUsersForStore, defaultStorePermissionMatrix };

