import React, { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";
import { Button } from "../components/ui/button";
import { useAuth } from "../contexts/AuthContext";
import api from "../utils/api";
import ItemForm from "../components/items/ItemForm";
// Remove ItemList import
// import ItemList from "../components/items/ItemList";

// Import DataTable components
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

const ItemPage = () => {
  const { inventoryId } = useParams();
  const { user, token, logout } = useAuth();
  const navigate = useNavigate();

  const [items, setItems] = useState([]);
  // Keep search state for the input, will connect to table filtering
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const [inventoryName, setInventoryName] = useState("");
  const [printData, setPrintData] = useState(null);

  // Add state for react-table
  const [sorting, setSorting] = useState([]);
  const [columnFilters, setColumnFilters] = useState([]);
  const [columnVisibility, setColumnVisibility] = useState({});
  const [rowSelection, setRowSelection] = useState({});

  // Define columns for the DataTable
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
      // No click handler on name here, will rely on a separate button or action
      // for editing/viewing details if needed later.
    },
    {
      accessorKey: "sku",
      header: "SKU",
    },
    {
      accessorKey: "quantity",
      header: "Quantity",
    },
    {
      accessorKey: "price",
      header: "Price",
      cell: ({ row }) => {
        const price = parseFloat(row.original.price);
        if (isNaN(price)) return "-"; // Handle cases where price is not a number
        return price.toLocaleString(undefined, {
          style: "currency",
          currency: "USD",
        });
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

  // Initialize react-table
  const table = useReactTable({
    data: items,
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

  // Effect to apply search filter to table
  useEffect(() => {
    table.getColumn("name")?.setFilterValue(search);
  }, [search, table]);

  // Fetch the inventory name for the header (optional)
  const fetchInventoryName = useCallback(async () => {
    if (!token || !inventoryId) return; // Add check for inventoryId
    try {
      const resp = await api.get(`/inventories/${inventoryId}`);
      setInventoryName(resp.data.name);
    } catch (err) {
      console.error("Error fetching inventory name:", err);
      setInventoryName("Unknown Inventory"); // Set a default name on error
    }
  }, [inventoryId, token]);

  // Fetch items for this inventory
  const fetchItems = useCallback(async () => {
    if (!token || !inventoryId) {
       setItems([]); // Clear items if no token or inventoryId
       return;
    }
    setLoading(true);
    setError("");
    try {
      // Fetch all items for the inventory, filtering will be done by react-table
      const resp = await api.get(
        `/items?inventoryId=${encodeURIComponent(inventoryId)}`
      );
      setItems(resp.data);
    } catch (err) {
      console.error("Error fetching items:", err);
      setError(
        err.response?.data?.message || "Failed to load items. Please try again."
      );
      setItems([]); // Clear items on error
    } finally {
      setLoading(false);
    }
  }, [inventoryId, token]); // Remove search from dependency array

  // Run fetch functions whenever dependencies change
  useEffect(() => {
    if (token && inventoryId) {
      fetchInventoryName();
      fetchItems();
    }
  }, [fetchInventoryName, fetchItems, token, inventoryId]); // Add inventoryId to dependency array

  // If not logged in, prompt to log in
  if (!user) {
    return (
      <div className="px-4 py-6 max-w-5xl mx-auto">
        <h1 className="text-3xl font-bold mb-4">Items</h1>
        <p className="text-red-500">You must log in to view items.</p>
        <Button onClick={() => navigate('/login')}>Go To Login</Button>
      </div>
    );
  }

  // Handler: open form to create
  const handleCreate = () => {
    setEditingItem(null);
    setShowForm(true);
  };

  // Handler: open form to edit
  const handleEdit = (item) => {
    setEditingItem(item);
    setShowForm(true);
  };

  // Handler: delete item
  const handleDelete = async (id) => {
    const confirmed = window.confirm("Delete this item?");
    if (!confirmed) return;

    try {
      await api.delete(`/items/${id}`);
      fetchItems(); // Refresh list after deletion
    } catch (err) {
      console.error("Error deleting item:", err);
      alert(err.response?.data?.message || "Failed to delete. Try again.");
    }
  };

  // Handler: form submit for create or update
  const handleFormSubmit = async (values) => {
    try {
      if (editingItem) {
        // PUT /items/:id
        await api.put(`/items/${editingItem._id}`, values);
      } else {
        // POST /items
        // Ensure inventoryId is included in the payload for new items
        await api.post("/items", { inventoryId, ...values });
      }
      setShowForm(false);
      setEditingItem(null);
      fetchItems(); // Refresh list after save
    } catch (err) {
      console.error("Error saving item:", err);
      alert(err.response?.data?.message || "Failed to save. Try again.");
    }
  };

  // Handler: print selected rows
  const handlePrintSelected = () => {
    const selectedRows = table.getFilteredSelectedRowModel().rows;
    if (selectedRows.length === 0) {
      alert("Please select at least one item to print.");
      return;
    }
    const selectedItems = selectedRows.map((row) => row.original);

    const columnsToPrint = [
      { key: "name", header: "Name" },
      { key: "sku", header: "SKU" },
      { key: "quantity", header: "Quantity" },
      { key: "price", header: "Price" },
    ];
    const rowsToPrint = selectedItems.map((item) => ({
      name: item.name,
      sku: item.sku || "",
      quantity: item.quantity,
      price: item.price.toLocaleString(undefined, {
        style: "currency",
        currency: "USD",
      }),
    }));
    setPrintData({
      columns: columnsToPrint,
      rows: rowsToPrint,
      title: `Items in ${inventoryName || "Inventory"}`,
    });

    setTimeout(() => {
      window.print();
    }, 100);
  };

  return (
    <div className="px-4 py-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 space-y-4 sm:space-y-0">
        <div>
          <h1 className="text-3xl font-bold">
            Items in {inventoryName || "Inventory"}
          </h1>
        </div>
      </div>

      {/* Main Content: Loading, Error, or Table */}
      {loading ? (
        <p className="text-center py-8">Loading items…</p>
      ) : error ? (
        <p className="text-red-500 text-center py-4">{error}</p>
      ) : items.length > 0 ? (
        <>
          {/* Search, Column Visibility, and New Item Button */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 space-y-4 sm:space-y-0">
            <div className="flex items-center space-x-2 w-full sm:w-1/2">
              <Label htmlFor="search" className="sr-only">
                Search Items
              </Label>
              {/* Connect search input to table filtering */}
              <Input
                id="search"
                placeholder="Filter names..."
                value={table.getColumn("name")?.getFilterValue() ?? ""}
                onChange={(event) =>
                  table.getColumn("name")?.setFilterValue(event.target.value)
                }
                className="max-w-sm"
              />
              {/* Column visibility dropdown (optional but good for consistency) */}
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
              + New Item
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
          <DataTable columns={columns} data={items} table={table} />

          {/* Pagination Controls (optional but good for consistency) */}
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
        // Display message when no items found after loading and no error
        !loading &&
        !error && (
          <p className="text-center py-8">No items found in this inventory.</p>
        )
      )}

      {/* ItemForm Modal */}
      {showForm && (
        <ItemForm
          inventoryId={inventoryId}
          initialData={editingItem}
          onSubmit={handleFormSubmit}
          onClose={() => {
            setShowForm(false);
            setEditingItem(null);
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

export default ItemPage;
