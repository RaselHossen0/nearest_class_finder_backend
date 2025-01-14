const express = require('express');
const router = express.Router();
const classRatingController = require('../controllers/classRatingController');

// Add a rating
router.post('/', classRatingController.addRating);

// Get all ratings for a specific class
router.get('/:classId', classRatingController.getRatingsForClass);

// Update a rating
router.put('/:id', classRatingController.updateRating);

// Delete a rating
router.delete('/:id', classRatingController.deleteRating);

module.exports = router;