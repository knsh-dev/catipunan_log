// server/controllers/paymentController.js
const { sequelize } = require('../models');
const { QueryTypes } = require('sequelize');

// ── Helper: local date string (YYYY-MM-DD) in PHT ──────────────
function localDateStr(d = new Date()) {
  const yr  = d.getFullYear();
  const mo  = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${yr}-${mo}-${day}`;
}

/**
 * GET /api/payments
 * Admin only — returns TODAY's payment transactions (latest first).
 */
const getTodayPayments = async (req, res) => {
  try {
    const todayStr = localDateStr(); // YYYY-MM-DD in server local timezone (PHT)

    const payments = await sequelize.query(
      `SELECT
         p.payment_id,
         p.order_id,
         p.booking_id,
         p.order_total,
         p.booking_fee,
         p.grand_total,
         p.method,
         p.status,
         p.reference_no,
         p.paid_at,
         u.full_name AS cashier_name
       FROM PAYMENT p
       LEFT JOIN \`USER\` u ON p.user_id = u.user_id
       WHERE DATE(p.paid_at) = :today
       ORDER BY p.paid_at DESC`,
      { replacements: { today: todayStr }, type: QueryTypes.SELECT }
    );

    return res.status(200).json({ payments });
  } catch (err) {
    console.error('Payment fetch error:', err);
    return res.status(500).json({ message: 'Failed to fetch payment transactions.' });
  }
};

module.exports = { getTodayPayments };
