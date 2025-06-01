import mongoose from "mongoose";

const { Schema, model, Types } = mongoose;

const itemSchema = new Schema(
  {
    inventoryId: {
      type: Types.ObjectId,
      ref: "Inventory",
      required: [true, "Associated inventoryId is required."],
    },
    name: {
      type: String,
      required: [true, "Item name is required."],
      trim: true,
    },
    sku: {
      type: String,
      trim: true,
      default: "",
    },
    quantity: {
      type: Number,
      required: true,
      default: 0,
    },
    price: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true, // adds createdAt and updatedAt
  }
);

const Item = model("Item", itemSchema);
export default Item;
