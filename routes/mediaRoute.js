const express = require('express');
const router = express.Router();
const { uploadMedia } = require('../controllers/mediaController');  // Ensure this is imported correctly
const verifyToken = require('../middleware/middleware');
const upload = require('../services/multer'); // Assuming you're using multer for file upload

// Upload media file
router.post('/upload/:classId', verifyToken, upload.single('mediaFile'), uploadMedia);

module.exports = router;