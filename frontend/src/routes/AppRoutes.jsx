import { Routes, Route, Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import MainLayout from "../layouts/MainLayout";
import Dashboard from "../pages/Dashboard";
import Invoices from "../pages/Invoices";
import Items from "../pages/Items";
import Reports from "../pages/Reports";
import Login from "../pages/Login";
import NotFound from "../pages/NotFound";

const PrivateRoute = ({ children }) => {
  const token = useSelector((state) => state.auth.accessToken);
  return token ? children : <Navigate to="/login" replace />;
};

const AppRoutes = () => (
  <Routes>
    <Route path="/login" element={<Login />} />
    <Route
      path="/"
      element={
        <PrivateRoute>
          <MainLayout>
            <Dashboard />
          </MainLayout>
        </PrivateRoute>
      }
    />
    <Route
      path="/invoices"
      element={
        <PrivateRoute>
          <MainLayout>
            <Invoices />
          </MainLayout>
        </PrivateRoute>
      }
    />
    <Route
      path="/items"
      element={
        <PrivateRoute>
          <MainLayout>
            <Items />
          </MainLayout>
        </PrivateRoute>
      }
    />
    <Route
      path="/reports"
      element={
        <PrivateRoute>
          <MainLayout>
            <Reports />
          </MainLayout>
        </PrivateRoute>
      }
    />
    <Route path="*" element={<NotFound />} />
  </Routes>
);

export default AppRoutes;
