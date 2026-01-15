import { Box } from "@mui/material";
import Topbar from "../components/Topbar";
import Sidebar from "../components/Sidebar";

const MainLayout = ({ children }) => (
  <Box sx={{ display: "flex", minHeight: "100vh", bgcolor: "background.default" }}>
    <Sidebar />
    <Box sx={{ flex: 1 }}>
      <Topbar />
      <Box sx={{ p: 3 }}>{children}</Box>
    </Box>
  </Box>
);

export default MainLayout;
