import {
  AppBar,
  Toolbar,
  Typography,
  Box,
  Button,
  IconButton,
  TextField,
  MenuItem,
  Avatar,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import { useDispatch, useSelector } from "react-redux";
import { clearAuth } from "../store/authSlice";
import { logout } from "../services/authService";

const Topbar = ({ onMenuClick }) => {
  const dispatch = useDispatch();
  const { user, refreshToken } = useSelector((state) => state.auth);

  const handleLogout = async () => {
    if (refreshToken) {
      await logout(refreshToken);
    }
    dispatch(clearAuth());
  };

  return (
    <AppBar
      position="fixed"
      elevation={0}
      color="inherit"
      sx={{ borderBottom: "1px solid #e5eef6", zIndex: (theme) => theme.zIndex.drawer + 1 }}
    >
      <Toolbar sx={{ gap: 2 }}>
        <IconButton
          color="inherit"
          edge="start"
          onClick={onMenuClick}
          sx={{ display: { md: "none" } }}
        >
          <MenuIcon />
        </IconButton>
        <Typography variant="h6" sx={{ fontWeight: 600 }}>
          Billing Portal
        </Typography>
        <Box sx={{ flex: 1 }} />
        <TextField
          size="small"
          placeholder="Search..."
          sx={{ display: { xs: "none", md: "block" }, minWidth: 220 }}
        />
        <TextField
          select
          size="small"
          value="Main Store"
          sx={{ minWidth: 160 }}
        >
          <MenuItem value="Main Store">Main Store</MenuItem>
        </TextField>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
          <Avatar sx={{ width: 32, height: 32 }}>
            {user?.name?.[0] || "U"}
          </Avatar>
          <Typography variant="body2">{user?.name || "User"}</Typography>
          {user && (
            <Button color="primary" variant="outlined" onClick={handleLogout}>
              Logout
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Topbar;
