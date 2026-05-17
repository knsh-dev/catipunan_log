'use strict';

// Inventory is connected dynamically to PRODUCT by name —
// no hardcoded IDs so it works regardless of auto-increment state.

module.exports = {
  async up(queryInterface, Sequelize) {
    // Fetch the actual product_ids from the already-seeded PRODUCT table
    const products = await queryInterface.sequelize.query(
      `SELECT product_id, name FROM PRODUCT
       WHERE name IN (
         'Iced Americano','Iced Latte','Espresso','Cappuccino',
         'Matcha Latte','Iced Chamomile','Butter Croissant',
         'Cheese Sandwich','Lemon Fizz','Strawberry Soda'
       )`,
      { type: queryInterface.sequelize.QueryTypes.SELECT }
    );

    // Build name → product_id map
    const pid = {};
    products.forEach(p => { pid[p.name] = p.product_id; });

    await queryInterface.bulkInsert('INVENTORY', [
      { product_id: pid['Iced Americano'],   quantity: 120, low_stock_threshold: 20, createdAt: new Date(), updatedAt: new Date() },
      { product_id: pid['Iced Latte'],       quantity: 100, low_stock_threshold: 20, createdAt: new Date(), updatedAt: new Date() },
      { product_id: pid['Espresso'],         quantity: 150, low_stock_threshold: 25, createdAt: new Date(), updatedAt: new Date() },
      { product_id: pid['Cappuccino'],       quantity:  90, low_stock_threshold: 15, createdAt: new Date(), updatedAt: new Date() },
      { product_id: pid['Matcha Latte'],     quantity:  75, low_stock_threshold: 15, createdAt: new Date(), updatedAt: new Date() },
      { product_id: pid['Iced Chamomile'],   quantity:  80, low_stock_threshold: 10, createdAt: new Date(), updatedAt: new Date() },
      { product_id: pid['Butter Croissant'], quantity:  60, low_stock_threshold: 10, createdAt: new Date(), updatedAt: new Date() },
      { product_id: pid['Cheese Sandwich'],  quantity:  50, low_stock_threshold: 10, createdAt: new Date(), updatedAt: new Date() },
      { product_id: pid['Lemon Fizz'],       quantity: 100, low_stock_threshold: 20, createdAt: new Date(), updatedAt: new Date() },
      { product_id: pid['Strawberry Soda'],  quantity:  90, low_stock_threshold: 15, createdAt: new Date(), updatedAt: new Date() },
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('INVENTORY', null, {});
  },
};