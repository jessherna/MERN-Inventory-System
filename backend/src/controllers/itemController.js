import Item from "../models/Item.js";
import Inventory from "../models/Inventory.js"; // to verify ownership

/**
 * @desc    Get all items for a given inventory, filtered by optional search term.
 * @route   GET /api/items
 * @access  Private
 *
 * @param   {Object} req  
 * @param   {Object} req.query.inventoryId - (required) ID of the parent Inventory.
 * @param   {string} [req.query.search]    - (optional) Case-insensitive substring to match item name.
 * @param   {Object} req.user              - Populated by `protect` middleware; contains `req.user._id`.
 * @param   {Object} res
 *
 * @returns {Item[]}    200 - Array of matching item documents, sorted by createdAt desc.
 * @returns {400}       - If `inventoryId` is missing or invalid.
 * @returns {403}       - If the inventory does not exist or is not owned by the user.
 * @returns {404}       - If no inventory is found with the given `inventoryId`.
 * @returns {500}       - On server/database error.
 */
export const getItems = async (req, res) => {
  try {
    const { inventoryId, search } = req.query;

    if (!inventoryId) {
      return res.status(400).json({ message: "inventoryId query parameter is required." });
    }

    // Validate inventory existence & ownership
    const parentInventory = await Inventory.findById(inventoryId);
    if (!parentInventory) {
      return res.status(404).json({ message: "Parent inventory not found." });
    }
    if (parentInventory.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to view items for this inventory." });
    }

    // Build filter: inventoryId must match, and if search is provided, match name regex
    const filter = { inventoryId };
    if (search && search.trim() !== "") {
      filter.name = { $regex: search.trim(), $options: "i" };
    }

    const items = await Item.find(filter).sort({ createdAt: -1 });
    return res.status(200).json(items);
  } catch (error) {
    console.error("getItems error:", error);
    return res.status(500).json({ message: "Server error while fetching items." });
  }
};

/**
 * @desc    Create a new item under an existing inventory (owned by user).
 * @route   POST /api/items
 * @access  Private
 *
 * @param   {Object} req
 * @param   {Object} req.body.inventoryId  - (required) ID of the parent Inventory.
 * @param   {string} req.body.name         - (required) Item name.
 * @param   {string} [req.body.sku]        - (optional) SKU string.
 * @param   {number} [req.body.quantity]   - (optional) Quantity (defaults to 0 if omitted).
 * @param   {number} [req.body.price]      - (optional) Price (defaults to 0 if omitted).
 * @param   {Object} req.user              - Populated by `protect`; contains `req.user._id`.
 * @param   {Object} res
 *
 * @returns {Item}     201 - Newly created item document.
 * @returns {400}      - If required fields (inventoryId or name) are missing/invalid.
 * @returns {403}      - If parent inventory is not owned by user.
 * @returns {404}      - If parent inventory does not exist.
 * @returns {500}      - On server/database error.
 */
export const createItem = async (req, res) => {
  try {
    const { inventoryId, name, sku, quantity, price } = req.body;

    if (!inventoryId) {
      return res.status(400).json({ message: "inventoryId is required to create an item." });
    }
    if (!name || name.trim() === "") {
      return res.status(400).json({ message: "Item name is required." });
    }

    // Verify parent inventory exists & is owned by this user
    const parentInventory = await Inventory.findById(inventoryId);
    if (!parentInventory) {
      return res.status(404).json({ message: "Parent inventory not found." });
    }
    if (parentInventory.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to add items to this inventory." });
    }

    const newItem = await Item.create({
      inventoryId,
      name: name.trim(),
      sku: sku ? sku.trim() : "",
      quantity: quantity !== undefined ? quantity : 0,
      price: price !== undefined ? price : 0,
    });

    return res.status(201).json(newItem);
  } catch (error) {
    console.error("createItem error:", error);
    return res.status(500).json({ message: "Server error while creating item." });
  }
};

/**
 * @desc    Update an existing item (only if its parent inventory is owned by user).
 * @route   PUT /api/items/:id
 * @access  Private
 *
 * @param   {Object} req
 * @param   {string} req.params.id        - (required) ID of the item to update.
 * @param   {string} [req.body.name]      - (optional) New item name.
 * @param   {string} [req.body.sku]       - (optional) New SKU.
 * @param   {number} [req.body.quantity]  - (optional) New quantity.
 * @param   {number} [req.body.price]     - (optional) New price.
 * @param   {Object} req.user             - Populated by `protect`; contains `req.user._id`.
 * @param   {Object} res
 *
 * @returns {Item}     200 - Updated item document.
 * @returns {400}      - If provided fields are invalid.
 * @returns {403}      - If parent inventory is not owned by user.
 * @returns {404}      - If no item is found with given ID (or parent inventory not found).
 * @returns {500}      - On server/database error.
 */
export const updateItem = async (req, res) => {
  try {
    const itemId = req.params.id;
    const { name, sku, quantity, price } = req.body;

    // Find the item
    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({ message: "Item not found." });
    }

    // Verify parent inventory and ownership
    const parentInventory = await Inventory.findById(item.inventoryId);
    if (!parentInventory) {
      return res.status(404).json({ message: "Parent inventory not found." });
    }
    if (parentInventory.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to update this item." });
    }

    // Update only provided fields
    if (name && name.trim() !== "") {
      item.name = name.trim();
    }
    if (sku !== undefined) {
      item.sku = sku.trim();
    }
    if (quantity !== undefined) {
      item.quantity = quantity;
    }
    if (price !== undefined) {
      item.price = price;
    }

    const updatedItem = await item.save();
    return res.status(200).json(updatedItem);
  } catch (error) {
    console.error("updateItem error:", error);
    return res.status(500).json({ message: "Server error while updating item." });
  }
};

/**
 * @desc    Delete an existing item (only if its parent inventory is owned by user).
 * @route   DELETE /api/items/:id
 * @access  Private
 *
 * @param   {Object} req
 * @param   {string} req.params.id    - (required) ID of the item to delete.
 * @param   {Object} req.user        - Populated by `protect`; contains `req.user._id`.
 * @param   {Object} res
 *
 * @returns {Object}   200 - `{ message: "Item removed" }`.
 * @returns {403}      - If parent inventory is not owned by user.
 * @returns {404}      - If no item is found (or parent inventory not found).
 * @returns {500}      - On server/database error.
 */
export const deleteItem = async (req, res) => {
  try {
    const itemId = req.params.id;

    // Find the item
    const item = await Item.findById(itemId);
    if (!item) {
      return res.status(404).json({ message: "Item not found." });
    }

    // Verify parent inventory and ownership
    const parentInventory = await Inventory.findById(item.inventoryId);
    if (!parentInventory) {
      return res.status(404).json({ message: "Parent inventory not found." });
    }
    if (parentInventory.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to delete this item." });
    }

    await item.deleteOne();
    return res.status(200).json({ message: "Item removed" });
  } catch (error) {
    console.error("deleteItem error:", error);
    return res.status(500).json({ message: "Server error while deleting item." });
  }
};
