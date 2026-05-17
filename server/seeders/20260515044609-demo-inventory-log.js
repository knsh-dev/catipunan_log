'use strict';

// inventory_id 1–10 map to product_id 1–10
// Dates relative to today to avoid stale data.

function ts(offsetDays, hh, mm = '00') {
  const d = new Date();
  d.setDate(d.getDate() + offsetDays);
  d.setHours(parseInt(hh), parseInt(mm), 0, 0);
  return new Date(d);
}

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('INVENTORYLOG', [
      // Restocks by admin (user_id: 1) — ~1 week ago
      { action: 'restock',    quantity_change:  50, inventory_id:  1, user_id: 1, createdAt: ts(-7,'08','00'), updatedAt: ts(-7,'08','00') }, // Iced Americano
      { action: 'restock',    quantity_change:  50, inventory_id:  2, user_id: 1, createdAt: ts(-7,'08','05'), updatedAt: ts(-7,'08','05') }, // Iced Latte
      { action: 'restock',    quantity_change: 100, inventory_id:  3, user_id: 1, createdAt: ts(-7,'08','10'), updatedAt: ts(-7,'08','10') }, // Espresso
      { action: 'restock',    quantity_change:  40, inventory_id:  7, user_id: 1, createdAt: ts(-5,'09','00'), updatedAt: ts(-5,'09','00') }, // Butter Croissant
      { action: 'restock',    quantity_change:  40, inventory_id:  8, user_id: 1, createdAt: ts(-5,'09','05'), updatedAt: ts(-5,'09','05') }, // Cheese Sandwich
      { action: 'restock',    quantity_change:  60, inventory_id:  9, user_id: 1, createdAt: ts(-4,'08','30'), updatedAt: ts(-4,'08','30') }, // Lemon Fizz
      { action: 'restock',    quantity_change:  60, inventory_id: 10, user_id: 1, createdAt: ts(-4,'08','35'), updatedAt: ts(-4,'08','35') }, // Strawberry Soda

      // Consumed – day before yesterday
      { action: 'consumed',   quantity_change:  -4, inventory_id:  2, user_id: 4, createdAt: ts(-2,'12','40'), updatedAt: ts(-2,'12','40') }, // Iced Latte
      { action: 'consumed',   quantity_change:  -4, inventory_id:  5, user_id: 2, createdAt: ts(-2,'12','45'), updatedAt: ts(-2,'12','45') }, // Matcha Latte
      { action: 'consumed',   quantity_change:  -3, inventory_id:  1, user_id: 4, createdAt: ts(-2,'16','40'), updatedAt: ts(-2,'16','40') }, // Iced Americano
      { action: 'consumed',   quantity_change:  -2, inventory_id:  9, user_id: 2, createdAt: ts(-2,'18','40'), updatedAt: ts(-2,'18','40') }, // Lemon Fizz

      // Consumed – yesterday
      { action: 'consumed',   quantity_change:  -3, inventory_id:  5, user_id: 4, createdAt: ts(-1,'11','10'), updatedAt: ts(-1,'11','10') }, // Matcha Latte
      { action: 'consumed',   quantity_change:  -2, inventory_id:  3, user_id: 2, createdAt: ts(-1,'13','10'), updatedAt: ts(-1,'13','10') }, // Espresso
      { action: 'consumed',   quantity_change:  -2, inventory_id:  2, user_id: 4, createdAt: ts(-1,'15','10'), updatedAt: ts(-1,'15','10') }, // Iced Latte
      { action: 'consumed',   quantity_change:  -1, inventory_id:  6, user_id: 2, createdAt: ts(-1,'17','10'), updatedAt: ts(-1,'17','10') }, // Iced Chamomile

      // Consumed – today
      { action: 'consumed',   quantity_change:  -2, inventory_id:  4, user_id: 4, createdAt: ts( 0,'11','40'), updatedAt: ts( 0,'11','40') }, // Cappuccino
      { action: 'consumed',   quantity_change:  -3, inventory_id:  5, user_id: 2, createdAt: ts( 0,'15','40'), updatedAt: ts( 0,'15','40') }, // Matcha Latte
      { action: 'consumed',   quantity_change:  -1, inventory_id:  7, user_id: 4, createdAt: ts( 0,'15','45'), updatedAt: ts( 0,'15','45') }, // Butter Croissant

      // Adjustments / waste
      { action: 'adjustment', quantity_change:  -3, inventory_id:  7, user_id: 1, createdAt: ts(-2,'18','00'), updatedAt: ts(-2,'18','00') }, // Butter Croissant (expired)
      { action: 'adjustment', quantity_change:  -2, inventory_id:  8, user_id: 1, createdAt: ts(-1,'18','00'), updatedAt: ts(-1,'18','00') }, // Cheese Sandwich (expired)
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('INVENTORYLOG', null, {});
  },
};
