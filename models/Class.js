// models/Class.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Category = require('./Category'); // Import Category model
const Media = require('./Media');  // Import the Media model

const Class = sequelize.define('Class', {
  name: { type: DataTypes.STRING, allowNull: false },
  description: { type: DataTypes.TEXT },
  categoryId: { 
    type: DataTypes.INTEGER, 
    references: { model: 'Categories', key: 'id' }, // Foreign key to Category
    allowNull: false
  },
  location: { type: DataTypes.STRING, allowNull: false },
  coordinates: { type: DataTypes.GEOMETRY('POINT') },
  price: { type: DataTypes.FLOAT },
  rating: { type: DataTypes.FLOAT, defaultValue: 0.0 },
  ownerId: { 
    type: DataTypes.INTEGER, 
    references: { model: 'Users', key: 'id' },
    allowNull: false
  },
});

// Association with Category model
Class.belongsTo(Category, { foreignKey: 'categoryId' });

// Set up the relationship: A class has many media files
Class.hasMany(Media, { foreignKey: 'classId' });
Media.belongsTo(Class, { foreignKey: 'classId' });


module.exports = Class;