// Static permission schema for the simplified RBAC model.
// This replaces the old PermissionDefinition collection.
//
// Levels: show | read_only | download | read_write

const schema = {
  // Optional: friendly labels for UI (don’t affect stored data keys)
  moduleLabels: {
    store_management: "Store Management",
    items: "Items",
    inventory: "Inventory",
    users: "Users Access",
    reports: "Reports",
  },
  modules: {
    store_management: [
      { action: "store_list", label: "Store List", levels: ["show", "read_only", "read_write"], defaultLevel: "read_only" },
      { action: "add_store", label: "Add Store", levels: ["show", "read_only", "read_write"], defaultLevel: "read_write" },
      { action: "edit_store", label: "Edit Store", levels: ["show", "read_only", "read_write"], defaultLevel: "read_write" },
      { action: "delete_store", label: "Delete Store", levels: ["show", "read_only", "read_write"], defaultLevel: "read_write" },
      { action: "add_child_store", label: "Create Child Store", levels: ["show", "read_only", "read_write"], defaultLevel: "read_write" },
      { action: "store_config", label: "Store Configuration", levels: ["show", "read_only", "read_write"], defaultLevel: "read_write" },
      { action: "tax_info", label: "Taxes", levels: ["show", "read_only", "read_write"], defaultLevel: "read_write" },
      { action: "discount", label: "Discounts", levels: ["show", "read_only", "read_write"], defaultLevel: "read_write" },
      { action: "order_type", label: "Order Types", levels: ["show", "read_only", "read_write"], defaultLevel: "read_write" },
      { action: "payment_type", label: "Payment Types", levels: ["show", "read_only", "read_write"], defaultLevel: "read_write" },
      { action: "quick_bill", label: "Quick Bill / New Invoice", levels: ["show", "read_only", "read_write"], defaultLevel: "read_write" },
      { action: "save_draft", label: "Save Draft Invoice", levels: ["show", "read_only", "read_write"], defaultLevel: "read_write" },
      { action: "invoice_list", label: "Invoice List", levels: ["show", "read_only", "read_write"], defaultLevel: "read_only" },
      // Download is a separate privilege. Keep it "view/download" style in the UI.
      { action: "invoice_download", label: "Invoice Download", levels: ["show", "download"], defaultLevel: "download" },
      { action: "payments", label: "Payments", levels: ["show", "read_only", "read_write"], defaultLevel: "read_write" },
    ],
    items: [
      { action: "item_master", label: "Items", levels: ["show", "read_only", "read_write"], defaultLevel: "read_only" },
      { action: "categories", label: "Categories", levels: ["show", "read_only", "read_write"], defaultLevel: "read_only" },
    ],
    inventory: [
      { action: "suppliers", label: "Suppliers", levels: ["show", "read_only", "read_write"], defaultLevel: "read_only" },
      { action: "buyers", label: "Buyers", levels: ["show", "read_only", "read_write"], defaultLevel: "read_only" },
      { action: "stock_purchase", label: "Stock Purchase", levels: ["show", "read_only", "read_write"], defaultLevel: "read_only" },
      { action: "stock_sold", label: "Stock Sold", levels: ["show", "read_only"], defaultLevel: "read_only" },
      { action: "wastage", label: "Wastage", levels: ["show", "read_only", "read_write"], defaultLevel: "read_only" },
      { action: "stock_report", label: "Stock Report", levels: ["show", "download"], defaultLevel: "download" },
      // Legacy / optional:
      { action: "skus", label: "SKUs (Legacy)", levels: ["show", "read_only", "read_write"], defaultLevel: "show" },
    ],
    users: [
      { action: "users", label: "Employees", levels: ["show", "read_only", "read_write"], defaultLevel: "read_only" },
      { action: "role", label: "Roles", levels: ["show", "read_only", "read_write"], defaultLevel: "read_only" },
    ],
    reports: [
      { action: "sales_report", label: "Sales Report", levels: ["show", "download"], defaultLevel: "download" },
      { action: "tax_report", label: "Tax Report", levels: ["show", "download"], defaultLevel: "download" },
      { action: "invoice_report", label: "Invoice Report", levels: ["show", "download"], defaultLevel: "download" },
    ],
  },
};

schema.definitions = Object.entries(schema.modules).flatMap(([moduleKey, defs]) =>
  (defs || []).map((d) => ({ module: moduleKey, ...d }))
);

module.exports = schema;

