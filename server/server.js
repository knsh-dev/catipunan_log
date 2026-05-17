// server/server.js
require('dotenv').config();
// Set Node.js timezone to Philippine Standard Time (UTC+8) as early as possible
// so all new Date() calls reflect local time.
process.env.TZ = process.env.TZ || 'Asia/Manila';
const express = require('express');
const cors    = require('cors');
const path    = require('path');

const authRoutes      = require('./routes/auth');
const dashboardRoutes = require('./routes/dashboard');
const paymentRoutes   = require('./routes/payment');
const bookingRoutes   = require('./routes/booking');
const userRoutes      = require('./routes/users');
const productRoutes   = require('./routes/products');
const inventoryRoutes = require('./routes/inventory');
const posRoutes       = require('./routes/pos');

const app  = express();
const PORT = process.env.PORT || 5000;

// ── Middleware ───────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Static files (product images) ────────────────────────────
app.use('/uploads', require('express').static(require('path').join(__dirname, 'public', 'uploads')));

// ── API Routes ───────────────────────────────────────────────
app.use('/api/auth',      authRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/payments',  paymentRoutes);
app.use('/api/bookings',  bookingRoutes);
app.use('/api/users',     userRoutes);
app.use('/api/products',  productRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/pos',       posRoutes);

// ── Health check ─────────────────────────────────────────────
app.get('/api/health', (_req, res) => res.json({ status: 'ok', time: new Date() }));

// ── Start ─────────────────────────────────────────────────────
const { sequelize } = require('./models');
sequelize.authenticate()
  .then(() => {
    console.log('✅  MySQL connected via Sequelize.');
    app.listen(PORT, () => {
      console.log(`🚀  Server running at http://localhost:${PORT}`);
    });

    // ── Cron: Auto-transition booking statuses every minute ──
    try {
      const cron = require('node-cron');

      // Every minute — confirmed→active when check_in passed, active→completed when check_out passed
      cron.schedule('* * * * *', async () => {
        try {
          const { QueryTypes } = require('sequelize');
          const now = new Date();
          await sequelize.query(
            `UPDATE CATROOMBOOKING SET status='active'
             WHERE status='confirmed' AND check_in <= :now`,
            { replacements: { now }, type: QueryTypes.UPDATE }
          );
          await sequelize.query(
            `UPDATE CATROOMBOOKING SET status='completed'
             WHERE status='active' AND check_out <= :now`,
            { replacements: { now }, type: QueryTypes.UPDATE }
          );
        } catch (err) {
          console.error('[CRON] Booking auto-update error:', err.message);
        }
      });

      console.log('⏰  Cron jobs scheduled.');
    } catch (e) {
      console.warn('⚠️  node-cron not available — run: npm install node-cron');
    }
  })
  .catch((err) => {
    console.error('❌  DB connection failed:', err.message);
    process.exit(1);
  });