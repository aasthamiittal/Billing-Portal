import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Typography,
} from "@mui/material";

const ConfirmDialog = ({ open, title, description, onClose, onConfirm }) => (
  <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
    <DialogTitle>{title}</DialogTitle>
    <DialogContent>
      <Typography variant="body2">{description}</Typography>
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose}>Cancel</Button>
      <Button variant="contained" onClick={onConfirm}>
        Confirm
      </Button>
    </DialogActions>
  </Dialog>
);

export default ConfirmDialog;
