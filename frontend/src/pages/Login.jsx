import { useState } from "react";
import { Typography, TextField, Button, Stack, Alert } from "@mui/material";
import { useDispatch } from "react-redux";
import { setCredentials } from "../store/authSlice";
import { login } from "../services/authService";
import AuthLayout from "../layouts/AuthLayout";

const Login = () => {
  const dispatch = useDispatch();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event) => {
    event.preventDefault();
    setLoading(true);
    setError("");
    try {
      const data = await login(email, password);
      dispatch(setCredentials(data));
    } catch (err) {
      setError(err.response?.data?.details?.join(', ') || err.response?.data?.message || "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <Typography variant="h5" gutterBottom>
        Sign in
      </Typography>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Stack component="form" spacing={2} onSubmit={handleSubmit}>
        <TextField
          label="Email"
          type="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          required
        />
        <TextField
          label="Password"
          type="password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          required
          inputProps={{ minLength: 6 }}
        />
        <Button type="submit" variant="contained" disabled={loading}>
          {loading ? "Signing in..." : "Login"}
        </Button>
      </Stack>
    </AuthLayout>
  );
};

export default Login;
