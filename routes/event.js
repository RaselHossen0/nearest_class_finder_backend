const express = require('express');
const {
  getEvents,
  getEventById,
  createEvent,
  updateEvent,
  deleteEvent,
} = require('../controllers/eventController');
const upload = require('../services/multer'); // Assuming you're using multer for file upload
const verifyToken = require('../middleware/middleware');

const router = express.Router();

router.get('/', verifyToken, getEvents);                  // Get all events
router.get('/:id', verifyToken, getEventById);            // Get a specific event by ID
router.post('/', verifyToken, upload.array('files', 10), createEvent); // Create event with media upload
router.put('/:id', verifyToken, updateEvent);             // Update an event
router.delete('/:id', verifyToken, deleteEvent);          // Delete an event

module.exports = router;