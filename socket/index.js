
io.on('connection', (socket) => {
    console.log('New client connected');
  
    socket.on('joinRoom', (chatId) => {
      socket.join(chatId);  // User joins a specific chat room
    });
  
    socket.on('message', async (data) => {
      const { chatId, senderId, content } = data;
  
      // Save message to the database
      const message = await Message.create({ chatId, senderId, content });
      
      // Emit the message to users in the chat room
      io.to(chatId).emit('newMessage', message);
    });
  
    socket.on('disconnect', () => {
      console.log('Client disconnected');
    });
  });