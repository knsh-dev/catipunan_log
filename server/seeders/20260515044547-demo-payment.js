'use strict';

// Dates match order seeder: 5 today | 3 last week | 2 last month | 5 month-before-last

function ts(offsetDays, hh, mm = '00') {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  d.setHours(parseInt(hh), parseInt(mm), 0, 0);
  return new Date(d);
}

// booking_fees: 15min=₱100/pax, 30min=₱150/pax, 1hr=₱300/pax
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('PAYMENT', [
      // ── TODAY (5 payments) ────────────────────────────────────────────────
      { method: 'cash',  booking_fee:   0.00, order_total: 185.00, grand_total:  185.00, status: 'completed', paid_at: ts( 0,'09','25'), user_id: 2, order_id:  1, booking_id: null, createdAt: new Date(), updatedAt: new Date() },
      { method: 'gcash', booking_fee: 450.00, order_total: 270.00, grand_total:  720.00, status: 'completed', paid_at: ts( 0,'10','10'), user_id: 4, order_id:  2, booking_id:    2, createdAt: new Date(), updatedAt: new Date() },
      { method: 'cash',  booking_fee:   0.00, order_total: 165.00, grand_total:  165.00, status: 'completed', paid_at: ts( 0,'11','40'), user_id: 2, order_id:  3, booking_id: null, createdAt: new Date(), updatedAt: new Date() },
      { method: 'gcash', booking_fee: 750.00, order_total: 390.00, grand_total: 1140.00, status: 'completed', paid_at: ts( 0,'14','10'), user_id: 4, order_id:  4, booking_id:    4, createdAt: new Date(), updatedAt: new Date() },
      { method: 'cash',  booking_fee:   0.00, order_total: 175.00, grand_total:  175.00, status: 'completed', paid_at: ts( 0,'16','10'), user_id: 2, order_id:  5, booking_id: null, createdAt: new Date(), updatedAt: new Date() },

      // ── LAST WEEK / -7 days (3 payments) ─────────────────────────────────
      { method: 'gcash', booking_fee: 300.00, order_total: 250.00, grand_total:  550.00, status: 'completed', paid_at: ts(-7,'10','10'), user_id: 4, order_id:  6, booking_id:    6, createdAt: new Date(), updatedAt: new Date() },
      { method: 'cash',  booking_fee:   0.00, order_total: 320.00, grand_total:  320.00, status: 'completed', paid_at: ts(-7,'13','40'), user_id: 2, order_id:  7, booking_id: null, createdAt: new Date(), updatedAt: new Date() },
      { method: 'gcash', booking_fee: 1200.00, order_total: 410.00, grand_total: 1610.00, status: 'completed', paid_at: ts(-7,'15','10'), user_id: 4, order_id:  8, booking_id:    8, createdAt: new Date(), updatedAt: new Date() },

      // ── LAST MONTH / -30 days (2 payments) ───────────────────────────────
      { method: 'cash',  booking_fee: 300.00, order_total: 280.00, grand_total:  580.00, status: 'completed', paid_at: ts(-30,'11','10'), user_id: 2, order_id:  9, booking_id:    9, createdAt: new Date(), updatedAt: new Date() },
      { method: 'gcash', booking_fee:   0.00, order_total: 190.00, grand_total:  190.00, status: 'completed', paid_at: ts(-30,'14','10'), user_id: 4, order_id: 10, booking_id: null, createdAt: new Date(), updatedAt: new Date() },

      // ── MONTH BEFORE LAST / -60 days (5 payments) ────────────────────────
      { method: 'cash',  booking_fee: 200.00, order_total: 200.00, grand_total:  400.00, status: 'completed', paid_at: ts(-60,'09','10'), user_id: 4, order_id: 11, booking_id:   11, createdAt: new Date(), updatedAt: new Date() },
      { method: 'gcash', booking_fee:   0.00, order_total: 340.00, grand_total:  340.00, status: 'completed', paid_at: ts(-60,'10','40'), user_id: 2, order_id: 12, booking_id: null, createdAt: new Date(), updatedAt: new Date() },
      { method: 'cash',  booking_fee: 1200.00, order_total: 470.00, grand_total: 1670.00, status: 'completed', paid_at: ts(-60,'12','10'), user_id: 4, order_id: 13, booking_id:   13, createdAt: new Date(), updatedAt: new Date() },
      { method: 'gcash', booking_fee:   0.00, order_total: 260.00, grand_total:  260.00, status: 'completed', paid_at: ts(-60,'14','40'), user_id: 2, order_id: 14, booking_id: null, createdAt: new Date(), updatedAt: new Date() },
      { method: 'cash',  booking_fee: 500.00, order_total: 180.00, grand_total:  680.00, status: 'completed', paid_at: ts(-60,'16','10'), user_id: 4, order_id: 15, booking_id:   15, createdAt: new Date(), updatedAt: new Date() },
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('PAYMENT', null, {});
  },
};
