-- tables: doctors, slots, bookings

CREATE TABLE IF NOT EXISTS doctors (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  specialization TEXT,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TABLE IF NOT EXISTS slots (
  id UUID PRIMARY KEY,
  doctor_id UUID REFERENCES doctors(id) ON DELETE CASCADE,
  start_time TIMESTAMP NOT NULL,
  end_time TIMESTAMP NOT NULL,
  capacity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMP DEFAULT now()
);

CREATE TYPE booking_status AS ENUM ('PENDING', 'CONFIRMED', 'FAILED');

CREATE TABLE IF NOT EXISTS bookings (
  id UUID PRIMARY KEY,
  slot_id UUID REFERENCES slots(id) ON DELETE CASCADE,
  patient_name TEXT NOT NULL,
  patient_contact TEXT,
  status booking_status NOT NULL DEFAULT 'PENDING',
  created_at TIMESTAMP DEFAULT now(),
  updated_at TIMESTAMP DEFAULT now()
);
-- index to quickly find pending bookings
CREATE INDEX IF NOT EXISTS idx_bookings_slot_status ON bookings(slot_id, status);
