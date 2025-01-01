const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');
const ClassOwner = require('./ClassOwner');
const Message = require('./Message');

const Chat = sequelize.define('Chat', {
  userId: { type: DataTypes.INTEGER, allowNull: false },
  classOwnerId: { type: DataTypes.INTEGER, allowNull: false },
});

// Define associations with aliases
Chat.belongsTo(User, { foreignKey: 'userId' }); // alias for user
Chat.belongsTo(ClassOwner, { foreignKey: 'classOwnerId' }); // alias for class owner
Chat.hasMany(Message, { foreignKey: 'chatId' });

// In the User and ClassOwner models, you should define the reverse associations, like:
User.hasMany(Chat, { foreignKey: 'userId' });
ClassOwner.hasMany(Chat, { foreignKey: 'classOwnerId' });

module.exports = Chat;