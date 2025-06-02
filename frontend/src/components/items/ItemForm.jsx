import React, { useEffect } from "react";
import { useForm } from "react-hook-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { Label } from "../ui/label";
import { Input } from "../ui/input";
import { Button } from "../ui/button";

const ItemForm = ({ inventoryId, initialData = null, onSubmit, onClose }) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    defaultValues: {
      name: initialData?.name || "",
      sku: initialData?.sku || "",
      quantity: initialData?.quantity ?? 0,
      price: initialData?.price ?? 0,
    },
  });

  // Reset form whenever initialData changes
  useEffect(() => {
    reset({
      name: initialData?.name || "",
      sku: initialData?.sku || "",
      quantity: initialData?.quantity ?? 0,
      price: initialData?.price ?? 0,
    });
  }, [initialData, reset]);

  const internalSubmit = async (values) => {
    // Include inventoryId in the payload
    await onSubmit({ inventoryId, ...values });
    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Edit Item" : "New Item"}
          </DialogTitle>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(internalSubmit)}
          className="space-y-4 py-2"
        >
          {/* Name */}
          <div>
            <Label htmlFor="name" className="block font-medium mb-1">
              Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              placeholder="Item name"
              {...register("name", { required: "Name is required" })}
            />
            {errors.name && (
              <p className="text-red-600 text-sm mt-1">
                {errors.name.message}
              </p>
            )}
          </div>

          {/* SKU */}
          <div>
            <Label htmlFor="sku" className="block font-medium mb-1">
              SKU
            </Label>
            <Input
              id="sku"
              placeholder="Stock Keeping Unit"
              {...register("sku")}
            />
          </div>

          {/* Quantity */}
          <div>
            <Label htmlFor="quantity" className="block font-medium mb-1">
              Quantity <span className="text-red-500">*</span>
            </Label>
            <Input
              id="quantity"
              type="number"
              min={0}
              step={1}
              {...register("quantity", {
                required: "Quantity is required",
                min: { value: 0, message: "Quantity must be ≥ 0" },
              })}
            />
            {errors.quantity && (
              <p className="text-red-600 text-sm mt-1">
                {errors.quantity.message}
              </p>
            )}
          </div>

          {/* Price */}
          <div>
            <Label htmlFor="price" className="block font-medium mb-1">
              Price ($) <span className="text-red-500">*</span>
            </Label>
            <Input
              id="price"
              type="number"
              min={0}
              step={0.01}
              {...register("price", {
                required: "Price is required",
                min: { value: 0, message: "Price must be ≥ 0" },
              })}
            />
            {errors.price && (
              <p className="text-red-600 text-sm mt-1">
                {errors.price.message}
              </p>
            )}
          </div>

          <DialogFooter className="flex justify-end space-x-2">
            <Button
              type="button"
              variant="outline"
              onClick={onClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting
                ? initialData
                  ? "Saving..."
                  : "Creating..."
                : initialData
                ? "Save Changes"
                : "Create Item"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default ItemForm;
