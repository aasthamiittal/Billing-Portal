import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { can, hasPermissionKey } from "../utils/permissions";

const ProtectedRoute = ({ children, permission, permissionKey, masterOnly = false }) => {
  const token = useSelector((state) => state.auth.accessToken);
  const user = useSelector((state) => state.auth.user);

  if (!token) return <Navigate to="/login" replace />;

  if (masterOnly) {
    if (!user?.isMasterAdmin) return <Navigate to="/" replace />;
  }

  if (permission) {
    const { category, action, level = "read_only" } = permission;
    const allowed = can(user, category, action, level);
    if (!allowed) return <Navigate to="/" replace />;
  }

  if (permissionKey) {
    const allowed = hasPermissionKey(user, permissionKey);
    if (!allowed) return <Navigate to="/" replace />;
  }

  return children;
};

export default ProtectedRoute;

