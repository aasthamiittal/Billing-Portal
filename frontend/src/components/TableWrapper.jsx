import { Paper, TableContainer } from "@mui/material";

const TableWrapper = ({ children }) => (
  <TableContainer component={Paper} elevation={0}>
    {children}
  </TableContainer>
);

export default TableWrapper;
