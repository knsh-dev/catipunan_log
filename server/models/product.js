const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define(
    'Product',
    {
      product_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING(150),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
      price: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
      },
      image_url: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },
      is_available: {
        type: DataTypes.TINYINT,
        allowNull: false,
        defaultValue: 1,
      },
      category_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      tableName: 'PRODUCT',
      timestamps: false,
    }
  );