'use strict';

// Dynamic dates — always relative to today when seeder runs.
// Distribution: 5 today | 3 last week | 2 last month | 5 month-before-last
// Booking durations: 15 min, 30 min, 1 hour

function dt(offsetDays, hh, mm = '00') {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  const yyyy = d.getFullYear();
  const mo   = String(d.getMonth() + 1).padStart(2, '0');
  const dd   = String(d.getDate()).padStart(2, '0');
  return `${yyyy}-${mo}-${dd} ${hh}:${mm}:00`;
}

// 15 min = ₱100/pax, 30 min = ₱150/pax, 1 hour = ₱300/pax
// booking_fee = price_per_pax × party_size
const FEE15  = (n) => 100 * n;
const FEE30  = (n) => 150 * n;
const FEE60  = (n) => 300 * n;

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('CATROOMBOOKING', [
      // ── TODAY (5 bookings) ───────────────────────────────────────────────
      { check_in: dt( 0,'09','00'), check_out: dt( 0,'09','15'), party_size: 2, booking_fee: FEE15(2), status: 'completed', user_id: 2, createdAt: new Date(), updatedAt: new Date() },
      { check_in: dt( 0,'10','00'), check_out: dt( 0,'10','30'), party_size: 3, booking_fee: FEE30(3), status: 'completed', user_id: 4, createdAt: new Date(), updatedAt: new Date() },
      { check_in: dt( 0,'11','30'), check_out: dt( 0,'12','30'), party_size: 4, booking_fee: FEE60(4), status: 'completed', user_id: 2, createdAt: new Date(), updatedAt: new Date() },
      { check_in: dt( 0,'14','00'), check_out: dt( 0,'14','30'), party_size: 5, booking_fee: FEE30(5), status: 'active',    user_id: 4, createdAt: new Date(), updatedAt: new Date() },
      { check_in: dt( 0,'16','00'), check_out: dt( 0,'17','00'), party_size: 2, booking_fee: FEE60(2), status: 'confirmed', user_id: 2, createdAt: new Date(), updatedAt: new Date() },

      // ── LAST WEEK / -7 days (3 bookings) ────────────────────────────────
      { check_in: dt(-7,'10','00'), check_out: dt(-7,'10','15'), party_size: 3, booking_fee: FEE15(3), status: 'completed', user_id: 4, createdAt: new Date(), updatedAt: new Date() },
      { check_in: dt(-7,'13','00'), check_out: dt(-7,'13','30'), party_size: 2, booking_fee: FEE30(2), status: 'completed', user_id: 2, createdAt: new Date(), updatedAt: new Date() },
      { check_in: dt(-7,'15','00'), check_out: dt(-7,'16','00'), party_size: 4, booking_fee: FEE60(4), status: 'completed', user_id: 4, createdAt: new Date(), updatedAt: new Date() },

      // ── LAST MONTH / -30 days (2 bookings) ──────────────────────────────
      { check_in: dt(-30,'11','00'), check_out: dt(-30,'11','30'), party_size: 2, booking_fee: FEE30(2), status: 'completed', user_id: 2, createdAt: new Date(), updatedAt: new Date() },
      { check_in: dt(-30,'14','00'), check_out: dt(-30,'15','00'), party_size: 3, booking_fee: FEE60(3), status: 'completed', user_id: 4, createdAt: new Date(), updatedAt: new Date() },

      // ── MONTH BEFORE LAST / -60 days (5 bookings) ───────────────────────
      { check_in: dt(-60,'09','00'), check_out: dt(-60,'09','15'), party_size: 2, booking_fee: FEE15(2), status: 'completed', user_id: 4, createdAt: new Date(), updatedAt: new Date() },
      { check_in: dt(-60,'10','30'), check_out: dt(-60,'11','00'), party_size: 3, booking_fee: FEE30(3), status: 'completed', user_id: 2, createdAt: new Date(), updatedAt: new Date() },
      { check_in: dt(-60,'12','00'), check_out: dt(-60,'13','00'), party_size: 4, booking_fee: FEE60(4), status: 'completed', user_id: 4, createdAt: new Date(), updatedAt: new Date() },
      { check_in: dt(-60,'14','00'), check_out: dt(-60,'14','30'), party_size: 2, booking_fee: FEE30(2), status: 'completed', user_id: 2, createdAt: new Date(), updatedAt: new Date() },
      { check_in: dt(-60,'16','00'), check_out: dt(-60,'16','15'), party_size: 5, booking_fee: FEE15(5), status: 'completed', user_id: 4, createdAt: new Date(), updatedAt: new Date() },
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('CATROOMBOOKING', null, {});
  },
};
