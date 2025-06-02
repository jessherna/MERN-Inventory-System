import express from "express";
import {
  getInventories,
  createInventory,
  updateInventory,
  deleteInventory,
  getInventoryById,
} from "../controllers/inventoryController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// All routes under /api/inventories are protected
router.route("/")
  .get(protect, getInventories)     // GET  /api/inventories
  .post(protect, createInventory);  // POST /api/inventories

router.route("/:id")
  .get(protect, getInventoryById)
  .put(protect, updateInventory)    // PUT    /api/inventories/:id
  .delete(protect, deleteInventory); // DELETE /api/inventories/:id

export default router;
