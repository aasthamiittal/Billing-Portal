import { Box } from "@mui/material";

const Filters = ({ children }) => (
  <Box
    sx={{
      display: "grid",
      gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
      gap: 2,
      alignItems: "center",
    }}
  >
    {children}
  </Box>
);

export default Filters;
