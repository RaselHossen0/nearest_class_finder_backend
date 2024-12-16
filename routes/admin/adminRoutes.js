const express = require('express');
const router = express.Router();
const { verifyClassOwner } = require('../../controllers/verificationController');

// Route for verifying a class owner
router.put('/class-owner/:id/verify', verifyClassOwner);

module.exports = router;
