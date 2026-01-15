import { Pagination as MuiPagination, Stack } from "@mui/material";

const Pagination = ({ page, count, onChange }) => (
  <Stack direction="row" justifyContent="flex-end" sx={{ py: 2 }}>
    <MuiPagination page={page} count={count} onChange={onChange} />
  </Stack>
);

export default Pagination;
