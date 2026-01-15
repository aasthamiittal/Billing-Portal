import { Box, Paper } from "@mui/material";

const AuthLayout = ({ children }) => (
  <Box
    sx={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      bgcolor: "background.default",
      p: 2,
    }}
  >
    <Paper elevation={0} sx={{ p: 4, width: "100%", maxWidth: 420 }}>
      {children}
    </Paper>
  </Box>
);

export default AuthLayout;
