import React from "react";
import { useNavigate } from "react-router-dom";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "../ui/table";
import { Button } from "../ui/button";

const InventoryList = ({ inventories, onEdit, onDelete, onPrint }) => {
  const navigate = useNavigate();

  const handleInventoryClick = (inventoryId) => {
    navigate(`/items/${inventoryId}`);
  };

  return (
    <div className="overflow-x-auto w-full">
      <Table className="min-w-[600px]">
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Description</TableHead>
            <TableHead>Created At</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {inventories.length === 0 ? (
            <TableRow>
              <TableCell colSpan={4} className="text-center py-8">
                No inventories found.
              </TableCell>
            </TableRow>
          ) : (
            inventories.map((inv) => (
              <TableRow key={inv._id} className="hover:bg-gray-50">
                <TableCell 
                  className="font-medium cursor-pointer hover:text-blue-600"
                  onClick={() => handleInventoryClick(inv._id)}
                >
                  {inv.name}
                </TableCell>
                <TableCell>{inv.description || "-"}</TableCell>
                <TableCell>
                  {new Date(inv.createdAt).toLocaleDateString()}
                </TableCell>
                <TableCell className="flex justify-end space-x-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onPrint([inv])}
                  >
                    Print
                  </Button>
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => onEdit(inv)}
                  >
                    Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => onDelete(inv._id)}
                  >
                    Delete
                  </Button>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>

      {/* Print All button at bottom */}
      {inventories.length > 0 && (
        <div className="mt-4 flex justify-end">
          <Button onClick={() => onPrint(inventories)}>Print All</Button>
        </div>
      )}
    </div>
  );
};

export default InventoryList;
