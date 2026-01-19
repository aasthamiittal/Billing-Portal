import { useEffect, useState } from "react";
import {
  Typography,
  TextField,
  Button,
  Stack,
  Alert,
  Paper,
  Box,
  Avatar,
  Link,
} from "@mui/material";
import PersonIcon from "@mui/icons-material/Person";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { setCredentials } from "../store/authSlice";
import { login } from "../services/authService";
import AuthLayout from "../layouts/AuthLayout";
import SarangLogo from "../assests/Logo.png";

const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const accessToken = useSelector((state) => state.auth.accessToken);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (accessToken) {
      navigate("/", { replace: true });
    }
  }, [accessToken, navigate]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await login(email, password);
      dispatch(setCredentials(data));
      navigate("/", { replace: true });
    } catch (err) {
      setError(err.response?.data?.details?.join(', ') || err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <Paper
        elevation={6}
        sx={{
          p: 4,
          width: "100%",
          maxWidth: 360,
          textAlign: "center",
          position: "relative",
          pt: 6,
          borderRadius: 2,
        }}
      >
        <Avatar
          sx={{
            width: 64,
            height: 64,
            bgcolor: "#1f7fae",
            position: "absolute",
            top: -32,
            left: "50%",
            transform: "translateX(-50%)",
          }}
        >
          <PersonIcon />
        </Avatar>
        <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
          Portal Login
        </Typography>
        {error && (
          <Alert severity="error" sx={{ mb: 2 }}>
            {error}
          </Alert>
        )}
        <Stack component="form" spacing={2} onSubmit={handleSubmit}>
          <TextField
            placeholder="Username"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            size="small"
            variant="filled"
            InputProps={{ disableUnderline: true }}
            inputProps={{ "aria-label": "Username" }}
            sx={{ bgcolor: "#f1f1f1", borderRadius: 1 }}
          />
          <TextField
            placeholder="Password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            required
            inputProps={{ minLength: 6, "aria-label": "Password" }}
            size="small"
            variant="filled"
            InputProps={{ disableUnderline: true }}
            sx={{ bgcolor: "#f1f1f1", borderRadius: 1 }}
          />
          <Button type="submit" variant="contained" disabled={loading}>
            {loading ? "Signing in..." : "Login"}
          </Button>
        </Stack>
        <Box sx={{ mt: 2 }}>
          <Typography variant="body2" color="text.secondary">
            Forgot your password?{" "}
            <Link href="#" underline="hover">
              Click Here
            </Link>
          </Typography>
        </Box>
        <Box sx={{ mt: 2, display: "flex", justifyContent: "center" }}>
          <Box
            component="img"
            src={SarangLogo}
            alt="Logo"
            sx={{ height: 70 }}
          />
        </Box>
      </Paper>
    </AuthLayout>
  );
};

export default Login;
