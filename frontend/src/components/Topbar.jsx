import { AppBar, Toolbar, Typography, Box, Button } from "@mui/material";
import { useDispatch, useSelector } from "react-redux";
import { clearAuth } from "../store/authSlice";
import { logout } from "../services/authService";

const Topbar = () => {
  const dispatch = useDispatch();
  const { user, refreshToken } = useSelector((state) => state.auth);

  const handleLogout = async () => {
    if (refreshToken) {
      await logout(refreshToken);
    }
    dispatch(clearAuth());
  };

  return (
    <AppBar position="static" elevation={0}>
      <Toolbar>
        <Typography variant="h6" sx={{ flexGrow: 1 }}>
          Billing Portal
        </Typography>
        <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
          <Typography variant="body2">{user?.name || "Guest"}</Typography>
          {user && (
            <Button color="inherit" onClick={handleLogout}>
              Logout
            </Button>
          )}
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Topbar;
