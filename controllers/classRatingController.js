const ClassRating = require('../models/ClassRating');
const Class = require('../models/Class');
const User = require('../models/User');

// Add a rating
const addRating = async (req, res) => {
  try {
    const { userId, classId, rating, comment } = req.body;

    // Validate request
    if (!userId || !classId || !rating) {
      return res.status(400).json({ message: 'User ID, Class ID, and Rating are required.' });
    }

    // Create a new rating
    const newRating = await ClassRating.create({ userId, classId, rating, comment });
    return res.status(201).json({ message: 'Rating added successfully.', data: newRating });
  } catch (error) {
    return res.status(500).json({ message: 'Error adding rating.', error: error.message });
  }
};

// Get all ratings for a class
const getRatingsForClass = async (req, res) => {
  try {
    const { classId } = req.params;

    // Fetch ratings
    const ratings = await ClassRating.findAll({
      where: { classId },
      include: [{ model: User, attributes: ['id', 'name','profileImage','email'] }],
    });

    return res.status(200).json({ message: 'Ratings fetched successfully.', data: ratings });
  } catch (error) {
    return res.status(500).json({ message: 'Error fetching ratings.', error: error.message });
  }
};

// Update a rating
const updateRating = async (req, res) => {
  try {
    const { id } = req.params; // ID of the rating
    const { rating, comment } = req.body;

    // Find and update the rating
    const ratingToUpdate = await ClassRating.findByPk(id);
    if (!ratingToUpdate) {
      return res.status(404).json({ message: 'Rating not found.' });
    }

    await ratingToUpdate.update({ rating, comment });
    return res.status(200).json({ message: 'Rating updated successfully.', data: ratingToUpdate });
  } catch (error) {
    return res.status(500).json({ message: 'Error updating rating.', error: error.message });
  }
};

// Delete a rating
const deleteRating = async (req, res) => {
  try {
    const { id } = req.params;

    // Find and delete the rating
    const ratingToDelete = await ClassRating.findByPk(id);
    if (!ratingToDelete) {
      return res.status(404).json({ message: 'Rating not found.' });
    }

    await ratingToDelete.destroy();
    return res.status(200).json({ message: 'Rating deleted successfully.' });
  } catch (error) {
    return res.status(500).json({ message: 'Error deleting rating.', error: error.message });
  }
};

module.exports = {
  addRating,
  getRatingsForClass,
  updateRating,
  deleteRating,
};

/**
 * @swagger
 * tags:
 *   name: Ratings
 *   description: APIs for managing class ratings and comments
 */

/**
 * @swagger
 * /api/ratings:
 *   post:
 *     summary: Add a new rating for a class
 *     tags: [Ratings]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: integer
 *                 description: ID of the user giving the rating
 *                 example: 1
 *               classId:
 *                 type: integer
 *                 description: ID of the class being rated
 *                 example: 1
 *               rating:
 *                 type: number
 *                 format: float
 *                 description: Rating value between 1 and 5
 *                 example: 4.5
 *               comment:
 *                 type: string
 *                 description: Optional comment about the class
 *                 example: "Great class!"
 *     responses:
 *       201:
 *         description: Rating added successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Rating'
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/ratings/{classId}:
 *   get:
 *     summary: Get all ratings for a specific class
 *     tags: [Ratings]
 *     parameters:
 *       - in: path
 *         name: classId
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the class
 *     responses:
 *       200:
 *         description: Ratings fetched successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Rating'
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/ratings/{id}:
 *   put:
 *     summary: Update an existing rating
 *     tags: [Ratings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the rating to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               rating:
 *                 type: number
 *                 format: float
 *                 description: Updated rating value
 *                 example: 5.0
 *               comment:
 *                 type: string
 *                 description: Updated comment
 *                 example: "Amazing class!"
 *     responses:
 *       200:
 *         description: Rating updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 data:
 *                   $ref: '#/components/schemas/Rating'
 *       404:
 *         description: Rating not found
 *       500:
 *         description: Server error
 */

/**
 * @swagger
 * /api/ratings/{id}:
 *   delete:
 *     summary: Delete a rating
 *     tags: [Ratings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID of the rating to delete
 *     responses:
 *       200:
 *         description: Rating deleted successfully
 *       404:
 *         description: Rating not found
 *       500:
 *         description: Server error
 */