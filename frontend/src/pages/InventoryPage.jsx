import React, { useEffect, useState, useCallback } from "react";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import { useAuth } from "../contexts/AuthContext";
import api from "../utils/api";
import InventoryForm from "../components/inventory/InventoryForm";
import { DataTable } from "@/components/ui/data-table";
import { Checkbox } from "@/components/ui/checkbox";
import { DataTableColumnHeader } from "@/components/ui/data-table-column-header";

import {
  flexRender,
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

const InventoryPage = () => {
  const { user, token, logout } = useAuth();

  const [inventories, setInventories] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingInventory, setEditingInventory] = useState(null);

  const [printData, setPrintData] = useState(null);

  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [rowSelection, setRowSelection] = useState({});

  const columns = [
    {
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={
            table.getIsAllPageRowsSelected() ||
            (table.getIsSomePageRowsSelected() && "indeterminate")
          }
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
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
        const inventory = row.original;
        return (
          <div className="flex space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleEdit(inventory)}
            >
              Edit
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => handleDelete(inventory._id)}
            >
              Delete
            </Button>
          </div>
        );
      },
    },
  ];

  const table = useReactTable({
    data: inventories,
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

  // Fetch inventories from backend only if token is present
  const fetchInventories = useCallback(async () => {
    if (!token) {
      // Skip fetch until we have a valid token
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await api.get(
        `/inventories${search ? `?search=${encodeURIComponent(search)}` : ""}`
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

  // Run fetchInventories whenever `token` or `search` changes
  useEffect(() => {
    fetchInventories();
  }, [fetchInventories]);

  // If not logged in, prompt to login
  if (!user) {
    return (
      <div className="px-4 py-6 max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">My Inventories</h1>
        <p className="text-red-500">You must log in to view your inventories.</p>
        <Button onClick={() => logout()}>Go To Login</Button>
      </div>
    );
  }

  // Handler: open form to create
  const handleCreate = () => {
    setEditingInventory(null);
    setShowForm(true);
  };

  // Handler: open form to edit
  const handleEdit = (inv) => {
    setEditingInventory(inv);
    setShowForm(true);
  };

  // Handler: delete inventory
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
      alert(err.response?.data?.message || "Failed to delete. Try again.");
    }
  };

  // Handler: form submit for create or update
  const handleFormSubmit = async (values) => {
    try {
      if (editingInventory) {
        await api.put(`/inventories/${editingInventory._id}`, values);
      } else {
        await api.post("/inventories", values);
      }
      setShowForm(false);
      setEditingInventory(null);
      fetchInventories();
    } catch (err) {
      console.error("Error saving inventory:", err);
      alert(err.response?.data?.message || "Failed to save. Try again.");
    }
  };

  // Handler: print selected rows
  const handlePrintSelected = () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    if (selectedRows.length === 0) {
      alert("Please select at least one inventory to print.");
      return;
    }
    const selectedInventories = selectedRows.map((row) => row.original);

    const columnsToPrint = [
      { key: "name", header: "Name" },
      { key: "description", header: "Description" },
      { key: "createdAt", header: "Created At" },
    ];
    const rowsToPrint = selectedInventories.map((inv) => ({
      name: inv.name,
      description: inv.description || "",
      createdAt: new Date(inv.createdAt).toLocaleDateString(),
    }));
    setPrintData({
      columns: columnsToPrint,
      rows: rowsToPrint,
      title: "Selected Inventory List",
    });

    setTimeout(() => {
      window.print();
    }, 100);
  };

  return (
    <div className="px-4 py-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
        <h1 className="text-3xl font-bold">My Inventories</h1>
        <Button variant="outline" onClick={logout}>
          Logout
        </Button>
      </div>

      {/* Main Content: Loading, Error, or Table */}
      {loading ? (
        <p className="text-center py-8">Loading inventories…</p>
      ) : error ? (
        <p className="text-red-500 text-center py-4">{error}</p>
      ) : inventories.length > 0 ? (
        <>
          {/* Search, Column Visibility, and New Inventory Button */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-2 w-full sm:w-1/2">
              <Label htmlFor="search" className="sr-only">
                Search Inventories
              </Label>
              <Input
                id="search"
                placeholder="Filter names..."
                value={table.getColumn("name")?.getFilterValue() ?? ""}
                onChange={(event) =>
                  table.getColumn("name")?.setFilterValue(event.target.value)
                }
                className="max-w-sm"
              />
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" className="ml-auto">
                    Columns <ChevronDown className="ml-2 h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuLabel>Toggle columns</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {table
                    .getAllColumns()
                    .filter((column) => column.getCanHide())
                    .map((column) => (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) =>
                          column.toggleVisibility(!!value)
                        }
                      >
                        {column.id}
                      </DropdownMenuCheckboxItem>
                    ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
            <Button onClick={handleCreate} variant="outline">
              + New Inventory
            </Button>
          </div>

          {/* Print Selected Button */}
          <div className="flex justify-end mb-4">
            <Button
              variant="outline"
              onClick={handlePrintSelected}
              disabled={
                table.getFilteredSelectedRowModel().rows.length === 0
              }
            >
              Print Selected (
              {table.getFilteredSelectedRowModel().rows.length})
            </Button>
          </div>

          {/* DataTable Component */}
          <DataTable columns={columns} data={inventories} table={table} />

          {/* Pagination Controls */}
          <div className="flex items-center justify-end space-x-2 py-4">
            <div className="flex-1 text-sm text-muted-foreground">
              {table.getFilteredSelectedRowModel().rows.length} of{" "}
              {table.getFilteredRowModel().rows.length} row(s) selected.
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
        // Display message when no inventories found after loading and no error
        !loading &&
        !error && (
          <p className="text-center py-8">No inventories found.</p>
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

      {/* Printable Table (only visible in print) */}
      {printData && (
        <div className="print:block hidden mt-8">
          <h2 className="text-xl font-semibold mb-4">{printData.title}</h2>
          <table className="w-full border-collapse">
            <thead className="border-b">
              <tr>
                {printData.columns.map((col) => (
                  <th
                    key={col.key}
                    className="text-left px-2 py-1 border"
                  >
                    {col.header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {printData.rows.map((row, idx) => (
                <tr
                  key={idx}
                  className={idx % 2 === 0 ? "bg-gray-100" : ""}
                >
                  {printData.columns.map((col) => (
                    <td key={col.key} className="px-2 py-1 border">
                      {row[col.key]}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default InventoryPage;
