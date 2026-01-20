import { TextField } from "@mui/material";
import { useEffect, useState } from "react";

const extractDates = (value) => value.match(/\d{4}-\d{2}-\d{2}/g) || [];

const formatRange = (startDate, endDate) => {
  if (startDate && endDate) return `${startDate} - ${endDate}`;
  if (startDate && !endDate) return `${startDate} -`;
  if (!startDate && endDate) return `- ${endDate}`;
  return "";
};

const DateRangePicker = ({ startDate, endDate, onChange }) => {
  const [input, setInput] = useState(formatRange(startDate, endDate));

  useEffect(() => {
    setInput(formatRange(startDate, endDate));
  }, [startDate, endDate]);

  const handleChange = (event) => {
    const next = event.target.value;
    setInput(next);
    if (!next.trim()) {
      onChange({ startDate: "", endDate: "" });
      return;
    }
    const [start, end] = extractDates(next);
    if (start || end) {
      onChange({ startDate: start || "", endDate: end || "" });
    }
  };

  return (
    <TextField
      size="small"
      label="Dates"
      placeholder="YYYY-MM-DD - YYYY-MM-DD"
      value={input}
      onChange={handleChange}
      fullWidth
    />
  );
};

export default DateRangePicker;
