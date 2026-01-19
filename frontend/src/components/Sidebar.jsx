import {
  Drawer,
  List,
  ListItemButton,
  ListItemText,
  Typography,
  Box,
  Collapse,
  ListItemIcon,
} from "@mui/material";
import React from "react";
import { NavLink } from "react-router-dom";
import { useSelector } from "react-redux";
import { useLocation } from "react-router-dom";
import ExpandLessIcon from "@mui/icons-material/ExpandLess";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import { can, hasPermissionKey } from "../utils/permissions";
import { menuConfig } from "../layouts/menuConfig";

const drawerWidth = 240;

const isAllowed = (user, item) => {
  if (item?.hidden) return false;
  if (item?.masterOnly) return !!user?.isMasterAdmin;
  if (item?.permissionKey) return hasPermissionKey(user, item.permissionKey);
  if (item?.permission) {
    return can(user, item.permission.category, item.permission.action, item.permission.level);
  }
  return true;
};

const hasAnyVisibleChild = (user, node) => {
  if (!node) return false;
  if (node.path && !node.children) return isAllowed(user, node);
  return (node.children || []).some((child) =>
    child.children ? hasAnyVisibleChild(user, child) : isAllowed(user, child)
  );
};

const isActivePath = (pathname, path) => (path === "/" ? pathname === "/" : pathname.startsWith(path));

const SidebarContent = () => {
  const user = useSelector((state) => state.auth.user);
  const location = useLocation();
  const [openGroups, setOpenGroups] = React.useState(() => {
    // Auto-open groups that match current path
    const initial = {};
    menuConfig.forEach((group) => {
      if (group.path && isActivePath(location.pathname, group.path)) {
        initial[group.label] = false;
      }
      const anyActive = (group.children || []).some((c) => c.path && isActivePath(location.pathname, c.path));
      if (anyActive) initial[group.label] = true;
    });
    return initial;
  });

  const toggleGroup = (label) => setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));

  return (
    <Box sx={{ px: 2, py: 3 }}>
      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 2 }}>
        MAIN MENU
      </Typography>

      <List sx={{ display: "flex", flexDirection: "column", gap: 0.5 }}>
        {menuConfig
          .filter((group) => hasAnyVisibleChild(user, group))
          .map((group) => {
            const GroupIcon = group.icon;
            const isOpen = !!openGroups[group.label];

            return (
              <Box key={group.label}>
                {group.path ? (
                  <ListItemButton
                    component={NavLink}
                    to={group.path}
                    sx={{
                      borderRadius: 1,
                      "&.active": {
                        bgcolor: "rgba(57, 161, 247, 0.12)",
                        color: "primary.main",
                        fontWeight: 600,
                      },
                    }}
                  >
                    {GroupIcon && (
                      <ListItemIcon sx={{ minWidth: 36, color: "text.secondary" }}>
                        <GroupIcon fontSize="small" />
                      </ListItemIcon>
                    )}
                    <ListItemText primary={group.label} />
                  </ListItemButton>
                ) : (
                  <ListItemButton
                    onClick={() => toggleGroup(group.label)}
                    sx={{
                      borderRadius: 1,
                      "&:hover": { bgcolor: "rgba(57, 161, 247, 0.08)" },
                    }}
                  >
                    {GroupIcon && (
                      <ListItemIcon sx={{ minWidth: 36, color: "text.secondary" }}>
                        <GroupIcon fontSize="small" />
                      </ListItemIcon>
                    )}
                    <ListItemText primary={group.label} />
                    {isOpen ? <ExpandLessIcon fontSize="small" /> : <ExpandMoreIcon fontSize="small" />}
                  </ListItemButton>
                )}

                <Collapse in={!group.path && isOpen} timeout="auto" unmountOnExit>
                  <List sx={{ pl: 1, pt: 0.5, display: "flex", flexDirection: "column", gap: 0.5 }}>
                    {(group.children || [])
                      .filter((item) => (item.children ? hasAnyVisibleChild(user, item) : isAllowed(user, item)))
                      .map((item) => (
                        <ListItemButton
                          key={item.path || item.label}
                          component={item.path ? NavLink : "button"}
                          to={item.path || undefined}
                          sx={{
                            borderRadius: 1,
                            pl: 2,
                            "&.active": {
                              bgcolor: "rgba(57, 161, 247, 0.12)",
                              color: "primary.main",
                              fontWeight: 600,
                            },
                          }}
                        >
                          <ListItemText primary={item.label} />
                        </ListItemButton>
                      ))}
                  </List>
                </Collapse>
              </Box>
            );
          })}
      </List>
    </Box>
  );
};

const Sidebar = ({ mobileOpen, onClose }) => (
  <>
    <Drawer
      variant="temporary"
      open={mobileOpen}
      onClose={onClose}
      ModalProps={{ keepMounted: true }}
      PaperProps={{ className: "sidebar", sx: { width: drawerWidth } }}
      sx={{ display: { xs: "block", md: "none" } }}
    >
      <SidebarContent />
    </Drawer>
    <Drawer
      variant="permanent"
      open
      PaperProps={{
        className: "sidebar",
        sx: {
          width: drawerWidth,
          borderRight: "1px solid #e5eef6",
        },
      }}
      sx={{ display: { xs: "none", md: "block" } }}
    >
      <SidebarContent />
    </Drawer>
  </>
);

export default Sidebar;
