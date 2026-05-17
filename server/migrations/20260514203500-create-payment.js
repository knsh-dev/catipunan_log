'use strict';
/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('PAYMENT', {
      payment_id: {
        allowNull: false,
        autoIncrement: true,
        primaryKey: true,
        type: Sequelize.INTEGER
      },
      method: {
        type: Sequelize.STRING
      },
      booking_fee: {
        type: Sequelize.DECIMAL
      },
      order_total: {
        type: Sequelize.DECIMAL
      },
      grand_total: {
        type: Sequelize.DECIMAL
      },
      status: {
        type: Sequelize.STRING
      },
      reference_no: {
        type: Sequelize.STRING
      },
      paid_at: {
        type: Sequelize.DATE
      },
      user_id: {
        type: Sequelize.INTEGER
      },
      order_id: {
        type: Sequelize.INTEGER
      },
      booking_id: {
        type: Sequelize.INTEGER
      },
      createdAt: {
        allowNull: false,
        type: Sequelize.DATE
      },
      updatedAt: {
        allowNull: false,
        type: Sequelize.DATE
      }
    });
  },
  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('PAYMENT');
  }
};