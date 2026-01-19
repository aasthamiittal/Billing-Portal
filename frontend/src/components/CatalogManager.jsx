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
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import EditIcon from "@mui/icons-material/Edit";
import Filters from "./Filters";
import Search from "./Search";
import TableWrapper from "./TableWrapper";
import Loader from "./Loader";
import EmptyState from "./EmptyState";
import { createCatalog, deactivateCatalog, listCatalog, updateCatalog } from "../services/catalogService";
import { fetchStores } from "../services/storeService";
import { useSelector } from "react-redux";

const CatalogManager = ({ title, kind, showValue = false, valueLabel = "Value" }) => {
  const user = useSelector((s) => s.auth.user);
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [stores, setStores] = useState([]);
  const [storeId, setStoreId] = useState("");
  const [query, setQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ name: "", code: "", value: 0 });

  useEffect(() => {
    const load = async () => {
      try {
        const storeData = await fetchStores();
        setStores(storeData || []);
        const defaultStore = user?.isMasterAdmin
          ? (storeData?.[0]?._id || "")
          : (user?.store || storeData?.[0]?._id || "");
        setStoreId(defaultStore);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [kind, user?.isMasterAdmin, user?.store]);

  useEffect(() => {
    const load = async () => {
      if (!storeId) return;
      const data = await listCatalog(kind, { storeId });
      setRows(data);
    };
    load();
  }, [kind, storeId]);

  const filtered = useMemo(() => {
    if (!query) return rows;
    const lower = query.toLowerCase();
    return rows.filter((r) => r.name?.toLowerCase().includes(lower) || r.code?.toLowerCase().includes(lower));
  }, [rows, query]);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", code: "", value: 0 });
    setDialogOpen(true);
  };

  const openEdit = (row) => {
    setEditing(row);
    setForm({ name: row.name || "", code: row.code || "", value: row.value || 0 });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (!editing) {
        const created = await createCatalog(kind, {
          name: form.name,
          code: form.code,
          value: showValue ? Number(form.value || 0) : 0,
          config: {},
          storeId,
        });
        setRows((prev) => [created, ...prev]);
      } else {
        const updated = await updateCatalog(kind, editing._id, {
          name: form.name,
          code: form.code,
          value: showValue ? Number(form.value || 0) : editing.value,
        });
        setRows((prev) => prev.map((r) => (r._id === updated._id ? updated : r)));
      }
      setDialogOpen(false);
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (id) => {
    await deactivateCatalog(kind, id);
    setRows((prev) => prev.map((r) => (r._id === id ? { ...r, isActive: false } : r)));
  };

  if (loading) return <Loader />;

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h5">{title}</Typography>
        <Button variant="contained" onClick={openCreate}>
          + Add New
        </Button>
      </Stack>

      <Paper elevation={0} sx={{ mt: 2, p: 2 }}>
        <Filters>
          <Search value={query} onChange={setQuery} placeholder={`Search ${title.toLowerCase()}`} />
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
        <EmptyState title={`No ${title.toLowerCase()}`} description={`Create your first ${title.toLowerCase()}.`} />
      ) : (
        <TableWrapper>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Code</TableCell>
                {showValue && <TableCell>{valueLabel}</TableCell>}
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((row) => (
                <TableRow key={row._id}>
                  <TableCell>{row.name}</TableCell>
                  <TableCell>{row.code || "-"}</TableCell>
                  {showValue && <TableCell>{Number(row.value || 0).toFixed(2)}</TableCell>}
                  <TableCell>
                    <Chip
                      label={row.isActive ? "Active" : "Inactive"}
                      color={row.isActive ? "success" : "default"}
                      variant="filled"
                    />
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
        <DialogTitle>{editing ? `Edit ${title}` : `Create ${title}`}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Name"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              required
            />
            <TextField
              label="Code"
              value={form.code}
              onChange={(e) => setForm((p) => ({ ...p, code: e.target.value }))}
            />
            {showValue && (
              <TextField
                label={valueLabel}
                type="number"
                value={form.value}
                onChange={(e) => setForm((p) => ({ ...p, value: e.target.value }))}
              />
            )}
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

export default CatalogManager;

