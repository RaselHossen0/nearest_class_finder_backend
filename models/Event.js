const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Event = sequelize.define('Event', {
  title: { type: DataTypes.STRING, allowNull: false },
  date: { type: DataTypes.DATE },
  classId: { type: DataTypes.INTEGER, references: { model: 'Classes', key: 'id' } },
});

module.exports = Event;