const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define(
    'DashboardLog',
    {
      dashboard_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      log_date: {
        type: DataTypes.DATEONLY,
        allowNull: false,
        unique: true,
      },
      total_payments: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      total_orders: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      total_bookings: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      order_revenue: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0.00,
      },
      booking_revenue: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0.00,
      },
      total_revenue: {
        type: DataTypes.DECIMAL(12, 2),
        allowNull: false,
        defaultValue: 0.00,
      },
      items_sold: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
    },
    {
      tableName: 'DASHBOARDLOG',
      timestamps: false,
    }
  );