'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.bulkInsert('CATEGORY', [
      { name: 'Cold Coffee',  description: 'Cold espresso-based drinks',        createdAt: new Date(), updatedAt: new Date() },
      { name: 'Hot Coffee',   description: 'Hot espresso-based drinks',         createdAt: new Date(), updatedAt: new Date() },
      { name: 'Tea',          description: 'Hot and iced tea beverages',        createdAt: new Date(), updatedAt: new Date() },
      { name: 'Snack',        description: 'Light bites and pastries',          createdAt: new Date(), updatedAt: new Date() },
      { name: 'Fruit Soda',   description: 'Sparkling fruit-infused sodas',     createdAt: new Date(), updatedAt: new Date() },
    ], {});
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('CATEGORY', null, {});
  },
};