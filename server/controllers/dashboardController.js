// server/controllers/dashboardController.js
const { sequelize } = require('../models');
const { QueryTypes } = require('sequelize');

// ── Helper: today's date string in PHT ────────────────────────
function getPhDate(date = new Date()) {
  return date.toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
}

// ── GET /api/dashboard — all widgets in one call ──────────────
const getDashboardData = async (req, res) => {
  try {
    const todayStr = getPhDate();

    // ── 1. Monthly Sales (order + booking) ───────────────────
    const [monthlySalesRow] = await sequelize.query(
      `SELECT
         COALESCE((SELECT SUM(o.total_amount) FROM \`ORDER\` o
                   WHERE o.status='completed' AND YEAR(o.created_at)=YEAR(CURDATE()) AND MONTH(o.created_at)=MONTH(CURDATE())),0)
         +COALESCE((SELECT SUM(b.booking_fee) FROM CATROOMBOOKING b
                    WHERE YEAR(b.check_in)=YEAR(CURDATE()) AND MONTH(b.check_in)=MONTH(CURDATE())),0)
         AS monthly_sales`,
      { type: QueryTypes.SELECT }
    );

    // ── 2. Orders Today (live) ────────────────────────────────
    const [ordersRow] = await sequelize.query(
      `SELECT COUNT(*) AS orders_today FROM \`ORDER\`
       WHERE DATE(created_at)=:today AND status='completed'`,
      { replacements: { today: todayStr }, type: QueryTypes.SELECT }
    );

    // ── 3. Total Revenue Today (order + booking, live) ────────
    const [revenueRow] = await sequelize.query(
      `SELECT
         COALESCE((SELECT SUM(o.total_amount) FROM \`ORDER\` o WHERE o.status='completed' AND DATE(o.created_at)=:today),0)
         +COALESCE((SELECT SUM(b.booking_fee) FROM CATROOMBOOKING b WHERE DATE(b.check_in)=:today),0)
         AS total_revenue_today`,
      { replacements: { today: todayStr }, type: QueryTypes.SELECT }
    );

    // ── 4. Weekly Favorite Product ────────────────────────────
    const weeklyFav = await sequelize.query(
      `SELECT p.name AS product_name, SUM(oi.quantity) AS total_qty
       FROM ORDERITEM oi
       JOIN \`ORDER\` o ON oi.order_id=o.order_id
       JOIN PRODUCT p ON oi.product_id=p.product_id
       WHERE o.created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) AND o.status='completed'
       GROUP BY oi.product_id, p.name ORDER BY total_qty DESC LIMIT 1`,
      { type: QueryTypes.SELECT }
    );

    // ── 5. Sales Performance Last 7 Months ────────────────────
    const last7MonthsRows = await sequelize.query(
      `SELECT
         DATE_FORMAT(ms.m, '%Y-%m') AS month_label,
         COALESCE(SUM(o.total_amount),0) AS order_revenue,
         COALESCE(b_agg.booking_rev,0)   AS booking_revenue
       FROM (
         SELECT DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL n MONTH),'%Y-%m-01') AS m
         FROM (SELECT 0 n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6) nums
       ) ms
       LEFT JOIN \`ORDER\` o
         ON DATE_FORMAT(o.created_at,'%Y-%m')=DATE_FORMAT(ms.m,'%Y-%m') AND o.status='completed'
       LEFT JOIN (
         SELECT DATE_FORMAT(check_in,'%Y-%m') AS bm, SUM(booking_fee) AS booking_rev
         FROM CATROOMBOOKING GROUP BY bm
       ) b_agg ON b_agg.bm=DATE_FORMAT(ms.m,'%Y-%m')
       GROUP BY ms.m ORDER BY ms.m ASC`,
      { type: QueryTypes.SELECT }
    );

    const salesChart = last7MonthsRows.map(r => ({
      log_date:        r.month_label,
      order_revenue:   parseFloat(r.order_revenue)   || 0,
      booking_revenue: parseFloat(r.booking_revenue) || 0,
      total_revenue:   (parseFloat(r.order_revenue)||0) + (parseFloat(r.booking_revenue)||0),
    }));

    // ── 6. Top Products This Week ─────────────────────────────
    const topProducts = await sequelize.query(
      `SELECT p.name AS product_name, SUM(oi.quantity) AS total_qty
       FROM ORDERITEM oi
       JOIN \`ORDER\` o ON oi.order_id=o.order_id
       JOIN PRODUCT p ON oi.product_id=p.product_id
       WHERE o.created_at >= DATE_SUB(CURDATE(), INTERVAL 7 DAY) AND o.status='completed'
       GROUP BY oi.product_id, p.name ORDER BY total_qty DESC LIMIT 4`,
      { type: QueryTypes.SELECT }
    );

    // ── 7. Low Stock Alert ────────────────────────────────────
    const lowStock = await sequelize.query(
      `SELECT p.name AS product_name, i.quantity, i.low_stock_threshold
       FROM INVENTORY i JOIN PRODUCT p ON i.product_id=p.product_id
       WHERE i.quantity<=i.low_stock_threshold ORDER BY i.quantity ASC`,
      { type: QueryTypes.SELECT }
    );

    // ── 8. Today's Recent Payments ────────────────────────────
    const recentPayments = await sequelize.query(
      `SELECT p.payment_id, p.order_id, p.method, p.grand_total, p.paid_at
       FROM PAYMENT p WHERE DATE(p.paid_at)=:today AND p.status='completed'
       ORDER BY p.paid_at DESC LIMIT 5`,
      { replacements: { today: todayStr }, type: QueryTypes.SELECT }
    );

    // ── 9. Upcoming Bookings ──────────────────────────────────
    const upcomingBookings = await sequelize.query(
      `SELECT b.check_in, b.party_size, u.username
       FROM CATROOMBOOKING b
       JOIN \`USER\` u ON b.user_id=u.user_id
       WHERE b.status='confirmed' AND DATE(b.check_in)=:today AND b.check_in>=NOW()
       ORDER BY b.check_in ASC LIMIT 3`,
      { replacements: { today: todayStr }, type: QueryTypes.SELECT }
    );

    // ── Anchoring Principle: prior-period baselines ───────────

    // Prior month's sales (anchor for Monthly Sales card)
    const [prevMonthlySalesRow] = await sequelize.query(
      `SELECT
         COALESCE((SELECT SUM(o.total_amount) FROM \`ORDER\` o
                   WHERE o.status='completed'
                     AND YEAR(o.created_at)=YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))
                     AND MONTH(o.created_at)=MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))),0)
         +COALESCE((SELECT SUM(b.booking_fee) FROM CATROOMBOOKING b
                    WHERE YEAR(b.check_in)=YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))
                      AND MONTH(b.check_in)=MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))),0)
         AS prev_monthly_sales`,
      { type: QueryTypes.SELECT }
    );

    // Yesterday's order count (anchor for Orders Today card)
    const [prevOrdersRow] = await sequelize.query(
      `SELECT COUNT(*) AS prev_orders FROM \`ORDER\`
       WHERE DATE(created_at)=DATE_SUB(:today, INTERVAL 1 DAY) AND status='completed'`,
      { replacements: { today: todayStr }, type: QueryTypes.SELECT }
    );

    // Yesterday's revenue (anchor for Today's Total Revenue card)
    const [prevRevenueRow] = await sequelize.query(
      `SELECT
         COALESCE((SELECT SUM(o.total_amount) FROM \`ORDER\` o
                   WHERE o.status='completed' AND DATE(o.created_at)=DATE_SUB(:today, INTERVAL 1 DAY)),0)
         +COALESCE((SELECT SUM(b.booking_fee) FROM CATROOMBOOKING b
                    WHERE DATE(b.check_in)=DATE_SUB(:today, INTERVAL 1 DAY)),0)
         AS prev_revenue`,
      { replacements: { today: todayStr }, type: QueryTypes.SELECT }
    );

    return res.status(200).json({
      monthlySales:      parseFloat(monthlySalesRow?.monthly_sales      || 0),
      ordersToday:       parseInt(ordersRow?.orders_today               || 0),
      orderRevenue:      parseFloat(revenueRow?.total_revenue_today     || 0),
      weeklyFavorite:    weeklyFav?.[0]?.product_name                   || '—',
      // Anchoring baselines
      prevMonthlySales:  parseFloat(prevMonthlySalesRow?.prev_monthly_sales || 0),
      prevOrdersToday:   parseInt(prevOrdersRow?.prev_orders               || 0),
      prevOrderRevenue:  parseFloat(prevRevenueRow?.prev_revenue            || 0),
      salesChart,
      topProducts,
      lowStock,
      recentPayments,
      upcomingBookings,
    });
  } catch (err) {
    console.error('Dashboard error:', err);
    return res.status(500).json({ message: 'Failed to load dashboard data.' });
  }
};

// ── GET /api/dashboard/sales-chart?range=weeks|months|days ────
const getSalesChart = async (req, res) => {
  try {
    const range = ['weeks','months','days'].includes(req.query.range) ? req.query.range : 'months';

    let rows;
    if (range === 'days') {
      rows = await sequelize.query(
        `SELECT
           DATE_FORMAT(ds.d, '%Y-%m-%d') AS log_date,
           COALESCE(SUM(o.total_amount), 0) AS order_revenue,
           COALESCE(b_agg.booking_rev, 0)   AS booking_revenue
         FROM (
           SELECT DATE_SUB(CURDATE(), INTERVAL n DAY) AS d
           FROM (SELECT 0 n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3
                 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6) nums
         ) ds
         LEFT JOIN \`ORDER\` o
           ON o.status='completed' AND DATE(o.created_at) = ds.d
         LEFT JOIN (
           SELECT DATE(check_in) AS bd, SUM(booking_fee) AS booking_rev
           FROM CATROOMBOOKING GROUP BY bd
         ) b_agg ON b_agg.bd = ds.d
         GROUP BY ds.d, b_agg.booking_rev
         ORDER BY ds.d ASC`,
        { type: QueryTypes.SELECT }
      );
    } else if (range === 'weeks') {
      rows = await sequelize.query(
        `SELECT
           DATE_FORMAT(ws.week_start, '%Y-%m-%d') AS log_date,
           COALESCE(SUM(o.total_amount), 0)       AS order_revenue,
           COALESCE(MAX(b_agg.booking_rev), 0)    AS booking_revenue
         FROM (
           SELECT DATE_SUB(CURDATE(), INTERVAL (n * 7 + WEEKDAY(CURDATE())) DAY) AS week_start
           FROM (SELECT 0 n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3
                 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6) nums
         ) ws
         LEFT JOIN \`ORDER\` o
           ON o.status='completed'
           AND DATE(o.created_at) >= ws.week_start
           AND DATE(o.created_at) <  DATE_ADD(ws.week_start, INTERVAL 7 DAY)
         LEFT JOIN (
           -- DATE() ensures type matches week_start (DATE vs DATETIME mismatch would silently fail)
           SELECT DATE(DATE_SUB(check_in, INTERVAL WEEKDAY(check_in) DAY)) AS wk,
                  SUM(booking_fee) AS booking_rev
           FROM CATROOMBOOKING
           GROUP BY wk
         ) b_agg ON b_agg.wk = ws.week_start
         GROUP BY ws.week_start
         ORDER BY ws.week_start ASC`,
        { type: QueryTypes.SELECT }
      );
    } else {
      rows = await sequelize.query(
        `SELECT
           DATE_FORMAT(ms.m, '%Y-%m') AS log_date,
           COALESCE(SUM(o.total_amount), 0) AS order_revenue,
           COALESCE(b_agg.booking_rev, 0)   AS booking_revenue
         FROM (
           SELECT DATE_FORMAT(DATE_SUB(CURDATE(), INTERVAL n MONTH),'%Y-%m-01') AS m
           FROM (SELECT 0 n UNION SELECT 1 UNION SELECT 2 UNION SELECT 3
                 UNION SELECT 4 UNION SELECT 5 UNION SELECT 6) nums
         ) ms
         LEFT JOIN \`ORDER\` o
           ON DATE_FORMAT(o.created_at,'%Y-%m')=DATE_FORMAT(ms.m,'%Y-%m') AND o.status='completed'
         LEFT JOIN (
           SELECT DATE_FORMAT(check_in,'%Y-%m') AS bm, SUM(booking_fee) AS booking_rev
           FROM CATROOMBOOKING GROUP BY bm
         ) b_agg ON b_agg.bm=DATE_FORMAT(ms.m,'%Y-%m')
         GROUP BY ms.m, b_agg.booking_rev ORDER BY ms.m ASC`,
        { type: QueryTypes.SELECT }
      );
    }

    const chart = rows.map(r => ({
      log_date:        r.log_date,
      order_revenue:   parseFloat(r.order_revenue)   || 0,
      booking_revenue: parseFloat(r.booking_revenue) || 0,
      total_revenue:   (parseFloat(r.order_revenue) || 0) + (parseFloat(r.booking_revenue) || 0),
    }));

    return res.status(200).json({ range, chart });
  } catch (err) {
    console.error('getSalesChart error:', err);
    return res.status(500).json({ message: 'Failed to fetch chart data.' });
  }
};

module.exports = { getDashboardData, getSalesChart };
