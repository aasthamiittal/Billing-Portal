import { useEffect, useMemo, useState } from "react";
import {
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Paper,
  IconButton,
  MenuItem,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import TableWrapper from "../components/TableWrapper";
import Loader from "../components/Loader";
import EmptyState from "../components/EmptyState";
import Filters from "../components/Filters";
import Search from "../components/Search";
import {
  fetchInvoices,
  createInvoice,
  downloadInvoiceExcel,
  downloadInvoicePdf,
} from "../services/invoiceService";
import { downloadBlob } from "../utils/download";
import { fetchStores } from "../services/storeService";

const Invoices = () => {
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState([]);
  const [stores, setStores] = useState([]);
  const [query, setQuery] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    customerName: "",
    customerEmail: "",
    currency: "INR",
    notes: "",
    storeId: "",
  });
  const [items, setItems] = useState([
    { description: "", quantity: 1, unitPrice: 0, taxRate: 0, discount: 0 },
  ]);

  useEffect(() => {
    const load = async () => {
      try {
        const [invoiceData, storeData] = await Promise.all([
          fetchInvoices(),
          fetchStores(),
        ]);
        setInvoices(invoiceData);
        setStores(storeData);
        if (storeData.length === 1) {
          setForm((prev) => ({ ...prev, storeId: storeData[0]._id }));
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const filteredInvoices = useMemo(() => {
    if (!query) return invoices;
    const lower = query.toLowerCase();
    return invoices.filter((invoice) =>
      invoice.invoiceNumber.toLowerCase().includes(lower)
    );
  }, [invoices, query]);

  const totals = useMemo(() => {
    let subtotal = 0;
    let tax = 0;
    let discount = 0;
    items.forEach((item) => {
      subtotal += Number(item.unitPrice || 0) * Number(item.quantity || 0);
      tax +=
        (Number(item.unitPrice || 0) *
          Number(item.quantity || 0) *
          Number(item.taxRate || 0)) /
        100;
      discount += Number(item.discount || 0);
    });
    const total = subtotal + tax - discount;
    return { subtotal, tax, discount, total };
  }, [items]);

  const openCreate = () => {
    setForm({
      customerName: "",
      customerEmail: "",
      currency: "INR",
      notes: "",
      storeId: stores.length === 1 ? stores[0]._id : "",
    });
    setItems([{ description: "", quantity: 1, unitPrice: 0, taxRate: 0, discount: 0 }]);
    setDialogOpen(true);
  };

  const handleAddItem = () => {
    setItems((prev) => [
      ...prev,
      { description: "", quantity: 1, unitPrice: 0, taxRate: 0, discount: 0 },
    ]);
  };

  const handleRemoveItem = (index) => {
    setItems((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleItemChange = (index, field, value) => {
    setItems((prev) =>
      prev.map((item, idx) =>
        idx === index ? { ...item, [field]: value } : item
      )
    );
  };

  const handleSave = async () => {
    const selectedStore = stores.find((store) => store._id === form.storeId);
    if (!selectedStore) return;
    const payload = {
      storeId: selectedStore._id,
      industryId: selectedStore.industry?._id,
      customerName: form.customerName,
      customerEmail: form.customerEmail,
      currency: form.currency,
      notes: form.notes,
      items: items.map((item) => ({
        description: item.description,
        quantity: Number(item.quantity || 0),
        unitPrice: Number(item.unitPrice || 0),
        taxRate: Number(item.taxRate || 0),
        discount: Number(item.discount || 0),
      })),
    };
    setSaving(true);
    try {
      const created = await createInvoice(payload);
      setInvoices((prev) => [created, ...prev]);
      setDialogOpen(false);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <Loader />;

  return (
    <>
      <Stack direction="row" justifyContent="space-between" alignItems="center">
        <Typography variant="h5">Invoices</Typography>
        <Button variant="contained" onClick={openCreate}>
          Create Invoice
        </Button>
      </Stack>

      <Paper elevation={0} sx={{ mt: 2, p: 2 }}>
        <Filters>
          <Search value={query} onChange={setQuery} placeholder="Search invoices" />
          <TextField
            select
            size="small"
            label="Store"
            value={form.storeId}
            onChange={(event) =>
              setForm((prev) => ({ ...prev, storeId: event.target.value }))
            }
            fullWidth
          >
            {stores.map((store) => (
              <MenuItem key={store._id} value={store._id}>
                {store.name}
              </MenuItem>
            ))}
          </TextField>
        </Filters>
      </Paper>

      {!filteredInvoices.length ? (
        <EmptyState title="No invoices" description="Create your first invoice." />
      ) : (
        <TableWrapper>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Invoice #</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Total</TableCell>
                <TableCell>Issued At</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredInvoices.map((invoice) => (
                <TableRow key={invoice._id}>
                  <TableCell>{invoice.invoiceNumber}</TableCell>
                  <TableCell>{invoice.status}</TableCell>
                  <TableCell>{invoice.totals?.total?.toFixed(2)}</TableCell>
                  <TableCell>{new Date(invoice.issuedAt).toLocaleDateString()}</TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      <Button
                        size="small"
                        onClick={async () => {
                          const response = await downloadInvoicePdf(invoice._id);
                          downloadBlob(
                            response.data,
                            `${invoice.invoiceNumber}.pdf`
                          );
                        }}
                      >
                        PDF
                      </Button>
                      <Button
                        size="small"
                        onClick={async () => {
                          const response = await downloadInvoiceExcel(invoice._id);
                          downloadBlob(
                            response.data,
                            `${invoice.invoiceNumber}.xlsx`
                          );
                        }}
                      >
                        Excel
                      </Button>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableWrapper>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>Create Invoice</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Filters>
              <TextField
                label="Customer Name"
                value={form.customerName}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, customerName: event.target.value }))
                }
              />
              <TextField
                label="Customer Email"
                type="email"
                value={form.customerEmail}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, customerEmail: event.target.value }))
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
                label="Currency"
                value={form.currency}
                onChange={(event) =>
                  setForm((prev) => ({ ...prev, currency: event.target.value }))
                }
              />
            </Filters>
            <TextField
              label="Notes"
              multiline
              minRows={2}
              value={form.notes}
              onChange={(event) =>
                setForm((prev) => ({ ...prev, notes: event.target.value }))
              }
            />

            <Typography variant="subtitle1">Line Items</Typography>
            {items.map((item, index) => (
              <Paper key={index} elevation={0} sx={{ p: 2 }}>
                <Stack spacing={2}>
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography variant="subtitle2">Item {index + 1}</Typography>
                    {items.length > 1 && (
                      <IconButton size="small" onClick={() => handleRemoveItem(index)}>
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    )}
                  </Stack>
                  <TextField
                    label="Description"
                    value={item.description}
                    onChange={(event) =>
                      handleItemChange(index, "description", event.target.value)
                    }
                  />
                  <Filters>
                    <TextField
                      label="Quantity"
                      type="number"
                      value={item.quantity}
                      onChange={(event) =>
                        handleItemChange(index, "quantity", event.target.value)
                      }
                    />
                    <TextField
                      label="Unit Price"
                      type="number"
                      value={item.unitPrice}
                      onChange={(event) =>
                        handleItemChange(index, "unitPrice", event.target.value)
                      }
                    />
                    <TextField
                      label="Tax Rate (%)"
                      type="number"
                      value={item.taxRate}
                      onChange={(event) =>
                        handleItemChange(index, "taxRate", event.target.value)
                      }
                    />
                    <TextField
                      label="Discount"
                      type="number"
                      value={item.discount}
                      onChange={(event) =>
                        handleItemChange(index, "discount", event.target.value)
                      }
                    />
                  </Filters>
                </Stack>
              </Paper>
            ))}
            <Button startIcon={<AddIcon />} onClick={handleAddItem}>
              Add line item
            </Button>

            <Paper elevation={0} sx={{ p: 2 }}>
              <Stack spacing={1}>
                <Typography variant="subtitle2">
                  Subtotal: {totals.subtotal.toFixed(2)}
                </Typography>
                <Typography variant="subtitle2">Tax: {totals.tax.toFixed(2)}</Typography>
                <Typography variant="subtitle2">
                  Discount: {totals.discount.toFixed(2)}
                </Typography>
                <Typography variant="h6">Total: {totals.total.toFixed(2)}</Typography>
              </Stack>
            </Paper>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSave}
            disabled={saving || !form.storeId || items.length === 0}
          >
            {saving ? "Saving..." : "Create Invoice"}
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default Invoices;
