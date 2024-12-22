const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Chat = sequelize.define('Chat', {
  userId: { type: DataTypes.INTEGER, allowNull: false },
  classOwnerId: { type: DataTypes.INTEGER, allowNull: false },
});

Chat.associate = (models) => {
  Chat.hasMany(models.Message, { onDelete: 'CASCADE' });
  Chat.belongsTo(models.User, { as: 'User', foreignKey: 'userId' });
  Chat.belongsTo(models.User, { as: 'ClassOwner', foreignKey: 'classOwnerId' });
};

module.exports = Chat;