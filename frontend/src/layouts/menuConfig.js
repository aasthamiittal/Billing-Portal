import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import StorefrontOutlinedIcon from "@mui/icons-material/StorefrontOutlined";
import Inventory2OutlinedIcon from "@mui/icons-material/Inventory2Outlined";
import InventoryOutlinedIcon from "@mui/icons-material/InventoryOutlined";
import ReceiptLongOutlinedIcon from "@mui/icons-material/ReceiptLongOutlined";
import PaymentsOutlinedIcon from "@mui/icons-material/PaymentsOutlined";
import PeopleAltOutlinedIcon from "@mui/icons-material/PeopleAltOutlined";
import AdminPanelSettingsOutlinedIcon from "@mui/icons-material/AdminPanelSettingsOutlined";
import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";
import AccountCircleOutlinedIcon from "@mui/icons-material/AccountCircleOutlined";
import SettingsOutlinedIcon from "@mui/icons-material/SettingsOutlined";

// Hierarchical sidebar configuration:
// - Keep existing routes where they exist (e.g., /stores, /items, /invoices, /reports, /roles, /employees)
// - Add placeholder paths for upcoming modules; they can be wired later without changing menu rendering logic.
export const menuConfig = [
  {
    label: "Dashboard",
    icon: DashboardOutlinedIcon,
    path: "/",
  },
  {
    label: "Billing",
    icon: ReceiptLongOutlinedIcon,
    children: [
      {
        label: "Quick Bill / New Invoice",
        path: "/billing/quick",
        permissionKey: "quick_bill",
      },
      { label: "Invoices", path: "/invoices", permissionKey: "invoice_list" },
      // { label: "Payments", path: "/payments", permission: { category: "store_management", action: "payments", level: "read_only" }, optional: true },
    ],
  },
  {
    label: "Items",
    icon: Inventory2OutlinedIcon,
    children: [
      { label: "Items", path: "/items", permissionKey: "items_read" },
      { label: "Categories", path: "/items/categories", permissionKey: "categories_read" },
    ],
  },
  {
    label: "Inventory",
    icon: InventoryOutlinedIcon,
    children: [
      { label: "Suppliers", path: "/inventory/suppliers", permissionKey: "suppliers_read" },
      { label: "Buyers", path: "/inventory/buyers", permissionKey: "buyers_read" },
      { label: "Stock Purchase", path: "/inventory/purchases", permissionKey: "stock_purchase_read" },
      { label: "Stock Sold", path: "/inventory/sold", permissionKey: "stock_sold_read" },
      { label: "Wastage", path: "/inventory/wastage", permissionKey: "wastage_read" },
      { label: "Stock Report", path: "/inventory/stock-report", permissionKey: "stock_report_download" },
    ],
  },
  {
    label: "Store Panel",
    icon: StorefrontOutlinedIcon,
    children: [
      {
        label: "Store Information",
        path: "/stores",
        permissionKey: "store_list",
      },
      // { label: "Store Configuration", path: "/store/configuration", permission: { category: "store_management", action: "store_config", level: "read_only" } },
      { label: "Taxes", path: "/store/taxes", permission: { category: "store_management", action: "tax_info", level: "read_only" } },
      { label: "Discounts", path: "/store/discounts", permission: { category: "store_management", action: "discount", level: "read_only" } },
      { label: "Order Types", path: "/store/order-types", permission: { category: "store_management", action: "order_type", level: "read_only" } },
      { label: "Payment Types", path: "/store/payment-types", permission: { category: "store_management", action: "payment_type", level: "read_only" } },
    ],
  },
  {
    label: "Administration",
    icon: AdminPanelSettingsOutlinedIcon,
    children: [
      {
        label: "Employees",
        path: "/employees",
        permissionKey: "employees_read",
      },
      {
        label: "Roles",
        path: "/roles",
        permissionKey: "roles_read",
      },
    ],
  },
  {
    label: "Reports",
    icon: AssessmentOutlinedIcon,
    children: [
      { label: "Sales Reports", path: "/reports/sales", permissionKey: "reports_sales_download" },
      { label: "Tax Reports", path: "/reports/tax", permissionKey: "reports_tax_download" },
      { label: "Invoice Reports", path: "/reports/invoices", permissionKey: "reports_invoice_download" },
    ],
  },
  {
    label: "Account",
    icon: PeopleAltOutlinedIcon,
    children: [
      { label: "Profile", path: "/account/profile", icon: AccountCircleOutlinedIcon },
      { label: "Settings", path: "/account/settings", icon: SettingsOutlinedIcon },
      // { label: "Dashboard (Legacy)", path: "/" },
      // { label: "Items (Legacy)", path: "/items" },
    ],
  },
];

