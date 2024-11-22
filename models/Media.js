// models/Media.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');

const Media = sequelize.define('Media', {
  // Unique ID for each media entry
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  // The type of media (photo, video, or reel)
  type: {
    type: DataTypes.ENUM,
    values: ['photo', 'video', 'reel'],
    allowNull: false
  },
  // URL of the media file
  url: {
    type: DataTypes.STRING,
    allowNull: false
  },
  // Title of the media
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  // Description of the media
  description: {
    type: DataTypes.TEXT,
  },
  // Tags to help categorize the media (e.g., class name, event)
  tags: {
    type: DataTypes.STRING,
  },
  // Date when the media was uploaded
  upload_date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW,
  },
  // The ID of the class this media belongs to
  classId: {
    type: DataTypes.INTEGER,
    references: { model: 'Classes', key: 'id' },
    allowNull: false
  }
});

module.exports = Media;