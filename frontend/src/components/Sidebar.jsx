import { Drawer, List, ListItemButton, ListItemText } from "@mui/material";
import { NavLink } from "react-router-dom";

const items = [
  { label: "Dashboard", path: "/" },
  { label: "Invoices", path: "/invoices" },
  { label: "Items", path: "/items" },
  { label: "Reports", path: "/reports" },
];

const Sidebar = () => (
  <Drawer variant="permanent" PaperProps={{ sx: { width: 220 } }}>
    <List sx={{ mt: 2 }}>
      {items.map((item) => (
        <ListItemButton
          key={item.path}
          component={NavLink}
          to={item.path}
        >
          <ListItemText primary={item.label} />
        </ListItemButton>
      ))}
    </List>
  </Drawer>
);

export default Sidebar;
