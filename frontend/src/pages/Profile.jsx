import { Box, Paper, Stack, Typography } from "@mui/material";
import { useSelector } from "react-redux";

const Profile = () => {
  const user = useSelector((state) => state.auth.user);
  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Profile
      </Typography>
      <Paper elevation={0} sx={{ p: 3 }}>
        <Stack spacing={1}>
          <Typography variant="subtitle2" color="text.secondary">
            Name
          </Typography>
          <Typography variant="body1">{user?.name || "-"}</Typography>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>
            Email
          </Typography>
          <Typography variant="body1">{user?.email || "-"}</Typography>
          <Typography variant="subtitle2" color="text.secondary" sx={{ mt: 2 }}>
            Role
          </Typography>
          <Typography variant="body1">{user?.role || "-"}</Typography>
        </Stack>
      </Paper>
    </Box>
  );
};

export default Profile;

