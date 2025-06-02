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

const InventoryForm = ({ initialData = null, onSubmit, onClose }) => {
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm({
    defaultValues: {
      name: initialData?.name || "",
      description: initialData?.description || "",
    },
  });

  // When initialData changes (e.g. editing a different inventory), reset form
  useEffect(() => {
    reset({
      name: initialData?.name || "",
      description: initialData?.description || "",
    });
  }, [initialData, reset]);

  const internalSubmit = async (values) => {
    await onSubmit(values);
    onClose();
  };

  return (
    <Dialog open onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>
            {initialData ? "Edit Inventory" : "New Inventory"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit(internalSubmit)} className="space-y-4 py-2">
          <div>
            <Label htmlFor="name" className="block font-medium mb-1">
              Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="name"
              placeholder="Enter inventory name"
              {...register("name", { required: "Name is required" })}
            />
            {errors.name && (
              <p className="text-red-600 text-sm mt-1">{errors.name.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="description" className="block font-medium mb-1">
              Description
            </Label>
            <Input
              id="description"
              placeholder="Enter description (optional)"
              {...register("description")}
            />
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
            <Button type="submit" disabled={isSubmitting} variant="outline">
              {isSubmitting
                ? initialData
                  ? "Saving..."
                  : "Creating..."
                : initialData
                ? "Save Changes"
                : "Create Inventory"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default InventoryForm;
