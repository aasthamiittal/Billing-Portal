import { ThemeProvider } from "@mui/material/styles";
import { CssBaseline } from "@mui/material";
import { BrowserRouter } from "react-router-dom";
import AppRoutes from "./routes/AppRoutes";
import theme from "./theme/theme";

const App = () => (
  <ThemeProvider theme={theme}>
    <CssBaseline />
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  </ThemeProvider>
);

export default App;
