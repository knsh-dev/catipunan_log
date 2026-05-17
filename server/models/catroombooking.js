const { DataTypes } = require('sequelize');

module.exports = (sequelize) =>
  sequelize.define(
    'CatRoomBooking',
    {
      booking_id: {
        type: DataTypes.INTEGER,
        primaryKey: true,
        autoIncrement: true,
        allowNull: false,
      },
      check_in: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      check_out: {
        type: DataTypes.DATE,
        allowNull: false,
      },
      party_size: {
        type: DataTypes.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      booking_fee: {
        type: DataTypes.DECIMAL(10, 2),
        allowNull: false,
        defaultValue: 0.00,
      },
      status: {
        type: DataTypes.ENUM('confirmed', 'active', 'completed'),
        allowNull: false,
        defaultValue: 'confirmed',
      },
      user_id: {
        type: DataTypes.INTEGER,
        allowNull: false,
      },
    },
    {
      tableName: 'CATROOMBOOKING',
      timestamps: false,
      validate: {
        checkOutAfterCheckIn() {
          if (this.check_out <= this.check_in) {
            throw new Error('check_out must be after check_in');
          }
        },
      },
    }
  );