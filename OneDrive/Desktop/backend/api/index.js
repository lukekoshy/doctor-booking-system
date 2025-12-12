const express = require('express');
const path = require('path');
const cors = require('cors');
const db = require('../src/db');

const adminRoutes = require('../src/routes/admin');
const bookingRoutes = require('../src/routes/booking');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date() });
});

// API Routes
app.use('/api/admin', adminRoutes);
app.use('/api', bookingRoutes);

// Serve static files
app.use(express.static(path.join(__dirname, '../public')));

// Fallback to index.html for SPA
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Export for Vercel
module.exports = app;