import { useEffect, useState } from "react";
import {
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Button,
  Stack,
} from "@mui/material";
import TableWrapper from "../components/TableWrapper";
import Loader from "../components/Loader";
import EmptyState from "../components/EmptyState";
import {
  fetchInvoices,
  downloadInvoiceExcel,
  downloadInvoicePdf,
} from "../services/invoiceService";
import { downloadBlob } from "../utils/download";

const Invoices = () => {
  const [loading, setLoading] = useState(true);
  const [invoices, setInvoices] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchInvoices();
        setInvoices(data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <Loader />;
  if (!invoices.length) {
    return <EmptyState title="No invoices" description="Create your first invoice." />;
  }

  return (
    <>
      <Typography variant="h5" gutterBottom>
        Invoices
      </Typography>
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
            {invoices.map((invoice) => (
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
                        downloadBlob(response.data, `${invoice.invoiceNumber}.pdf`);
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
    </>
  );
};

export default Invoices;
