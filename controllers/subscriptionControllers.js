// controllers/subscriptionController.js
const { Subscription, ClassOwnerSubscription}  = require('../models/Subscription');
const Feature = require('../models/Feature');

module.exports = {
  // Create a new subscription
  createSubscription: async (req, res) => {
    try {
      const { name, price, durationInDays, features } = req.body;

      const subscription = await Subscription.create({ name, price, durationInDays });

      if (features && features.length > 0) {
        const featureInstances = await Feature.findAll({ where: { id: features } });
        await subscription.addFeatures(featureInstances);
      }

      res.status(201).json({ message: 'Subscription created successfully', subscription });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to create subscription' });
    }
  },
  updateSubscription: async (req, res) => {
    try {
      const { id } = req.params;
      const { name, price, durationInDays, features } = req.body;
      const subscription = await Subscription.findByPk(id);
      if (!subscription) return res.status(404).json({ error: 'Subscription not found' });
      const updatedSubscription = await subscription.update({ name, price, durationInDays });
      if (features && features.length > 0) {
        const featureInstances = await Feature.findAll({ where: { id: features } });
        await updatedSubscription.setFeatures(featureInstances);
      }
      res.status(200).json({ message: 'Subscription updated successfully', subscription: updatedSubscription });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to update subscription' });
    }
  },


  // Get all subscriptions
  getAllSubscriptions: async (req, res) => {
    try {
      const subscriptions = await Subscription.findAll({ include: [Feature] });
      res.status(200).json(subscriptions);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to retrieve subscriptions' });
    }
  },

  // Assign subscription to a class owner
  assignSubscriptionToClassOwner: async (req, res) => {
    try {
      const { classOwnerId, subscriptionId, startDate } = req.body;

      const subscription = await Subscription.findByPk(subscriptionId);
      if (!subscription) return res.status(404).json({ error: 'Subscription not found' });

      const endDate = new Date(startDate);
      endDate.setDate(endDate.getDate() + subscription.durationInDays);

      const classOwnerSubscription = await ClassOwnerSubscription.create({
        classOwnerId,
        subscriptionId,
        startDate,
        endDate,
        status: 'active',
      });

      res.status(201).json({ message: 'Subscription assigned successfully', classOwnerSubscription });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to assign subscription' });
    }
  },

  // Get active subscription for a class owner
  getClassOwnerSubscription: async (req, res) => {
    try {
      const { id } = req.params;

      const classOwnerSubscription = await ClassOwnerSubscription.findOne({
        where: { classOwnerId: id, status: 'active' },
        include: [{ model: Subscription, include: [Feature] }],
      });

      if (!classOwnerSubscription) {
        return res.status(404).json({ error: 'No active subscription found' });
      }

      res.status(200).json(classOwnerSubscription);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to retrieve subscription' });
    }
  },

  // Renew subscription
  renewSubscription: async (req, res) => {
    try {
      const { classOwnerId, subscriptionId } = req.body;

      const existingSubscription = await ClassOwnerSubscription.findOne({
        where: { classOwnerId, subscriptionId, status: 'active' },
      });

      if (!existingSubscription) {
        return res.status(404).json({ error: 'No active subscription to renew' });
      }

      const newEndDate = new Date(existingSubscription.endDate);
      newEndDate.setDate(newEndDate.getDate() + existingSubscription.Subscription.durationInDays);

      await existingSubscription.update({ endDate: newEndDate });

      res.status(200).json({ message: 'Subscription renewed successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to renew subscription' });
    }
  },
  deleteSubscription: async (req, res) => {
    try {
      const { id } = req.params;
      const subscription = await Subscription.findByPk(id);
      if (!subscription) return res.status(404).json({ error: 'Subscription not found' });
  
      await subscription.destroy();
      res.status(200).json({ message: 'Subscription deleted successfully' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: 'Failed to delete subscription' });
    }
  }
};
//deleteSubscription



  
/**
 * @swagger
 * /api/subscriptions:
 *   get:
 *     summary: Get all subscription plans
 *     tags:
 *       - Subscriptions
 *     responses:
 *       200:
 *         description: List of all subscriptions
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Subscription'
 */

/**
 * @swagger
 * /api/subscriptions/create:
 *   post:
 *     summary: Create a new subscription plan
 *     tags:
 *       - Subscriptions
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name of the subscription plan
 *               price:
 *                 type: number
 *                 description: Price of the subscription plan
 *               durationInDays:
 *                 type: integer
 *                 description: Duration of the subscription plan in days
 *               features:
 *                 type: array
 *                 items:
 *                   type: integer
 *                 description: List of feature IDs associated with the subscription plan
 *     responses:
 *       201:
 *         description: Subscription plan created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 subscription:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: integer
 *                     name:
 *                       type: string
 *                     price:
 *                       type: number
 *                     durationInDays:
 *                       type: integer
 *                     createdAt:
 *                       type: string
 *                       format: date-time
 *                     updatedAt:
 *                       type: string
 *                       format: date-time
 */

/**
 * @swagger
 * /api/subscriptions/assign:
 *   post:
 *     summary: Assign a subscription plan to a class owner
 *     tags:
 *       - Subscriptions
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               classOwnerId:
 *                 type: integer
 *                 description: Class owner ID
 *               subscriptionId:
 *                 type: integer
 *                 description: Subscription plan ID
 *               startDate:
 *                 type: string
 *                 format: date
 *                 description: Start date of the subscription
 *     responses:
 *       201:
 *         description: Subscription assigned successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ClassOwnerSubscription'
 */

/**
 * @swagger
 * /api/subscriptions/class-owner/{id}:
 *   get:
 *     summary: Get active subscription for a class owner
 *     tags:
 *       - Subscriptions
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Class owner ID
 *     responses:
 *       200:
 *         description: Active subscription for the class owner
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ClassOwnerSubscription'
 *       404:
 *         description: No active subscription found
 */

/**
 * @swagger
 * /api/subscriptions/renew:
 *   post:
 *     summary: Renew a subscription for a class owner
 *     tags:
 *       - Subscriptions
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               classOwnerId:
 *                 type: integer
 *                 description: Class owner ID
 *               subscriptionId:
 *                 type: integer
 *                 description: Subscription plan ID
 *     responses:
 *       200:
 *         description: Subscription renewed successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/ClassOwnerSubscription'
 *       404:
 *         description: No active subscription to renew
 */
