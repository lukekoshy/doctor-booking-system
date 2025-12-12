// Handles atomic booking using row-level locking and transactions
require('dotenv').config();
const db = require('../db');
const { v4: uuidv4 } = require('uuid');

const BOOKING_EXPIRY = parseInt(process.env.BOOKING_EXPIRY_SECONDS || '120', 10);

async function createBookingAtomic({ slotId, patient_name, patient_contact }) {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    // Lock slot row FOR UPDATE to prevent concurrent capacity reads/writes
    const slotRes = await client.query('SELECT * FROM slots WHERE id=$1 FOR UPDATE', [slotId]);
    if (slotRes.rows.length === 0) {
      await client.query('ROLLBACK');
      throw new Error('SLOT_NOT_FOUND');
    }
    const slot = slotRes.rows[0];

    // Count current confirmed + pending bookings
    const countRes = await client.query(
      "SELECT COUNT(*)::int as cnt FROM bookings WHERE slot_id=$1 AND status IN ('PENDING','CONFIRMED')",
      [slotId]
    );
    const current = countRes.rows[0].cnt;

    if (current >= slot.capacity) {
      await client.query('ROLLBACK');
      const e = new Error('NO_SEAT');
      e.message = 'NO_SEAT';
      throw e;
    }

    const bookingId = uuidv4();
    const now = new Date();
    await client.query(
      `INSERT INTO bookings(id, slot_id, patient_name, patient_contact, status, created_at, updated_at) 
       VALUES($1,$2,$3,$4,'PENDING',$5,$5)`,
      [bookingId, slotId, patient_name, patient_contact, now]
    );

    await client.query('COMMIT');

    // Start expiry timer (non-blocking) — could also be handled by background worker in production
    scheduleExpiry(bookingId, BOOKING_EXPIRY);

    return { id: bookingId, slot_id: slotId, patient_name, status: 'PENDING' };
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch(e){ }
    throw err;
  } finally {
    client.release();
  }
}

async function confirmBooking(bookingId) {
  const client = await db.getClient();
  try {
    await client.query('BEGIN');

    const bookingRes = await client.query('SELECT * FROM bookings WHERE id=$1 FOR UPDATE', [bookingId]);
    if (bookingRes.rows.length === 0) {
      await client.query('ROLLBACK');
      throw new Error('BOOKING_NOT_FOUND');
    }
    const booking = bookingRes.rows[0];
    if (booking.status !== 'PENDING') {
      await client.query('ROLLBACK');
      return { id: bookingId, status: booking.status, msg: 'Already processed' };
    }

    // check capacity one more time
    const countRes = await client.query(
      "SELECT COUNT(*)::int as cnt FROM bookings WHERE slot_id=$1 AND status='CONFIRMED'",
      [booking.slot_id]
    );
    const confirmed = countRes.rows[0].cnt;

    const slotRes = await client.query('SELECT * FROM slots WHERE id=$1 FOR UPDATE', [booking.slot_id]);
    const slot = slotRes.rows[0];

    if (confirmed >= slot.capacity) {
      // mark booking failed
      await client.query("UPDATE bookings SET status='FAILED', updated_at=now() WHERE id=$1", [bookingId]);
      await client.query('COMMIT');
      return { id: bookingId, status: 'FAILED', msg: 'No capacity' };
    }

    await client.query("UPDATE bookings SET status='CONFIRMED', updated_at=now() WHERE id=$1", [bookingId]);

    await client.query('COMMIT');
    return { id: bookingId, status: 'CONFIRMED' };
  } catch (err) {
    try { await client.query('ROLLBACK'); } catch(e){}
    throw err;
  } finally {
    client.release();
  }
}

function scheduleExpiry(bookingId, seconds) {
  // This is a simple in-memory timeout. In production use a background worker (e.g., Bull, Sidekiq, cron, or DB TTL).
  setTimeout(async () => {
    try {
      const res = await db.query('SELECT status FROM bookings WHERE id=$1', [bookingId]);
      if (res.rows.length === 0) return;
      const status = res.rows[0].status;
      if (status === 'PENDING') {
        await db.query("UPDATE bookings SET status='FAILED', updated_at=now() WHERE id=$1", [bookingId]);
      }
    } catch (err) {
      console.error('expiry error', err);
    }
  }, seconds * 1000);
}

module.exports = {
  createBookingAtomic,
  confirmBooking
};
