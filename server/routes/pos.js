// server/routes/pos.js
const express = require('express');
const router  = express.Router();

const { protect, restrictTo } = require('../middleware/authMiddleware');
const {
  getPosProducts,
  getBookingDurations,
  posCheckout,
  getNextOrderNumber,
} = require('../controllers/posController');

// Only Admin and Cashier can access POS
router.get('/products',            protect, restrictTo('admin', 'cashier'), getPosProducts);
router.get('/bookings/durations',  protect, restrictTo('admin', 'cashier'), getBookingDurations);
router.get('/next-order-number',   protect, restrictTo('admin', 'cashier'), getNextOrderNumber);
router.post('/checkout',           protect, restrictTo('admin', 'cashier'), posCheckout);

module.exports = router;