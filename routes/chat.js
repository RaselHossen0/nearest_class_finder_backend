const express = require('express');
const chatController = require('../controllers/chatController');
const verifyToken = require('../middleware/middleware');
const router = express.Router();









router.post('/send', chatController.sendMessage);
router.put('/read/:messageId', chatController.markAsRead);

router.get('/messages/chat/:chatId', chatController.getMessages);

router.post('/create', chatController.createChat);
router.get('/user/:userId', chatController.getChats);

module.exports = router;