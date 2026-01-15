import { useSelector } from "react-redux";

const PermissionWrapper = ({ permission, children, fallback = null }) => {
  const user = useSelector((state) => state.auth.user);
  if (!user) return fallback;
  if (user.isMasterAdmin) return children;
  const permissions = user.permissions || [];
  return permissions.includes(permission) ? children : fallback;
};

export default PermissionWrapper;
