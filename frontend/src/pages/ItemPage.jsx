import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import { useAuth } from "../contexts/AuthContext";
import api from "../utils/api";
import ItemForm from "../components/items/ItemForm";
import { DataTable } from "../components/ui/data-table";
import { Checkbox } from "../components/ui/checkbox";
import { DataTableColumnHeader } from "../components/ui/data-table-column-header";

import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";

import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

const ItemPage = () => {
  const { user, token, logout } = useAuth();
  const { inventoryId } = useParams();
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [rowSelection, setRowSelection] = useState({});

  // Filter items by search term
  const filteredItems = useMemo(() => {
    if (!search) return items;
    return items.filter((item) =>
      item.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [items, search]);

  // Table column definitions
  const columns = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) =>
            table.toggleAllPageRowsSelected(!!value)
          }
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) =>
            row.toggleSelected(!!value)
          }
          aria-label="Select row"
        />
      ),
      enableSorting: false,
      enableHiding: false,
    },
    {
      accessorKey: "name",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Name" />
      ),
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div
            className="font-medium cursor-pointer hover:text-blue-600"
            onClick={() =>
              navigate(
                `/inventories/${inventoryId}/items/${item._id}`
              )
            }
          >
            {item.name}
          </div>
        );
      },
    },
    {
      accessorKey: "sku",
      header: "SKU",
    },
    {
      accessorKey: "quantity",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Quantity" />
      ),
    },
    {
      accessorKey: "price",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Price" />
      ),
      cell: ({ row }) => {
        const price = row.original.price ?? 0;
        return `$${price.toFixed(2)}`;
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const item = row.original;
        return (
          <div className="flex space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleEdit(item)}
            >
              Edit
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleDelete(item._id)}
            >
              Delete
            </Button>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: filteredItems,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  });

  // Fetch items for this inventory
  const fetchItems = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const response = await api.get(
        `/items?inventoryId=${encodeURIComponent(inventoryId)}${
          search ? `&search=${encodeURIComponent(search)}` : ""
        }`
      );
      setItems(response.data);
    } catch (err) {
      console.error("Error fetching items:", err);
      setError(
        err.response?.data?.message ||
          "Failed to load items. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [inventoryId, search, token]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  if (!user) {
    return (
      <div className="px-4 py-6 max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Items</h1>
        <p className="text-red-500">
          You must log in to view items.
        </p>
        <Button onClick={() => logout()}>Go To Login</Button>
      </div>
    );
  }

  // Handlers for create/edit/delete
  const handleCreate = () => {
    setEditingItem(null);
    setShowForm(true);
  };

  const handleEdit = (item) => {
    setEditingItem(item);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this item?"
    );
    if (!confirmed) return;

    try {
      await api.delete(`/items/${id}`);
      fetchItems();
    } catch (err) {
      console.error("Error deleting item:", err);
      alert(
        err.response?.data?.message ||
          "Failed to delete. Try again."
      );
    }
  };

  const handleFormSubmit = async (values) => {
    try {
      if (editingItem) {
        await api.put(`/items/${editingItem._id}`, values);
      } else {
        await api.post("/items", {
          ...values,
          inventoryId,
        });
      }
      setShowForm(false);
      setEditingItem(null);
      fetchItems();
    } catch (err) {
      console.error("Error saving item:", err);
      alert(
        err.response?.data?.message ||
          "Failed to save. Try again."
      );
    }
  };

  // Format a date as “Month day, year” (e.g. “June 5, 2025”)
  const formatDate = (dateObj) =>
    dateObj.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  // Handler: open a new window with just the table and print it
  const handlePrintSelected = () => {
    const selectedRows =
      table.getFilteredSelectedRowModel().rows;
    if (selectedRows.length === 0) {
      alert("Please select at least one item to print.");
      return;
    }
    const selectedItems = selectedRows.map(
      (row) => row.original
    );

    // Define columns + rows for the print window
    const columnsToPrint = [
      { key: "name", header: "Name" },
      { key: "sku", header: "SKU" },
      { key: "quantity", header: "Quantity" },
      { key: "price", header: "Price" },
    ];
    const rowsToPrint = selectedItems.map((item) => ({
      name: item.name,
      sku: item.sku || "—",
      quantity: item.quantity,
      price: `$${(item.price ?? 0).toFixed(2)}`,
    }));

    // Build a standalone HTML document
    const printedAt = new Date();
    const htmlContent = `
      <html>
        <head>
          <title>Selected Item List</title>
          <style>
            body {
              font-family: sans-serif;
              margin: 1in;
              color: #000;
            }
            h1 {
              text-align: center;
              margin-bottom: 20px;
              font-size: 1.5rem;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            th, td {
              border: 1px solid #000;
              padding: 8px;
              text-align: left;
              font-size: 0.9rem;
            }
            th {
              background-color: #f2f2f2;
            }
            footer {
              text-align: center;
              font-size: 0.8rem;
              color: #555;
            }
          </style>
        </head>
        <body>
          <h1>Selected Item List</h1>
          <table>
            <thead>
              <tr>
                ${columnsToPrint
                  .map(
                    (col) =>
                      `<th>${col.header}</th>`
                  )
                  .join("")}
              </tr>
            </thead>
            <tbody>
              ${rowsToPrint
                .map(
                  (row) => `
                <tr>
                  ${columnsToPrint
                    .map(
                      (col) =>
                        `<td>${row[col.key]}</td>`
                    )
                    .join("")}
                </tr>`
                )
                .join("")}
            </tbody>
          </table>
          <footer>
            Inventory App – Printed on ${formatDate(
              printedAt
            )}
          </footer>
        </body>
      </html>
    `;

    // Open a new window, write the HTML, and invoke print()
    const printWindow = window.open("", "_blank");
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();

    // Delay slightly to ensure content loads, then print
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 100);
  };

  return (
    <div className="px-4 py-6 max-w-5xl mx-auto">
      {/* Header + Logout */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
        <h1 className="text-3xl font-bold">Items</h1>
        <Button variant="outline" onClick={logout}>
          Logout
        </Button>
      </div>

      {/* Loading / Error */}
      {loading ? (
        <p className="text-center py-8">Loading items…</p>
      ) : error ? (
        <p className="text-red-500 text-center py-4">
          {error}
        </p>
      ) : items.length > 0 ? (
        <>
          {/* Search + Columns + New Item */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-2 w-full sm:w-1/2">
              <Label htmlFor="search" className="sr-only">
                Search Items
              </Label>
              <Input
                id="search"
                placeholder="Filter names..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="max-w-sm"
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="ml-auto">
                    Columns{" "}
                    <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>
                    Toggle columns
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {table
                    .getAllColumns()
                    .filter((col) => col.getCanHide())
                    .map((col) => (
                      <DropdownMenuCheckboxItem
                        key={col.id}
                        className="capitalize"
                        checked={col.getIsVisible()}
                        onCheckedChange={(value) =>
                          col.toggleVisibility(!!value)
                        }
                      >
                        {col.id}
                      </DropdownMenuCheckboxItem>
                    ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <Button onClick={handleCreate} variant="outline">
              + New Item
            </Button>
          </div>

          {/* Print Selected Button */}
          <div className="flex justify-end mb-4">
            <Button
              variant="outline"
              onClick={handlePrintSelected}
              disabled={
                table.getFilteredSelectedRowModel().rows
                  .length === 0
              }
            >
              Print Selected (
              {
                table.getFilteredSelectedRowModel().rows
                  .length
              }
              )
            </Button>
          </div>

          {/* DataTable */}
          <DataTable
            columns={columns}
            data={items}
            table={table}
          />

          {/* Pagination */}
          <div className="flex items-center justify-end space-x-2 py-4">
            <div className="flex-1 text-sm text-muted-foreground">
              {
                table.getFilteredSelectedRowModel().rows
                  .length
              }{" "}
              of{" "}
              {
                table.getFilteredRowModel().rows.length
              }{" "}
              row(s) selected.
            </div>
            <div className="space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                Next
              </Button>
            </div>
          </div>
        </>
      ) : (
        // No items found
        !loading &&
        !error && (
          <p className="text-center py-8">No items found.</p>
        )
      )}

      {/* ItemForm Modal */}
      {showForm && (
        <ItemForm
          initialData={editingItem}
          inventoryId={inventoryId}
          onSubmit={handleFormSubmit}
          onClose={() => {
            setShowForm(false);
            setEditingItem(null);
          }}
        />
      )}
    </div>
  );
};

export default ItemPage;
