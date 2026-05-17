// server/routes/booking.js
const express = require('express');
const router  = express.Router();
const { protect, restrictTo } = require('../middleware/authMiddleware');
const {
  getBookingSummary,
  getTodayBookings,
  getSlotCount,
  updateBookingStatus,
  deleteBooking,
  autoActivateBookings,
} = require('../controllers/bookingController');

router.get('/summary',       protect, restrictTo('admin','staff'),           getBookingSummary);
router.get('/slot-count',    protect, restrictTo('admin','staff','cashier'), getSlotCount);
router.get('/',              protect, restrictTo('admin','staff'),            getTodayBookings);
router.post('/auto-activate',protect, restrictTo('admin','staff','cashier'), autoActivateBookings);
router.patch('/:id/status',  protect, restrictTo('admin','staff'),           updateBookingStatus);
router.delete('/:id',        protect, restrictTo('admin'),                   deleteBooking);

module.exports = router;
