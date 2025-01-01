const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');
const Class = require('./Class');
const Event = sequelize.define('Event', {
  title: { type: DataTypes.STRING, allowNull: false },
  date: { type: DataTypes.DATE },
  description: { type: DataTypes.TEXT },
  location : { type: DataTypes.STRING },
  classId: { type: DataTypes.INTEGER, references: { model: 'Classes', key: 'id' } },
});


const EventMedia = sequelize.define('EventMedia', {
  url: { type: DataTypes.STRING, allowNull: false },
  type: { type: DataTypes.STRING, allowNull: false },
  eventId: { type: DataTypes.INTEGER, references: { model: 'Events', key: 'id' } },
});

const EventUser = sequelize.define('EventUser', {
  eventId: { type: DataTypes.INTEGER, references: { model: 'Events', key: 'id' } },
  userId: { type: DataTypes.INTEGER, references: { model: 'Users', key: 'id' } },
}, {
  indexes: [
    {
      unique: true,
      fields: ['eventId', 'userId']
    }
  ]
});

Event.hasMany(EventUser, { foreignKey: 'eventId' });
EventUser.belongsTo(Event, { foreignKey: 'eventId' });
EventUser.belongsTo(User, { foreignKey: 'userId' });


Event.hasMany(EventMedia, { foreignKey: 'eventId' });
EventMedia.belongsTo(Event, { foreignKey: 'eventId' });
Event.belongsTo(Class, { foreignKey: 'classId' });
Class.hasMany(Event, { foreignKey: 'classId' });

Class.belongsTo(User, { foreignKey: 'ownerId' }); // Assuming ownerId links Class to User
User.hasMany(Class, { foreignKey: 'ownerId' });
module.exports = { Event,EventMedia ,EventUser};