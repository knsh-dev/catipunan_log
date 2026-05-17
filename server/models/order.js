const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define(
    'Order',
    {
      order_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      order_type: {
        type: DataTypes.ENUM('walk_in', 'cat_room'),
        allowNull: false,
        defaultValue: 'walk_in',
      },
      status: {
        type: DataTypes.ENUM('preparing', 'completed'),
        allowNull: false,
        defaultValue: 'preparing',
      },
      subtotal: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00,
      },
      total_amount: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      booking_id: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
    },
    {
      tableName: 'ORDER',
      timestamps: false,
    }
  );