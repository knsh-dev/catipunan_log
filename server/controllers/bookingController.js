// server/controllers/bookingController.js
const { sequelize } = require('../models');
const { QueryTypes } = require('sequelize');

function durationLabel(checkIn, checkOut) {
  const diffMs = new Date(checkOut) - new Date(checkIn);
  const mins = Math.round(diffMs / 60000);
  if (mins < 60) return `${mins}min`;
  const hrs = mins / 60;
  return Number.isInteger(hrs) ? `${hrs}hr` : `${hrs.toFixed(1)}hr`;
}

// ── GET /api/bookings/summary ────────────────────────────────
const getBookingSummary = async (req, res) => {
  try {
    const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });

    const [monthlyRev] = await sequelize.query(
      `SELECT COALESCE(SUM(booking_fee), 0) AS monthly_revenue
       FROM CATROOMBOOKING
       WHERE YEAR(check_in)=YEAR(CURDATE()) AND MONTH(check_in)=MONTH(CURDATE())`,
      { type: QueryTypes.SELECT }
    );
    const [todayCount] = await sequelize.query(
      `SELECT COUNT(*) AS bookings_today FROM CATROOMBOOKING WHERE DATE(check_in)=:today`,
      { replacements: { today: todayStr }, type: QueryTypes.SELECT }
    );
    const [todayRev] = await sequelize.query(
      `SELECT COALESCE(SUM(booking_fee), 0) AS today_revenue FROM CATROOMBOOKING WHERE DATE(check_in)=:today`,
      { replacements: { today: todayStr }, type: QueryTypes.SELECT }
    );
    const [upcomingRow] = await sequelize.query(
      `SELECT COUNT(*) AS upcoming_count
       FROM CATROOMBOOKING
       WHERE status='confirmed' AND check_in >= NOW()`,
      { type: QueryTypes.SELECT }
    );

    // ── Anchoring Principle: prior-period baselines ───────────

    // Previous month's booking revenue
    const [prevMonthlyRev] = await sequelize.query(
      `SELECT COALESCE(SUM(booking_fee), 0) AS prev_monthly_revenue
       FROM CATROOMBOOKING
       WHERE YEAR(check_in)=YEAR(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))
         AND MONTH(check_in)=MONTH(DATE_SUB(CURDATE(), INTERVAL 1 MONTH))`,
      { type: QueryTypes.SELECT }
    );
    // Yesterday's booking count
    const [prevTodayCount] = await sequelize.query(
      `SELECT COUNT(*) AS prev_bookings FROM CATROOMBOOKING
       WHERE DATE(check_in)=DATE_SUB(:today, INTERVAL 1 DAY)`,
      { replacements: { today: todayStr }, type: QueryTypes.SELECT }
    );
    // Yesterday's booking revenue
    const [prevTodayRev] = await sequelize.query(
      `SELECT COALESCE(SUM(booking_fee), 0) AS prev_today_revenue FROM CATROOMBOOKING
       WHERE DATE(check_in)=DATE_SUB(:today, INTERVAL 1 DAY)`,
      { replacements: { today: todayStr }, type: QueryTypes.SELECT }
    );

    return res.status(200).json({
      monthlyRevenue:      parseFloat(monthlyRev?.monthly_revenue    || 0),
      bookingsToday:       parseInt(todayCount?.bookings_today        || 0),
      todayRevenue:        parseFloat(todayRev?.today_revenue         || 0),
      upcomingCount:       parseInt(upcomingRow?.upcoming_count       || 0),
      // Anchoring baselines
      prevMonthlyRevenue:  parseFloat(prevMonthlyRev?.prev_monthly_revenue || 0),
      prevBookingsToday:   parseInt(prevTodayCount?.prev_bookings          || 0),
      prevTodayRevenue:    parseFloat(prevTodayRev?.prev_today_revenue      || 0),
    });
  } catch (err) {
    console.error('Booking summary error:', err);
    return res.status(500).json({ message: 'Failed to fetch booking summary.' });
  }
};

// ── GET /api/bookings ─────────────────────────────────────────
const getTodayBookings = async (req, res) => {
  try {
    const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
    const rows = await sequelize.query(
      `SELECT b.booking_id, b.check_in, b.check_out, b.party_size, b.booking_fee, b.status,
              u.username AS handled_by
       FROM CATROOMBOOKING b
       LEFT JOIN \`USER\` u ON b.user_id=u.user_id
       WHERE DATE(b.check_in)=:today
       ORDER BY b.check_in DESC`,
      { replacements: { today: todayStr }, type: QueryTypes.SELECT }
    );
    const bookings = rows.map(b => ({ ...b, duration: durationLabel(b.check_in, b.check_out) }));
    return res.status(200).json({ bookings });
  } catch (err) {
    console.error('Get bookings error:', err);
    return res.status(500).json({ message: 'Failed to fetch bookings.' });
  }
};

// ── GET /api/bookings/slot-count ───────────────────────────────
// Returns occupied/available totals AND each overlapping booking's
// details so the POS modal can show a per-booking conflict breakdown.
const getSlotCount = async (req, res) => {
  try {
    const { check_in, check_out } = req.query;
    if (!check_in || !check_out) {
      return res.status(400).json({ message: 'check_in and check_out are required.' });
    }

    // Fetch every confirmed/active booking that overlaps [check_in, check_out]
    const rows = await sequelize.query(
      `SELECT booking_id, check_in, check_out, party_size, status
       FROM CATROOMBOOKING
       WHERE status IN ('confirmed', 'active')
         AND check_in  < :check_out
         AND check_out > :check_in
       ORDER BY check_in ASC`,
      { replacements: { check_in, check_out }, type: QueryTypes.SELECT }
    );

    const occupied = rows.reduce((sum, r) => sum + parseInt(r.party_size || 0), 0);
    return res.status(200).json({
      occupied,
      available:  Math.max(0, 10 - occupied),
      bookings:   rows,   // ← per-booking breakdown for the UI
    });
  } catch (err) {
    console.error('Slot count error:', err);
    return res.status(500).json({ message: 'Failed to check slot availability.' });
  }
};

// ── PATCH /api/bookings/:id/status ────────────────────────────
const updateBookingStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    const allowed = ['confirmed', 'active', 'completed'];
    if (!allowed.includes(status)) {
      return res.status(400).json({ message: `Status must be one of: ${allowed.join(', ')}.` });
    }
    const [count] = await sequelize.query(
      `UPDATE CATROOMBOOKING SET status=:status WHERE booking_id=:id`,
      { replacements: { status, id }, type: QueryTypes.UPDATE }
    );
    if (count === 0) return res.status(404).json({ message: 'Booking not found.' });
    return res.status(200).json({ message: 'Status updated.' });
  } catch (err) {
    console.error('Update status error:', err);
    return res.status(500).json({ message: 'Failed to update status.' });
  }
};

// ── POST /api/bookings/auto-activate ─────────────────────────
// Confirmed → Active when check_in has passed
// Active    → Completed when check_out has passed
const autoActivateBookings = async (req, res) => {
  try {
    // 1. Activate confirmed bookings whose check_in has passed
    await sequelize.query(
      `UPDATE CATROOMBOOKING
       SET status = 'active'
       WHERE status = 'confirmed'
         AND check_in <= NOW()`,
      { type: QueryTypes.UPDATE }
    );

    // 2. Complete active bookings whose check_out has passed
    await sequelize.query(
      `UPDATE CATROOMBOOKING
       SET status = 'completed'
       WHERE status = 'active'
         AND check_out <= NOW()`,
      { type: QueryTypes.UPDATE }
    );

    return res.status(200).json({ message: 'Auto-sync complete.' });
  } catch (err) {
    console.error('Auto-activate error:', err);
    return res.status(500).json({ message: 'Auto-activate failed.' });
  }
};

// ── DELETE /api/bookings/:id ──────────────────────────────────
const deleteBooking = async (req, res) => {
  try {
    const { id } = req.params;
    const [count] = await sequelize.query(
      `DELETE FROM CATROOMBOOKING WHERE booking_id=:id`,
      { replacements: { id }, type: QueryTypes.DELETE }
    );
    if (count === 0) return res.status(404).json({ message: 'Booking not found.' });
    return res.status(200).json({ message: 'Booking deleted.' });
  } catch (err) {
    console.error('Delete booking error:', err);
    return res.status(500).json({ message: 'Failed to delete booking.' });
  }
};

module.exports = { getBookingSummary, getTodayBookings, getSlotCount, updateBookingStatus, deleteBooking, autoActivateBookings };
