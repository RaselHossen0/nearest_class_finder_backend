const express = require('express');
const { getClasses, getClassById, createClass, updateClass } = require('../controllers/ClassController');
const verifyToken = require('../middleware/middleware');
const router = express.Router();

router.get('/', verifyToken, getClasses);                  // Get all classes
router.get('/:id', verifyToken, getClassById);             // Get a single class by ID
router.post('/', verifyToken, createClass);                // Create a new class
router.put('/:id', verifyToken, updateClass);              // Update a class

module.exports = router;