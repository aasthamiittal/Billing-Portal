import { useEffect, useState } from "react";
import { Typography, Button, Stack, Table, TableHead, TableRow, TableCell, TableBody, Paper } from "@mui/material";
import Filters from "../../components/Filters";
import DateRangePicker from "../../components/DateRangePicker";
import TableWrapper from "../../components/TableWrapper";
import EmptyState from "../../components/EmptyState";
import Loader from "../../components/Loader";
import { downloadBlob } from "../../utils/download";
import { downloadInvoiceReportExcel, downloadInvoiceReportPdf, fetchInvoiceReport } from "../../services/reportService";

const InvoiceReports = () => {
  const [range, setRange] = useState({ startDate: "", endDate: "" });
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState([]);
  const [totals, setTotals] = useState({ total: 0, tax: 0, discount: 0 });

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const params = {
          startDate: range.startDate || undefined,
          endDate: range.endDate || undefined,
        };
        const { data } = await fetchInvoiceReport(params);
        setRows(data?.rows || []);
        setTotals(data?.totals || { total: 0, tax: 0, discount: 0 });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [range.startDate, range.endDate]);

  const handleDownload = async (type) => {
    const params = {
      startDate: range.startDate || undefined,
      endDate: range.endDate || undefined,
    };
    const response =
      type === "pdf"
        ? await downloadInvoiceReportPdf(params)
        : await downloadInvoiceReportExcel(params);
    downloadBlob(response.data, `invoice-report.${type === "pdf" ? "pdf" : "xlsx"}`);
  };

  return (
    <>
      <Typography variant="h5" gutterBottom>
        Invoice Reports
      </Typography>
      <Filters>
        <DateRangePicker startDate={range.startDate} endDate={range.endDate} onChange={setRange} />
      </Filters>
      <Stack direction="row" spacing={2} sx={{ mt: 3 }}>
        <Button variant="contained" onClick={() => handleDownload("pdf")}>
          Download PDF
        </Button>
        <Button variant="outlined" onClick={() => handleDownload("excel")}>
          Download Excel
        </Button>
      </Stack>
      <Paper elevation={0} sx={{ mt: 3, p: 2 }}>
        {loading ? (
          <Loader />
        ) : !rows.length ? (
          <EmptyState title="No invoices" description="Adjust the date range or create invoices." />
        ) : (
          <TableWrapper>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Invoice #</TableCell>
                  <TableCell>Store</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Total</TableCell>
                  <TableCell>Tax</TableCell>
                  <TableCell>Discount</TableCell>
                  <TableCell>Issued At</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.invoiceNumber}>
                    <TableCell>{row.invoiceNumber}</TableCell>
                    <TableCell>{row.store}</TableCell>
                    <TableCell>{row.status}</TableCell>
                    <TableCell>{Number(row.total || 0).toFixed(2)}</TableCell>
                    <TableCell>{Number(row.tax || 0).toFixed(2)}</TableCell>
                    <TableCell>{Number(row.discount || 0).toFixed(2)}</TableCell>
                    <TableCell>{row.issuedAt}</TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell colSpan={3} sx={{ fontWeight: 700 }}>
                    Totals
                  </TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>{Number(totals.total || 0).toFixed(2)}</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>{Number(totals.tax || 0).toFixed(2)}</TableCell>
                  <TableCell sx={{ fontWeight: 700 }}>{Number(totals.discount || 0).toFixed(2)}</TableCell>
                  <TableCell />
                </TableRow>
              </TableBody>
            </Table>
          </TableWrapper>
        )}
      </Paper>
    </>
  );
};

export default InvoiceReports;

