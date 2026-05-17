const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define(
    'Payment',
    {
      payment_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      method: {
        type: DataTypes.ENUM('cash', 'gcash'),
        allowNull: false,
        defaultValue: 'cash',
      },
      booking_fee: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00,
      },
      order_total: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00,
      },
      grand_total: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00,
      },
      status: {
        type: DataTypes.ENUM('pending', 'completed'),
        allowNull: false,
        defaultValue: 'pending',
      },
      reference_no: {
        type: DataTypes.STRING(100),
        allowNull: true,
      },
      paid_at: {
        type: DataTypes.DATE,
        allowNull: true,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      order_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      booking_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      tableName: 'PAYMENT',
      timestamps: false,
    }
  );