import Inventory from "../models/Inventory.js";

/**
 * @desc    Get all inventories created by the authenticated user.
 *          If `search` query param is provided, filter by name (case-insensitive).
 * @route   GET /api/inventories
 * @access  Private (must be logged in)
 *
 * @param   {Object} req  - Express request object.
 * @param   {Object} req.user - Populated by `protect`, contains at least `req.user._id`.
 * @param   {string} [req.query.search] - Optional search term to match `name` (regex, case-insensitive).
 * @param   {Object} res  - Express response object.
 *
 * @returns {Inventory[]} 200 - JSON array of inventory documents.
 * @returns {401}         - If no valid token / no `req.user`.
 * @returns {500}         - On server/database error.
 */
export const getInventories = async (req, res) => {
  try {
    const { search } = req.query;
    // Build base filter: only fetch items created by this user
    const filter = { createdBy: req.user._id };

    // If a `search` term is provided, add a regex filter on `name`
    if (search && search.trim() !== "") {
      filter.name = { $regex: search.trim(), $options: "i" };
    }

    // Query, sort by descending creation date
    const inventories = await Inventory.find(filter).sort({ createdAt: -1 });

    return res.status(200).json(inventories);
  } catch (error) {
    console.error("getInventories error:", error);
    return res.status(500).json({ message: "Server error while fetching inventories." });
  }
};

/**
 * @desc    Create a new inventory item for the authenticated user.
 * @route   POST /api/inventories
 * @access  Private
 *
 * @param   {Object} req  - Express request object.
 * @param   {Object} req.user - Populated by `protect`, contains `req.user._id`.
 * @param   {string} req.body.name - Name of the inventory (required).
 * @param   {string} [req.body.description] - Optional description.
 * @param   {Object} res  - Express response object.
 *
 * @returns {Inventory}  201 - JSON of the newly created inventory.
 * @returns {400}        - If `name` is missing/invalid.
 * @returns {401}        - If no valid token / no `req.user`.
 * @returns {500}        - On server/database error.
 */
export const createInventory = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name || name.trim() === "") {
      return res.status(400).json({ message: "Name is required to create an inventory item." });
    }

    const newInventory = await Inventory.create({
      name: name.trim(),
      description: description ? description.trim() : "",
      createdBy: req.user._id,
    });

    return res.status(201).json(newInventory);
  } catch (error) {
    console.error("createInventory error:", error);
    return res.status(500).json({ message: "Server error while creating inventory." });
  }
};

/**
 * @desc    Update an existing inventory item (only if it belongs to the authenticated user).
 * @route   PUT /api/inventories/:id
 * @access  Private
 *
 * @param   {Object} req  - Express request object.
 * @param   {Object} req.user - Populated by `protect`, contains `req.user._id`.
 * @param   {string} req.params.id - Inventory document ID to update.
 * @param   {string} [req.body.name] - New name (optional).
 * @param   {string} [req.body.description] - New description (optional).
 * @param   {Object} res  - Express response object.
 *
 * @returns {Inventory}  200 - JSON of the updated inventory.
 * @returns {400}        - If provided fields are invalid.
 * @returns {401}        - If no valid token / no `req.user`.
 * @returns {403}        - If the inventory does not belong to this user.
 * @returns {404}        - If no inventory is found with the given ID.
 * @returns {500}        - On server/database error.
 */
export const updateInventory = async (req, res) => {
  try {
    const inventoryId = req.params.id;
    const { name, description } = req.body;

    // Find the inventory by ID
    const inventory = await Inventory.findById(inventoryId);
    if (!inventory) {
      return res.status(404).json({ message: "Inventory not found." });
    }

    // Check ownership
    if (inventory.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to update this inventory." });
    }

    // Update fields if provided
    if (name && name.trim() !== "") {
      inventory.name = name.trim();
    }
    if (description !== undefined) {
      inventory.description = description.trim();
    }

    const updatedInventory = await inventory.save();
    return res.status(200).json(updatedInventory);
  } catch (error) {
    console.error("updateInventory error:", error);
    return res.status(500).json({ message: "Server error while updating inventory." });
  }
};

/**
 * @desc    Delete an existing inventory item (only if it belongs to the authenticated user).
 * @route   DELETE /api/inventories/:id
 * @access  Private
 *
 * @param   {Object} req  - Express request object.
 * @param   {Object} req.user - Populated by `protect`, contains `req.user._id`.
 * @param   {string} req.params.id - Inventory document ID to delete.
 * @param   {Object} res  - Express response object.
 *
 * @returns {Object}     200 - `{ message: "Inventory removed" }`.
 * @returns {401}        - If no valid token / no `req.user`.
 * @returns {403}        - If the inventory does not belong to this user.
 * @returns {404}        - If no inventory is found with the given ID.
 * @returns {500}        - On server/database error.
 */
export const deleteInventory = async (req, res) => {
  try {
    const inventoryId = req.params.id;

    // Find the inventory by ID
    const inventory = await Inventory.findById(inventoryId);
    if (!inventory) {
      return res.status(404).json({ message: "Inventory not found." });
    }

    // Check ownership
    if (inventory.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to delete this inventory." });
    }

    await inventory.deleteOne();
    return res.status(200).json({ message: "Inventory removed" });
  } catch (error) {
    console.error("deleteInventory error:", error);
    return res.status(500).json({ message: "Server error while deleting inventory." });
  }
};

/**
 * @desc    Get a single inventory item by ID (only if it belongs to the authenticated user).
 * @route   GET /api/inventories/:id
 * @access  Private
 *
 * @param   {Object} req  - Express request object.
 * @param   {Object} req.user - Populated by `protect`, contains `req.user._id`.
 * @param   {string} req.params.id - Inventory document ID.
 * @param   {Object} res  - Express response object.
 *
 * @returns {Inventory}  200 - JSON of the inventory document.
 * @returns {401}        - If no valid token / no `req.user`.
 * @returns {403}        - If the inventory does not belong to this user.
 * @returns {404}        - If no inventory is found with the given ID.
 * @returns {500}        - On server/database error.
 */
export const getInventoryById = async (req, res) => {
  try {
    const inventoryId = req.params.id;

    // Find the inventory by ID
    const inventory = await Inventory.findById(inventoryId);
    if (!inventory) {
      return res.status(404).json({ message: "Inventory not found." });
    }

    // Check ownership
    if (inventory.createdBy.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to view this inventory." });
    }

    return res.status(200).json(inventory);
  } catch (error) {
    console.error("getInventoryById error:", error);
    return res.status(500).json({ message: "Server error while fetching inventory." });
  }
};
