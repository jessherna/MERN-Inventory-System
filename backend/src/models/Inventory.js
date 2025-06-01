import mongoose from "mongoose";

const { Schema, model, Types } = mongoose;

const inventorySchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Please add a name for this inventory item."],
      trim: true,
    },
    description: {
      type: String,
      default: "",
    },
    createdBy: {
      type: Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt
  }
);

const Inventory = model("Inventory", inventorySchema);
export default Inventory;
