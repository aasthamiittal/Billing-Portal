import { TextField, Box } from "@mui/material";

const DateRangePicker = ({ startDate, endDate, onChange }) => (
  <Box sx={{ display: "flex", gap: 2 }}>
    <TextField
      type="date"
      size="small"
      label="Start"
      InputLabelProps={{ shrink: true }}
      value={startDate}
      onChange={(event) => onChange({ startDate: event.target.value, endDate })}
      fullWidth
    />
    <TextField
      type="date"
      size="small"
      label="End"
      InputLabelProps={{ shrink: true }}
      value={endDate}
      onChange={(event) => onChange({ startDate, endDate: event.target.value })}
      fullWidth
    />
  </Box>
);

export default DateRangePicker;
