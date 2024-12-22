const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User');
const Class = require('./Class');

const ClassOwner = sequelize.define('ClassOwner', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  userId: { 
    type: DataTypes.INTEGER, 
    allowNull: false, 
    unique: true,
    references: {
      model: User, // References the User model
      key: 'id',   // Key in the User model to reference
    },
    onUpdate: 'CASCADE', // Update on parent update
    onDelete: 'CASCADE', // Delete on parent delete
  },
  mobileNumber: { type: DataTypes.STRING, allowNull: false },
  alternateMobileNumber: { type: DataTypes.STRING, allowNull: true },
  experience: { type: DataTypes.STRING, allowNull: true },
  qualifications: { type: DataTypes.TEXT, allowNull: true },
  aadhaarCardNumber: { type: DataTypes.STRING, allowNull: false, unique: true },
  panCardNumber: { type: DataTypes.STRING, allowNull: false, unique: true },
  aadhaarCardFile: { type: DataTypes.STRING, allowNull: false },
  panCardFile: { type: DataTypes.STRING, allowNull: false },
  photographFile: { type: DataTypes.STRING, allowNull: false },
  certificatesFile: { type: DataTypes.STRING, allowNull: true },
  classId: { 
    type: DataTypes.INTEGER, 
    allowNull: false,
    references: {
      model: Class, // References the Class model
      key: 'id',   // Key in the Class model to reference
    },
    onUpdate: 'CASCADE', // Update on parent update
    onDelete: 'CASCADE', // Delete on parent delete
  },
});

// Associate the models
ClassOwner.belongsTo(User, { foreignKey: 'userId', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
ClassOwner.belongsTo(Class, { foreignKey: 'classId', onDelete: 'CASCADE', onUpdate: 'CASCADE' });
Class.hasOne(ClassOwner, { foreignKey: 'classId', onDelete: 'CASCADE' });


module.exports = ClassOwner;