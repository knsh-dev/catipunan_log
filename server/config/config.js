// server/config/config.js
require('dotenv').config();

module.exports = {
  development: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD || null,
    database: process.env.DB_NAME,
    host:     process.env.DB_HOST,
    port:     parseInt(process.env.DB_PORT, 10) || 3306,
    dialect:  'mysql',
    logging:  false,
    timezone: '+08:00',                 // Philippine Standard Time (UTC+8)
    dialectOptions: {
      timezone: '+08:00',               // Ensures MySQL session uses PST
    },
  },
};