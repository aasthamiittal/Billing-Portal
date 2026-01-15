import { createTheme } from "@mui/material/styles";

const theme = createTheme({
  palette: {
    primary: {
      main: "#39A1F7",
    },
    background: {
      default: "#ffffff",
    },
  },
  typography: {
    fontFamily: ["Inter", "Roboto", "Helvetica", "Arial", "sans-serif"].join(
      ","
    ),
  },
  shape: {
    borderRadius: 8,
  },
});

export default theme;
