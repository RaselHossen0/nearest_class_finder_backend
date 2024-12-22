const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Feature = sequelize.define('Feature', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false, unique: true },
  description: { type: DataTypes.TEXT, allowNull: true },
});

module.exports = Feature;