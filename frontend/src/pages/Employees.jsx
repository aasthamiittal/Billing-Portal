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
  TablePagination,
  Chip,
  FormControlLabel,
  Switch,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import DeleteOutlineIcon from "@mui/icons-material/DeleteOutline";
import TableWrapper from "../components/TableWrapper";
import Search from "../components/Search";
import Filters from "../components/Filters";
import Loader from "../components/Loader";
import EmptyState from "../components/EmptyState";
import { fetchUsers, createUser, updateUser, deactivateUser } from "../services/userService";
import { fetchRoles } from "../services/roleService";
import { fetchStores } from "../services/storeService";
import { useSelector } from "react-redux";
import { can } from "../utils/permissions";

const Employees = () => {
  const user = useSelector((state) => state.auth.user);
  const [loading, setLoading] = useState(true);
  const [employees, setEmployees] = useState([]);
  const [roles, setRoles] = useState([]);
  const [stores, setStores] = useState([]);
  const [query, setQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [editingId, setEditingId] = useState(null);
  const [changePassword, setChangePassword] = useState(true);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    roleId: "",
    storeId: "",
    status: "ACTIVE",
  });

  useEffect(() => {
    const load = async () => {
      try {
        const [usersData, rolesData, storesData] = await Promise.all([
          fetchUsers(),
          fetchRoles(),
          fetchStores(),
        ]);
        setEmployees(usersData);
        setRoles(rolesData);
        setStores(storesData);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filtered = useMemo(() => {
    if (!query) return employees;
    const lower = query.toLowerCase();
    return employees.filter(
      (e) => e.name?.toLowerCase().includes(lower) || e.email?.toLowerCase().includes(lower)
    );
  }, [employees, query]);

  const paged = useMemo(() => {
    const start = page * rowsPerPage;
    return filtered.slice(start, start + rowsPerPage);
  }, [filtered, page, rowsPerPage]);

  const canCreate = can(user, "users", "users", "read_write");
  const canEdit = can(user, "users", "users", "read_write");
  const canDelete = can(user, "users", "users", "read_write");

  const openCreate = () => {
    setEditingId(null);
    setChangePassword(true);
    setForm({
      name: "",
      email: "",
      password: "",
      roleId: "",
      storeId: "",
      status: "ACTIVE",
    });
    setDialogOpen(true);
  };

  const openEdit = (emp) => {
    setEditingId(emp._id);
    setChangePassword(false);
    setForm({
      name: emp.name || "",
      email: emp.email || "",
      password: "",
      roleId: emp.role?._id || "",
      storeId: emp.store || "",
      status: emp.status || "ACTIVE",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      if (!editingId) {
        const created = await createUser({
          name: form.name,
          email: form.email,
          password: form.password,
          roleId: form.roleId || undefined,
          storeId: form.storeId || undefined,
        });
        // backend createUser returns small payload; refresh list for consistency
        const usersData = await fetchUsers();
        setEmployees(usersData);
        setDialogOpen(false);
        return created;
      }

      const updated = await updateUser(editingId, {
        name: form.name,
        email: form.email,
        password: changePassword ? form.password || undefined : undefined,
        roleId: form.roleId || undefined,
        storeId: form.storeId || undefined,
        status: form.status,
      });
      setEmployees((prev) => prev.map((u) => (u._id === updated._id ? updated : u)));
      setDialogOpen(false);
      return updated;
    } finally {
      setSaving(false);
    }
  };

  const handleDeactivate = async (id) => {
    await deactivateUser(id);
    setEmployees((prev) => prev.map((u) => (u._id === id ? { ...u, status: "INACTIVE" } : u)));
  };

  if (loading) return <Loader />;

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h5">Employees ({filtered.length})</Typography>
        <Button variant="contained" onClick={openCreate} disabled={!canCreate}>
          + Add New
        </Button>
      </Stack>

      <Paper elevation={0} sx={{ mt: 2, p: 2 }}>
        <Filters>
          <Search value={query} onChange={setQuery} placeholder="Search Here" />
        </Filters>
      </Paper>

      {!filtered.length ? (
        <EmptyState title="No employees" description="Create your first employee." />
      ) : (
        <TableWrapper>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Email</TableCell>
                <TableCell>Role</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paged.map((emp) => (
                <TableRow key={emp._id}>
                  <TableCell>{emp.name}</TableCell>
                  <TableCell>{emp.email}</TableCell>
                  <TableCell>{emp.role?.name || "-"}</TableCell>
                  <TableCell>
                    <Chip
                      label={emp.status === "ACTIVE" ? "Active" : "Inactive"}
                      color={emp.status === "ACTIVE" ? "success" : "default"}
                      variant="filled"
                    />
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" disabled={!canEdit} onClick={() => openEdit(emp)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                    <IconButton
                      size="small"
                      disabled={!canDelete || emp.status !== "ACTIVE"}
                      onClick={() => handleDeactivate(emp._id)}
                    >
                      <DeleteOutlineIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={filtered.length}
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
        <DialogTitle>{editingId ? "Edit Employee" : "Create Employee"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Name"
              value={form.name}
              onChange={(event) => setForm((p) => ({ ...p, name: event.target.value }))}
              required
            />
            <TextField
              label="Email"
              type="email"
              value={form.email}
              onChange={(event) => setForm((p) => ({ ...p, email: event.target.value }))}
              required
            />
            {editingId && (
              <FormControlLabel
                control={
                  <Switch
                    checked={changePassword}
                    onChange={(e) => {
                      const on = e.target.checked;
                      setChangePassword(on);
                      if (!on) setForm((p) => ({ ...p, password: "" }));
                    }}
                  />
                }
                label="Change password"
              />
            )}
            <TextField
              label={editingId ? "New Password" : "Password"}
              type="password"
              value={form.password}
              onChange={(event) => setForm((p) => ({ ...p, password: event.target.value }))}
              placeholder={editingId ? "••••••••" : ""}
              disabled={!!editingId && !changePassword}
              required={!editingId || changePassword}
              helperText={
                editingId
                  ? changePassword
                    ? "Enter a new password to reset it (we never show existing passwords)."
                    : "Password is hidden and cannot be viewed."
                  : ""
              }
            />
            <TextField
              select
              label="Role"
              value={form.roleId}
              onChange={(event) => setForm((p) => ({ ...p, roleId: event.target.value }))}
            >
              <MenuItem value="">None</MenuItem>
              {roles.map((r) => (
                <MenuItem key={r._id} value={r._id}>
                  {r.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Store"
              value={form.storeId}
              onChange={(event) => setForm((p) => ({ ...p, storeId: event.target.value }))}
            >
              <MenuItem value="">Default</MenuItem>
              {stores.map((s) => (
                <MenuItem key={s._id} value={s._id}>
                  {s.name}
                </MenuItem>
              ))}
            </TextField>
            {editingId && (
              <TextField
                select
                label="Status"
                value={form.status}
                onChange={(event) => setForm((p) => ({ ...p, status: event.target.value }))}
              >
                <MenuItem value="ACTIVE">ACTIVE</MenuItem>
                <MenuItem value="INACTIVE">INACTIVE</MenuItem>
              </TextField>
            )}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={
              saving ||
              !form.name ||
              !form.email ||
              (!editingId && !form.password) ||
              (editingId && changePassword && !form.password) ||
              (!editingId ? !canCreate : !canEdit)
            }
          >
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Employees;

