const express = require('express');
const { getChatHistory, startConversation } = require('../controllers/chatController');
const verifyToken = require('../middleware/middleware');
const router = express.Router();

router.get('/:userId', verifyToken, getChatHistory);     // Get chat history for a user
router.post('/', verifyToken, startConversation);        // Start a new conversation

module.exports = router;