
const User = require('../models/User');
const Chat = require('../models/Chat');
const Message = require('../models/Message');
const { route } = require('../routes/classRoute');
const { Op } = require('sequelize');
const ClassOwner = require('../models/ClassOwner');

// Send a message
exports.sendMessage = async (req, res) => {
  const { chatId, senderId, content, attachmentUrl, isReply, repliedToId } = req.body;
  try {
    const message = await Message.create({
      chatId,
      senderId,
      content,
      attachmentUrl,
      isReply,
      repliedToId,
    });
    return res.status(201).json(message);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Mark a message as read
exports.markAsRead = async (req, res) => {
  const { messageId } = req.params;
  try {
    const message = await Message.update(
      { isRead: true },
      { where: { id: messageId } }
    );
    return res.status(200).json({ success: true });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};
// Create a new chat
exports.createChat = async (req, res) => {
  const { userId, classOwnerId } = req.body;
  try {
    const existingChat = await Chat.findOne({ where: { userId, classOwnerId } });
    if (existingChat) return res.status(200).json({ chatId: existingChat.id });

    const chat = await Chat.create({ userId, classOwnerId });
    return res.status(201).json(chat);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
};

// Get all chats for a user
exports.getChats = async (req, res) => {
  const { userId } = req.params;
  try {
    const chats = await Chat.findAll({
      where: {
      [Op.or]: [
       
        { classOwnerId: userId }
      ]
      },
      include: [
         { model: User, attributes: ['id','name', 'email','profileImage'] },
        { model: Message, limit: 1, order: [['timestamp', 'DESC']] },
       
      ],
    });
    return res.status(200).json(chats);
    } catch (error) {
    return res.status(500).json({ error: error.message });
    }
};
exports.getMessages = async (req, res) => {
  const { chatId } = req.params;
  try {
    const messages = await Message.findAll({
      where: { chatId },
      // include: [
      //   { model: User, as: 'Sender', attributes: ['name', 'email'] },
      // ],
    });
    return res.status(200).json(messages);
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}



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
 *               userId:
 *                 type: string
 *                 description: ID of the user starting the chat
 *               classOwnerId:
 *                 type: string
 *                 description: ID of the class owner
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

/**
 * @swagger
 * /chats/user/{userId}:
 *   get:
 *     summary: Get all chats for a user
 *     description: Retrieve all chat conversations for a specific user.
 *     tags:
 *       - Chats
 *     parameters:
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the user
 *     responses:
 *       200:
 *         description: List of chats retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Chat'
 *       500:
 *         description: Failed to retrieve chats
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Failed to retrieve chats
 */

/**
 * @swagger
 * /messages/send:
 *   post:
 *     summary: Send a message
 *     description: Send a new message in a chat.
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
 *                 description: ID of the chat
 *               senderId:
 *                 type: string
 *                 description: ID of the sender
 *               content:
 *                 type: string
 *                 description: Content of the message
 *               attachmentUrl:
 *                 type: string
 *                 description: URL of the attachment
 *               isReply:
 *                 type: boolean
 *                 description: Whether the message is a reply
 *               repliedToId:
 *                 type: string
 *                 description: ID of the message being replied to
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

/**
 * @swagger
 * /messages/{messageId}/read:
 *   patch:
 *     summary: Mark a message as read
 *     description: Mark a specific message as read.
 *     tags:
 *       - Messages
 *     parameters:
 *       - in: path
 *         name: messageId
 *         required: true
 *         schema:
 *           type: string
 *         description: ID of the message
 *     responses:
 *       200:
 *         description: Message marked as read successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *       500:
 *         description: Failed to mark message as read
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Failed to mark message as read
 */