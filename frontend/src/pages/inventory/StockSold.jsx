import { useEffect, useMemo, useState } from "react";
import {
  Box,
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
import Filters from "../../components/Filters";
import Search from "../../components/Search";
import TableWrapper from "../../components/TableWrapper";
import Loader from "../../components/Loader";
import EmptyState from "../../components/EmptyState";
import { fetchStores } from "../../services/storeService";
import { fetchSold } from "../../services/inventoryService";
import { useSelector } from "react-redux";

const StockSold = () => {
  const user = useSelector((s) => s.auth.user);
  const [loading, setLoading] = useState(true);
  const [stores, setStores] = useState([]);
  const [storeId, setStoreId] = useState("");
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState("");

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
      const data = await fetchSold(storeId);
      setRows(data || []);
    };
    load();
  }, [storeId]);

  const filtered = useMemo(() => {
    if (!query) return rows;
    const q = query.toLowerCase();
    return rows.filter(
      (r) =>
        r.item?.name?.toLowerCase().includes(q) ||
        r.invoice?.invoiceNumber?.toLowerCase().includes(q) ||
        r.buyer?.name?.toLowerCase().includes(q) ||
        r.buyerName?.toLowerCase().includes(q)
    );
  }, [rows, query]);

  if (loading) return <Loader />;

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h5">Stock Sold</Typography>
      </Stack>

      <Paper elevation={0} sx={{ mt: 2, p: 2 }}>
        <Filters>
          <Search value={query} onChange={setQuery} placeholder="Search sold (invoice/item)" />
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
        </Filters>
      </Paper>

      {!filtered.length ? (
        <EmptyState title="No sold entries" description="Sold entries are created automatically when invoices are issued." />
      ) : (
        <TableWrapper>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Invoice</TableCell>
                <TableCell>Item</TableCell>
                <TableCell>Qty</TableCell>
                <TableCell>Unit Price</TableCell>
                <TableCell>Buyer</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r._id}>
                  <TableCell>{r.occurredAt ? new Date(r.occurredAt).toLocaleDateString() : "-"}</TableCell>
                  <TableCell>{r.invoice?.invoiceNumber || "-"}</TableCell>
                  <TableCell>{r.item?.name || "-"}</TableCell>
                  <TableCell>{r.quantity}</TableCell>
                  <TableCell>{Number(r.unitPrice || 0).toFixed(2)}</TableCell>
                  <TableCell>{r.buyer?.name || r.buyerName || "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableWrapper>
      )}
    </Box>
  );
};

export default StockSold;

