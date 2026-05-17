// server/controllers/posController.js
const { sequelize } = require('../models');
const { QueryTypes } = require('sequelize');

// ── GET /api/pos/products ─────────────────────────────────────
// Returns products with inventory stock, categories for POS
const getPosProducts = async (req, res) => {
  try {
    const products = await sequelize.query(
      `SELECT
         p.product_id,
         p.name,
         p.price,
         p.image_url,
         p.is_available,
         p.category_id,
         c.name AS category_name,
         COALESCE(i.quantity, 0) AS stock
       FROM PRODUCT p
       LEFT JOIN CATEGORY c ON c.category_id = p.category_id
       LEFT JOIN INVENTORY i ON i.product_id = p.product_id
       WHERE p.is_available = 1
       ORDER BY c.category_id ASC, p.name ASC`,
      { type: QueryTypes.SELECT }
    );

    const categories = await sequelize.query(
      `SELECT DISTINCT c.category_id, c.name
       FROM CATEGORY c
       INNER JOIN PRODUCT p ON p.category_id = c.category_id
       WHERE p.is_available = 1
       ORDER BY c.category_id ASC`,
      { type: QueryTypes.SELECT }
    );

    return res.status(200).json({ products, categories });
  } catch (err) {
    console.error('POS products error:', err);
    return res.status(500).json({ message: 'Failed to fetch products.' });
  }
};

// ── GET /api/pos/bookings/durations ──────────────────────────
// Returns available booking duration options
const getBookingDurations = async (req, res) => {
  // Static durations as defined in the business rules
  const durations = [
    { id: 1, label: '10 MINS', minutes: 10, price: 100 },
    { id: 2, label: '15 MINS', minutes: 15, price: 150 },
    { id: 3, label: '1 HOUR',  minutes: 60, price: 300 },
  ];
  return res.status(200).json({ durations });
};

// ── POST /api/pos/checkout ────────────────────────────────────
// Processes full POS transaction:
// - Creates booking (if applicable)
// - Creates order + order items (if applicable)
// - Creates payment record
// - Deducts inventory + creates CONSUMED logs
const posCheckout = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const userId = req.user.id;
    const {
      items,        // [{ product_id, quantity, unit_price }]
      booking,      // { duration_label, minutes, price_per_pax, start_time, guests } | null
      payment_method, // 'cash' | 'gcash'
      reference_no,   // string | null
    } = req.body;

    const hasItems   = Array.isArray(items) && items.length > 0;
    const hasBooking = !!booking;

    if (!hasItems && !hasBooking) {
      await t.rollback();
      return res.status(400).json({ message: 'Order must have at least one item or a booking.' });
    }
    if (!['cash', 'gcash'].includes(payment_method)) {
      await t.rollback();
      return res.status(400).json({ message: 'Invalid payment method.' });
    }
    if (payment_method === 'gcash' && (!reference_no || !reference_no.trim())) {
      await t.rollback();
      return res.status(400).json({ message: 'GCash reference number is required.' });
    }

    const now = new Date();

    // ── 1. Create Booking ──────────────────────────────────────
    let bookingId   = null;
    let bookingFee  = 0;
    let bookingData = null;

    if (hasBooking) {
      const { minutes, price_per_pax, start_time, guests, duration_label, is_exclusive } = booking;
      // Exclusive always books 10 (full room promo); otherwise use provided guest count
      const guestCount = is_exclusive ? 10 : parseInt(guests, 10);
      if (!guestCount || guestCount < 1) {
        await t.rollback();
        return res.status(400).json({ message: 'Number of guests must be at least 1.' });
      }

      // Validate start_time is today (in Philippine Standard Time)
      const startDt = new Date(start_time);
      const todayStr = new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
      const startStr = startDt.toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' });
      if (startStr !== todayStr) {
        await t.rollback();
        return res.status(400).json({ message: 'Booking start time must be today.' });
      }

      const checkIn  = startDt;
      const checkOut = new Date(startDt.getTime() + minutes * 60 * 1000);
      // Exclusive = flat ₱1,000 fee; regular = price_per_pax × guests
      bookingFee = is_exclusive ? parseFloat(price_per_pax) : parseFloat(price_per_pax) * guestCount;

      // ── Enforce 10-person room cap ──────────────────────────────
      // Counts party_size of all CONFIRMED or ACTIVE bookings that overlap
      // this time window. Completed bookings release their slots immediately.
      // This must match getSlotCount exactly so the POS meter = checkout reality.
      const [slotRow] = await sequelize.query(
        `SELECT COALESCE(SUM(party_size), 0) AS occupied
         FROM CATROOMBOOKING
         WHERE status IN ('confirmed', 'active')
           AND check_in  < :check_out
           AND check_out > :check_in`,
        { replacements: { check_in: checkIn, check_out: checkOut }, type: QueryTypes.SELECT, transaction: t }
      );
      const occupied  = parseInt(slotRow?.occupied || 0);
      const available = 10 - occupied;
      if (available <= 0) {
        await t.rollback();
        return res.status(409).json({
          message: 'Room is fully booked for this time window. Please choose a different time.',
        });
      }
      if (guestCount > available) {
        await t.rollback();
        return res.status(409).json({
          message: `Only ${available} spot${available !== 1 ? 's' : ''} available for this window (${occupied} already booked). Reduce guests or choose a different time.`,
        });
      }

      const [bookingResult] = await sequelize.query(
        `INSERT INTO CATROOMBOOKING (check_in, check_out, party_size, booking_fee, status, user_id)
         VALUES (:check_in, :check_out, :party_size, :booking_fee, 'confirmed', :user_id)`,
        {
          replacements: {
            check_in:    checkIn,
            check_out:   checkOut,
            party_size:  guestCount,
            booking_fee: bookingFee,
            user_id:     userId,
          },
          type: QueryTypes.INSERT,
          transaction: t,
        }
      );
      bookingId = bookingResult;

      bookingData = {
        booking_id:     bookingId,
        duration_label,
        start_time:     checkIn,
        guests:         guestCount,
        price_per_pax:  parseFloat(price_per_pax),
        booking_fee:    bookingFee,
      };
    }

    // ── 2. Create Order + Items ────────────────────────────────
    let orderId    = null;
    let orderTotal = 0;
    let orderItems = [];

    if (hasItems) {
      // Validate stock availability
      for (const item of items) {
        const [inv] = await sequelize.query(
          `SELECT i.quantity FROM INVENTORY i WHERE i.product_id = :pid`,
          { replacements: { pid: item.product_id }, type: QueryTypes.SELECT, transaction: t }
        );
        if (!inv || parseInt(inv.quantity) < item.quantity) {
          await t.rollback();
          return res.status(400).json({
            message: `Insufficient stock for product ID ${item.product_id}.`,
          });
        }
      }

      // Calculate subtotal
      const subtotal = items.reduce((sum, it) => sum + (parseFloat(it.unit_price) * it.quantity), 0);
      orderTotal = subtotal;
      const orderType = hasBooking ? 'cat_room' : 'walk_in';

      const [orderResult] = await sequelize.query(
        `INSERT INTO \`ORDER\` (order_type, status, subtotal, total_amount, created_at, user_id, booking_id)
         VALUES (:order_type, 'completed', :subtotal, :total_amount, :created_at, :user_id, :booking_id)`,
        {
          replacements: {
            order_type:   orderType,
            subtotal,
            total_amount: subtotal,
            created_at:   now,
            user_id:      userId,
            booking_id:   bookingId,
          },
          type: QueryTypes.INSERT,
          transaction: t,
        }
      );
      orderId = orderResult;

      // Insert order items + deduct inventory
      for (const item of items) {
        await sequelize.query(
          `INSERT INTO ORDERITEM (quantity, unit_price, order_id, product_id)
           VALUES (:quantity, :unit_price, :order_id, :product_id)`,
          {
            replacements: {
              quantity:   item.quantity,
              unit_price: parseFloat(item.unit_price),
              order_id:   orderId,
              product_id: item.product_id,
            },
            type: QueryTypes.INSERT,
            transaction: t,
          }
        );

        // Deduct inventory
        await sequelize.query(
          `UPDATE INVENTORY SET quantity = quantity - :qty, last_updated = :now
           WHERE product_id = :pid`,
          {
            replacements: { qty: item.quantity, now, pid: item.product_id },
            type: QueryTypes.UPDATE,
            transaction: t,
          }
        );

        // Create CONSUMED log
        const [inv] = await sequelize.query(
          `SELECT inventory_id FROM INVENTORY WHERE product_id = :pid`,
          { replacements: { pid: item.product_id }, type: QueryTypes.SELECT, transaction: t }
        );
        if (inv) {
          await sequelize.query(
            `INSERT INTO INVENTORYLOG (action, quantity_change, created_at, inventory_id, user_id)
             VALUES ('consumed', :qty_change, :created_at, :inventory_id, :user_id)`,
            {
              replacements: {
                qty_change:   -item.quantity,
                created_at:   now,
                inventory_id: inv.inventory_id,
                user_id:      userId,
              },
              type: QueryTypes.INSERT,
              transaction: t,
            }
          );
        }
      }

      // Fetch full item details for receipt
      const itemDetails = await sequelize.query(
        `SELECT oi.item_id, oi.quantity, oi.unit_price, p.name AS product_name
         FROM ORDERITEM oi
         LEFT JOIN PRODUCT p ON p.product_id = oi.product_id
         WHERE oi.order_id = :order_id`,
        { replacements: { order_id: orderId }, type: QueryTypes.SELECT, transaction: t }
      );
      orderItems = itemDetails;
    }

    // ── 3. Create Payment ──────────────────────────────────────
    const grandTotal = orderTotal + bookingFee;

    const [paymentResult] = await sequelize.query(
      `INSERT INTO PAYMENT (method, booking_fee, order_total, grand_total, status, reference_no, paid_at, user_id, order_id, booking_id)
       VALUES (:method, :booking_fee, :order_total, :grand_total, 'completed', :reference_no, :paid_at, :user_id, :order_id, :booking_id)`,
      {
        replacements: {
          method:       payment_method,
          booking_fee:  bookingFee,
          order_total:  orderTotal,
          grand_total:  grandTotal,
          reference_no: reference_no?.trim() || null,
          paid_at:      now,
          user_id:      userId,
          order_id:     orderId,
          booking_id:   bookingId,
        },
        type: QueryTypes.INSERT,
        transaction: t,
      }
    );

    await t.commit();

    // ── 4. Build Receipt Data ──────────────────────────────────
    const isBookingOnly = !hasItems && hasBooking;
    const orderNum = isBookingOnly
      ? `BOOK-${String(bookingId).padStart(6, '0')}`
      : `ORD-${String(orderId).padStart(6, '0')}`;

    const receipt = {
      order_number:    orderNum,
      is_booking_only: isBookingOnly,
      date:            now,
      order_type:      hasBooking ? 'Catroom' : 'Walk-in',
      payment_method:  payment_method,
      reference_no:    reference_no?.trim() || null,
      booking:         bookingData,
      items:           orderItems,
      order_total:     orderTotal,
      booking_fee:     bookingFee,
      grand_total:     grandTotal,
      payment_id:      paymentResult,
    };

    return res.status(201).json({ message: 'Checkout successful.', receipt });
  } catch (err) {
    await t.rollback();
    console.error('POS checkout error:', err);
    return res.status(500).json({ message: 'Checkout failed. Please try again.' });
  }
};

// ── GET /api/pos/next-order-number ───────────────────────────
// Returns the next AUTO_INCREMENT value for the ORDER table
const getNextOrderNumber = async (req, res) => {
  try {
    const [row] = await sequelize.query(
      `SELECT AUTO_INCREMENT AS next_id
       FROM INFORMATION_SCHEMA.TABLES
       WHERE TABLE_SCHEMA = DATABASE()
         AND TABLE_NAME = 'ORDER'`,
      { type: QueryTypes.SELECT }
    );
    const nextId = row?.next_id || 1;
    return res.status(200).json({ next_order_number: nextId });
  } catch (err) {
    console.error('Next order number error:', err);
    return res.status(500).json({ message: 'Failed to fetch next order number.' });
  }
};

module.exports = { getPosProducts, getBookingDurations, posCheckout, getNextOrderNumber };