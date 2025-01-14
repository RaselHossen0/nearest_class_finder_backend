// server.js
require('dotenv').config();
const express = require('express');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./swagger');
const path = require('path');
const cors = require('cors');
const http = require('http');  // Import the http module

const subscriptionRoutes = require('./routes/subcriptionRoute');
const featuresRoutes = require('./routes/featureRoute');

const setupSocket = require('./socket/index'); // Import the setupSocket function

// Subscription API routes
// Import route modules
const authRoutes = require('./routes/authRoute');
const classRoutes = require('./routes/classRoute');
const eventRoutes = require('./routes/event');
const chatRoutes = require('./routes/chat');
const categoryRoutes = require('./routes/categoryRoutes');
const mediaRoutes = require('./routes/mediaRoute'); // Import media routes
const adminRoutes = require('./routes/admin/adminRoutes');
const classRatingRoutes = require('./routes/classRatingRoutes');

const app = express();
const PORT = process.env.PORT || 8000;
app.use(cors({
  origin: '*',
 
}));

// Middleware
app.use(express.json());


// Middleware for parsing form-data (Multer handles file uploads in specific routes)
app.use(express.urlencoded({ extended: true }));

// Swagger documentation
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Routes
app.use('/auth', authRoutes);
app.use('/classes', classRoutes);
app.use('/events', eventRoutes);
app.use('/chats', chatRoutes);
app.use('/categories', categoryRoutes);
app.use('/media', mediaRoutes);
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/admin', adminRoutes);

app.use('/api/subscriptions', subscriptionRoutes);
app.use('/features', featuresRoutes);
app.use('/api/ratings', classRatingRoutes);


// Create HTTP server and attach Socket.IO
const server = http.createServer(app);  // Create HTTP server
const io = setupSocket(server);

// Expose io instance for controllers


// Root route
app.get('/', (req, res) => {
  res.send('Welcome to the Nearest Classes Finder API');
});

// Start server
server.listen(PORT, () => {  // Start the HTTP server, not app.listen
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Swagger UI available at http://localhost:${PORT}/api-docs`);
});