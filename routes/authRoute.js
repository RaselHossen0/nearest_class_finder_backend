const express = require('express');
const { signup, login ,completeSignup,getUserDetails,changeProfileImage} = require('../controllers/authController');
const router = express.Router();
const verifyToken = require('../middleware/middleware');
const upload = require('../config/upload');

router.post('/signup', signup);
router.post('/login', login);
router.post('/class-owner/complete-signup', completeSignup);
router.get('/user-details', getUserDetails);
router.post('/change-profile-image', upload.single('profileImage'),verifyToken, changeProfileImage,);


module.exports = router;