const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Chat = sequelize.define('Chat', {
  userId: { type: DataTypes.INTEGER, allowNull: false },
  classOwnerId: { type: DataTypes.INTEGER, allowNull: false },
});

Chat.associate = (models) => {
  Chat.hasMany(models.Message, { onDelete: 'CASCADE' });
};

module.exports = Chat;