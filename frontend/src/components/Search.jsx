import { TextField } from "@mui/material";

const Search = ({ value, onChange, placeholder = "Search..." }) => (
  <TextField
    size="small"
    value={value}
    onChange={(event) => onChange(event.target.value)}
    placeholder={placeholder}
    fullWidth
  />
);

export default Search;
