// swagger.js
const swaggerJSDoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'Nearest Classes Finder API',
      version: '1.0.0',
      description: 'API documentation for the Nearest Classes Finder App',
    },
    servers: [
      {
        url: 'https://classroom-api.raselhossen.tech', // Replace with your server URL
        // url: 'http://localhost:3000',
      },
    ],
  },
  apis: ['./routes/*.js','./controllers/*.js'], // Path to the API docs
};

const swaggerSpec = swaggerJSDoc(options);
module.exports = swaggerSpec;