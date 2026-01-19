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
import { createPurchase, fetchPurchases, fetchSuppliers } from "../../services/inventoryService";
import { useSelector } from "react-redux";

const StockPurchases = () => {
  const user = useSelector((s) => s.auth.user);
  const [loading, setLoading] = useState(true);
  const [stores, setStores] = useState([]);
  const [storeId, setStoreId] = useState("");
  const [rows, setRows] = useState([]);
  const [items, setItems] = useState([]);
  const [suppliers, setSuppliers] = useState([]);
  const [query, setQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    itemId: "",
    supplierId: "",
    quantity: "",
    unitCost: "",
    occurredAt: "",
    notes: "",
  });

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
      const [data, s] = await Promise.all([fetchPurchases(storeId), fetchSuppliers(storeId)]);
      setRows(data || []);
      setSuppliers((s || []).filter((x) => x.isActive));
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
        r.supplier?.name?.toLowerCase().includes(q) ||
        String(r.quantity || "").includes(q)
    );
  }, [rows, query]);

  const openCreate = () => {
    setForm({ itemId: "", supplierId: "", quantity: "", unitCost: "", occurredAt: "", notes: "" });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const created = await createPurchase({
        storeId,
        itemId: form.itemId,
        supplierId: form.supplierId || undefined,
        quantity: Number(form.quantity),
        unitCost: Number(form.unitCost || 0),
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
        <Typography variant="h5">Stock Purchase</Typography>
        <Button variant="contained" onClick={openCreate} disabled={!storeId}>
          + Add New
        </Button>
      </Stack>

      <Paper elevation={0} sx={{ mt: 2, p: 2 }}>
        <Filters>
          <Search value={query} onChange={setQuery} placeholder="Search purchases" />
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
        <EmptyState title="No purchases" description="Create your first stock purchase." />
      ) : (
        <TableWrapper>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Item</TableCell>
                <TableCell>Supplier</TableCell>
                <TableCell>Qty</TableCell>
                <TableCell>Unit Cost</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((r) => (
                <TableRow key={r._id}>
                  <TableCell>{r.occurredAt ? new Date(r.occurredAt).toLocaleDateString() : "-"}</TableCell>
                  <TableCell>{r.item?.name || "-"}</TableCell>
                  <TableCell>{r.supplier?.name || "-"}</TableCell>
                  <TableCell>{r.quantity}</TableCell>
                  <TableCell>{Number(r.unitCost || 0).toFixed(2)}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableWrapper>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Create Stock Purchase</DialogTitle>
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
            <TextField select label="Supplier (optional)" value={form.supplierId} onChange={(e) => setForm((p) => ({ ...p, supplierId: e.target.value }))}>
              <MenuItem value="">Select supplier</MenuItem>
              {suppliers.map((s) => (
                <MenuItem key={s._id} value={s._id}>
                  {s.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField label="Quantity" type="number" value={form.quantity} onChange={(e) => setForm((p) => ({ ...p, quantity: e.target.value }))} required />
            <TextField label="Unit Cost" type="number" value={form.unitCost} onChange={(e) => setForm((p) => ({ ...p, unitCost: e.target.value }))} />
            <TextField label="Purchase Date" type="date" InputLabelProps={{ shrink: true }} value={form.occurredAt} onChange={(e) => setForm((p) => ({ ...p, occurredAt: e.target.value }))} />
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

export default StockPurchases;

