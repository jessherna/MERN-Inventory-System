import React, {
  useEffect,
  useState,
  useCallback,
  useMemo,
} from "react";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import { useAuth } from "../contexts/AuthContext";
import api from "../utils/api";
import InventoryForm from "../components/inventory/InventoryForm";
import { DataTable } from "../components/ui/data-table";
import { Checkbox } from "../components/ui/checkbox";
import { DataTableColumnHeader } from "../components/ui/data-table-column-header";
import { useNavigate } from "react-router-dom";

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
} from "../components/ui/dropdown-menu";
import { ChevronDown } from "lucide-react";

const InventoryPage = ({ inventories: initialInventories }) => {
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  const [inventories, setInventories] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingInventory, setEditingInventory] = useState(null);

  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [rowSelection, setRowSelection] = useState({});

  // Filter inventories by search term
  const filteredInventories = useMemo(() => {
    if (!search) return inventories;
    return inventories.filter((inv) =>
      inv.name.toLowerCase().includes(search.toLowerCase())
    );
  }, [inventories, search]);

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
        const inv = row.original;
        return (
          <div
            className="font-medium cursor-pointer hover:text-blue-600"
            onClick={() => navigate(`/items/${inv._id}`)}
          >
            {inv.name}
          </div>
        );
      },
    },
    {
      accessorKey: "description",
      header: "Description",
    },
    {
      accessorKey: "createdAt",
      header: ({ column }) => (
        <DataTableColumnHeader column={column} title="Created At" />
      ),
      cell: ({ row }) => {
        const date = new Date(row.original.createdAt);
        return date.toLocaleDateString();
      },
    },
    {
      id: "actions",
      header: "Actions",
      cell: ({ row }) => {
        const inv = row.original;
        return (
          <div className="flex space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleEdit(inv)}
            >
              Edit
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleDelete(inv._id)}
            >
              Delete
            </Button>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: filteredInventories,
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

  // Fetch inventories from backend
  const fetchInventories = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setError("");
    try {
      const response = await api.get(
        `/inventories${
          search ? `?search=${encodeURIComponent(search)}` : ""
        }`
      );
      setInventories(response.data);
    } catch (err) {
      console.error("Error fetching inventories:", err);
      setError(
        err.response?.data?.message ||
          "Failed to load inventories. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [search, token]);

  useEffect(() => {
    fetchInventories();
  }, [fetchInventories]);

  if (!user) {
    return (
      <div className="px-4 py-6 max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">My Inventories</h1>
        <p className="text-red-500">
          You must log in to view your inventories.
        </p>
        <Button onClick={() => logout()}>Go To Login</Button>
      </div>
    );
  }

  // Handlers for create/edit/delete
  const handleCreate = () => {
    setEditingInventory(null);
    setShowForm(true);
  };

  const handleEdit = (inv) => {
    setEditingInventory(inv);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this inventory?"
    );
    if (!confirmed) return;

    try {
      await api.delete(`/inventories/${id}`);
      fetchInventories();
    } catch (err) {
      console.error("Error deleting inventory:", err);
      alert(
        err.response?.data?.message ||
          "Failed to delete. Try again."
      );
    }
  };

  const handleFormSubmit = async (values) => {
    try {
      if (editingInventory) {
        await api.put(
          `/inventories/${editingInventory._id}`,
          values
        );
      } else {
        await api.post("/inventories", values);
      }
      setShowForm(false);
      setEditingInventory(null);
      fetchInventories();
    } catch (err) {
      console.error("Error saving inventory:", err);
      alert(
        err.response?.data?.message ||
          "Failed to save. Try again."
      );
    }
  };

  // Format date, e.g. “June 5, 2025”
  const formatDate = (dateObj) =>
    dateObj.toLocaleDateString(undefined, {
      year: "numeric",
      month: "long",
      day: "numeric",
    });

  // Handler: open a new window with only the selected‐inventory table and print it
  const handlePrintSelected = () => {
    const selectedRows =
      table.getFilteredSelectedRowModel().rows;
    if (selectedRows.length === 0) {
      alert("Please select at least one inventory to print.");
      return;
    }
    const selectedInventories = selectedRows.map(
      (row) => row.original
    );

    // Define columns + rows for the print window
    const columnsToPrint = [
      { key: "name", header: "Name" },
      { key: "description", header: "Description" },
      { key: "createdAt", header: "Created At" },
    ];
    const rowsToPrint = selectedInventories.map((inv) => ({
      name: inv.name,
      description: inv.description || "—",
      createdAt: new Date(inv.createdAt).toLocaleDateString(),
    }));

    // Build standalone HTML for printing
    const printedAt = new Date();
    const htmlContent = `
      <html>
        <head>
          <title>Selected Inventory List</title>
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
          <h1>Selected Inventory List</h1>
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

    // Open new window, write HTML, trigger print, then close
    const printWindow = window.open("", "_blank");
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 100);
  };

  // (Optional) If you want a “Print All” button instead of “Print Selected”:
  const handlePrintAll = () => {
    if (inventories.length === 0) {
      alert("No inventories to print.");
      return;
    }
    const columnsToPrint = [
      { key: "name", header: "Name" },
      { key: "description", header: "Description" },
      { key: "createdAt", header: "Created At" },
    ];
    const rowsToPrint = inventories.map((inv) => ({
      name: inv.name,
      description: inv.description || "—",
      createdAt: new Date(inv.createdAt).toLocaleDateString(),
    }));

    const printedAt = new Date();
    const htmlContent = `
      <html>
        <head>
          <title>Inventory List</title>
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
          <h1>Inventory List</h1>
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

    const printWindow = window.open("", "_blank");
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 100);
  };

  return (
    <div className="px-4 py-6 max-w-5xl mx-auto">
      {/* Header + Logout */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
        <h1 className="text-3xl font-bold">My Inventories</h1>
        <Button variant="outline" onClick={logout}>
          Logout
        </Button>
      </div>

      {/* Loading / Error */}
      {loading ? (
        <p className="text-center py-8">Loading inventories…</p>
      ) : error ? (
        <p className="text-red-500 text-center py-4">
          {error}
        </p>
      ) : inventories.length > 0 ? (
        <>
          {/* Search + Columns + New Inventory */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-2 w-full sm:w-1/2">
              <Label htmlFor="search" className="sr-only">
                Search Inventories
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
              + New Inventory
            </Button>
          </div>

          {/* Print Buttons */}
          <div className="flex space-x-2 justify-end mb-4">
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
            <Button variant="outline" onClick={handlePrintAll}>
              Print All
            </Button>
          </div>

          {/* DataTable */}
          <DataTable
            columns={columns}
            data={inventories}
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
        // No inventories found
        !loading &&
        !error && (
          <p className="text-center py-8">
            No inventories found.
          </p>
        )
      )}

      {/* InventoryForm Modal */}
      {showForm && (
        <InventoryForm
          initialData={editingInventory}
          onSubmit={handleFormSubmit}
          onClose={() => {
            setShowForm(false);
            setEditingInventory(null);
          }}
        />
      )}
    </div>
  );
};

export default InventoryPage;
