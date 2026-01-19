import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
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
  Chip,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import Filters from "../../components/Filters";
import Search from "../../components/Search";
import TableWrapper from "../../components/TableWrapper";
import Loader from "../../components/Loader";
import EmptyState from "../../components/EmptyState";
import { fetchStores } from "../../services/storeService";
import { createSupplier, deleteSupplier, fetchSuppliers, updateSupplier } from "../../services/inventoryService";
import { useSelector } from "react-redux";

const Suppliers = () => {
  const user = useSelector((s) => s.auth.user);
  const [loading, setLoading] = useState(true);
  const [stores, setStores] = useState([]);
  const [storeId, setStoreId] = useState("");
  const [rows, setRows] = useState([]);
  const [query, setQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", phone: "", email: "", address: "" });

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
      const data = await fetchSuppliers(storeId);
      setRows(data || []);
    };
    load();
  }, [storeId]);

  const filtered = useMemo(() => {
    if (!query) return rows;
    const q = query.toLowerCase();
    return rows.filter((r) => r.name?.toLowerCase().includes(q) || r.phone?.toLowerCase().includes(q) || r.email?.toLowerCase().includes(q));
  }, [rows, query]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", phone: "", email: "", address: "" });
    setDialogOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm({ name: row.name || "", phone: row.phone || "", email: row.email || "", address: row.address || "" });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (!editing) {
        const created = await createSupplier({ storeId, ...form });
        setRows((prev) => [created, ...prev]);
      } else {
        const updated = await updateSupplier(editing._id, form);
        setRows((prev) => prev.map((r) => (r._id === updated._id ? updated : r)));
      }
      setDialogOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (id) => {
    await deleteSupplier(id);
    setRows((prev) => prev.map((r) => (r._id === id ? { ...r, isActive: false } : r)));
  };

  if (loading) return <Loader />;

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h5">Suppliers</Typography>
        <Button variant="contained" onClick={openCreate} disabled={!storeId}>
          + Add New
        </Button>
      </Stack>

      <Paper elevation={0} sx={{ mt: 2, p: 2 }}>
        <Filters>
          <Search value={query} onChange={setQuery} placeholder="Search suppliers" />
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
        <EmptyState title="No suppliers" description="Create your first supplier." />
      ) : (
        <TableWrapper>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Phone</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((row) => (
                <TableRow key={row._id}>
                  <TableCell>{row.name}</TableCell>
                  <TableCell>{row.phone || "-"}</TableCell>
                  <TableCell>{row.email || "-"}</TableCell>
                  <TableCell>
                    <Chip label={row.isActive ? "Active" : "Inactive"} color={row.isActive ? "success" : "default"} />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => openEdit(row)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDeactivate(row._id)} disabled={!row.isActive}>
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableWrapper>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editing ? "Edit Supplier" : "Create Supplier"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Name" value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} required />
            <TextField label="Phone" value={form.phone} onChange={(e) => setForm((p) => ({ ...p, phone: e.target.value }))} />
            <TextField label="Email" value={form.email} onChange={(e) => setForm((p) => ({ ...p, email: e.target.value }))} />
            <TextField label="Address" value={form.address} onChange={(e) => setForm((p) => ({ ...p, address: e.target.value }))} multiline minRows={2} />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleSave} disabled={saving || !form.name}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Suppliers;

