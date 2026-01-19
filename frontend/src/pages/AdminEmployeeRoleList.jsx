import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TablePagination,
  TextField,
  Typography,
  Checkbox,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import FileDownloadOutlinedIcon from "@mui/icons-material/FileDownloadOutlined";
import ViewColumnOutlinedIcon from "@mui/icons-material/ViewColumnOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import TableWrapper from "../components/TableWrapper";
import Search from "../components/Search";
import Filters from "../components/Filters";
import Loader from "../components/Loader";
import EmptyState from "../components/EmptyState";
import { fetchRoles, updateRole } from "../services/roleService";
import { fetchStores } from "../services/storeService";
import { useNavigate } from "react-router-dom";

const statusChip = (active) => (
  <Chip
    label={active ? "Available" : "Not Available"}
    color={active ? "success" : "default"}
    variant="filled"
    size="small"
  />
);

const toCsv = (rows) => {
  const esc = (v) => `"${String(v ?? "").replaceAll('"', '""')}"`;
  const header = ["Store", "Role Name", "Description", "Status"];
  const lines = [
    header.map(esc).join(","),
    ...rows.map((r) =>
      [
        r.storeName || "-",
        r.name || "",
        r.description || "",
        r.isActive ? "Available" : "Not Available",
      ]
        .map(esc)
        .join(",")
    ),
  ];
  return lines.join("\n");
};

const downloadText = (text, filename) => {
  const blob = new Blob([text], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};

const AdminEmployeeRoleList = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [roles, setRoles] = useState([]);
  const [stores, setStores] = useState([]);
  const [query, setQuery] = useState("");
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [quickAction, setQuickAction] = useState("");
  const [selected, setSelected] = useState(() => new Set());
  const [savingBulk, setSavingBulk] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const [roleData, storeData] = await Promise.all([fetchRoles(), fetchStores()]);
        setRoles(roleData || []);
        setStores(storeData || []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const storeNameById = useMemo(() => {
    const map = new Map();
    (stores || []).forEach((s) => map.set(String(s._id), s.name));
    return map;
  }, [stores]);

  const rows = useMemo(() => {
    const q = query.trim().toLowerCase();
    const mapped = (roles || []).map((r) => {
      const locked = r.scope === "GLOBAL" && String(r.name || "").toLowerCase() === "master admin";
      return {
        ...r,
        locked,
        storeName: r.scope === "STORE" ? storeNameById.get(String(r.store)) || "-" : "GLOBAL",
      };
    });
    if (!q) return mapped;
    return mapped.filter(
      (r) =>
        r.name?.toLowerCase().includes(q) ||
        r.description?.toLowerCase().includes(q) ||
        r.storeName?.toLowerCase().includes(q)
    );
  }, [roles, query, storeNameById]);

  const paged = useMemo(() => {
    const start = page * rowsPerPage;
    return rows.slice(start, start + rowsPerPage);
  }, [rows, page, rowsPerPage]);

  const selectableOnPage = paged.filter((r) => !r.locked);
  const allOnPageSelected =
    selectableOnPage.length > 0 && selectableOnPage.every((r) => selected.has(String(r._id)));
  const someOnPageSelected =
    selectableOnPage.some((r) => selected.has(String(r._id))) && !allOnPageSelected;

  const toggleAllOnPage = (checked) => {
    setSelected((prev) => {
      const next = new Set(prev);
      paged.forEach((r) => {
        if (r.locked) return;
        const id = String(r._id);
        if (checked) next.add(id);
        else next.delete(id);
      });
      return next;
    });
  };

  const toggleOne = (id) => {
    setSelected((prev) => {
      const next = new Set(prev);
      const key = String(id);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const applyQuickAction = async (action) => {
    if (!action) return;
    const ids = Array.from(selected);
    if (!ids.length) return;
    const nextActive = action === "set_available";
    setSavingBulk(true);
    try {
      // Backend will also block Master Admin role, but we filter locked rows client-side as well.
      const allowedIds = ids.filter((id) => !rows.find((r) => String(r._id) === String(id))?.locked);
      await Promise.all(allowedIds.map((id) => updateRole(id, { isActive: nextActive })));
      setRoles((prev) =>
        prev.map((r) => (allowedIds.includes(String(r._id)) ? { ...r, isActive: nextActive } : r))
      );
      setQuickAction("");
      setSelected(new Set());
    } finally {
      setSavingBulk(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h5">Roles ({rows.length})</Typography>
        <Stack direction="row" spacing={2}>
          <Button variant="outlined" startIcon={<ViewColumnOutlinedIcon />}>
            Column
          </Button>
          <Button
            variant="outlined"
            startIcon={<FileDownloadOutlinedIcon />}
            onClick={() => downloadText(toCsv(rows), "roles.csv")}
          >
            Export
          </Button>
          <Button variant="contained" onClick={() => navigate("/roles/new")}>
            + Add New
          </Button>
        </Stack>
      </Stack>

      <Paper elevation={0} sx={{ mt: 2, p: 2 }}>
        <Filters>
          <TextField
            select
            size="small"
            label="Quick Action"
            value={quickAction}
            onChange={(e) => setQuickAction(e.target.value)}
            sx={{ minWidth: 220 }}
            disabled={savingBulk}
          >
            <MenuItem value="">Select</MenuItem>
            <MenuItem value="set_available">Set Available</MenuItem>
            <MenuItem value="set_not_available">Set Not Available</MenuItem>
          </TextField>
          <Button
            variant="contained"
            disabled={!quickAction || !selected.size || savingBulk}
            onClick={() => applyQuickAction(quickAction)}
          >
            {savingBulk ? "Applying..." : "Apply"}
          </Button>
          <Search value={query} onChange={setQuery} placeholder="Search role/store/description" />
        </Filters>
      </Paper>

      {!rows.length ? (
        <EmptyState title="No roles" description="Create your first role." />
      ) : (
        <TableWrapper>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={allOnPageSelected}
                    indeterminate={someOnPageSelected}
                    onChange={(e) => toggleAllOnPage(e.target.checked)}
                  />
                </TableCell>
                <TableCell>Store</TableCell>
                <TableCell>Role Name</TableCell>
                <TableCell>Description</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Edit</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {paged.map((r) => (
                <TableRow key={r._id} hover>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selected.has(String(r._id))}
                      disabled={r.locked}
                      onChange={() => toggleOne(r._id)}
                    />
                  </TableCell>
                  <TableCell>{r.storeName}</TableCell>
                  <TableCell>{r.name}</TableCell>
                  <TableCell>{r.description || "-"}</TableCell>
                  <TableCell>
                    <Stack direction="row" spacing={1} alignItems="center">
                      {statusChip(!!r.isActive)}
                      {r.locked && (
                        <Chip
                          icon={<LockOutlinedIcon />}
                          label="System"
                          size="small"
                          variant="outlined"
                        />
                      )}
                    </Stack>
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" disabled={r.locked} onClick={() => navigate(`/roles/${r._id}`)}>
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          <TablePagination
            component="div"
            count={rows.length}
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
    </Box>
  );
};

export default AdminEmployeeRoleList;

