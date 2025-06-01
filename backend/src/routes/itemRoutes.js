import express from "express";
import {
  getItems,
  createItem,
  updateItem,
  deleteItem,
} from "../controllers/itemController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// All /api/items routes are protected
router.route("/")
  .get(protect, getItems)     // GET  /api/items?inventoryId=<id>&search=<optional>
  .post(protect, createItem); // POST /api/items

router.route("/:id")
  .put(protect, updateItem)    // PUT    /api/items/:id
  .delete(protect, deleteItem); // DELETE /api/items/:id

export default router;
