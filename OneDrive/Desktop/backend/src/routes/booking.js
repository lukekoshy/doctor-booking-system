const express = require('express');
const router = express.Router();
const controller = require('../controllers/bookingController');

// list slots (public)
router.get('/slots', controller.listSlots);
// slot detail + availability
router.get('/slots/:id', controller.getSlot);
// create booking (atomic)
router.post('/slots/:id/book', controller.createBooking);
// confirm booking (simulate payment)
router.post('/bookings/:id/confirm', controller.confirmBooking);

module.exports = router;
