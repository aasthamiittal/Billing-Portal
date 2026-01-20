import { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Chip,
  Collapse,
  Divider,
  Grid,
  IconButton,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import AddOutlinedIcon from "@mui/icons-material/AddOutlined";
import RemoveCircleOutlineIcon from "@mui/icons-material/RemoveCircleOutline";
import SaveOutlinedIcon from "@mui/icons-material/SaveOutlined";
import CloseOutlinedIcon from "@mui/icons-material/CloseOutlined";
import DownloadOutlinedIcon from "@mui/icons-material/DownloadOutlined";
import { useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import Loader from "../components/Loader";
import EmptyState from "../components/EmptyState";
import { fetchItems } from "../services/itemService";
import { listCatalog } from "../services/catalogService";
import { fetchStores } from "../services/storeService";
import { createInvoice, downloadInvoiceExcel, downloadInvoicePdf } from "../services/invoiceService";
import api from "../services/api";
import { downloadBlob } from "../utils/download";
import { hasPermission } from "../utils/permissions";

const QuickBilling = () => {
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth.user);

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);
  const [stores, setStores] = useState([]);
  const [storeId, setStoreId] = useState("");
  const [storeLabel, setStoreLabel] = useState("");

  const [query, setQuery] = useState("");
  const [cart, setCart] = useState([]);

  const [paidStatus, setPaidStatus] = useState("PENDING");
  const [paymentTypeId, setPaymentTypeId] = useState("");
  const [orderTypeId, setOrderTypeId] = useState("");
  const [discountId, setDiscountId] = useState("");
  const [discountValue, setDiscountValue] = useState(0);
  const [referenceNo, setReferenceNo] = useState("");

  const [showCustomer, setShowCustomer] = useState(false);
  const [customer, setCustomer] = useState({ name: "", email: "" });

  const [savingDraft, setSavingDraft] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState(null); // { id, invoiceNumber }

  const canCreate = hasPermission(user, "store_management", "quick_bill", "read_write");
  const canDraft = hasPermission(user, "store_management", "save_draft", "read_write");
  // Optional functionality toggles (UI-only). You can later enforce these server-side if needed.
  const canEditPrice = (user?.permissions?.functionality_access?.manager_override || "show") !== "show";
  const canDiscount = (user?.permissions?.functionality_access?.manual_discounts || "show") !== "show";
  const canPdf = hasPermission(user, "store_management", "invoice_download", "download");
  const canExcel = hasPermission(user, "store_management", "invoice_download", "download");

  const [orderTypes, setOrderTypes] = useState([]);
  const [paymentTypes, setPaymentTypes] = useState([]);
  const [discounts, setDiscounts] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const [itemData, storeData] = await Promise.all([fetchItems(), fetchStores()]);
        setItems(itemData);
        setStores(storeData);
        const resolvedStore = user?.store || storeData?.[0]?._id || "";
        setStoreId(resolvedStore);
        setStoreLabel(storeData.find((s) => String(s._id) === String(resolvedStore))?.name || "");
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user?.store]);

  useEffect(() => {
    const load = async () => {
      if (!storeId) return;
      const [orders, payments, disc] = await Promise.all([
        listCatalog("order-types", { storeId }),
        listCatalog("payment-types", { storeId }),
        listCatalog("discounts", { storeId }),
      ]);
      const orderRows = (orders || []).filter((o) => o.isActive);
      const paymentRows = (payments || []).filter((p) => p.isActive);
      const discountRows = (disc || []).filter((d) => d.isActive);
      setOrderTypes(orderRows);
      setPaymentTypes(paymentRows);
      setDiscounts(discountRows);
      // Reset selections if they don't belong to store
      if (orderTypeId && !orderRows?.some((o) => String(o._id) === String(orderTypeId))) setOrderTypeId("");
      if (paymentTypeId && !paymentRows?.some((p) => String(p._id) === String(paymentTypeId))) setPaymentTypeId("");
      if (discountId && !discountRows?.some((d) => String(d._id) === String(discountId))) {
        setDiscountId("");
        setDiscountValue(0);
      }
    };
    load();
  }, [storeId, orderTypeId, paymentTypeId, discountId]);

  const filteredItems = useMemo(() => {
    if (!query) return items.slice(0, 20);
    const lower = query.toLowerCase();
    const storeFiltered = items.filter((i) => !storeId || String(i.store) === String(storeId));
    return storeFiltered
      .filter(
        (i) =>
          i.name?.toLowerCase().includes(lower) ||
          ((i.categoryNames?.length ? i.categoryNames.join(" ") : i.categoryName || "") || "")
            .toLowerCase()
            .includes(lower) ||
          i.description?.toLowerCase().includes(lower)
      )
      .slice(0, 50);
  }, [items, query, storeId]);

  const addToCart = (item) => {
    if (item.isOutOfStock || Number(item.stockQty || 0) <= 0) return;
    setCart((prev) => {
      const existing = prev.find((c) => c.itemId === item._id);
      if (existing) {
        return prev.map((c) => (c.itemId === item._id ? { ...c, quantity: c.quantity + 1 } : c));
      }
      return [
        ...prev,
        {
          itemId: item._id,
          name: item.name,
          quantity: 1,
          unitPrice: Number(item.defaultPrice || 0),
          taxRate: Number(item.taxRate || 0),
          taxNames: item.taxNames?.length ? item.taxNames : item.taxName ? [item.taxName] : [],
        },
      ];
    });
  };

  const updateCart = (itemId, patch) => {
    setCart((prev) => prev.map((c) => (c.itemId === itemId ? { ...c, ...patch } : c)));
  };

  const removeFromCart = (itemId) => {
    setCart((prev) => prev.filter((c) => c.itemId !== itemId));
  };

  const totals = useMemo(() => {
    let subtotal = 0;
    let tax = 0;
    cart.forEach((c) => {
      subtotal += c.unitPrice * c.quantity;
      tax += (c.unitPrice * c.quantity * c.taxRate) / 100;
    });
    const percent = Math.max(0, Math.min(100, Number(discountValue || 0)));
    const invoiceDiscount = (subtotal * percent) / 100;
    const totalDiscount = invoiceDiscount;
    const total = subtotal + tax - totalDiscount;
    return { subtotal, tax, discount: totalDiscount, total };
  }, [cart, discountValue]);

  const handleSaveDraft = async () => {
    if (!canDraft) return;
    if (!orderTypeId || !paymentTypeId || !discountId) return;
    setSavingDraft(true);
    try {
      const selectedStore = stores.find((s) => s._id === storeId);
      if (!selectedStore) return;
      const payload = {
        storeId: selectedStore._id,
        industryId: selectedStore.industry?._id,
        customerName: customer.name,
        customerEmail: customer.email,
        currency: "INR",
        notes: "",
        orderTypeId: orderTypeId || undefined,
        paymentTypeId: paymentTypeId || undefined,
        discountId: discountId || undefined,
        discountValue: Number(discountValue || 0),
        items: cart.map((c) => ({
          item: c.itemId,
          description: c.name,
          quantity: c.quantity,
          unitPrice: c.unitPrice,
          taxRate: c.taxRate,
          discount: 0,
        })),
      };
      const { data } = await api.post("/invoices/draft", payload);
      setGenerated({ id: data._id, invoiceNumber: data.invoiceNumber });
    } finally {
      setSavingDraft(false);
    }
  };

  const handleGenerate = async () => {
    if (!canCreate) return;
    if (!orderTypeId || !paymentTypeId || !discountId) return;
    setGenerating(true);
    try {
      const selectedStore = stores.find((s) => s._id === storeId);
      if (!selectedStore) return;
      const payload = {
        storeId: selectedStore._id,
        industryId: selectedStore.industry?._id,
        customerName: customer.name,
        customerEmail: customer.email,
        currency: "INR",
        notes: "",
        orderTypeId: orderTypeId || undefined,
        paymentTypeId: paymentTypeId || undefined,
        discountId: discountId || undefined,
        discountValue: Number(discountValue || 0),
        items: cart.map((c) => ({
          item: c.itemId,
          description: c.name,
          quantity: c.quantity,
          unitPrice: c.unitPrice,
          taxRate: c.taxRate,
          discount: 0,
        })),
      };
      const invoice = await createInvoice(payload);
      setGenerated({ id: invoice._id, invoiceNumber: invoice.invoiceNumber });
    } finally {
      setGenerating(false);
    }
  };

  const handleNewBill = () => {
    setQuery("");
    setCart([]);
    setPaidStatus("PENDING");
    setPaymentTypeId("");
    setOrderTypeId("");
    setDiscountId("");
    setDiscountValue(0);
    setReferenceNo("");
    setCustomer({ name: "", email: "" });
    setGenerated(null);
  };

  if (loading) return <Loader />;

  return (
    <Box>
      <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
        <Typography variant="h5">Quick Billing</Typography>
        <Stack direction="row" spacing={1}>
          <Button variant="outlined" startIcon={<CloseOutlinedIcon />} onClick={() => navigate("/")}>
            Cancel
          </Button>
          <Tooltip title={!canDraft ? "Not allowed: billing:draft:create" : ""} disableHoverListener={canDraft}>
            <span>
              <Button
                variant="outlined"
                startIcon={<SaveOutlinedIcon />}
                onClick={handleSaveDraft}
                disabled={!canDraft || savingDraft || cart.length === 0 || !storeId || !orderTypeId || !paymentTypeId || !discountId}
              >
                {savingDraft ? "Saving..." : "Save as Draft"}
              </Button>
            </span>
          </Tooltip>
          <Tooltip title={!canCreate ? "Not allowed: billing:create" : ""} disableHoverListener={canCreate}>
            <span>
              <Button
                variant="contained"
                sx={{ bgcolor: "#39A1F7" }}
                onClick={handleGenerate}
                disabled={!canCreate || generating || cart.length === 0 || !storeId || !orderTypeId || !paymentTypeId || !discountId}
              >
                {generating ? "Generating..." : "Generate Invoice"}
              </Button>
            </span>
          </Tooltip>
        </Stack>
      </Stack>

      {generated && (
        <Paper elevation={0} sx={{ p: 2, mb: 2 }}>
          <Stack direction={{ xs: "column", md: "row" }} spacing={2} alignItems={{ md: "center" }}>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Invoice created: {generated.invoiceNumber}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                You can download PDF/Excel or start a new bill.
              </Typography>
            </Box>
            <Stack direction="row" spacing={1}>
              <Tooltip title={!canPdf ? "Not allowed: invoice:download:pdf" : ""} disableHoverListener={canPdf}>
                <span>
                  <Button
                    variant="outlined"
                    startIcon={<DownloadOutlinedIcon />}
                    disabled={!canPdf}
                    onClick={async () => {
                      const response = await downloadInvoicePdf(generated.id);
                      downloadBlob(response.data, `${generated.invoiceNumber}.pdf`);
                    }}
                  >
                    PDF
                  </Button>
                </span>
              </Tooltip>
              <Tooltip title={!canExcel ? "Not allowed: invoice:download:excel" : ""} disableHoverListener={canExcel}>
                <span>
                  <Button
                    variant="outlined"
                    startIcon={<DownloadOutlinedIcon />}
                    disabled={!canExcel}
                    onClick={async () => {
                      const response = await downloadInvoiceExcel(generated.id);
                      downloadBlob(response.data, `${generated.invoiceNumber}.xlsx`);
                    }}
                  >
                    Excel
                  </Button>
                </span>
              </Tooltip>
              <Button variant="contained" onClick={handleNewBill}>
                New Bill
              </Button>
            </Stack>
          </Stack>
        </Paper>
      )}

      <Grid container spacing={2}>
        {/* Left: item search + quick add + cart */}
        <Grid item xs={12} md={7}>
          <Paper elevation={0} sx={{ p: 2 }}>
            <Stack spacing={2}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <TextField
                  label="Search items"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search by name/category"
                  fullWidth
                />
                <TextField
                  label="Store"
                  value={storeLabel || "-"}
                  sx={{ minWidth: 220 }}
                  InputProps={{ readOnly: true }}
                />
              </Stack>

              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Quick add
                </Typography>
                {!filteredItems.length ? (
                  <EmptyState title="No items" description="Add items to start billing." />
                ) : (
                  <Stack direction="row" flexWrap="wrap" gap={1}>
                    {filteredItems.map((i) => {
                      const outOfStock = i.isOutOfStock || Number(i.stockQty || 0) <= 0;
                      return (
                        <Chip
                          key={i._id}
                          label={`${i.name} • ₹${Number(i.defaultPrice || 0).toFixed(0)}${outOfStock ? " • Out of stock" : ""}`}
                          variant="outlined"
                          onClick={() => addToCart(i)}
                          clickable={!outOfStock}
                          disabled={outOfStock}
                          color={outOfStock ? "error" : "default"}
                          size="small"
                          sx={{ borderColor: outOfStock ? "rgba(239, 68, 68, 0.6)" : "rgba(57, 161, 247, 0.45)" }}
                        />
                      );
                    })}
                  </Stack>
                )}
              </Box>

              <Divider />

              <Box>
                <Typography variant="subtitle2" sx={{ mb: 1 }}>
                  Cart
                </Typography>
                {!cart.length ? (
                  <EmptyState title="Cart is empty" description="Search and add items to start." />
                ) : (
                  <Stack spacing={1}>
                    {cart.map((c) => (
                      <Paper key={c.itemId} variant="outlined" sx={{ p: 1.5 }}>
                        <Grid container spacing={1} alignItems="center">
                          <Grid item xs={12} md={4}>
                            <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                              {c.name}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              Taxes: {c.taxNames?.length ? c.taxNames.join(", ") : "-"} • {c.taxRate}%
                            </Typography>
                          </Grid>
                          <Grid item xs={6} md={2}>
                            <TextField
                              label="Qty"
                              type="number"
                              size="small"
                              value={c.quantity}
                              onChange={(e) =>
                                updateCart(c.itemId, { quantity: Math.max(1, Number(e.target.value || 1)) })
                              }
                              fullWidth
                            />
                          </Grid>
                          <Grid item xs={6} md={2}>
                            <Tooltip
                              title={!canEditPrice ? "Not allowed: invoice:price:edit" : ""}
                              disableHoverListener={canEditPrice}
                            >
                              <span>
                                <TextField
                                  label="Price"
                                  type="number"
                                  size="small"
                                  value={c.unitPrice}
                                  onChange={(e) => updateCart(c.itemId, { unitPrice: Number(e.target.value || 0) })}
                                  fullWidth
                                  disabled={!canEditPrice}
                                />
                              </span>
                            </Tooltip>
                          </Grid>
                          <Grid item xs={6} md={2}>
                            <Box />
                          </Grid>
                          <Grid item xs={6} md={2} sx={{ textAlign: "right" }}>
                            <IconButton onClick={() => removeFromCart(c.itemId)}>
                              <RemoveCircleOutlineIcon />
                            </IconButton>
                          </Grid>
                        </Grid>
                      </Paper>
                    ))}
                  </Stack>
                )}
              </Box>
            </Stack>
          </Paper>
        </Grid>

        {/* Right: summary + payment */}
        <Grid item xs={12} md={5}>
          <Paper elevation={0} sx={{ p: 2 }}>
            <Stack spacing={2}>
              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Bill Summary
              </Typography>
              <Stack spacing={1}>
                <Stack direction="row" justifyContent="space-between">
                  <Typography color="text.secondary">Subtotal</Typography>
                  <Typography>₹ {totals.subtotal.toFixed(2)}</Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography color="text.secondary">Tax</Typography>
                  <Typography>₹ {totals.tax.toFixed(2)}</Typography>
                </Stack>
                <Stack direction="row" justifyContent="space-between">
                  <Typography color="text.secondary">Discount</Typography>
                  <Typography>₹ {totals.discount.toFixed(2)}</Typography>
                </Stack>
                <Divider />
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                  <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                    Total
                  </Typography>
                  <Typography variant="h6" sx={{ fontWeight: 800, color: "#39A1F7" }}>
                    ₹ {totals.total.toFixed(2)}
                  </Typography>
                </Stack>
              </Stack>

              <Divider />

              <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                Payment
              </Typography>
              <TextField
                select
                label="Order Type"
                value={orderTypeId}
                onChange={(e) => setOrderTypeId(e.target.value)}
                required
              >
                <MenuItem value="">Select Order Type</MenuItem>
                {orderTypes.map((o) => (
                  <MenuItem key={o._id} value={o._id}>
                    {o.name}
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                select
                label="Status"
                value={paidStatus}
                onChange={(e) => setPaidStatus(e.target.value)}
              >
                <MenuItem value="PENDING">Unpaid / Pending</MenuItem>
                <MenuItem value="PAID">Paid</MenuItem>
              </TextField>
              <TextField select label="Payment Type" value={paymentTypeId} onChange={(e) => setPaymentTypeId(e.target.value)} required>
                <MenuItem value="">Select Payment Type</MenuItem>
                {paymentTypes.map((p) => (
                  <MenuItem key={p._id} value={p._id}>
                    {p.name}
                  </MenuItem>
                ))}
              </TextField>
              <TextField select label="Discount (%)" value={discountId} onChange={(e) => {
                const nextId = e.target.value;
                setDiscountId(nextId);
                const entry = discounts.find((d) => String(d._id) === String(nextId));
                setDiscountValue(Number(entry?.value || 0));
              }} required>
                <MenuItem value="">Select Discount</MenuItem>
                {discounts.map((d) => (
                  <MenuItem key={d._id} value={d._id}>
                    {d.name} ({Number(d.value || 0).toFixed(2)}%)
                  </MenuItem>
                ))}
              </TextField>
              <TextField
                label="Reference No (optional)"
                value={referenceNo}
                onChange={(e) => setReferenceNo(e.target.value)}
              />

              <Divider />

              <Stack direction="row" justifyContent="space-between" alignItems="center">
                <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                  Customer
                </Typography>
                <Button size="small" onClick={() => setShowCustomer((v) => !v)} startIcon={<AddOutlinedIcon />}>
                  {showCustomer ? "Hide" : "Add"}
                </Button>
              </Stack>
              <Collapse in={showCustomer}>
                <Stack spacing={2} sx={{ mt: 1 }}>
                  <TextField
                    label="Customer Name"
                    value={customer.name}
                    onChange={(e) => setCustomer((p) => ({ ...p, name: e.target.value }))}
                  />
                  <TextField
                    label="Customer Email"
                    type="email"
                    value={customer.email}
                    onChange={(e) => setCustomer((p) => ({ ...p, email: e.target.value }))}
                  />
                </Stack>
              </Collapse>
            </Stack>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default QuickBilling;

