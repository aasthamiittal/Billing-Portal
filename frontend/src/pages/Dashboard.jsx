import { Grid, Typography, Paper, Box, Button, Stack, Tooltip } from "@mui/material";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
} from "recharts";
import StatCard from "../components/StatCard";
import { useEffect, useMemo, useState } from "react";
import { fetchInvoices } from "../services/invoiceService";
import { fetchItems } from "../services/itemService";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { hasPermission } from "../utils/permissions";

const chartData = [
  { name: "Mon", sales: 1200 },
  { name: "Tue", sales: 2100 },
  { name: "Wed", sales: 1800 },
  { name: "Thu", sales: 2600 },
  { name: "Fri", sales: 2300 },
  { name: "Sat", sales: 3200 },
  { name: "Sun", sales: 2800 },
];

const Dashboard = () => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);
  const canQuickBill = hasPermission(user, "store_management", "quick_bill", "read_write");

  const [invoices, setInvoices] = useState([]);
  const [items, setItems] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [inv, it] = await Promise.all([fetchInvoices(), fetchItems()]);
        setInvoices(inv);
        setItems(it);
      } catch {
        // keep dashboard resilient even if APIs fail
      }
    };
    load();
  }, []);

  const kpis = useMemo(() => {
    const now = new Date();
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const issued = invoices.filter((i) => i.status === "ISSUED");
    const todaySales = issued
      .filter((i) => new Date(i.issuedAt) >= startOfDay)
      .reduce((sum, i) => sum + (i.totals?.total || 0), 0);
    const monthlyRevenue = issued
      .filter((i) => new Date(i.issuedAt) >= startOfMonth)
      .reduce((sum, i) => sum + (i.totals?.total || 0), 0);
    const invoiceCount = issued.filter((i) => new Date(i.issuedAt) >= startOfMonth).length;
    const pendingDrafts = invoices.filter((i) => i.status === "DRAFT").length;

    return { todaySales, monthlyRevenue, invoiceCount, pendingDrafts };
  }, [invoices]);

  const recentInvoices = useMemo(() => invoices.slice(0, 5), [invoices]);

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h5">Dashboard</Typography>
        <Tooltip title={!canQuickBill ? "Not allowed: billing:create" : ""} disableHoverListener={canQuickBill}>
          <span>
            <Button
              variant="contained"
              sx={{ bgcolor: "#39A1F7" }}
              disabled={!canQuickBill}
              onClick={() => navigate("/billing/quick")}
            >
              Quick Bill / New Invoice
            </Button>
          </span>
        </Tooltip>
      </Stack>

      <Grid container spacing={2}>
        <Grid item xs={12} md={3}>
          <StatCard title="Today's Sales" value={`₹ ${kpis.todaySales.toFixed(2)}`} subtitle="Issued invoices" />
        </Grid>
        <Grid item xs={12} md={3}>
          <StatCard title="Monthly Revenue" value={`₹ ${kpis.monthlyRevenue.toFixed(2)}`} subtitle="This month" />
        </Grid>
        <Grid item xs={12} md={3}>
          <StatCard title="Invoices" value={`${kpis.invoiceCount}`} subtitle="Monthly count" />
        </Grid>
        <Grid item xs={12} md={3}>
          <StatCard title="Pending Drafts" value={`${kpis.pendingDrafts}`} subtitle="Needs issuing" />
        </Grid>

        <Grid item xs={12} md={8}>
          <Paper elevation={0} sx={{ p: 3 }}>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
              Sales Overview
            </Typography>
            <ResponsiveContainer width="100%" height={280}>
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#39A1F7" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#39A1F7" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="name" />
                <YAxis />
                <RechartsTooltip />
                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke="#39A1F7"
                  fill="url(#salesGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper elevation={0} sx={{ p: 3, height: "100%" }}>
            <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
              Recent Invoices
            </Typography>
            {recentInvoices.length === 0 ? (
              <Typography variant="body2" color="text.secondary">
                No invoices yet.
              </Typography>
            ) : (
              <Stack spacing={1}>
                {recentInvoices.map((inv) => (
                  <Stack key={inv._id} direction="row" justifyContent="space-between" alignItems="center">
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 600 }}>
                        {inv.invoiceNumber}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {inv.status} • ₹ {(inv.totals?.total || 0).toFixed(2)}
                      </Typography>
                    </Box>
                    <Button size="small" onClick={() => navigate("/invoices")}>
                      View
                    </Button>
                  </Stack>
                ))}
              </Stack>
            )}
            <Box sx={{ mt: 2 }}>
              <Typography variant="caption" color="text.secondary">
                Active items: {items.filter((i) => i.isActive).length}
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
