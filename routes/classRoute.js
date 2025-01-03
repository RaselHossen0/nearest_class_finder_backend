const express = require('express');
const {  getClassById, createClass, updateClass,getAllClasses ,getAllClass,getAllClasses1} = require('../controllers/ClassController');
const verifyToken = require('../middleware/middleware');
const router = express.Router();

// router.get('/', verifyToken, getClasses);                  // Get all classes
router.get('/:id', verifyToken, getClassById);             // Get a single class by ID
router.post('/', verifyToken, createClass);                // Create a new class
router.put('/:id', verifyToken, updateClass);              // Update a class
router.get('/owners/all', verifyToken, getAllClasses1);              // Update a class
router.get('/get/all', verifyToken, getAllClass);              // Update a class
router.get('/admin/all', verifyToken, getAllClasses); 
module.exports = router;