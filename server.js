// server.js
require('dotenv').config();
const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');
const path = require('path');
const cors = require('cors');
const http = require('http');  // Import the http module
const socketIo = require('socket.io');  // Import socket.io

// Import route modules
const authRoutes = require('./routes/authRoute');
const classRoutes = require('./routes/classRoute');
const eventRoutes = require('./routes/event');
const chatRoutes = require('./routes/chat');
const categoryRoutes = require('./routes/categoryRoutes');
const mediaRoutes = require('./routes/mediaRoute'); // Import media routes

const app = express();
const PORT = process.env.PORT || 8000;

// Middleware
app.use(express.json());


// Middleware for parsing form-data (Multer handles file uploads in specific routes)
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use('/auth', authRoutes);
app.use('/classes', classRoutes);
app.use('/events', eventRoutes);
app.use('/chat', chatRoutes);
app.use('/categories', categoryRoutes);
app.use('/media', mediaRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));



// Create HTTP server and attach Socket.IO
const server = http.createServer(app);  // Create HTTP server
const io = socketIo(server);  // Attach Socket.IO to the HTTP server

// Expose io instance for controllers
require('./socket')(io);

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

// Root route
app.get('/', (req, res) => {
  res.send('Welcome to the Nearest Classes Finder API');
});

// Start server
server.listen(PORT, () => {  // Start the HTTP server, not app.listen
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Swagger UI available at http://localhost:${PORT}/api-docs`);
});