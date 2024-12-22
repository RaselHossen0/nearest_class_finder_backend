// models/Class.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Category = require('./Category'); // Import Category model
const Media = require('./Media');  // Import the Media model
const ClassOwner = require('./ClassOwner');

const Class = sequelize.define('Class', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
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
 
});

// Association with Category model
Class.belongsTo(Category, { foreignKey: 'categoryId' });

// Set up the relationship: A class has many media files
Class.hasMany(Media, { foreignKey: 'classId' });
Media.belongsTo(Class, { foreignKey: 'classId' });

// Class.belongsTo(ClassOwner, { foreignKey: 'classId' });


module.exports = Class;