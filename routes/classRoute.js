const express = require('express');
const {  getClassById, createClass, updateClass,getAllClasses } = require('../controllers/ClassController');
const verifyToken = require('../middleware/middleware');
const router = express.Router();

// router.get('/', verifyToken, getClasses);                  // Get all classes
router.get('/:id', verifyToken, getClassById);             // Get a single class by ID
router.post('/', verifyToken, createClass);                // Create a new class
router.put('/:id', verifyToken, updateClass);              // Update a class
router.get('/owners/all', verifyToken, getAllClasses);              // Update a class

module.exports = router;