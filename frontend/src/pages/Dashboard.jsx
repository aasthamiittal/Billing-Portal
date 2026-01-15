import { Grid, Paper, Typography } from "@mui/material";

const Dashboard = () => (
  <Grid container spacing={2}>
    <Grid item xs={12} md={4}>
      <Paper elevation={0} sx={{ p: 3 }}>
        <Typography variant="subtitle2" color="text.secondary">
          Total Sales
        </Typography>
        <Typography variant="h5">--</Typography>
      </Paper>
    </Grid>
    <Grid item xs={12} md={4}>
      <Paper elevation={0} sx={{ p: 3 }}>
        <Typography variant="subtitle2" color="text.secondary">
          Invoices
        </Typography>
        <Typography variant="h5">--</Typography>
      </Paper>
    </Grid>
    <Grid item xs={12} md={4}>
      <Paper elevation={0} sx={{ p: 3 }}>
        <Typography variant="subtitle2" color="text.secondary">
          Items
        </Typography>
        <Typography variant="h5">--</Typography>
      </Paper>
    </Grid>
  </Grid>
);

export default Dashboard;
