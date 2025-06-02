import React from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "../ui/table";
import { Button } from "../ui/button";

const ItemList = ({ items, onEdit, onDelete, onPrint }) => {
  return (
    <div className="overflow-x-auto w-full">
      <Table className="min-w-[600px]">
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>SKU</TableHead>
            <TableHead>Quantity</TableHead>
            <TableHead>Price</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {items.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-8">
                No items found.
              </TableCell>
            </TableRow>
          ) : (
            items.map((item) => (
              <TableRow key={item._id} className="hover:bg-gray-50">
                <TableCell className="font-medium">{item.name}</TableCell>
                <TableCell>{item.sku || "-"}</TableCell>
                <TableCell>{item.quantity}</TableCell>
                <TableCell>
                  {item.price.toLocaleString(undefined, {
                    style: "currency",
                    currency: "USD",
                  })}
                </TableCell>
                <TableCell className="flex justify-end space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onPrint([item])}
                  >
                    Print
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onEdit(item)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onDelete(item._id)}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {items.length > 0 && (
        <div className="mt-4 flex justify-end">
          <Button onClick={() => onPrint(items)} variant="outline">Print All</Button>
        </div>
      )}
    </div>
  );
};

export default ItemList;
