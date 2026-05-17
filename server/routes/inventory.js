// server/routes/inventory.js
const express = require('express');
const { protect, restrictTo } = require('../middleware/authMiddleware');
const {
  getInventory,
  updateInventory,
  deleteInventory,
  getInventoryLogs,
} = require('../controllers/inventoryController');

const router = express.Router();

// GET  /api/inventory       – Admin & Staff
// GET  /api/inventory/logs  – Admin & Staff
// PUT  /api/inventory/:id   – Admin & Staff
// DELETE /api/inventory/:id – Admin only

router.get('/',      protect, restrictTo('admin', 'staff'), getInventory);
router.get('/logs',  protect, restrictTo('admin', 'staff'), getInventoryLogs);
router.put('/:id',   protect, restrictTo('admin', 'staff'), updateInventory);
router.delete('/:id',protect, restrictTo('admin'), deleteInventory);

module.exports = router;