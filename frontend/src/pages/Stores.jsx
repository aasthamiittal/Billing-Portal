import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
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
  TablePagination,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import ViewColumnOutlinedIcon from "@mui/icons-material/ViewColumnOutlined";
import TableWrapper from "../components/TableWrapper";
import Search from "../components/Search";
import Filters from "../components/Filters";
import Loader from "../components/Loader";
import EmptyState from "../components/EmptyState";
import { fetchStores } from "../services/storeService";
import { fetchIndustries } from "../services/industryService";
import api from "../services/api";
import { useSelector } from "react-redux";
import { can } from "../utils/permissions";

const Stores = () => {
  const user = useSelector((state) => state.auth.user);
  const [loading, setLoading] = useState(true);
  const [stores, setStores] = useState([]);
  const [industries, setIndustries] = useState([]);
  const [query, setQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [provisionDialogOpen, setProvisionDialogOpen] = useState(false);
  const [provisionedUsers, setProvisionedUsers] = useState([]);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    name: "",
    code: "",
    industryId: "",
    parentStoreId: "",
    isActive: true,
    defaultUserPassword: "",
  });

  useEffect(() => {
    const load = async () => {
      try {
        const [storeData, industryData] = await Promise.all([
          fetchStores(),
          fetchIndustries(),
        ]);
        setStores(storeData);
        setIndustries(industryData);
        if (industryData.length === 1) {
          setForm((prev) => ({ ...prev, industryId: industryData[0]._id }));
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filteredStores = useMemo(() => {
    if (!query) return stores;
    const lower = query.toLowerCase();
    return stores.filter(
      (store) =>
        store.name.toLowerCase().includes(lower) ||
        store.code.toLowerCase().includes(lower)
    );
  }, [stores, query]);

  const pagedStores = useMemo(() => {
    const start = page * rowsPerPage;
    return filteredStores.slice(start, start + rowsPerPage);
  }, [filteredStores, page, rowsPerPage]);

  const openCreate = () => {
    setEditingId(null);
    setForm({
      name: "",
      code: "",
      industryId: industries.length === 1 ? industries[0]._id : "",
      parentStoreId: "",
      isActive: true,
      defaultUserPassword: "",
    });
    setDialogOpen(true);
  };

  const openEdit = (store) => {
    setEditingId(store._id);
    setForm({
      name: store.name || "",
      code: store.code || "",
      industryId: store.industry?._id || store.industry || "",
      parentStoreId: store.parentStore || "",
      isActive: typeof store.isActive === "boolean" ? store.isActive : true,
      defaultUserPassword: "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (!editingId) {
        const payload = {
          name: form.name,
          code: form.code,
          industryId: form.industryId,
          parentStoreId: form.parentStoreId || null,
          settings: {},
          ...(user?.isMasterAdmin && form.defaultUserPassword
            ? { defaultUserPassword: form.defaultUserPassword }
            : {}),
        };
        const { data } = await api.post("/stores", payload);
        const store = data?.store || data; // backwards compatible
        setStores((prev) => [store, ...prev]);

        const defaults = Array.isArray(data?.defaultUsers) ? data.defaultUsers : [];
        if (defaults.length) {
          setProvisionedUsers(defaults);
          setProvisionDialogOpen(true);
        }
      } else {
        const payload = {
          name: form.name,
          code: form.code,
          industryId: form.industryId || undefined,
          parentStoreId: form.parentStoreId || null,
          isActive: form.isActive,
        };
        const { data } = await api.put(`/stores/${editingId}`, payload);
        setStores((prev) => prev.map((s) => (s._id === data._id ? data : s)));
      }
      setDialogOpen(false);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader />;

  const canCreate = can(user, "store_management", "add_store", "read_write");
  const canCreateChild = can(user, "store_management", "add_child_store", "read_write");
  const canEdit = can(user, "store_management", "edit_store", "read_write");
  const allowOpenCreate = user?.isMasterAdmin ? canCreate : canCreate && canCreateChild;

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h5">Store ({filteredStores.length})</Typography>
        <Stack direction="row" spacing={2}>
          <Button
            variant="outlined"
            startIcon={<ViewColumnOutlinedIcon />}
          >
            Column
          </Button>
          <Button variant="outlined" startIcon={<FileDownloadOutlinedIcon />}>
            Export
          </Button>
          <Button variant="contained" onClick={openCreate} disabled={!allowOpenCreate}>
            + Add New
          </Button>
        </Stack>
      </Stack>

      <Paper elevation={0} sx={{ mt: 2, p: 2 }}>
        <Filters>
          <TextField select size="small" label="Quick Action" value="all">
            <MenuItem value="all">Quick Action</MenuItem>
          </TextField>
          <Search value={query} onChange={setQuery} placeholder="Search Here" />
        </Filters>
      </Paper>

      {!filteredStores.length ? (
        <EmptyState title="No stores" description="Create your first store." />
      ) : (
        <TableWrapper>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Store Id</TableCell>
                <TableCell>Store Name</TableCell>
                <TableCell>Industry</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Edit</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {pagedStores.map((store) => (
                <TableRow key={store._id}>
                  <TableCell>{store.code}</TableCell>
                  <TableCell>{store.name}</TableCell>
                  <TableCell>{store.industry?.name || "-"}</TableCell>
                  <TableCell>
                    <Chip
                      label={store.isActive ? "Available" : "Inactive"}
                      color={store.isActive ? "success" : "default"}
                      variant="filled"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton
                      size="small"
                      disabled={!canEdit}
                      onClick={() => openEdit(store)}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={filteredStores.length}
            page={page}
            onPageChange={(event, newPage) => setPage(newPage)}
            rowsPerPage={rowsPerPage}
            onRowsPerPageChange={(event) => {
              setRowsPerPage(parseInt(event.target.value, 10));
              setPage(0);
            }}
            rowsPerPageOptions={[5, 10, 20]}
          />
        </TableWrapper>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editingId ? "Edit Store" : "Create Store"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Store Name"
              value={form.name}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, name: event.target.value }))
              }
              required
            />
            <TextField
              label="Store Code"
              value={form.code}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, code: event.target.value }))
              }
              required
            />
            <TextField
              select
              label="Industry"
              value={form.industryId}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, industryId: event.target.value }))
              }
              required
            >
              {industries.map((industry) => (
                <MenuItem key={industry._id} value={industry._id}>
                  {industry.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Parent Store"
              value={form.parentStoreId}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, parentStoreId: event.target.value }))
              }
            >
              <MenuItem value="">None</MenuItem>
              {stores.map((store) => (
                <MenuItem key={store._id} value={store._id}>
                  {store.name}
                </MenuItem>
              ))}
            </TextField>
            {editingId && (
              <TextField
                select
                label="Status"
                value={form.isActive ? "ACTIVE" : "INACTIVE"}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, isActive: event.target.value === "ACTIVE" }))
                }
              >
                <MenuItem value="ACTIVE">ACTIVE</MenuItem>
                <MenuItem value="INACTIVE">INACTIVE</MenuItem>
              </TextField>
            )}
            {!editingId && user?.isMasterAdmin && (
              <TextField
                label="Default Store Users Password (optional)"
                type="password"
                value={form.defaultUserPassword}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, defaultUserPassword: event.target.value }))
                }
                helperText="If set, this password will be used for the auto-created Store Admin/Cashier users."
              />
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving || !form.name || !form.code || !form.industryId}
          >
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={provisionDialogOpen}
        onClose={() => setProvisionDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Store users created</DialogTitle>
        <DialogContent>
          <Stack spacing={1} sx={{ mt: 1 }}>
            <Typography variant="body2" color="text.secondary">
              Use these credentials to log into the newly created store. You should change the password after first login.
            </Typography>
            {provisionedUsers.map((u) => (
              <Paper key={u.id} variant="outlined" sx={{ p: 2 }}>
                <Typography variant="subtitle2">{u.name}</Typography>
                <Typography variant="body2">Email: {u.email}</Typography>
                <Typography variant="body2">Temp Password: {u.tempPassword}</Typography>
              </Paper>
            ))}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setProvisionDialogOpen(false)} variant="contained">
            Done
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Stores;
