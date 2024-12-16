const express = require('express');
const { signup, login ,completeSignup,getUserDetails} = require('../controllers/authController');
const router = express.Router();

router.post('/signup', signup);
router.post('/login', login);
router.post('/class-owner/complete-signup', completeSignup);
router.get('/user-details', getUserDetails);


module.exports = router;