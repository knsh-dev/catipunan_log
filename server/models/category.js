const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define(
    'Category',
    {
      category_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING(100),
        allowNull: false,
      },
      description: {
        type: DataTypes.TEXT,
        allowNull: true,
      },
    },
    {
      tableName: 'CATEGORY',
      timestamps: false,
    }
  );