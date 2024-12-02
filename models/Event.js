const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Event = sequelize.define('Event', {
  title: { type: DataTypes.STRING, allowNull: false },
  date: { type: DataTypes.DATE },
  description: { type: DataTypes.TEXT },
  classId: { type: DataTypes.INTEGER, references: { model: 'Classes', key: 'id' } },
});


const EventMedia = sequelize.define('EventMedia', {
  url: { type: DataTypes.STRING, allowNull: false },
  type: { type: DataTypes.STRING, allowNull: false },
  eventId: { type: DataTypes.INTEGER, references: { model: 'Events', key: 'id' } },
});

Event.hasMany(EventMedia, { foreignKey: 'eventId' });
EventMedia.belongsTo(Event, { foreignKey: 'eventId' });

module.exports = { Event,EventMedia };