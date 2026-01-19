import { Box, Paper, Stack, Switch, Typography, FormControlLabel } from "@mui/material";

const Settings = () => {
  return (
    <Box>
      <Typography variant="h5" sx={{ mb: 2 }}>
        Settings
      </Typography>
      <Paper elevation={0} sx={{ p: 3 }}>
        <Stack spacing={2}>
          <FormControlLabel control={<Switch defaultChecked />} label="Enable notifications" />
          <FormControlLabel control={<Switch />} label="Compact tables" />
          <Typography variant="caption" color="text.secondary">
            (These are UI-only toggles for now; we can persist them per user/store next.)
          </Typography>
        </Stack>
      </Paper>
    </Box>
  );
};

export default Settings;

