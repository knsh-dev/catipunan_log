// client/src/pages/CafePOSPage.jsx
import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import '../styles/CafePOSPage.css';

// ── Helpers ───────────────────────────────────────────────────
function formatPeso(val) {
  const n = parseFloat(val) || 0;
  return '₱' + n.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function formatReceiptPeso(val) {
  const n = parseFloat(val) || 0;
  return '₱' + n.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
}

function formatTime12(date) {
  const d = date instanceof Date ? date : new Date(date);
  let h = d.getHours(), m = d.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')} ${ampm}`;
}

function formatReceiptDate(date) {
  const d = date instanceof Date ? date : new Date(date);
  const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

// Generate a random 6-digit order number for display (fallback only)
function generateOrderNum() {
  return Math.floor(100000 + Math.random() * 900000);
}

// ── Icons ─────────────────────────────────────────────────────
const SearchIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
  </svg>
);

const LogOutIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" style={{ width: 16, height: 16 }}>
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4" /><polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);

// ── Time Input Helpers ────────────────────────────────────────
// Returns true if the given "HH:MM" string is in the past relative to now
function isTimePast(timeStr) {
  if (!timeStr) return false;
  const now = new Date();
  const nowMins = now.getHours() * 60 + now.getMinutes();
  const [hh, mm] = timeStr.split(':').map(Number);
  return (hh * 60 + mm) <= nowMins;
}

// ── Booking Modal ─────────────────────────────────────────────
function BookingModal({ duration, onClose, onAdd, token }) {

  const [startTime,    setStartTime]   = useState('');
  const [guests,       setGuests]      = useState('');
  const [errors,       setErrors]      = useState({});
  const [slotInfo,     setSlotInfo]    = useState(null);  // { occupied, available }
  const [slotLoading,  setSlotLoading] = useState(false);
  const checkSlot = async (time) => {
    if (!time) { setSlotInfo(null); return; }
    setSlotLoading(true);
    try {
      const pad = n => String(n).padStart(2, '0');
      const nowLocal = new Date();
      const today = `${nowLocal.getFullYear()}-${pad(nowLocal.getMonth()+1)}-${pad(nowLocal.getDate())}`;

      // Build local datetime strings (YYYY-MM-DD HH:MM:SS) — same format MySQL stores them.
      // Using .toISOString() would send UTC which MySQL misparses against local-stored datetimes.
      const inDt  = new Date(`${today}T${time}:00`);
      const outDt = new Date(inDt.getTime() + duration.minutes * 60000);

      const checkIn  = `${today} ${time}:00`;
      const checkOut = `${outDt.getFullYear()}-${pad(outDt.getMonth()+1)}-${pad(outDt.getDate())} ${pad(outDt.getHours())}:${pad(outDt.getMinutes())}:00`;

      const res = await fetch(
        `/api/bookings/slot-count?check_in=${encodeURIComponent(checkIn)}&check_out=${encodeURIComponent(checkOut)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.ok) setSlotInfo(await res.json());
    } catch { /* silent */ }
    finally { setSlotLoading(false); }
  };

  const handleTimeChange = (val) => {
    setStartTime(val);
    setErrors(p => ({ ...p, startTime: '' }));
    checkSlot(val);
  };
  const handleGuestsChange = (val) => {
    setGuests(val);
    setErrors(p => ({ ...p, guests: '' }));
  };

  const validate = () => {
    const e = {};
    if (!startTime) {
      e.startTime = 'Start time is required.';
    } else if (isTimePast(startTime)) {
      e.startTime = 'Start time cannot be in the past.';
    }
    if (duration.isExclusive) {
      // Exclusive needs ALL 10 slots free
      if (slotInfo && slotInfo.occupied > 0) {
        e.startTime = `Room is not fully free at this time (${slotInfo.occupied} spot${slotInfo.occupied !== 1 ? 's' : ''} occupied). Exclusive requires the entire room.`;
      }
    } else {
      const g = parseInt(guests, 10);
      if (!guests || isNaN(g) || g < 1) {
        e.guests = 'At least 1 guest is required.';
      } else if (slotInfo && g > slotInfo.available) {
        e.guests = `Only ${slotInfo.available} spot${slotInfo.available !== 1 ? 's' : ''} available for this time.`;
      }
      if (slotInfo && slotInfo.available <= 0) {
        e.startTime = 'This time slot is full (10/10). Please choose another time.';
      }
    }
    return e;
  };

  const handleAdd = () => {
    const e = validate();
    if (Object.keys(e).length) { setErrors(e); return; }

    const nowLocal = new Date();
    const today = `${nowLocal.getFullYear()}-${String(nowLocal.getMonth()+1).padStart(2,'0')}-${String(nowLocal.getDate()).padStart(2,'0')}`;
    const startDt = new Date(`${today}T${startTime}:00`);
    // Exclusive: always 10 guests (full room), flat ₱1,000
    const guestCount = duration.isExclusive ? 10 : parseInt(guests, 10);
    const charge = duration.isExclusive ? duration.price : duration.price * guestCount;

    onAdd({
      duration_label: duration.label,
      minutes:        duration.minutes,
      price_per_pax:  duration.price,
      start_time:     startDt.toISOString(),
      guests:         guestCount,
      booking_fee:    charge,
      is_exclusive:   duration.isExclusive,
    });
  };

  // ── Slot meter derived values ──────────────────────────────────
  const occupied    = slotInfo ? slotInfo.occupied  : 0;
  const available   = slotInfo ? slotInfo.available : 10;
  // For exclusive: treat all 10 as "mine" (full room); for regular: use entered guest count
  const guestNum    = duration.isExclusive ? 10 : (parseInt(guests, 10) || 0);
  const isFull      = duration.isExclusive
    ? (!!slotInfo && slotInfo.occupied > 0)   // exclusive needs ZERO occupied
    : (!!slotInfo && slotInfo.available <= 0);
  const isLow       = !duration.isExclusive && !!slotInfo && slotInfo.available > 0 && slotInfo.available <= 3;
  const wouldExceed = !duration.isExclusive && !!slotInfo && guestNum > slotInfo.available;

  return (
    <div className="pos-modal-overlay" onClick={onClose}>
      <div className="pos-modal pos-modal--wide" onClick={e => e.stopPropagation()}>
        <div className="pos-modal-title">Cat Room Booking</div>
        <div className="pos-modal-subtitle">
          {duration.isExclusive
            ? <><span className="pos-exclusive-badge">★ EXCLUSIVE</span> 1 Hour — {formatPeso(duration.price)} flat · Full Room (10 guests)</>
            : <>{duration.label} – {formatPeso(duration.price)} / pax</>
          }
        </div>

        {/* Start Time */}
        <div className="pos-modal-field">
          <label className="pos-modal-label">Start Time</label>
          <input
            type="time"
            className={`pos-modal-input${errors.startTime ? ' pos-modal-input--error' : ''}`}
            value={startTime}
            min="08:00" max="22:00"
            onChange={e => handleTimeChange(e.target.value)}
          />
          {errors.startTime && <div className="pos-modal-error">{errors.startTime}</div>}
        </div>

        {/* Slot Capacity Meter — appears as soon as a time is picked */}
        {startTime && (
          <div className={`pos-slot-meter${
            slotLoading ? ' pos-slot-meter--loading' :
            isFull      ? ' pos-slot-meter--full'    :
            isLow       ? ' pos-slot-meter--low'     : ''
          }`}>

            <div className="pos-slot-meter-header">
              <span className="pos-slot-meter-title">🪑 Room Capacity — {duration.label} window</span>
              <span className={`pos-slot-meter-badge${
                slotLoading ? '' : isFull ? ' pos-slot-meter-badge--full' : isLow ? ' pos-slot-meter-badge--low' : ' pos-slot-meter-badge--ok'
              }`}>
                {slotLoading ? 'Checking…' : `${available} / 10 free`}
              </span>
            </div>

            {/* 10-pip seat grid */}
            <div className="pos-slot-pips">
              {Array.from({ length: 10 }).map((_, i) => {
                let state = 'free';
                if (!slotLoading) {
                  if (i < occupied) state = 'occupied';
                  else if (guestNum > 0 && i < occupied + guestNum)
                    state = wouldExceed ? 'exceed' : 'mine';
                }
                return (
                  <div
                    key={i}
                    className={`pos-slot-pip pos-slot-pip--${slotLoading ? 'loading' : state}`}
                    title={
                      slotLoading          ? 'Loading…'                             :
                      state === 'occupied' ? 'Taken by an existing booking'         :
                      state === 'mine'     ? 'Your guests'                          :
                      state === 'exceed'   ? 'Over available capacity'              :
                      'Available'
                    }
                  />
                );
              })}
            </div>

            {/* Stats legend */}
            <div className="pos-slot-stats">
              {(slotLoading || occupied > 0) && (
                <span className="pos-slot-stat pos-slot-stat--occupied">
                  <span className="pos-slot-stat-dot" />
                  {slotLoading ? '…' : occupied} occupied
                </span>
              )}
              {guestNum > 0 && (
                <span className={`pos-slot-stat${wouldExceed ? ' pos-slot-stat--exceed' : ' pos-slot-stat--mine'}`}>
                  <span className="pos-slot-stat-dot" />
                  {guestNum} your guests
                </span>
              )}
              <span className="pos-slot-stat pos-slot-stat--free">
                <span className="pos-slot-stat-dot" />
                {slotLoading ? '…' : available} free
              </span>
            </div>

            {/* ── Conflict Breakdown ── */}
            {!slotLoading && slotInfo?.bookings?.length > 0 && (
              <div className="pos-slot-breakdown">
                <div className="pos-slot-breakdown-title">
                  ⚡ Overlapping bookings in this window:
                </div>
                <table className="pos-slot-breakdown-table">
                  <thead>
                    <tr>
                      <th>Check-in</th>
                      <th>Check-out</th>
                      <th>Party</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {slotInfo.bookings.map((b, i) => (
                      <tr key={i}>
                        <td>{formatTime12(new Date(b.check_in))}</td>
                        <td>{formatTime12(new Date(b.check_out))}</td>
                        <td className="pos-slot-party">{b.party_size} pax</td>
                        <td>
                          <span className={`pos-slot-status pos-slot-status--${b.status}`}>
                            {b.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                    <tr className="pos-slot-breakdown-total">
                      <td colSpan={2}>Total occupied</td>
                      <td className="pos-slot-party">{occupied} / 10</td>
                      <td>{available} free</td>
                    </tr>
                  </tbody>
                </table>
              </div>
            )}

            {/* Full warning */}
            {isFull && !slotLoading && (
              <div className="pos-slot-full-msg">
                ⛔ Room fully booked for this window — please choose a different time.
              </div>
            )}

            {/* Exceed warning */}
            {wouldExceed && !isFull && (
              <div className="pos-slot-exceed-msg">
                ⚠ {guestNum} guests exceeds {available} available spot{available !== 1 ? 's' : ''}.

              </div>
            )}
          </div>
        )}

        {/* Guests — hidden for exclusive (always 10) */}
        {duration.isExclusive ? (
          <div className="pos-modal-field">
            <label className="pos-modal-label">Party Size</label>
            <div className="pos-exclusive-fixed-guests">
              <span className="pos-exclusive-room-icon">🏠</span>
              Full Room — <strong>10 guests</strong> (fixed)
            </div>
          </div>
        ) : (
          <div className="pos-modal-field">
            <label className="pos-modal-label">Number of Guests</label>
            <input
              type="number" min="1" max={slotInfo ? slotInfo.available : 10}
              className={`pos-modal-input${errors.guests ? ' pos-modal-input--error' : ''}`}
              placeholder="e.g. 2"
              value={guests}
              onChange={e => handleGuestsChange(e.target.value)}
            />
            {errors.guests && <div className="pos-modal-error">{errors.guests}</div>}
          </div>
        )}

        <div className="pos-modal-actions">
          <button className="pos-modal-cancel" onClick={onClose}>Cancel</button>
          <button className="pos-modal-confirm" onClick={handleAdd} disabled={isFull}>
            Add to Order
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Payment Confirm Modal ─────────────────────────────────────
function PaymentConfirmModal({ total, paymentMethod, onClose, onConfirm, loading }) {
  const [refNo,    setRefNo]    = useState('');
  const [refError, setRefError] = useState('');

  const handleConfirm = () => {
    if (paymentMethod === 'gcash' && !refNo.trim()) {
      setRefError('GCash reference number is required.');
      return;
    }
    onConfirm(refNo.trim());
  };

  return (
    <div className="pos-modal-overlay" onClick={onClose}>
      <div className="pos-modal" onClick={e => e.stopPropagation()}>
        <div className="pos-modal-title">Confirm Payment</div>

        <div className="pos-confirm-row">
          <span className="pos-confirm-key">Payment Method:</span>
          <span className="pos-confirm-val">{paymentMethod === 'gcash' ? 'GCash' : 'Cash'}</span>
        </div>

        <div className="pos-confirm-row">
          <span className="pos-confirm-key">Total Amount:</span>
          <span className="pos-confirm-val--amount">{formatPeso(total)}</span>
        </div>

        {paymentMethod === 'gcash' && (
          <div className="pos-modal-field" style={{ marginTop: 10 }}>
            <label className="pos-modal-label">
              Reference Number <span style={{ color: '#EF4444' }}>*</span>
            </label>
            <input
              type="text"
              className={`pos-modal-input${refError ? ' pos-modal-input--error' : ''}`}
              placeholder="Enter GCash reference number"
              value={refNo}
              onChange={e => { setRefNo(e.target.value); setRefError(''); }}
            />
            {refError && <div className="pos-modal-error">{refError}</div>}
          </div>
        )}

        <div className="pos-confirm-note">Please confirm the payment details before proceeding.</div>

        <div className="pos-modal-actions" style={{ marginTop: 0 }}>
          <button className="pos-modal-cancel" onClick={onClose} disabled={loading}>Cancel</button>
          <button className="pos-modal-confirm" onClick={handleConfirm} disabled={loading}>
            {loading ? 'Processing…' : 'Confirm Payment'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Cancel Order Modal ────────────────────────────────────────
function CancelOrderModal({ onClose, onConfirm }) {
  return (
    <div className="pos-modal-overlay" onClick={onClose}>
      <div className="pos-modal" onClick={e => e.stopPropagation()}>
        <div className="pos-modal-title">Cancel Order?</div>
        <p className="pos-cancel-confirm-text">
          Are you sure you want to cancel and clear the current order? This action cannot be undone.
        </p>
        <div className="pos-modal-actions">
          <button className="pos-modal-cancel" onClick={onClose}>Go Back</button>
          <button
            className="pos-modal-confirm"
            style={{ background: '#EF4444' }}
            onClick={onConfirm}
          >
            Yes, Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Receipt Modal ─────────────────────────────────────────────
function ReceiptModal({ receipt, onClose }) {
  const {
    order_number, is_booking_only, date, order_type, payment_method,
    reference_no, booking, items, order_total, booking_fee, grand_total,
  } = receipt;

  const d = new Date(date);
  const hasItems   = Array.isArray(items) && items.length > 0;
  const hasBooking = !!booking;

  return (
    <div className="pos-receipt-overlay">
      <div className="pos-receipt">

        {/* Header */}
        <div className="receipt-header">
          <div className="receipt-business-name">CATIPUNAN PET CAFE</div>
          <div className="receipt-subtitle">Cat Cafe &amp; Lounge</div>
        </div>

        <hr className="receipt-divider" />

        {/* Meta */}
        <div className="receipt-meta">
          <div className="receipt-meta-row">
            <span className="receipt-meta-key">{is_booking_only ? 'Book #:' : 'Order #:'}</span>
            <span className="receipt-meta-val">{order_number}</span>
          </div>
          <div className="receipt-meta-row">
            <span className="receipt-meta-key">Date:</span>
            <span className="receipt-meta-val">{formatReceiptDate(d)}</span>
          </div>
          <div className="receipt-meta-row">
            <span className="receipt-meta-key">Time:</span>
            <span className="receipt-meta-val">{formatTime12(d)}</span>
          </div>
          <div className="receipt-meta-row">
            <span className="receipt-meta-key">Type:</span>
            <span className="receipt-meta-val">{order_type}</span>
          </div>
          <div className="receipt-meta-row">
            <span className="receipt-meta-key">Payment:</span>
            <span className="receipt-meta-val">{payment_method === 'gcash' ? 'GCash' : 'Cash'}</span>
          </div>
          {payment_method === 'gcash' && reference_no && (
            <div className="receipt-meta-row">
              <span className="receipt-meta-key">Ref No.:</span>
              <span className="receipt-meta-val">{reference_no}</span>
            </div>
          )}
        </div>

        {/* Booking Section */}
        {hasBooking && (
          <>
            <hr className="receipt-divider" />
            <div className="receipt-booking-section">
              <div className="receipt-booking-title">Cat Room Booking:</div>
              <div className="receipt-booking-detail">
                Cat Room {booking.duration_label} ({formatTime12(new Date(booking.start_time))}, {booking.guests} guest{booking.guests !== 1 ? 's' : ''})
              </div>
              <div className="receipt-booking-calc">
                {booking.is_exclusive
                  ? <>★ Exclusive — Full Room (flat fee) = {formatReceiptPeso(booking.booking_fee)}</>
                  : <>{booking.guests} pax × {formatReceiptPeso(booking.price_per_pax)} = {formatReceiptPeso(booking.booking_fee)}</>}
              </div>
            </div>
          </>
        )}

        {/* Items Table */}
        {hasItems && (
          <>
            <hr className="receipt-divider" />
            <table className="receipt-items-table">
              <thead>
                <tr>
                  <th>ITEM</th>
                  <th>QTY</th>
                  <th>PRICE</th>
                  <th>TOTAL</th>
                </tr>
              </thead>
              <tbody>
                {items.map((item, i) => (
                  <tr key={i}>
                    <td>{item.product_name || item.name}</td>
                    <td>{item.quantity}</td>
                    <td>{formatReceiptPeso(item.unit_price || item.price)}</td>
                    <td>{formatReceiptPeso(parseFloat(item.unit_price || item.price) * item.quantity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </>
        )}

        <hr className="receipt-divider" />

        {/* Totals */}
        <div className="receipt-totals">
          {hasItems && (
            <div className="receipt-total-row">
              <span className="receipt-total-label">ITEMS SUBTOTAL:</span>
              <span className="receipt-total-val">{formatReceiptPeso(order_total)}</span>
            </div>
          )}
          {hasBooking && (
            <div className="receipt-total-row">
              <span className="receipt-total-label">BOOKING FEE:</span>
              <span className="receipt-total-val">{formatReceiptPeso(booking_fee)}</span>
            </div>
          )}
          <div className="receipt-total-row receipt-total-row--grand">
            <span className="receipt-total-label">TOTAL:</span>
            <span className="receipt-total-val">{formatReceiptPeso(grand_total)}</span>
          </div>
        </div>

        <hr className="receipt-divider" />

        {/* Footer */}
        <div className="receipt-footer">
          <div className="receipt-thank-you">Thank you for visiting!</div>
          <div className="receipt-tagline">Come back and see our cats again soon</div>
        </div>

        <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
          <button
            className="receipt-close-btn"
            style={{ flex: 1, margin: 0 }}
            onClick={() => handlePrintReceipt({ order_number, is_booking_only, date, order_type, payment_method, reference_no, booking, items, order_total, booking_fee, grand_total })}
          >
            🖨 Print
          </button>
          <button
            className="receipt-close-btn"
            style={{ flex: 1, margin: 0, background: '#444' }}
            onClick={onClose}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Print Receipt Helper ──────────────────────────────────────
function handlePrintReceipt({ order_number, is_booking_only, date, order_type, payment_method, reference_no, booking, items, order_total, booking_fee, grand_total }) {
  const d = new Date(date);
  const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const dateStr = `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
  let h = d.getHours(), m = d.getMinutes();
  const ampm = h >= 12 ? 'PM' : 'AM';
  h = h % 12 || 12;
  const timeStr = `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')} ${ampm}`;
  const peso = v => '₱' + (parseFloat(v)||0).toLocaleString('en-PH',{minimumFractionDigits:0,maximumFractionDigits:0});
  const hasItems   = Array.isArray(items) && items.length > 0;
  const hasBooking = !!booking;

  let bookingHtml = '';
  if (hasBooking) {
    let bh = new Date(booking.start_time).getHours(), bm = new Date(booking.start_time).getMinutes();
    const bampm = bh >= 12 ? 'PM' : 'AM'; bh = bh % 12 || 12;
    const bTime = `${String(bh).padStart(2,'0')}:${String(bm).padStart(2,'0')} ${bampm}`;
    bookingHtml = `
      <hr/>
      <div class="booking-title">Cat Room Booking:</div>
      <div class="booking-detail">Cat Room ${booking.duration_label} (${bTime}, ${booking.guests} guest${booking.guests!==1?'s':''})</div>
      <div class="booking-calc">${booking.is_exclusive
        ? `&#9733; Exclusive &mdash; Full Room (flat fee) = ${peso(booking.booking_fee)}`
        : `${booking.guests} pax &times; ${peso(booking.price_per_pax)} = ${peso(booking.booking_fee)}`}</div>
    `;
  }

  let itemsHtml = '';
  if (hasItems) {
    const rows = items.map(it => `
      <tr>
        <td>${it.product_name||it.name}</td>
        <td>${it.quantity}</td>
        <td>${peso(it.unit_price||it.price)}</td>
        <td>${peso(parseFloat(it.unit_price||it.price)*it.quantity)}</td>
      </tr>
    `).join('');
    itemsHtml = `
      <hr/>
      <table>
        <thead><tr><th>ITEM</th><th>QTY</th><th>PRICE</th><th>TOTAL</th></tr></thead>
        <tbody>${rows}</tbody>
      </table>
    `;
  }

  const refHtml = (payment_method==='gcash' && reference_no)
    ? `<div class="row"><span>Ref No.:</span><span>${reference_no}</span></div>` : '';

  const html = `
    <html>
      <head>
        <title>Receipt – ${order_number}</title>
        <style>
          *{box-sizing:border-box;margin:0;padding:0;}
          body{font-family:Arial,sans-serif;padding:28px 24px;background:#fff;color:#1A1A1A;max-width:360px;margin:auto;}
          .biz{font-size:20px;font-weight:800;text-align:center;letter-spacing:0.02em;}
          .sub{font-size:12px;color:#666;text-align:center;margin-top:3px;}
          hr{border:none;border-top:1.5px dashed #D8D0C4;margin:12px 0;}
          .row{display:flex;justify-content:space-between;font-size:13px;margin-bottom:5px;}
          .booking-title{font-size:13px;font-weight:700;margin-bottom:4px;}
          .booking-detail,.booking-calc{font-size:12px;color:#444;margin-bottom:3px;}
          table{width:100%;border-collapse:collapse;font-size:12px;margin-top:4px;}
          th{font-size:10px;font-weight:700;color:#888;text-transform:uppercase;letter-spacing:0.06em;padding:5px 0;border-bottom:1px solid #E8E1D4;text-align:left;}
          th:not(:first-child){text-align:right;}
          td{padding:6px 0;border-bottom:1px solid #F5F0E8;font-size:12px;}
          td:not(:first-child){text-align:right;}
          .tr{display:flex;justify-content:space-between;padding:4px 0;font-size:13px;font-weight:600;}
          .tr.grand{font-size:15px;font-weight:800;}
          .foot{text-align:center;margin-top:10px;}
          .foot .ty{font-size:13px;font-weight:500;}
          .foot .tag{font-size:11px;color:#999;margin-top:3px;}
          @media print{body{padding:0;}}
        </style>
      </head>
      <body>
        <div class="biz">CATIPUNAN PET CAFE</div>
        <div class="sub">Cat Cafe &amp; Lounge</div>
        <hr/>
        <div class="row"><span>${is_booking_only?'Book #:':'Order #:'}</span><span>${order_number}</span></div>
        <div class="row"><span>Date:</span><span>${dateStr}</span></div>
        <div class="row"><span>Time:</span><span>${timeStr}</span></div>
        <div class="row"><span>Type:</span><span>${order_type}</span></div>
        <div class="row"><span>Payment:</span><span>${payment_method==='gcash'?'GCash':'Cash'}</span></div>
        ${refHtml}
        ${bookingHtml}
        ${itemsHtml}
        <hr/>
        ${hasItems ? `<div class="tr"><span>ITEMS SUBTOTAL:</span><span>${peso(order_total)}</span></div>` : ''}
        ${hasBooking ? `<div class="tr"><span>BOOKING FEE:</span><span>${peso(booking_fee)}</span></div>` : ''}
        <div class="tr grand"><span>TOTAL:</span><span>${peso(grand_total)}</span></div>
        <hr/>
        <div class="foot">
          <div class="ty">Thank you for visiting!</div>
          <div class="tag">Come back and see our cats again soon</div>
        </div>
      </body>
    </html>
  `;

  const win = window.open('', '_blank', 'width=440,height=720');
  if (!win) {
    alert('Please allow popups for this site to print receipts.');
    return;
  }
  win.document.write(html);
  win.document.close();
  win.focus();
  setTimeout(() => { win.print(); }, 500);
}

// ── BOOKING DURATIONS ────────────────────────────────────────
// isExclusive = flat ₱1,000 fee (not per-pax), max 10 guests, 1hr
const DEFAULT_DURATIONS = [
  { id: 1, label: '15 MINS',    minutes: 15,  price: 100,  isExclusive: false },
  { id: 2, label: '30 MINS',    minutes: 30,  price: 150,  isExclusive: false },
  { id: 3, label: '1 HOUR',     minutes: 60,  price: 300,  isExclusive: false },
  { id: 4, label: 'EXCLUSIVE',  minutes: 60,  price: 1000, isExclusive: true  },
];

// ── Main Component ────────────────────────────────────────────
export default function CafePOSPage({ user }) {
  // ── Data State ──────────────────────────────────────────────
  const [products,   setProducts]   = useState([]);
  const [categories, setCategories] = useState([]);
  const [durations,  setDurations]  = useState(DEFAULT_DURATIONS);
  const [loading,    setLoading]    = useState(true);
  const [error,      setError]      = useState('');

  // ── Filter State ────────────────────────────────────────────
  const [search,      setSearch]      = useState('');
  const [activeCategory, setActiveCategory] = useState('All');

  // ── Order State ─────────────────────────────────────────────
  const [orderItems,    setOrderItems]    = useState([]);   // [{ product_id, name, price, quantity }]
  const [bookingInOrder, setBookingInOrder] = useState(null); // booking object or null
  const [paymentMethod,  setPaymentMethod]  = useState('cash');
  const [orderNumDisplay, setOrderNumDisplay] = useState(null); // fetched from DB

  // ── Modal State ─────────────────────────────────────────────
  const [bookingModal,   setBookingModal]   = useState(null); // duration object
  const [showConfirm,    setShowConfirm]    = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [receipt,        setReceipt]        = useState(null);

  const token = localStorage.getItem('token');

  // ── Fetch Products & Categories ──────────────────────────────
  const fetchProducts = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/pos/products', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error('Failed to load products.');
      const json = await res.json();
      setProducts(json.products || []);
      setCategories(json.categories || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [token]);

  // ── Fetch Next Order Number ───────────────────────────────────
  const fetchNextOrderNumber = useCallback(async () => {
    try {
      const res = await fetch('/api/pos/next-order-number', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) return;
      const json = await res.json();
      setOrderNumDisplay(json.next_order_number);
    } catch {
      // silently fall back — display will show null which renders as empty
    }
  }, [token]);

  useEffect(() => {
    fetchProducts();
    fetchNextOrderNumber();
  }, [fetchProducts, fetchNextOrderNumber]);

  // ── Filtered Products ────────────────────────────────────────
  const filteredProducts = useMemo(() => {
    let list = products;
    if (activeCategory !== 'All') {
      list = list.filter(p => p.category_name === activeCategory);
    }
    if (search.trim()) {
      const q = search.trim().toLowerCase();
      list = list.filter(p => p.name.toLowerCase().includes(q));
    }
    return list;
  }, [products, activeCategory, search]);

  // ── Order Computations ───────────────────────────────────────
  const itemsTotal = orderItems.reduce((s, it) => s + it.price * it.quantity, 0);
  const bookingTotal = bookingInOrder ? bookingInOrder.booking_fee : 0;
  const grandTotal = itemsTotal + bookingTotal;
  const hasOrder = orderItems.length > 0 || !!bookingInOrder;

  const orderType = bookingInOrder ? 'Catroom' : 'Walk-in';

  // ── Add Product to Order ─────────────────────────────────────
  const handleAddProduct = (product) => {
    if (product.stock <= 0) return;
    setOrderItems(prev => {
      const existing = prev.find(it => it.product_id === product.product_id);
      if (existing) {
        return prev.map(it =>
          it.product_id === product.product_id
            ? { ...it, quantity: Math.min(it.quantity + 1, product.stock) }
            : it
        );
      }
      return [...prev, {
        product_id: product.product_id,
        name:       product.name,
        price:      parseFloat(product.price),
        quantity:   1,
        stock:      product.stock,
      }];
    });
  };

  const handleQtyChange = (product_id, delta) => {
    setOrderItems(prev =>
      prev.map(it => {
        if (it.product_id !== product_id) return it;
        const newQty = it.quantity + delta;
        if (newQty < 1) return it;
        if (newQty > it.stock) return it;
        return { ...it, quantity: newQty };
      })
    );
  };

  const handleRemoveItem = (product_id) => {
    setOrderItems(prev => prev.filter(it => it.product_id !== product_id));
  };

  // ── Add Booking to Order ─────────────────────────────────────
  const handleAddBooking = (bookingData) => {
    setBookingInOrder(bookingData);
    setBookingModal(null);
  };

  const handleRemoveBooking = () => {
    setBookingInOrder(null);
  };

  // ── Cancel Order ─────────────────────────────────────────────
  const handleCancelOrder = () => {
    setOrderItems([]);
    setBookingInOrder(null);
    setPaymentMethod('cash');
    setShowCancelConfirm(false);
  };

  // ── Checkout ─────────────────────────────────────────────────
  const handleConfirmPayment = async (refNo) => {
    setConfirmLoading(true);
    try {
      const payload = {
        items: orderItems.map(it => ({
          product_id: it.product_id,
          quantity:   it.quantity,
          unit_price: it.price,
        })),
        booking:        bookingInOrder ? {
          duration_label: bookingInOrder.duration_label,
          minutes:        bookingInOrder.minutes,
          price_per_pax:  bookingInOrder.price_per_pax,
          start_time:     bookingInOrder.start_time,
          guests:         bookingInOrder.guests,
          is_exclusive:   bookingInOrder.is_exclusive ?? false,
        } : null,
        payment_method: paymentMethod,
        reference_no:   refNo || null,
      };

      const res = await fetch('/api/pos/checkout', {
        method:  'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization:  `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || 'Checkout failed.');

      // Snapshot client-side order items (have `name`) before clearing state
      const clientItems = orderItems.map(it => ({
        product_name: it.name,
        name:         it.name,
        quantity:     it.quantity,
        unit_price:   it.price,
        price:        it.price,
      }));

      const serverReceipt = json.receipt;
      setReceipt({
        ...serverReceipt,
        // Use client snapshot for items so product_name is always present
        items: clientItems.length > 0 ? clientItems : (serverReceipt.items || []),
        // Enrich client-side booking info for receipt display
        booking: bookingInOrder ? {
          ...serverReceipt.booking,
          duration_label: bookingInOrder.duration_label,
          start_time:     bookingInOrder.start_time,
          guests:         bookingInOrder.guests,
          price_per_pax:  bookingInOrder.price_per_pax,
          booking_fee:    bookingInOrder.booking_fee,
          is_exclusive:   bookingInOrder.is_exclusive ?? false,
        } : null,
      });

      setShowConfirm(false);
      setOrderItems([]);
      setBookingInOrder(null);
      setPaymentMethod('cash');
      // Refresh products to reflect updated stock, and fetch next order number
      fetchProducts();
      fetchNextOrderNumber();
    } catch (err) {
      alert(err.message);
    } finally {
      setConfirmLoading(false);
    }
  };

  const handleCloseReceipt = () => {
    setReceipt(null);
  };

  // ── Render ───────────────────────────────────────────────────
  return (
    <div className="pos-page">

      {/* ════════ LEFT PANEL ════════ */}
      <div className="pos-left">

        {/* ── Cat Room Booking ── */}
        <div className="pos-booking-section">
          <p className="pos-section-label">Cat Room Booking</p>
          <div className="pos-booking-options">
            {durations.map(d => (
              <button
                key={d.id}
                className={`pos-booking-option${d.isExclusive ? ' pos-booking-option--exclusive' : ''}`}
                onClick={() => setBookingModal(d)}
              >
                {d.isExclusive && <span className="pos-booking-exclusive-star">★</span>}
                <span className="pos-booking-option-label">{d.label}</span>
                <span className="pos-booking-option-price">
                  {d.isExclusive ? `${formatPeso(d.price)} flat` : `${formatPeso(d.price)} / pax`}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* ── Product Menus ── */}
        <div className="pos-products-section">
          <p className="pos-section-label">Product Menus</p>

          {/* Search */}
          <div className="pos-search-wrap">
            <SearchIcon />
            <input
              type="text"
              className="pos-search-input"
              placeholder="Search Products"
              value={search}
              onChange={e => setSearch(e.target.value)}
            />
            {search && (
              <button className="pos-search-clear" onClick={() => setSearch('')}>×</button>
            )}
          </div>

          {/* Category Tabs */}
          {!loading && (
            <div className="pos-category-tabs">
              <button
                className={`pos-category-tab${activeCategory === 'All' ? ' pos-category-tab--active' : ''}`}
                onClick={() => setActiveCategory('All')}
              >
                All
              </button>
              {categories.map(cat => (
                <button
                  key={cat.category_id}
                  className={`pos-category-tab${activeCategory === cat.name ? ' pos-category-tab--active' : ''}`}
                  onClick={() => setActiveCategory(cat.name)}
                >
                  {cat.name}
                </button>
              ))}
            </div>
          )}

          {/* Product Grid */}
          {loading ? (
            <div className="pos-product-skeleton">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="pos-skeleton-card" />
              ))}
            </div>
          ) : error ? (
            <div className="pos-empty-state">
              <span>{error}</span>
              <button
                style={{ marginTop: 8, background: '#1A1A1A', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 16px', cursor: 'pointer', fontFamily: 'DM Sans, sans-serif', fontSize: 13 }}
                onClick={fetchProducts}
              >
                Retry
              </button>
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="pos-empty-state">
              <span>No products found.</span>
            </div>
          ) : (
            <div className="pos-product-grid">
              {filteredProducts.map(product => {
                const isOOS = product.stock <= 0;
                const imgSrc = product.image_url
                  ? (product.image_url.startsWith('/uploads/') ? product.image_url : `/uploads/${product.image_url}`)
                  : null;
                return (
                  <div
                    key={product.product_id}
                    className={`pos-product-card${isOOS ? ' pos-product-card--disabled' : ''}`}
                    onClick={() => !isOOS && handleAddProduct(product)}
                  >
                    {isOOS && <span className="pos-oos-badge">OUT OF STOCK</span>}
                    <div className="pos-product-img-wrap">
                      {imgSrc
                        ? <img src={imgSrc} alt={product.name} className="pos-product-img" />
                        : <div className="pos-product-img-placeholder"><span>No Image</span></div>
                      }
                    </div>
                    <div className="pos-product-name">{product.name}</div>
                    <div className="pos-product-row">
                      <span className="pos-product-price">{formatPeso(product.price)}</span>
                      <span className="pos-product-stock">Stock: {product.stock}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ════════ RIGHT PANEL ════════ */}
      <div className="pos-right">

        {/* Order Header */}
        <div className="pos-order-header">
          <div>
            <div className="pos-order-title">Unified Order</div>
          </div>
          <button className="pos-cancel-btn" onClick={() => hasOrder && setShowCancelConfirm(true)}>
            Cancel Orders
          </button>
        </div>
        <div className="pos-order-num">
          {orderNumDisplay !== null ? `Order #${orderNumDisplay}` : 'Loading…'}
        </div>

        {/* Order Type */}
        <div className="pos-order-type">{orderType}</div>

        {/* Order Items */}
        <div className="pos-order-items">
          {/* Booking entry */}
          {bookingInOrder && (
            <div className="pos-order-booking-item">
              <div className="pos-order-booking-header">
                <div>
                  <div className="pos-order-booking-name">
                    Cat Room {bookingInOrder.duration_label}
                  </div>
                  <div className="pos-order-booking-detail">
                    {formatTime12(new Date(bookingInOrder.start_time))} · {bookingInOrder.guests} guest{bookingInOrder.guests !== 1 ? 's' : ''}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
                  <span className="pos-order-booking-fee">{formatPeso(bookingInOrder.booking_fee)}</span>
                  <button className="pos-item-remove" onClick={handleRemoveBooking}>✕</button>
                </div>
              </div>
            </div>
          )}

          {/* Product items */}
          {orderItems.map(item => (
            <div key={item.product_id} className="pos-order-item">
              <div className="pos-order-item-top">
                <span className="pos-order-item-name">{item.name}</span>
                <button className="pos-item-remove" onClick={() => handleRemoveItem(item.product_id)}>✕</button>
              </div>
              <div className="pos-order-item-price-unit">{formatPeso(item.price)}</div>
              <div className="pos-order-item-bottom">
                <div className="pos-qty-controls">
                  <button className="pos-qty-btn" onClick={() => handleQtyChange(item.product_id, -1)}>−</button>
                  <span className="pos-qty-num">{item.quantity}</span>
                  <button className="pos-qty-btn" onClick={() => handleQtyChange(item.product_id, +1)}>+</button>
                </div>
                <span className="pos-order-item-total">{formatPeso(item.price * item.quantity)}</span>
              </div>
            </div>
          ))}

          {!hasOrder && (
            <div className="pos-order-empty">
              <span>No items added yet.</span>
            </div>
          )}
        </div>

        <div className="pos-divider" />

        {/* Total */}
        <div className="pos-total-row">
          <span className="pos-total-label">Total</span>
          <span className="pos-total-amount">{formatPeso(grandTotal)}</span>
        </div>

        {/* Payment Methods */}
        <div className="pos-payment-methods">
          <button
            className={`pos-payment-method-btn${paymentMethod === 'cash' ? ' pos-payment-method-btn--active' : ''}`}
            onClick={() => setPaymentMethod('cash')}
          >
            Cash
          </button>
          <button
            className={`pos-payment-method-btn${paymentMethod === 'gcash' ? ' pos-payment-method-btn--active' : ''}`}
            onClick={() => setPaymentMethod('gcash')}
          >
            GCash
          </button>
        </div>

        {/* Charge Button */}
        <button
          className="pos-charge-btn"
          disabled={!hasOrder}
          onClick={() => hasOrder && setShowConfirm(true)}
        >
          Charge &nbsp;–&nbsp; {formatPeso(grandTotal)}
        </button>
      </div>

      {/* ════════ MODALS ════════ */}

      {/* Booking Modal */}
      {bookingModal && (
        <BookingModal
          duration={bookingModal}
          onClose={() => setBookingModal(null)}
          onAdd={handleAddBooking}
          token={token}
        />
      )}

      {/* Payment Confirm Modal */}
      {showConfirm && (
        <PaymentConfirmModal
          total={grandTotal}
          paymentMethod={paymentMethod}
          onClose={() => !confirmLoading && setShowConfirm(false)}
          onConfirm={handleConfirmPayment}
          loading={confirmLoading}
        />
      )}

      {/* Cancel Order Confirm Modal */}
      {showCancelConfirm && (
        <CancelOrderModal
          onClose={() => setShowCancelConfirm(false)}
          onConfirm={handleCancelOrder}
        />
      )}

      {/* Receipt Modal */}
      {receipt && (
        <ReceiptModal
          receipt={receipt}
          onClose={handleCloseReceipt}
        />
      )}
    </div>
  );
}