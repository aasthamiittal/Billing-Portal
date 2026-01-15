import { useEffect, useState } from "react";
import {
  Typography,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
} from "@mui/material";
import TableWrapper from "../components/TableWrapper";
import Loader from "../components/Loader";
import EmptyState from "../components/EmptyState";
import { fetchItems } from "../services/itemService";

const Items = () => {
  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const data = await fetchItems();
        setItems(data);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) return <Loader />;
  if (!items.length) {
    return <EmptyState title="No items" description="Add your first item." />;
  }

  return (
    <>
      <Typography variant="h5" gutterBottom>
        Items
      </Typography>
      <TableWrapper>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Name</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Price</TableCell>
              <TableCell>Tax Rate</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {items.map((item) => (
              <TableRow key={item._id}>
                <TableCell>{item.name}</TableCell>
                <TableCell>{item.category}</TableCell>
                <TableCell>{item.defaultPrice}</TableCell>
                <TableCell>{item.taxRate}%</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableWrapper>
    </>
  );
};

export default Items;
