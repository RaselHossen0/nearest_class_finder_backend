const Message = require('../models/Message');
const io = require('../socket');  // Access the Socket.io instance

exports.sendMessage = async (req, res) => {
  try {
    const { chatId, senderId, content } = req.body;

    const message = await Message.create({ chatId, senderId, content });
    io.to(chatId).emit('newMessage', message);  // Broadcast message to the chat room

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ error: 'Failed to send message' });
  }
};

/**
 * @swagger
 * /messages/send:
 *   post:
 *     summary: Send a message
 *     description: Send a message to a specific chat room.
 *     tags:
 *       - Messages
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               chatId:
 *                 type: string
 *                 description: ID of the chat room
 *               senderId:
 *                 type: string
 *                 description: ID of the sender
 *               content:
 *                 type: string
 *                 description: Content of the message
 *     responses:
 *       201:
 *         description: Message sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Message'
 *       500:
 *         description: Failed to send message
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Failed to send message
 */