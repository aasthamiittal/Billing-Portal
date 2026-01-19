import { useState } from "react";
import { Typography, Button, Stack } from "@mui/material";
import Filters from "../../components/Filters";
import DateRangePicker from "../../components/DateRangePicker";
import { downloadBlob } from "../../utils/download";
import { downloadTaxReportExcel, downloadTaxReportPdf } from "../../services/reportService";

const TaxReports = () => {
  const [range, setRange] = useState({ startDate: "", endDate: "" });

  const handleDownload = async (type) => {
    const params = {
      startDate: range.startDate || undefined,
      endDate: range.endDate || undefined,
    };
    const response =
      type === "pdf" ? await downloadTaxReportPdf(params) : await downloadTaxReportExcel(params);
    downloadBlob(response.data, `tax-report.${type === "pdf" ? "pdf" : "xlsx"}`);
  };

  return (
    <>
      <Typography variant="h5" gutterBottom>
        Tax Reports
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
    </>
  );
};

export default TaxReports;

