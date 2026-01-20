import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from "@mui/material";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import Filters from "../../components/Filters";
import Search from "../../components/Search";
import TableWrapper from "../../components/TableWrapper";
import Loader from "../../components/Loader";
import EmptyState from "../../components/EmptyState";
import DateRangePicker from "../../components/DateRangePicker";
import { fetchStores } from "../../services/storeService";
import { fetchStockReport } from "../../services/inventoryService";
import api from "../../services/api";
import { downloadBlob } from "../../utils/download";
import { useSelector } from "react-redux";

const StockReport = () => {
  const user = useSelector((s) => s.auth.user);
  const [loading, setLoading] = useState(true);
  const [stores, setStores] = useState([]);
  const [storeId, setStoreId] = useState("");
  const [query, setQuery] = useState("");
  const [range, setRange] = useState({ startDate: "", endDate: "" });
  const [data, setData] = useState({ rows: [] });

  useEffect(() => {
    const load = async () => {
      try {
        const storeData = await fetchStores();
        setStores(storeData || []);
        const defaultStore = user?.isMasterAdmin ? (storeData?.[0]?._id || "") : (user?.store || storeData?.[0]?._id || "");
        setStoreId(defaultStore);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.isMasterAdmin, user?.store]);

  useEffect(() => {
    const load = async () => {
      if (!storeId) return;
      const res = await fetchStockReport({
        storeId,
        from: range.startDate || undefined,
        to: range.endDate || undefined,
      });
      setData(res || { rows: [] });
    };
    load();
  }, [storeId, range.startDate, range.endDate]);

  const filtered = useMemo(() => {
    const rows = data?.rows || [];
    if (!query) return rows;
    const q = query.toLowerCase();
    return rows.filter((r) => r.itemName?.toLowerCase().includes(q));
  }, [data, query]);

  const exportExcel = async () => {
    const response = await api.get("/inventory/stock-report/excel", {
      responseType: "blob",
      params: { storeId, from: range.startDate || undefined, to: range.endDate || undefined },
    });
    downloadBlob(response.data, `stock-report-${storeId}.xlsx`);
  };

  const exportPdf = async () => {
    const response = await api.get("/inventory/stock-report/pdf", {
      responseType: "blob",
      params: { storeId, from: range.startDate || undefined, to: range.endDate || undefined },
    });
    downloadBlob(response.data, `stock-report-${storeId}.pdf`);
  };

  if (loading) return <Loader />;

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h5">Stock Report</Typography>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" startIcon={<DownloadOutlinedIcon />} onClick={exportPdf} disabled={!storeId}>
            PDF
          </Button>
          <Button variant="outlined" startIcon={<DownloadOutlinedIcon />} onClick={exportExcel} disabled={!storeId}>
            Excel
          </Button>
        </Stack>
      </Stack>

      <Paper elevation={0} sx={{ mt: 2, p: 2 }}>
        <Filters>
          <Search value={query} onChange={setQuery} placeholder="Search items" />
          <TextField
            select
            size="small"
            label="Store"
            value={storeId}
            onChange={(e) => setStoreId(e.target.value)}
            sx={{ minWidth: 220 }}
            disabled={!user?.isMasterAdmin}
          >
            {stores.map((s) => (
              <MenuItem key={s._id} value={s._id}>
                {s.name}
              </MenuItem>
            ))}
          </TextField>
          <DateRangePicker
            startDate={range.startDate}
            endDate={range.endDate}
            onChange={setRange}
          />
        </Filters>
      </Paper>

      {!filtered.length ? (
        <EmptyState title="No stock data" description="Create purchases or issue invoices to generate stock movements." />
      ) : (
        <TableWrapper>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Item</TableCell>
                <TableCell>Opening</TableCell>
                <TableCell>Purchased</TableCell>
                <TableCell>Sold</TableCell>
                <TableCell>Wasted</TableCell>
                <TableCell>Closing</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r.itemId}>
                  <TableCell>{r.itemName}</TableCell>
                  <TableCell>{Number(r.opening || 0).toFixed(2)}</TableCell>
                  <TableCell>{Number(r.purchased || 0).toFixed(2)}</TableCell>
                  <TableCell>{Number(r.sold || 0).toFixed(2)}</TableCell>
                  <TableCell>{Number(r.wasted || 0).toFixed(2)}</TableCell>
                  <TableCell>{Number(r.closing || 0).toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableWrapper>
      )}
    </Box>
  );
};

export default StockReport;

