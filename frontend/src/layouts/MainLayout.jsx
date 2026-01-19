import { useState } from "react";
import { Box, Toolbar } from "@mui/material";
import Topbar from "../components/Topbar";
import Sidebar from "../components/Sidebar";

const MainLayout = ({ children }) => {
  const [mobileOpen, setMobileOpen] = useState(false);
  const drawerWidth = 240;

  return (
    <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default" }}>
      <Topbar onMenuClick={() => setMobileOpen(true)} />
      <Sidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <Box
        component="main"
        sx={{
          flex: 1,
          p: { xs: 2, md: 3 },
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
        }}
      >
        <Toolbar />
        {children}
      </Box>
    </Box>
  );
};

export default MainLayout;
