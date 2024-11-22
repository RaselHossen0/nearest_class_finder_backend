const { Sequelize } = require('sequelize');
require('dotenv').config();


const sequelize = new Sequelize(process.env.DB_NAME, process.env.DB_USER, process.env.DB_PASS, {
  host: process.env.DB_HOST,
  dialect: 'mysql',
});
// if (process.env.NODE_ENV === 'development') {
//    sequelize.sync({ alter: true });
// }

module.exports = sequelize;