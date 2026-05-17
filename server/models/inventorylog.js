const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define(
    'InventoryLog',
    {
      log_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      action: {
        type: DataTypes.ENUM('restock', 'consumed'),
        allowNull: false,
      },
      quantity_change: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      created_at: {
        type: DataTypes.DATE,
        allowNull: false,
        defaultValue: DataTypes.NOW,
      },
      inventory_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      tableName: 'INVENTORYLOG',
      timestamps: false,
    }
  );