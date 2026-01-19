// Frontend permission-key map (mirrors backend/src/config/permissionKeys.js).
// Keep keys consistent across backend + frontend.

export const PERMISSION_KEYS = {
  store_list: { category: "store_management", action: "store_list", level: "read_only" },
  store_create: { category: "store_management", action: "add_store", level: "read_write" },
  store_edit: { category: "store_management", action: "edit_store", level: "read_write" },
  store_delete: { category: "store_management", action: "delete_store", level: "read_write" },
  store_list_and_update: {
    allOf: [
      { category: "store_management", action: "store_list", level: "read_only" },
      { category: "store_management", action: "edit_store", level: "read_write" },
    ],
  },

  quick_bill: { category: "store_management", action: "quick_bill", level: "read_write" },
  invoice_list: { category: "store_management", action: "invoice_list", level: "read_only" },
  invoice_download: { category: "store_management", action: "invoice_download", level: "download" },
  invoice_save_draft: { category: "store_management", action: "save_draft", level: "read_write" },

  items_read: { category: "items", action: "item_master", level: "read_only" },
  items_write: { category: "items", action: "item_master", level: "read_write" },
  categories_read: { category: "items", action: "categories", level: "read_only" },
  categories_write: { category: "items", action: "categories", level: "read_write" },

  skus_read: { category: "inventory", action: "skus", level: "read_only" },
  skus_write: { category: "inventory", action: "skus", level: "read_write" },

  suppliers_read: { category: "inventory", action: "suppliers", level: "read_only" },
  suppliers_write: { category: "inventory", action: "suppliers", level: "read_write" },
  buyers_read: { category: "inventory", action: "buyers", level: "read_only" },
  buyers_write: { category: "inventory", action: "buyers", level: "read_write" },
  stock_purchase_read: { category: "inventory", action: "stock_purchase", level: "read_only" },
  stock_purchase_write: { category: "inventory", action: "stock_purchase", level: "read_write" },
  stock_sold_read: { category: "inventory", action: "stock_sold", level: "read_only" },
  wastage_read: { category: "inventory", action: "wastage", level: "read_only" },
  wastage_write: { category: "inventory", action: "wastage", level: "read_write" },
  stock_report_download: { category: "inventory", action: "stock_report", level: "download" },

  employees_read: { category: "users", action: "users", level: "read_only" },
  employees_write: { category: "users", action: "users", level: "read_write" },
  roles_read: { category: "users", action: "role", level: "read_only" },
  roles_write: { category: "users", action: "role", level: "read_write" },

  reports_sales_download: { category: "reports", action: "sales_report", level: "download" },
  reports_tax_download: { category: "reports", action: "tax_report", level: "download" },
  reports_invoice_download: { category: "reports", action: "invoice_report", level: "download" },
};

