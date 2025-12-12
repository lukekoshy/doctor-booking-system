const express = require('express');
const router = express.Router();
const controller = require('../controllers/adminController');

// create doctor
router.post('/doctors', controller.createDoctor);
// create slot for doctor
router.post('/doctors/:doctorId/slots', controller.createSlot);
// list doctors & slots
router.get('/doctors', controller.listDoctors);

module.exports = router;
