import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
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
import { fetchItems } from "../../services/itemService";
import { createWastage, fetchWastage } from "../../services/inventoryService";
import { useSelector } from "react-redux";

const Wastage = () => {
  const user = useSelector((s) => s.auth.user);
  const [loading, setLoading] = useState(true);
  const [stores, setStores] = useState([]);
  const [storeId, setStoreId] = useState("");
  const [rows, setRows] = useState([]);
  const [items, setItems] = useState([]);
  const [query, setQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ itemId: "", quantity: "", reasonCode: "", occurredAt: "", notes: "" });

  useEffect(() => {
    const load = async () => {
      try {
        const [storeData, itemData] = await Promise.all([fetchStores(), fetchItems()]);
        setStores(storeData || []);
        setItems(itemData || []);
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
      const data = await fetchWastage(storeId);
      setRows(data || []);
    };
    load();
  }, [storeId]);

  const storeItems = useMemo(() => (items || []).filter((i) => String(i.store) === String(storeId)), [items, storeId]);

  const filtered = useMemo(() => {
    if (!query) return rows;
    const q = query.toLowerCase();
    return rows.filter(
      (r) =>
        r.item?.name?.toLowerCase().includes(q) ||
        r.reasonCode?.toLowerCase().includes(q) ||
        String(r.quantity || "").includes(q)
    );
  }, [rows, query]);

  const openCreate = () => {
    setForm({ itemId: "", quantity: "", reasonCode: "", occurredAt: "", notes: "" });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const created = await createWastage({
        storeId,
        itemId: form.itemId,
        quantity: Number(form.quantity),
        reasonCode: form.reasonCode || "",
        occurredAt: form.occurredAt ? new Date(form.occurredAt).toISOString() : undefined,
        notes: form.notes || "",
      });
      setRows((prev) => [created, ...prev]);
      setDialogOpen(false);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h5">Wastage</Typography>
        <Button variant="contained" onClick={openCreate} disabled={!storeId}>
          + Add New
        </Button>
      </Stack>

      <Paper elevation={0} sx={{ mt: 2, p: 2 }}>
        <Filters>
          <Search value={query} onChange={setQuery} placeholder="Search wastage" />
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
        <EmptyState title="No wastage entries" description="Record your first wastage transaction." />
      ) : (
        <TableWrapper>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Item</TableCell>
                <TableCell>Qty</TableCell>
                <TableCell>Reason</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r._id}>
                  <TableCell>{r.occurredAt ? new Date(r.occurredAt).toLocaleDateString() : "-"}</TableCell>
                  <TableCell>{r.item?.name || "-"}</TableCell>
                  <TableCell>{r.quantity}</TableCell>
                  <TableCell>{r.reasonCode || "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableWrapper>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Create Wastage</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField select label="Item" value={form.itemId} onChange={(e) => setForm((p) => ({ ...p, itemId: e.target.value }))} required>
              <MenuItem value="">Select item</MenuItem>
              {storeItems.map((i) => (
                <MenuItem key={i._id} value={i._id}>
                  {i.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField label="Quantity" type="number" value={form.quantity} onChange={(e) => setForm((p) => ({ ...p, quantity: e.target.value }))} required />
            <TextField label="Reason Code" value={form.reasonCode} onChange={(e) => setForm((p) => ({ ...p, reasonCode: e.target.value }))} />
            <TextField label="Date" type="date" InputLabelProps={{ shrink: true }} value={form.occurredAt} onChange={(e) => setForm((p) => ({ ...p, occurredAt: e.target.value }))} />
            <TextField label="Notes" value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} multiline minRows={2} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving || !form.itemId || !form.quantity}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Wastage;

