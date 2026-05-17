'use strict';

// Category IDs (based on insert order):
// 1 = Cold Coffee | 2 = Hot Coffee | 3 = Tea | 4 = Snack | 5 = Fruit Soda

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('PRODUCT', [
      // Cold Coffee (category_id: 1)
      { name: 'Iced Americano',    description: 'Espresso over ice with cold water',      price:  85.00, is_available: 1, category_id: 1, createdAt: new Date(), updatedAt: new Date() },
      { name: 'Iced Latte',        description: 'Espresso with cold milk over ice',        price: 100.00, is_available: 1, category_id: 1, createdAt: new Date(), updatedAt: new Date() },
      // Hot Coffee (category_id: 2)
      { name: 'Espresso',          description: 'Classic single shot',                     price:  65.00, is_available: 1, category_id: 2, createdAt: new Date(), updatedAt: new Date() },
      { name: 'Cappuccino',        description: 'Espresso with steamed and frothed milk',  price:  95.00, is_available: 1, category_id: 2, createdAt: new Date(), updatedAt: new Date() },
      // Tea (category_id: 3)
      { name: 'Matcha Latte',      description: 'Japanese matcha with steamed milk',       price: 110.00, is_available: 1, category_id: 3, createdAt: new Date(), updatedAt: new Date() },
      { name: 'Iced Chamomile',    description: 'Soothing chamomile tea served over ice',  price:  85.00, is_available: 1, category_id: 3, createdAt: new Date(), updatedAt: new Date() },
      // Snack (category_id: 4)
      { name: 'Butter Croissant',  description: 'Flaky, buttery classic pastry',           price:  75.00, is_available: 1, category_id: 4, createdAt: new Date(), updatedAt: new Date() },
      { name: 'Cheese Sandwich',   description: 'Toasted sandwich with melted cheese',     price:  90.00, is_available: 1, category_id: 4, createdAt: new Date(), updatedAt: new Date() },
      // Fruit Soda (category_id: 5)
      { name: 'Lemon Fizz',        description: 'Sparkling lemon juice with soda water',   price:  80.00, is_available: 1, category_id: 5, createdAt: new Date(), updatedAt: new Date() },
      { name: 'Strawberry Soda',   description: 'Fresh strawberry syrup with sparkling water', price: 90.00, is_available: 1, category_id: 5, createdAt: new Date(), updatedAt: new Date() },
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('PRODUCT', null, {});
  },
};