const db = require('../db');
const { v4: uuidv4 } = require('uuid');

exports.createDoctor = async (req, res) => {
  try {
    const { name, specialization } = req.body;

    if (!name || typeof name !== 'string' || name.trim() === '') {
      return res.status(400).json({ error: 'name is required' });
    }

    const id = uuidv4();
    await db.query('INSERT INTO doctors(id,name,specialization) VALUES($1,$2,$3)', [id, name.trim(), specialization || null]);
    res.status(201).json({ id, name: name.trim(), specialization: specialization || null });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
};


exports.createSlot = async (req, res) => {
  try {
    const { doctorId } = req.params;
    const { start_time, end_time, capacity } = req.body;

    // Validation
    if (!start_time || !end_time) {
      return res.status(400).json({ error: 'start_time and end_time are required' });
    }

    const startTime = new Date(start_time);
    const endTime = new Date(end_time);

    if (isNaN(startTime) || isNaN(endTime)) {
      return res.status(400).json({ error: 'Invalid datetime format' });
    }

    if (startTime >= endTime) {
      return res.status(400).json({ error: 'start_time must be before end_time' });
    }

    if (capacity && (capacity < 1 || !Number.isInteger(capacity))) {
      return res.status(400).json({ error: 'capacity must be a positive integer' });
    }

    const finalCapacity = capacity || 1;
    const id = uuidv4();

    await db.query(
      `INSERT INTO slots(id, doctor_id, start_time, end_time, capacity) VALUES($1,$2,$3,$4,$5)`,
      [id, doctorId, start_time, end_time, finalCapacity]
    );

    res.status(201).json({ id, doctorId, start_time, end_time, capacity: finalCapacity });
  } catch (err) {
    console.error(err);
    if (err.code === '23503') { // Foreign key violation
      return res.status(404).json({ error: 'Doctor not found' });
    }
    res.status(500).json({ error: 'server error' });
  }
};

exports.listDoctors = async (req, res) => {
  try {
    const doctors = await db.query('SELECT * FROM doctors ORDER BY created_at DESC');
    res.json({ doctors: doctors.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'server error' });
  }
};
