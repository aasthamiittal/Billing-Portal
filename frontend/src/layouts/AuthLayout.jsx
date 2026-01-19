import { Box } from "@mui/material";

const AuthLayout = ({ children }) => (
  <Box
    sx={{
      minHeight: "100vh",
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      background: "linear-gradient(135deg, #2f9fd6 0%, #9bd9d3 100%)",
      p: 2,
    }}
  >
    {children}
  </Box>
);

export default AuthLayout;
