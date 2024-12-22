// routes/subscriptionRoutes.js
const express = require('express');
const router = express.Router();
const subscriptionController = require('../controllers/subscriptionControllers');

// Routes for subscription management
router.post('/create', subscriptionController.createSubscription);
router.put('/update/:id', subscriptionController.updateSubscription);
router.get('/', subscriptionController.getAllSubscriptions);
router.get('/class-owner/:id', subscriptionController.getClassOwnerSubscription);
router.post('/assign', subscriptionController.assignSubscriptionToClassOwner);
router.post('/renew', subscriptionController.renewSubscription);
router.delete('/:id', subscriptionController.deleteSubscription);

module.exports = router;