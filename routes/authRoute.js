const express = require('express');
const { signup, login ,completeSignup} = require('../controllers/authController');
const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/class-owner/complete-signup', completeSignup);


module.exports = router;