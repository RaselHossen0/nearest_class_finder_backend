const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Message = sequelize.define('Message', {
  chatId: { type: DataTypes.INTEGER, allowNull: false },
  senderId: { type: DataTypes.INTEGER, allowNull: false },
  content: { type: DataTypes.STRING, allowNull: true },
  attachmentUrl: { type: DataTypes.STRING, allowNull: true }, // For file upload
  isRead: { type: DataTypes.BOOLEAN, defaultValue: false },
  isReply: { type: DataTypes.BOOLEAN, defaultValue: false },
  repliedToId: { type: DataTypes.INTEGER, allowNull: true }, // For replies
  timestamp: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
});

Message.associate = (models) => {
  Message.belongsTo(models.Chat, { foreignKey: 'chatId' });
  Message.belongsTo(models.User, { as: 'Sender', foreignKey: 'senderId' });
};

module.exports = Message;