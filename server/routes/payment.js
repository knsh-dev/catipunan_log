// server/routes/payment.js
const express = require('express');
const router  = express.Router();

const { protect, restrictTo }  = require('../middleware/authMiddleware');
const { getTodayPayments }     = require('../controllers/paymentController');

// GET /api/payments — admin only
router.get('/', protect, restrictTo('admin'), getTodayPayments);

module.exports = router;
