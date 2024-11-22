const express = require('express');
const { getEvents, getEventById, createEvent, updateEvent } = require('../controllers/eventController');
const verifyToken = require('../middleware/middleware');
const router = express.Router();

router.get('/', verifyToken, getEvents);                  // Get all events
router.get('/:id', verifyToken, getEventById);            // Get a specific event by ID
router.post('/', verifyToken, createEvent);               // Create a new event
router.put('/:id', verifyToken, updateEvent);             // Update an event

module.exports = router;