'use strict';

// Distribution: 5 today | 3 last week | 2 last month | 5 month-before-last
// Order IDs 1-5 → today, 6-8 → last week, 9-10 → last month, 11-15 → month-before-last

function ts(offsetDays, hh, mm = '00') {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  d.setHours(parseInt(hh), parseInt(mm), 0, 0);
  return new Date(d);
}

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('ORDER', [
      // ── TODAY (5 orders) ──────────────────────────────────────────────────
      { order_type: 'walk_in',  status: 'completed', subtotal: 185.00, total_amount: 185.00, user_id: 2, booking_id: null, createdAt: ts( 0,'09','20'), updatedAt: ts( 0,'09','20') },
      { order_type: 'cat_room', status: 'completed', subtotal: 270.00, total_amount: 270.00, user_id: 4, booking_id:    2, createdAt: ts( 0,'10','05'), updatedAt: ts( 0,'10','05') },
      { order_type: 'walk_in',  status: 'completed', subtotal: 165.00, total_amount: 165.00, user_id: 2, booking_id: null, createdAt: ts( 0,'11','35'), updatedAt: ts( 0,'11','35') },
      { order_type: 'cat_room', status: 'active',    subtotal: 390.00, total_amount: 390.00, user_id: 4, booking_id:    4, createdAt: ts( 0,'14','05'), updatedAt: ts( 0,'14','05') },
      { order_type: 'walk_in',  status: 'completed', subtotal: 175.00, total_amount: 175.00, user_id: 2, booking_id: null, createdAt: ts( 0,'16','05'), updatedAt: ts( 0,'16','05') },

      // ── LAST WEEK / -7 days (3 orders) ───────────────────────────────────
      { order_type: 'cat_room', status: 'completed', subtotal: 250.00, total_amount: 250.00, user_id: 4, booking_id:    6, createdAt: ts(-7,'10','05'), updatedAt: ts(-7,'10','05') },
      { order_type: 'walk_in',  status: 'completed', subtotal: 320.00, total_amount: 320.00, user_id: 2, booking_id: null, createdAt: ts(-7,'13','35'), updatedAt: ts(-7,'13','35') },
      { order_type: 'cat_room', status: 'completed', subtotal: 410.00, total_amount: 410.00, user_id: 4, booking_id:    8, createdAt: ts(-7,'15','05'), updatedAt: ts(-7,'15','05') },

      // ── LAST MONTH / -30 days (2 orders) ─────────────────────────────────
      { order_type: 'cat_room', status: 'completed', subtotal: 280.00, total_amount: 280.00, user_id: 2, booking_id:    9, createdAt: ts(-30,'11','05'), updatedAt: ts(-30,'11','05') },
      { order_type: 'walk_in',  status: 'completed', subtotal: 190.00, total_amount: 190.00, user_id: 4, booking_id: null, createdAt: ts(-30,'14','05'), updatedAt: ts(-30,'14','05') },

      // ── MONTH BEFORE LAST / -60 days (5 orders) ──────────────────────────
      { order_type: 'cat_room', status: 'completed', subtotal: 200.00, total_amount: 200.00, user_id: 4, booking_id:   11, createdAt: ts(-60,'09','05'), updatedAt: ts(-60,'09','05') },
      { order_type: 'walk_in',  status: 'completed', subtotal: 340.00, total_amount: 340.00, user_id: 2, booking_id: null, createdAt: ts(-60,'10','35'), updatedAt: ts(-60,'10','35') },
      { order_type: 'cat_room', status: 'completed', subtotal: 470.00, total_amount: 470.00, user_id: 4, booking_id:   13, createdAt: ts(-60,'12','05'), updatedAt: ts(-60,'12','05') },
      { order_type: 'walk_in',  status: 'completed', subtotal: 260.00, total_amount: 260.00, user_id: 2, booking_id: null, createdAt: ts(-60,'14','35'), updatedAt: ts(-60,'14','35') },
      { order_type: 'cat_room', status: 'completed', subtotal: 180.00, total_amount: 180.00, user_id: 4, booking_id:   15, createdAt: ts(-60,'16','05'), updatedAt: ts(-60,'16','05') },
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('ORDER', null, {});
  },
};
