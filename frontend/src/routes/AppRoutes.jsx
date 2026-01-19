import { Routes, Route, Navigate } from "react-router-dom";
import MainLayout from "../layouts/MainLayout";
import Dashboard from "../pages/Dashboard";
import Invoices from "../pages/Invoices";
import Items from "../pages/Items";
import Reports from "../pages/Reports";
import SalesReports from "../pages/reports/SalesReports";
import TaxReports from "../pages/reports/TaxReports";
import InvoiceReports from "../pages/reports/InvoiceReports";
import Login from "../pages/Login";
import NotFound from "../pages/NotFound";
import Stores from "../pages/Stores";
import Employees from "../pages/Employees";
import AdminEmployeeRoleList from "../pages/AdminEmployeeRoleList";
import AdminAddRole from "../pages/AdminAddRole";
import QuickBilling from "../pages/QuickBilling";
import Categories from "../pages/Categories";
import Suppliers from "../pages/inventory/Suppliers";
import Buyers from "../pages/inventory/Buyers";
import StockPurchases from "../pages/inventory/StockPurchases";
import StockSold from "../pages/inventory/StockSold";
import Wastage from "../pages/inventory/Wastage";
import StockReport from "../pages/inventory/StockReport";
import StoreConfiguration from "../pages/StoreConfiguration";
import Taxes from "../pages/Taxes";
import Discounts from "../pages/Discounts";
import OrderTypes from "../pages/OrderTypes";
import PaymentTypes from "../pages/PaymentTypes";
import Profile from "../pages/Profile";
import Settings from "../pages/Settings";
import ProtectedRoute from "./ProtectedRoute";

const AppRoutes = () => (
  <Routes>
    <Route path="/login" element={<Login />} />
    <Route
      path="/"
      element={
        <ProtectedRoute>
          <MainLayout>
            <Dashboard />
          </MainLayout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/invoices"
      element={
        <ProtectedRoute>
          <MainLayout>
            <Invoices />
          </MainLayout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/billing/quick"
      element={
        <ProtectedRoute permissionKey="quick_bill">
          <MainLayout>
            <QuickBilling />
          </MainLayout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/items"
      element={
        <ProtectedRoute>
          <MainLayout>
            <Items />
          </MainLayout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/reports"
      element={
        <ProtectedRoute>
          <MainLayout>
            <Reports />
          </MainLayout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/reports/sales"
      element={
        <ProtectedRoute permissionKey="reports_sales_download">
          <MainLayout>
            <SalesReports />
          </MainLayout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/reports/tax"
      element={
        <ProtectedRoute permissionKey="reports_tax_download">
          <MainLayout>
            <TaxReports />
          </MainLayout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/reports/invoices"
      element={
        <ProtectedRoute permissionKey="reports_invoice_download">
          <MainLayout>
            <InvoiceReports />
          </MainLayout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/items/categories"
      element={
        <ProtectedRoute permissionKey="categories_read">
          <MainLayout>
            <Categories />
          </MainLayout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/inventory/suppliers"
      element={
        <ProtectedRoute permissionKey="suppliers_read">
          <MainLayout>
            <Suppliers />
          </MainLayout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/inventory/buyers"
      element={
        <ProtectedRoute permissionKey="buyers_read">
          <MainLayout>
            <Buyers />
          </MainLayout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/inventory/purchases"
      element={
        <ProtectedRoute permissionKey="stock_purchase_read">
          <MainLayout>
            <StockPurchases />
          </MainLayout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/inventory/sold"
      element={
        <ProtectedRoute permissionKey="stock_sold_read">
          <MainLayout>
            <StockSold />
          </MainLayout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/inventory/wastage"
      element={
        <ProtectedRoute permissionKey="wastage_read">
          <MainLayout>
            <Wastage />
          </MainLayout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/inventory/stock-report"
      element={
        <ProtectedRoute permissionKey="stock_report_download">
          <MainLayout>
            <StockReport />
          </MainLayout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/store/configuration"
      element={
        <ProtectedRoute permission={{ category: "store_management", action: "store_config", level: "read_only" }}>
          <MainLayout>
            <StoreConfiguration />
          </MainLayout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/store/taxes"
      element={
        <ProtectedRoute permission={{ category: "store_management", action: "tax_info", level: "read_only" }}>
          <MainLayout>
            <Taxes />
          </MainLayout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/store/discounts"
      element={
        <ProtectedRoute permission={{ category: "store_management", action: "discount", level: "read_only" }}>
          <MainLayout>
            <Discounts />
          </MainLayout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/store/order-types"
      element={
        <ProtectedRoute permission={{ category: "store_management", action: "order_type", level: "read_only" }}>
          <MainLayout>
            <OrderTypes />
          </MainLayout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/store/payment-types"
      element={
        <ProtectedRoute permission={{ category: "store_management", action: "payment_type", level: "read_only" }}>
          <MainLayout>
            <PaymentTypes />
          </MainLayout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/account/profile"
      element={
        <ProtectedRoute>
          <MainLayout>
            <Profile />
          </MainLayout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/account/settings"
      element={
        <ProtectedRoute>
          <MainLayout>
            <Settings />
          </MainLayout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/stores"
      element={
        <ProtectedRoute permissionKey="store_list">
          <MainLayout>
            <Stores />
          </MainLayout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/employees"
      element={
        <ProtectedRoute permissionKey="employees_read">
          <MainLayout>
            <Employees />
          </MainLayout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/roles"
      element={
        <ProtectedRoute permissionKey="roles_read">
          <MainLayout>
            <AdminEmployeeRoleList />
          </MainLayout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/roles/new"
      element={
        <ProtectedRoute permissionKey="roles_write">
          <MainLayout>
            <AdminAddRole />
          </MainLayout>
        </ProtectedRoute>
      }
    />
    <Route
      path="/roles/:id"
      element={
        <ProtectedRoute permissionKey="roles_write">
          <MainLayout>
            <AdminAddRole />
          </MainLayout>
        </ProtectedRoute>
      }
    />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

export default AppRoutes;
