const express = require('express');
const router = express.Router();
const {
  createFeature,
  listFeatures,
  updateFeature,
  deleteFeature,
} = require('../controllers/featureController');

/**
 * @swagger
 * /features:
 *   get:
 *     summary: Get all features
 *     tags:
 *       - Features
 *     responses:
 *       200:
 *         description: List of all features
 */
router.get('/', listFeatures);

/**
 * @swagger
 * /features:
 *   post:
 *     summary: Create a new feature
 *     tags:
 *       - Features
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       201:
 *         description: Feature created successfully
 */
router.post('/', createFeature);

/**
 * @swagger
 * /features/{id}:
 *   put:
 *     summary: Update a feature by ID
 *     tags:
 *       - Features
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Feature ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *     responses:
 *       200:
 *         description: Feature updated successfully
 */
router.put('/:id', updateFeature);

/**
 * @swagger
 * /features/{id}:
 *   delete:
 *     summary: Delete a feature by ID
 *     tags:
 *       - Features
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Feature ID
 *     responses:
 *       200:
 *         description: Feature deleted successfully
 */
router.delete('/:id', deleteFeature);

module.exports = router;