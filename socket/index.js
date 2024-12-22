const socketIo = require('socket.io');
const Message = require('../models/Message'); // Adjust the path as necessary

const setupSocket = (server) => {
  const io = socketIo(server, {
    cors: { origin: '*' },
  });

  io.on('connection', (socket) => {
    console.log(`User connected: ${socket.id}`);

    socket.on('joinRoom', ({ chatId }) => {
      socket.join(chatId);
      console.log(`User joined chat: ${chatId}`);
    });

    socket.on('sendMessage', async (message) => {
      try {
        const savedMessage = await Message.create(message);
        io.to(message.chatId).emit('newMessage', {error: null, message: savedMessage});
        // console.log('New message:', savedMessage);
      } catch (error) {
        console.error('Error saving message:', error);
        io.to(message.chatId).emit('newMessage', { error: error.message });
      }
    });

    socket.on('disconnect', () => {
      console.log('User disconnected');
    });
  });

  return io;
};

module.exports = setupSocket;