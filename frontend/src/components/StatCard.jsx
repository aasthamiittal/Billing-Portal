import { Paper, Typography, Box } from "@mui/material";

const StatCard = ({ title, value, subtitle }) => (
  <Paper elevation={0} sx={{ p: 3, height: "100%" }}>
    <Typography variant="subtitle2" color="text.secondary">
      {title}
    </Typography>
    <Typography variant="h5" sx={{ mt: 1 }}>
      {value}
    </Typography>
    {subtitle && (
      <Box sx={{ mt: 1 }}>
        <Typography variant="caption" color="text.secondary">
          {subtitle}
        </Typography>
      </Box>
    )}
  </Paper>
);

export default StatCard;
