// server/controllers/inventoryController.js
const { sequelize } = require('../models');
const { QueryTypes } = require('sequelize');

function padInventoryId(id) {
  return 'INV' + String(id).padStart(3, '0');
}

function padLogId(id) {
  return 'LOG' + String(id).padStart(3, '0');
}

// ─────────────────────────────────────────────
// GET /api/inventory
// Returns all inventory records joined with product name
// ─────────────────────────────────────────────
const getInventory = async (req, res) => {
  try {
    const rows = await sequelize.query(
      `SELECT
         i.inventory_id,
         i.quantity,
         i.low_stock_threshold,
         i.last_updated,
         i.product_id,
         p.name AS product_name
       FROM INVENTORY i
       LEFT JOIN PRODUCT p ON p.product_id = i.product_id
       ORDER BY i.inventory_id ASC`,
      { type: QueryTypes.SELECT }
    );

    const inventory = rows.map(r => ({
      ...r,
      inventory_id_display: padInventoryId(r.inventory_id),
      is_low_stock: r.quantity !== null && r.low_stock_threshold !== null
        ? r.quantity <= r.low_stock_threshold
        : false,
    }));

    return res.status(200).json({ inventory });
  } catch (err) {
    console.error('Get inventory error:', err);
    return res.status(500).json({ message: 'Failed to fetch inventory.' });
  }
};

// ─────────────────────────────────────────────
// PUT /api/inventory/:id
// Updates inventory record; creates a log entry
// ─────────────────────────────────────────────
const updateInventory = async (req, res) => {
  try {
    const { id } = req.params;
    const { quantity, low_stock_threshold } = req.body;

    // Validate
    if (quantity === undefined || quantity === null || quantity === '') {
      return res.status(400).json({ message: 'Quantity is required.' });
    }
    if (low_stock_threshold === undefined || low_stock_threshold === null || low_stock_threshold === '') {
      return res.status(400).json({ message: 'Low stock threshold is required.' });
    }

    const parsedQty = parseInt(quantity, 10);
    const parsedThreshold = parseInt(low_stock_threshold, 10);

    if (isNaN(parsedQty) || parsedQty < 0) {
      return res.status(400).json({ message: 'Quantity must be a valid non-negative integer.' });
    }
    if (isNaN(parsedThreshold) || parsedThreshold < 0) {
      return res.status(400).json({ message: 'Low stock threshold must be a valid non-negative integer.' });
    }

    // Fetch current record
    const [existing] = await sequelize.query(
      `SELECT inventory_id, quantity, low_stock_threshold, product_id FROM INVENTORY WHERE inventory_id = :id`,
      { replacements: { id }, type: QueryTypes.SELECT }
    );

    if (!existing) {
      return res.status(404).json({ message: 'Inventory record not found.' });
    }

    const prevQty = existing.quantity !== null ? parseInt(existing.quantity, 10) : 0;
    const now = new Date();

    // Update inventory
    await sequelize.query(
      `UPDATE INVENTORY
       SET quantity = :quantity, low_stock_threshold = :low_stock_threshold, last_updated = :now
       WHERE inventory_id = :id`,
      {
        replacements: { quantity: parsedQty, low_stock_threshold: parsedThreshold, now, id },
        type: QueryTypes.UPDATE,
      }
    );

    // Create log entry only if quantity changed
    if (parsedQty !== prevQty) {
      const quantityChange = parsedQty - prevQty;
      const action = quantityChange > 0 ? 'restock' : 'consumed';
      const userId = req.user?.id || req.user?.user_id;

      await sequelize.query(
        `INSERT INTO INVENTORYLOG (action, quantity_change, inventory_id, user_id, created_at, createdAt, updatedAt)
         VALUES (:action, :quantity_change, :inventory_id, :user_id, :created_at, :created_at, :created_at)`,
        {
          replacements: {
            action,
            quantity_change: quantityChange,
            inventory_id: existing.inventory_id,
            user_id: userId,
            created_at: now,
          },
          type: QueryTypes.INSERT,
        }
      );
    }

    // Fetch updated record
    const [updated] = await sequelize.query(
      `SELECT
         i.inventory_id,
         i.quantity,
         i.low_stock_threshold,
         i.last_updated,
         i.product_id,
         p.name AS product_name
       FROM INVENTORY i
       LEFT JOIN PRODUCT p ON p.product_id = i.product_id
       WHERE i.inventory_id = :id`,
      { replacements: { id }, type: QueryTypes.SELECT }
    );

    const result = {
      ...updated,
      inventory_id_display: padInventoryId(updated.inventory_id),
      is_low_stock: updated.quantity !== null && updated.low_stock_threshold !== null
        ? updated.quantity <= updated.low_stock_threshold
        : false,
    };

    return res.status(200).json({ message: 'Inventory updated successfully.', inventory: result });
  } catch (err) {
    console.error('Update inventory error:', err);
    return res.status(500).json({ message: 'Failed to update inventory.' });
  }
};

// ─────────────────────────────────────────────
// DELETE /api/inventory/:id
// Permanently deletes inventory record (does NOT delete product)
// ─────────────────────────────────────────────
const deleteInventory = async (req, res) => {
  try {
    const { id } = req.params;

    const [existing] = await sequelize.query(
      `SELECT inventory_id FROM INVENTORY WHERE inventory_id = :id`,
      { replacements: { id }, type: QueryTypes.SELECT }
    );

    if (!existing) {
      return res.status(404).json({ message: 'Inventory record not found.' });
    }

    // Delete associated logs first to avoid FK constraint issues
    await sequelize.query(
      `DELETE FROM INVENTORYLOG WHERE inventory_id = :id`,
      { replacements: { id }, type: QueryTypes.DELETE }
    );

    await sequelize.query(
      `DELETE FROM INVENTORY WHERE inventory_id = :id`,
      { replacements: { id }, type: QueryTypes.DELETE }
    );

    return res.status(200).json({ message: 'Inventory record deleted successfully.' });
  } catch (err) {
    console.error('Delete inventory error:', err);
    return res.status(500).json({ message: 'Failed to delete inventory record.' });
  }
};

// ─────────────────────────────────────────────
// GET /api/inventory/logs
// Returns today's inventory logs
// ─────────────────────────────────────────────
const getInventoryLogs = async (req, res) => {
  try {
    const logs = await sequelize.query(
      `SELECT
         il.log_id,
         il.action,
         il.quantity_change,
         il.created_at,
         il.inventory_id,
         u.username
       FROM INVENTORYLOG il
       LEFT JOIN \`USER\` u ON u.user_id = il.user_id
       WHERE DATE(il.created_at) = CURDATE()
       ORDER BY il.created_at DESC`,
      { type: QueryTypes.SELECT }
    );

    const result = logs.map(l => ({
      ...l,
      log_id_display: padLogId(l.log_id),
      inventory_id_display: padInventoryId(l.inventory_id),
    }));

    return res.status(200).json({ logs: result });
  } catch (err) {
    console.error('Get inventory logs error:', err);
    return res.status(500).json({ message: 'Failed to fetch inventory logs.' });
  }
};

module.exports = { getInventory, updateInventory, deleteInventory, getInventoryLogs };