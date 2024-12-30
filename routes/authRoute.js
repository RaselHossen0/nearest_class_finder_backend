const express = require('express');
const { signup, login ,completeSignup,getUserDetails,changeProfileImage,sendOtp,
    changePassword,deleteUser,getAllUsers,
    editProfile} = require('../controllers/authController');
const router = express.Router();
const verifyToken = require('../middleware/middleware');
const upload = require('../config/upload');

router.post('/signup', signup);
router.post('/login', login);
router.post('/class-owner/complete-signup', completeSignup);
router.get('/user-details', getUserDetails);
router.post('/change-profile-image', upload.single('profileImage'),verifyToken, changeProfileImage,);
router.post('/send-otp',sendOtp);
router.post('/change-password',changePassword);
router.post('/edit-profile',upload.single('profileImage'),verifyToken,editProfile);
router.delete('/delete-user/:id',verifyToken,deleteUser);
router.get('/get-all-users',verifyToken,getAllUsers);



module.exports = router;