const db = require('../db');
const service = require('../services/bookingService');
const { v4: uuidv4 } = require('uuid');

exports.listSlots = async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT s.*, d.name as doctor_name FROM slots s JOIN doctors d ON s.doctor_id=d.id ORDER BY start_time`
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
};

exports.getSlot = async (req, res) => {
  try {
    const id = req.params.id;
    const slotRes = await db.query(`SELECT s.*, d.name as doctor_name FROM slots s JOIN doctors d ON s.doctor_id=d.id WHERE s.id=$1`, [id]);
    if (slotRes.rows.length === 0) return res.status(404).json({ error: 'slot not found' });
    const slot = slotRes.rows[0];
    const bookingCountRes = await db.query('SELECT status, COUNT(*) FROM bookings WHERE slot_id=$1 GROUP BY status', [id]);
    res.json({ slot, bookings: bookingCountRes.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
};

exports.createBooking = async (req, res) => {
  try {
    const slotId = req.params.id;
    const { patient_name, patient_contact } = req.body;

    // Validation
    if (!patient_name || typeof patient_name !== 'string' || patient_name.trim() === '') {
      return res.status(400).json({ error: 'patient_name is required' });
    }

    if (!slotId) {
      return res.status(400).json({ error: 'slotId is required' });
    }

    const booking = await service.createBookingAtomic({ 
      slotId, 
      patient_name: patient_name.trim(), 
      patient_contact: patient_contact?.trim() || null 
    });

    res.status(201).json(booking);
  } catch (err) {
    if (err.message === 'NO_SEAT') {
      return res.status(409).json({ error: 'No available seat' });
    }
    if (err.message === 'SLOT_NOT_FOUND') {
      return res.status(404).json({ error: 'Slot not found' });
    }
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
};

exports.confirmBooking = async (req, res) => {
  try {
    const bookingId = req.params.id;
    const result = await service.confirmBooking(bookingId);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
};
