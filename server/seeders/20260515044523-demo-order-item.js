'use strict';

// Dates match order seeder: 5 today | 3 last week | 2 last month | 5 month-before-last

function ts(offsetDays, hh, mm = '00') {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  d.setHours(parseInt(hh), parseInt(mm), 0, 0);
  return new Date(d);
}

const T0  = (hh, mm) => ts(  0, hh, mm);
const TW  = (hh, mm) => ts( -7, hh, mm);
const TM  = (hh, mm) => ts(-30, hh, mm);
const TM2 = (hh, mm) => ts(-60, hh, mm);

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('ORDERITEM', [
      // ── TODAY (orders 1–5) ───────────────────────────────────────────────
      { quantity: 1, unit_price:  85.00, order_id:  1, product_ID:  1, createdAt: T0('09','20'), updatedAt: T0('09','20') }, // Iced Americano
      { quantity: 1, unit_price: 100.00, order_id:  1, product_ID:  2, createdAt: T0('09','20'), updatedAt: T0('09','20') }, // Iced Latte
      { quantity: 2, unit_price:  95.00, order_id:  2, product_ID:  4, createdAt: T0('10','05'), updatedAt: T0('10','05') }, // Cappuccino ×2
      { quantity: 1, unit_price:  80.00, order_id:  2, product_ID:  9, createdAt: T0('10','05'), updatedAt: T0('10','05') }, // Lemon Fizz
      { quantity: 1, unit_price:  65.00, order_id:  3, product_ID:  3, createdAt: T0('11','35'), updatedAt: T0('11','35') }, // Espresso
      { quantity: 1, unit_price: 100.00, order_id:  3, product_ID:  2, createdAt: T0('11','35'), updatedAt: T0('11','35') }, // Iced Latte
      { quantity: 3, unit_price: 110.00, order_id:  4, product_ID:  5, createdAt: T0('14','05'), updatedAt: T0('14','05') }, // Matcha Latte ×3
      { quantity: 1, unit_price:  60.00, order_id:  4, product_ID:  7, createdAt: T0('14','05'), updatedAt: T0('14','05') }, // Butter Croissant
      { quantity: 1, unit_price:  85.00, order_id:  5, product_ID:  6, createdAt: T0('16','05'), updatedAt: T0('16','05') }, // Iced Chamomile
      { quantity: 1, unit_price:  90.00, order_id:  5, product_ID: 10, createdAt: T0('16','05'), updatedAt: T0('16','05') }, // Strawberry Soda

      // ── LAST WEEK (orders 6–8) ────────────────────────────────────────────
      { quantity: 2, unit_price:  85.00, order_id:  6, product_ID:  1, createdAt: TW('10','05'), updatedAt: TW('10','05') }, // Iced Americano ×2
      { quantity: 1, unit_price:  80.00, order_id:  6, product_ID:  9, createdAt: TW('10','05'), updatedAt: TW('10','05') }, // Lemon Fizz
      { quantity: 2, unit_price: 110.00, order_id:  7, product_ID:  5, createdAt: TW('13','35'), updatedAt: TW('13','35') }, // Matcha Latte ×2
      { quantity: 1, unit_price: 100.00, order_id:  7, product_ID:  2, createdAt: TW('13','35'), updatedAt: TW('13','35') }, // Iced Latte
      { quantity: 2, unit_price: 110.00, order_id:  8, product_ID:  5, createdAt: TW('15','05'), updatedAt: TW('15','05') }, // Matcha Latte ×2
      { quantity: 1, unit_price:  95.00, order_id:  8, product_ID:  4, createdAt: TW('15','05'), updatedAt: TW('15','05') }, // Cappuccino
      { quantity: 1, unit_price:  60.00, order_id:  8, product_ID:  7, createdAt: TW('15','05'), updatedAt: TW('15','05') }, // Butter Croissant

      // ── LAST MONTH (orders 9–10) ──────────────────────────────────────────
      { quantity: 2, unit_price: 100.00, order_id:  9, product_ID:  2, createdAt: TM('11','05'), updatedAt: TM('11','05') }, // Iced Latte ×2
      { quantity: 1, unit_price:  80.00, order_id:  9, product_ID:  9, createdAt: TM('11','05'), updatedAt: TM('11','05') }, // Lemon Fizz
      { quantity: 2, unit_price:  65.00, order_id: 10, product_ID:  3, createdAt: TM('14','05'), updatedAt: TM('14','05') }, // Espresso ×2
      { quantity: 1, unit_price:  60.00, order_id: 10, product_ID:  7, createdAt: TM('14','05'), updatedAt: TM('14','05') }, // Butter Croissant

      // ── MONTH BEFORE LAST (orders 11–15) ─────────────────────────────────
      { quantity: 2, unit_price: 100.00, order_id: 11, product_ID:  2, createdAt: TM2('09','05'), updatedAt: TM2('09','05') }, // Iced Latte ×2
      { quantity: 2, unit_price: 110.00, order_id: 12, product_ID:  5, createdAt: TM2('10','35'), updatedAt: TM2('10','35') }, // Matcha Latte ×2
      { quantity: 1, unit_price:  85.00, order_id: 12, product_ID:  1, createdAt: TM2('10','35'), updatedAt: TM2('10','35') }, // Iced Americano
      { quantity: 1, unit_price:  60.00, order_id: 12, product_ID:  7, createdAt: TM2('10','35'), updatedAt: TM2('10','35') }, // Butter Croissant
      { quantity: 2, unit_price: 110.00, order_id: 13, product_ID:  5, createdAt: TM2('12','05'), updatedAt: TM2('12','05') }, // Matcha Latte ×2
      { quantity: 2, unit_price: 100.00, order_id: 13, product_ID:  2, createdAt: TM2('12','05'), updatedAt: TM2('12','05') }, // Iced Latte ×2
      { quantity: 1, unit_price:  50.00, order_id: 13, product_ID:  8, createdAt: TM2('12','05'), updatedAt: TM2('12','05') }, // Cheese Sandwich
      { quantity: 2, unit_price:  85.00, order_id: 14, product_ID:  1, createdAt: TM2('14','35'), updatedAt: TM2('14','35') }, // Iced Americano ×2
      { quantity: 1, unit_price:  90.00, order_id: 14, product_ID: 10, createdAt: TM2('14','35'), updatedAt: TM2('14','35') }, // Strawberry Soda
      { quantity: 2, unit_price:  65.00, order_id: 15, product_ID:  3, createdAt: TM2('16','05'), updatedAt: TM2('16','05') }, // Espresso ×2
      { quantity: 1, unit_price:  50.00, order_id: 15, product_ID:  8, createdAt: TM2('16','05'), updatedAt: TM2('16','05') }, // Cheese Sandwich
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('ORDERITEM', null, {});
  },
};
