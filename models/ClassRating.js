const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Class = require('./Class'); // Import the Class model
const User = require('./User');   // Assuming you have a User model

const ClassRating = sequelize.define('ClassRating', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { 
    type: DataTypes.INTEGER, 
    references: { model: 'Users', key: 'id' }, // Foreign key to User
    allowNull: false 
  },
  classId: { 
    type: DataTypes.INTEGER, 
    references: { model: 'Classes', key: 'id' }, // Foreign key to Class
    allowNull: false 
  },
  rating: { 
    type: DataTypes.FLOAT, 
    allowNull: false,
    validate: { min: 1, max: 5 } // Ratings between 1 and 5
  },
  comment: { type: DataTypes.TEXT, allowNull: true },
}, {
  timestamps: true, // Adds createdAt and updatedAt fields
});

// Associations
ClassRating.belongsTo(Class, { foreignKey: 'classId' });
ClassRating.belongsTo(User, { foreignKey: 'userId' });
Class.hasMany(ClassRating, { foreignKey: 'classId' });
User.hasMany(ClassRating, { foreignKey: 'userId' });

module.exports = ClassRating;