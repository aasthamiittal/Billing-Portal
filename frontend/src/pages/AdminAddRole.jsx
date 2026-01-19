import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Checkbox,
  Divider,
  FormControlLabel,
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
  Alert,
} from "@mui/material";
import { useNavigate, useParams } from "react-router-dom";
import Loader from "../components/Loader";
import { fetchStores } from "../services/storeService";
import { createRole, getRole, updateRole } from "../services/roleService";
import { fetchPermissionSchema } from "../services/permissionSchemaService";
import { useSelector } from "react-redux";

const LEVELS = { show: 1, read_only: 2, download: 2, read_write: 3 };
const isMasterRole = (role) => role?.scope === "GLOBAL" && String(role?.name || "").toLowerCase() === "master admin";

const isReportLike = (def) => (def.levels || []).includes("download") && !(def.levels || []).includes("read_write");

const levelToFlags = (def, level) => {
  const l = level;
  if (isReportLike(def)) {
    // Reports: show=view, download=download, undefined=no access
    return { read: l === "show" || l === "download", write: l === "download" };
  }
  // Regular modules: read_only/read_write enable access; show/undefined treated as no access in this UI.
  return { read: l === "read_only" || l === "read_write", write: l === "read_write" };
};

const flagsToLevel = (def, read, write) => {
  if (isReportLike(def)) {
    if (write) return "download";
    if (read) return "show";
    return null; // unchecked => remove permission
  }
  if (write) return "read_write";
  if (read) return "read_only";
  return null; // unchecked => remove permission
};

const setPermissionValue = (obj, moduleKey, action, valueOrNull) => {
  const next = { ...(obj || {}) };
  const mod = { ...(next[moduleKey] || {}) };

  if (valueOrNull == null) {
    delete mod[action];
  } else {
    mod[action] = valueOrNull;
  }

  if (Object.keys(mod).length) next[moduleKey] = mod;
  else delete next[moduleKey];

  return next;
};

const FUNCTIONALITY_ACCESS = [
  { key: "manual_discounts", label: "Manual Discounts" },
  { key: "order_void", label: "Order Void" },
  { key: "manager_override", label: "Manager Override" },
  { key: "create_child_store", label: "Create Child Store" },
];

const sanitizePermissionsForUi = (raw, schemaModules) => {
  if (!raw || typeof raw !== "object") return {};
  if (Array.isArray(raw)) return {};
  const allowed = schemaModules || {};
  const out = {};

  // Keep functionality flags (UI section)
  if (raw.functionality_access && typeof raw.functionality_access === "object" && !Array.isArray(raw.functionality_access)) {
    out.functionality_access = {};
    Object.entries(raw.functionality_access).forEach(([k, v]) => {
      if (/^\d+$/.test(k)) return;
      out.functionality_access[k] = v === "read_write" ? "read_write" : "show";
    });
  }

  Object.entries(allowed).forEach(([moduleKey, defs]) => {
    const actions = raw[moduleKey];
    if (!actions || typeof actions !== "object" || Array.isArray(actions)) return;
    out[moduleKey] = {};
    (defs || []).forEach((def) => {
      const val = actions?.[def.action];
      if (val == null) return;
      // Normalize to schema allowed levels
      if ((def.levels || []).includes(val)) {
        out[moduleKey][def.action] = val;
        return;
      }
      // Coerce legacy values into the closest level used by UI
      if ((def.levels || []).includes("download")) {
        out[moduleKey][def.action] = val === "download" || val === "read_write" ? "download" : "show";
        return;
      }
      if ((def.levels || []).includes("read_write")) {
        out[moduleKey][def.action] = val === "read_write" ? "read_write" : "read_only";
        return;
      }
      out[moduleKey][def.action] = "show";
    });
  });

  return out;
};

const AdminAddRole = () => {
  const { id } = useParams();
  const editing = !!id && id !== "new";
  const navigate = useNavigate();
  const user = useSelector((s) => s.auth.user);
  const isMaster = !!user?.isMasterAdmin;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [locked, setLocked] = useState(false);
  const [stores, setStores] = useState([]);
  const [schema, setSchema] = useState({ modules: {}, definitions: [] });

  const [form, setForm] = useState({
    storeId: "",
    name: "",
    description: "",
    isActive: true,
    permissions: {},
  });

  const [functionalityAccess, setFunctionalityAccess] = useState(() => ({}));

  useEffect(() => {
    const load = async () => {
      try {
        const [storeData, schemaData] = await Promise.all([fetchStores(), fetchPermissionSchema()]);
        setStores(storeData || []);
        setSchema(schemaData || { modules: {}, definitions: [] });

        if (editing) {
          const role = await getRole(id);
          const lockedRole = isMasterRole(role);
          setLocked(lockedRole);
          const cleanPerms = sanitizePermissionsForUi(role.permissions || {}, schemaData?.modules || {});
          setForm({
            storeId: role.store || "",
            name: role.name || "",
            description: role.description || "",
            isActive: typeof role.isActive === "boolean" ? role.isActive : true,
            permissions: cleanPerms,
          });
          setFunctionalityAccess(cleanPerms?.functionality_access || {});
          if (lockedRole) {
            setError("Master Admin role is system-managed. Edit is disabled here (DB-only).");
          }
        } else {
          // Default store selection
          const first = (storeData || [])[0]?._id || "";
          setForm((p) => ({ ...p, storeId: isMaster ? first : user?.store || first }));
        }
      } catch (e) {
        setError(e?.response?.data?.message || "Failed to load role editor");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [editing, id, isMaster, user?.store]);

  const modules = useMemo(() => schema.modules || {}, [schema]);

  const moduleKeys = useMemo(() => Object.keys(modules), [modules]);

  const setPermFlag = (moduleKey, def, flag, checked) => {
    if (locked) return;
    const current = form.permissions?.[moduleKey]?.[def.action];
    const flags = levelToFlags(def, current);
    const nextFlags = { ...flags, [flag]: checked };
    // dependency: write implies read; unchecking read disables write
    if (nextFlags.write) nextFlags.read = true;
    if (!nextFlags.read) nextFlags.write = false;

    const nextLevel = flagsToLevel(def, nextFlags.read, nextFlags.write);
    setForm((p) => ({
      ...p,
      permissions: setPermissionValue(p.permissions, moduleKey, def.action, nextLevel),
    }));
  };

  const setAllForModule = (moduleKey, mode) => {
    if (locked) return;
    // mode: "read" | "write" | "none"
    const defs = modules[moduleKey] || [];
    let nextPerms = { ...(form.permissions || {}) };
    defs.forEach((def) => {
      const reportLike = isReportLike(def);
      if (mode === "none") {
        nextPerms = setPermissionValue(nextPerms, moduleKey, def.action, null);
      } else if (mode === "read") {
        nextPerms = setPermissionValue(nextPerms, moduleKey, def.action, reportLike ? "show" : "read_only");
      } else if (mode === "write") {
        nextPerms = setPermissionValue(nextPerms, moduleKey, def.action, reportLike ? "download" : "read_write");
      }
    });
    setForm((p) => ({ ...p, permissions: nextPerms }));
  };

  const toggleSimpleGroup = (groupKey, itemKey, checked, setter, state) => {
    if (locked) return;
    setter({ ...(state || {}), [itemKey]: checked ? "read_write" : "show" });
    setForm((p) => ({ ...p, permissions: { ...(p.permissions || {}), [groupKey]: { ...(state || {}), [itemKey]: checked ? "read_write" : "show" } } }));
  };

  const handleSave = async () => {
    if (locked) return;
    setSaving(true);
    setError("");
    try {
      const payload = {
        name: form.name,
        description: form.description,
        scope: "STORE",
        storeId: form.storeId,
        isActive: form.isActive,
        permissions: {
          ...(form.permissions || {}),
          functionality_access: functionalityAccess || {},
        },
      };

      if (!editing) {
        const created = await createRole(payload);
        navigate(`/roles/${created._id}`, { replace: true });
      } else {
        await updateRole(id, payload);
        navigate("/roles");
      }
    } catch (e) {
      setError(e?.response?.data?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h5">{editing ? "Update Role" : "Add Role"}</Typography>
        <Button variant="contained" onClick={handleSave} disabled={locked || saving || !form.storeId || !form.name}>
          {saving ? "Saving..." : editing ? "Update" : "Submit"}
        </Button>
      </Stack>

      {error && (
        <Alert severity={locked ? "warning" : "error"} sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Paper elevation={0} sx={{ p: 2 }}>
        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
          Basic Details
        </Typography>
        <Stack spacing={2}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2}>
            <TextField
              select
              label="Store ID"
              value={form.storeId}
              onChange={(e) => setForm((p) => ({ ...p, storeId: e.target.value }))}
              required
              disabled={locked || editing || (!isMaster && !user?.access?.is_parent_admin)}
              sx={{ minWidth: 260 }}
            >
              <MenuItem value="">Select store</MenuItem>
              {stores.map((s) => (
                <MenuItem key={s._id} value={s._id}>
                  {s.code} - {s.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Role Name"
              value={form.name}
              onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
              required
              disabled={locked}
              sx={{ flex: 1 }}
            />
          </Stack>
          <TextField
            label="Description"
            value={form.description}
            onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
            required
            disabled={locked}
          />
          <TextField
            select
            label="Status"
            value={form.isActive ? "ACTIVE" : "INACTIVE"}
            onChange={(e) => setForm((p) => ({ ...p, isActive: e.target.value === "ACTIVE" }))}
            disabled={locked}
            sx={{ width: 220 }}
          >
            <MenuItem value="ACTIVE">Available</MenuItem>
            <MenuItem value="INACTIVE">Not Available</MenuItem>
          </TextField>
        </Stack>

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
          Functionality Access
        </Typography>
        <Stack direction={{ xs: "column", md: "row" }} flexWrap="wrap" gap={2}>
          {FUNCTIONALITY_ACCESS.map((p) => {
            const checked = (functionalityAccess?.[p.key] || "show") !== "show";
            return (
              <FormControlLabel
                key={p.key}
                control={
                  <Checkbox
                    checked={checked}
                    onChange={(e) =>
                      toggleSimpleGroup("functionality_access", p.key, e.target.checked, setFunctionalityAccess, functionalityAccess)
                    }
                  />
                }
                label={p.label}
              />
            );
          })}
        </Stack>

        <Divider sx={{ my: 2 }} />

        <Typography variant="subtitle1" sx={{ fontWeight: 700, mb: 1 }}>
          Module Permissions
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          Write implies Read. Unchecking Read will also disable Write. For reports, the second checkbox means Download.
        </Typography>

        {!moduleKeys.length ? (
          <Alert severity="warning">No permission schema loaded.</Alert>
        ) : (
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 800 }}>Module</TableCell>
                <TableCell sx={{ fontWeight: 800 }}>Submodule</TableCell>
                <TableCell sx={{ fontWeight: 800, width: 160 }}>Read / View</TableCell>
                <TableCell sx={{ fontWeight: 800, width: 200 }}>Write / Download</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {moduleKeys.map((moduleKey) => {
                const defs = modules[moduleKey] || [];
                const anyReportLike = defs.some((d) => isReportLike(d));
                const moduleLabel = schema.moduleLabels?.[moduleKey] || moduleKey;
                return (
                  <>
                    <TableRow key={`hdr.${moduleKey}`} hover>
                      <TableCell sx={{ fontWeight: 900 }}>{moduleLabel}</TableCell>
                      <TableCell colSpan={3}>
                        <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                          <FormControlLabel
                            control={<Checkbox onChange={(e) => setAllForModule(moduleKey, e.target.checked ? "read" : "none")} />}
                            label={anyReportLike ? "All View Only" : "All Read Only"}
                          />
                          <FormControlLabel
                            control={<Checkbox onChange={(e) => setAllForModule(moduleKey, e.target.checked ? "write" : "none")} />}
                            label={anyReportLike ? "All View & Download" : "All Read & Write"}
                          />
                        </Stack>
                      </TableCell>
                    </TableRow>
                    {defs.map((def) => {
                      const current = form.permissions?.[moduleKey]?.[def.action] || def.defaultLevel || "show";
                      const flags = levelToFlags(def, current);
                      const label2 = isReportLike(def) ? "Download" : "Write";
                      return (
                        <TableRow key={`${moduleKey}.${def.action}`} hover>
                          <TableCell />
                          <TableCell sx={{ fontWeight: 700 }}>{def.label || def.action}</TableCell>
                          <TableCell>
                            <Checkbox
                              checked={!!flags.read}
                              onChange={(e) => setPermFlag(moduleKey, def, "read", e.target.checked)}
                            />
                          </TableCell>
                          <TableCell>
                            <FormControlLabel
                              control={
                                <Checkbox
                                  checked={!!flags.write}
                                  onChange={(e) => setPermFlag(moduleKey, def, "write", e.target.checked)}
                                />
                              }
                              label={label2}
                            />
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </>
                );
              })}
            </TableBody>
          </Table>
        )}
      </Paper>
    </Box>
  );
};

export default AdminAddRole;

