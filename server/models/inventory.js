const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define(
    'Inventory',
    {
      inventory_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      quantity: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      low_stock_threshold: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 10,
      },
      last_updated: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      product_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
        unique: true,
      },
    },
    {
      tableName: 'INVENTORY',
      timestamps: false,
    }
  );