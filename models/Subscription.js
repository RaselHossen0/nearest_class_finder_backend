// models/Subscription.js
const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const Feature = require('./Feature');
const ClassOwner = require('./ClassOwner');

const Subscription = sequelize.define('Subscription', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: { type: DataTypes.STRING, allowNull: false, unique: true },
  price: { type: DataTypes.FLOAT, allowNull: false },
  durationInDays: { type: DataTypes.INTEGER, allowNull: false },
});

// Many-to-Many association between Subscription and Features
Subscription.belongsToMany(Feature, { through: 'SubscriptionFeatures' });
Feature.belongsToMany(Subscription, { through: 'SubscriptionFeatures' });

// ClassOwnerSubscription model for tracking assigned subscriptions
const ClassOwnerSubscription = sequelize.define('ClassOwnerSubscription', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  classOwnerId: {
    type: DataTypes.INTEGER,
    references: { model: ClassOwner, key: 'id' },
    allowNull: false,
  },
  subscriptionId: {
    type: DataTypes.INTEGER,
    references: { model: Subscription, key: 'id' },
    allowNull: false,
  },
  startDate: { type: DataTypes.DATE, allowNull: false },
  endDate: { type: DataTypes.DATE, allowNull: false },
  status: { type: DataTypes.ENUM('active', 'expired'), allowNull: false, defaultValue: 'active' },
});

// Associate ClassOwnerSubscription with Subscription and ClassOwner
ClassOwnerSubscription.belongsTo(Subscription, { foreignKey: 'subscriptionId' });
ClassOwnerSubscription.belongsTo(ClassOwner, { foreignKey: 'classOwnerId' });

module.exports = { Subscription, ClassOwnerSubscription };