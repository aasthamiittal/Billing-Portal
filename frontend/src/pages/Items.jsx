import { useEffect, useMemo, useState } from "react";
import { useSelector } from "react-redux";
import {
  Typography,
  Chip,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Stack,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Paper,
  Checkbox,
  ListItemText,
} from "@mui/material";
import TableWrapper from "../components/TableWrapper";
import Loader from "../components/Loader";
import EmptyState from "../components/EmptyState";
import Filters from "../components/Filters";
import Search from "../components/Search";
import { fetchItems, createItem, updateItem } from "../services/itemService";
import { fetchStores } from "../services/storeService";
import { fetchCategories } from "../services/categoryService";
import { listCatalog } from "../services/catalogService";

const Items = () => {
  const user = useSelector((state) => state.auth.user);
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [stores, setStores] = useState([]);
  const [categories, setCategories] = useState([]);
  const [taxes, setTaxes] = useState([]);
  const [query, setQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [form, setForm] = useState({
    name: "",
    categoryIds: [],
    taxIds: [],
    description: "",
    defaultPrice: "",
    storeId: "",
  });

  useEffect(() => {
    const load = async () => {
      try {
        const [itemsData, storesData] = await Promise.all([
          fetchItems(),
          fetchStores(),
        ]);
        setItems(itemsData);
        setStores(storesData);
        const defaultStore = user?.isMasterAdmin
          ? storesData.length === 1
            ? storesData[0]._id
            : ""
          : user?.store || storesData[0]?._id || "";
        if (defaultStore) {
          setForm((prev) => ({ ...prev, storeId: defaultStore }));
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.isMasterAdmin, user?.store]);

  useEffect(() => {
    const load = async () => {
      if (!form.storeId) return;
      const [catData, taxData] = await Promise.all([
        fetchCategories(form.storeId),
        listCatalog("taxes", { storeId: form.storeId }),
      ]);
      setCategories(catData || []);
      setTaxes((taxData || []).filter((t) => t.isActive));
      // Reset categories if they don't belong to the new store
      if (form.categoryIds?.length) {
        const validIds = new Set(catData?.map((c) => String(c._id)));
        const nextCategoryIds = form.categoryIds.filter((id) => validIds.has(String(id)));
        if (nextCategoryIds.length !== form.categoryIds.length) {
          setForm((prev) => ({ ...prev, categoryIds: nextCategoryIds }));
        }
      }
      if (form.taxIds?.length) {
        const validIds = new Set(taxData?.map((t) => String(t._id)));
        const nextTaxIds = form.taxIds.filter((id) => validIds.has(String(id)));
        if (nextTaxIds.length !== form.taxIds.length) {
          setForm((prev) => ({ ...prev, taxIds: nextTaxIds }));
        }
      }
    };
    load();
  }, [form.storeId, form.categoryIds, form.taxIds]);

  const filteredItems = useMemo(() => {
    if (!query) return items;
    const lower = query.toLowerCase();
    const filtered = items.filter((item) => item.name.toLowerCase().includes(lower));
    if (!form.storeId) return filtered;
    return filtered.filter((item) => String(item.store) === String(form.storeId));
  }, [items, query]);

  const resetForm = () => {
    setForm({
      name: "",
      categoryIds: [],
      taxIds: [],
      description: "",
      defaultPrice: "",
      storeId: user?.isMasterAdmin
        ? stores.length === 1
          ? stores[0]._id
          : ""
        : user?.store || stores[0]?._id || "",
    });
  };

  const openCreate = () => {
    setEditingItem(null);
    resetForm();
    setDialogOpen(true);
  };

  const openEdit = (item) => {
    setEditingItem(item);
    setForm({
      name: item.name || "",
      categoryIds: item.categoryIds?.length ? item.categoryIds : item.categoryId ? [item.categoryId] : [],
      taxIds: item.taxIds?.length ? item.taxIds : item.taxId ? [item.taxId] : [],
      description: item.description || "",
      defaultPrice: item.defaultPrice ?? "",
      storeId: item.store || "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const selectedStore = stores.find((store) => store._id === form.storeId);
    const payload = {
      name: form.name,
      categoryIds: form.categoryIds,
      taxIds: form.taxIds,
      description: form.description,
      defaultPrice: Number(form.defaultPrice || 0),
      storeId: form.storeId || undefined,
      industryId: selectedStore?.industry?._id,
    };
    setSaving(true);
    try {
      if (editingItem) {
        const updated = await updateItem(editingItem._id, payload);
        setItems((prev) =>
          prev.map((item) => (item._id === updated._id ? updated : item))
        );
      } else {
        const created = await createItem(payload);
        setItems((prev) => [created, ...prev]);
      }
      setDialogOpen(false);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h5">Items</Typography>
        <Button variant="contained" onClick={openCreate}>
          Add Item
        </Button>
      </Stack>

      <Paper elevation={0} sx={{ mt: 2, p: 2 }}>
        <Filters>
          <Search value={query} onChange={setQuery} placeholder="Search items" />
          <TextField
            select
            size="small"
            label="Store"
            value={form.storeId}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, storeId: event.target.value }))
            }
            fullWidth
            disabled={!user?.isMasterAdmin}
          >
            {stores.map((store) => (
              <MenuItem key={store._id} value={store._id}>
                {store.name}
              </MenuItem>
            ))}
          </TextField>
        </Filters>
      </Paper>

      {!filteredItems.length ? (
        <EmptyState title="No items" description="Add your first item." />
      ) : (
        <TableWrapper>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Name</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Price</TableCell>
                <TableCell>Tax</TableCell>
                <TableCell>Stock</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredItems.map((item) => (
                <TableRow key={item._id}>
                  <TableCell>{item.name}</TableCell>
                <TableCell>
                  {item.categoryNames?.length ? item.categoryNames.join(", ") : item.categoryName || "-"}
                </TableCell>
                  <TableCell>{item.defaultPrice}</TableCell>
                <TableCell>{item.taxNames?.length ? item.taxNames.join(", ") : "-"}</TableCell>
                  <TableCell>
                    {item.isOutOfStock ? (
                      <Chip size="small" color="error" label="Out of stock" />
                    ) : (
                      Number(item.stockQty || 0).toFixed(2)
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Button size="small" onClick={() => openEdit(item)}>
                      Edit
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableWrapper>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>{editingItem ? "Edit Item" : "Create Item"}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField
              label="Name"
              value={form.name}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, name: event.target.value }))
              }
              required
            />
            <TextField
              select
              label="Categories"
              value={form.categoryIds}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, categoryIds: event.target.value }))
              }
              SelectProps={{
                multiple: true,
                renderValue: (selected) =>
                  categories
                    .filter((c) => selected.includes(c._id))
                    .map((c) => c.name)
                    .join(", "),
              }}
              required
            >
              {categories.map((c) => (
                <MenuItem key={c._id} value={c._id}>
                  <Checkbox checked={form.categoryIds.indexOf(c._id) > -1} />
                  <ListItemText primary={c.name} />
                </MenuItem>
              ))}
            </TextField>
            <TextField
              select
              label="Taxes"
              value={form.taxIds}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, taxIds: event.target.value }))
              }
              SelectProps={{
                multiple: true,
                renderValue: (selected) =>
                  taxes
                    .filter((t) => selected.includes(t._id))
                    .map((t) => `${t.name} (${Number(t.value || 0).toFixed(2)}%)`)
                    .join(", "),
              }}
              required
            >
              {taxes.map((t) => (
                <MenuItem key={t._id} value={t._id}>
                  <Checkbox checked={form.taxIds.indexOf(t._id) > -1} />
                  <ListItemText primary={`${t.name} (${Number(t.value || 0).toFixed(2)}%)`} />
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Description"
              multiline
              minRows={3}
              value={form.description}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, description: event.target.value }))
              }
            />
            <TextField
              select
              label="Store"
              value={form.storeId}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, storeId: event.target.value }))
              }
              required
            >
              {stores.map((store) => (
                <MenuItem key={store._id} value={store._id}>
                  {store.name}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              label="Default Price"
              type="number"
              value={form.defaultPrice}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, defaultPrice: event.target.value }))
              }
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving || !form.name || !form.storeId || !form.categoryIds.length || !form.taxIds.length}
          >
            {saving ? "Saving..." : "Save"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default Items;
