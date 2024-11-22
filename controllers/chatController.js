const Chat = require('../models/Chat');
const Message = require('../models/Message');
const io = require('../socket');  // Access the Socket.io instance

exports.getChatHistory = async (req, res) => {
  try {
    const { userId } = req.params;
    const chatHistory = await Chat.findAll({
      where: { userId },
      include: [Message]
    });

    res.json(chatHistory);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve chat history' });
  }
};

exports.startConversation = async (req, res) => {
  try {
    const newChat = await Chat.create(req.body);
    io.emit('newChat', newChat);  // Notify participants of a new chat
    res.status(201).json(newChat);
  } catch (error) {
    res.status(500).json({ error: 'Failed to start conversation' });
  }
};

/**
 * @swagger
 * /chats/start:
 *   post:
 *     summary: Start a new conversation
 *     description: Create a new chat conversation.
 *     tags:
 *       - Chats
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               participants:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: List of participant IDs
 *               topic:
 *                 type: string
 *                 description: Topic of the conversation
 *     responses:
 *       201:
 *         description: Conversation started successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Chat'
 *       500:
 *         description: Failed to start conversation
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Failed to start conversation
 */