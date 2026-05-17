// server/routes/dashboard.js
const express = require('express');
const router  = express.Router();
const { getDashboardData, getSalesChart } = require('../controllers/dashboardController');
const { protect, restrictTo } = require('../middleware/authMiddleware');

router.get('/',            protect, restrictTo('admin'), getDashboardData);
router.get('/sales-chart', protect, restrictTo('admin'), getSalesChart);

module.exports = router;
