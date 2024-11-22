// controllers/ClassController.js
const Class = require('../models/Class');
const Category = require('../models/Category');
const Media = require('../models/Media');

// GET all classes
exports.getClasses = async (req, res) => {
  try {
    const classes = await Class.findAll({
      include: [Category, Media]  // Include associated Category and Media
    });
    res.json(classes);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve classes' });
  }
};

// GET class by ID
exports.getClassById = async (req, res) => {
  try {
    const { id } = req.params;
    const classDetail = await Class.findByPk(id, {
      include: [Category, Media]  // Include associated Category and Media
    });

    if (!classDetail) return res.status(404).json({ error: 'Class not found' });

    res.json(classDetail);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve class' });
  }
};

// POST create a new class
// POST create a new class
exports.createClass = async (req, res) => {
  try {
    const { name, description, location, coordinates, price, rating, categoryId, ownerId } = req.body;

    const category = await Category.findByPk(categoryId);
    if (!category) return res.status(400).json({ error: 'Invalid category' });

    // Ensure coordinates are in the correct GeoJSON format
    const geoCoordinates = {
      type: 'Point',
      coordinates: coordinates
    };

    const newClass = await Class.create({
      name,
      description,
      location,
      coordinates: geoCoordinates,
      price,
      rating,
      categoryId,
      ownerId
    });

    res.status(201).json(newClass);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to create class' });
  }
};
// PUT update class by ID
exports.updateClass = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, location, price, rating, categoryId, media } = req.body;

    const classToUpdate = await Class.findByPk(id, {
      include: [Media]  // Include media data
    });

    if (!classToUpdate) return res.status(404).json({ error: 'Class not found' });

    // Validate categoryId
    const category = await Category.findByPk(categoryId);
    if (!category) return res.status(400).json({ error: 'Invalid category' });

    // Update class details
    classToUpdate.name = name || classToUpdate.name;
    classToUpdate.description = description || classToUpdate.description;
    classToUpdate.location = location || classToUpdate.location;
    classToUpdate.price = price || classToUpdate.price;
    classToUpdate.rating = rating || classToUpdate.rating;
    classToUpdate.categoryId = categoryId || classToUpdate.categoryId;

    // Save updated class
    await classToUpdate.save();

    // Handle media updates (photos, videos, reels)
    if (media) {
      // Delete existing media first (optional step to remove previous media)
      await Media.destroy({ where: { classId: id } });

      // Upload new media (photos, videos, reels)
      if (media && media.length) {
        const mediaData = media.map(item => ({
          type: item.type,  // 'photo', 'video', 'reel'
          url: item.url,
          title: item.title,
          description: item.description,
          tags: item.tags,
          classId: id
        }));

        // Bulk create new media records
        await Media.bulkCreate(mediaData);
      }
    }

    res.json({ message: 'Class updated successfully', class: classToUpdate });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to update class' });
  }
};

// DELETE class by ID
exports.deleteClass = async (req, res) => {
  try {
    const { id } = req.params;

    // Delete associated media
    await Media.destroy({ where: { classId: id } });

    // Delete class
    const deleted = await Class.destroy({ where: { id } });

    if (!deleted) return res.status(404).json({ error: 'Class not found' });

    res.json({ message: 'Class deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete class' });
  }
};

// POST search classes by filters (e.g., location, price, category, etc.)
exports.searchClasses = async (req, res) => {
  try {
    const { location, categoryId, priceRange, rating, sortBy, limit = 10, offset = 0 } = req.body;

    // Build the query conditions
    let whereConditions = {};
    if (location) whereConditions.location = { [Op.like]: `%${location}%` };
    if (categoryId) whereConditions.categoryId = categoryId;
    if (priceRange) whereConditions.price = { [Op.between]: priceRange };
    if (rating) whereConditions.rating = { [Op.gte]: rating };

    // Build sorting options
    let orderOptions = [];
    if (sortBy) {
      if (sortBy === 'price') {
        orderOptions.push(['price', 'ASC']);
      } else if (sortBy === 'rating') {
        orderOptions.push(['rating', 'DESC']);
      }
    }

    const classes = await Class.findAll({
      where: whereConditions,
      include: [Category, Media],  // Include associated Category and Media
      limit,
      offset,
      order: orderOptions
    });

    res.json(classes);
  } catch (error) {
    res.status(500).json({ error: 'Failed to search classes' });
  }
};
/**
 * @swagger
 * tags:
 *   name: Classes
 *   description: API for managing classes, categories, and media (photos, videos, reels)
 */

/**
 * @swagger
 * /classes:
 *   get:
 *     summary: "Get all classes"
 *     description: "Retrieve a list of all available classes."
 *     tags:
 *       - "Classes"
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: "List of classes retrieved successfully"
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: "#/definitions/Class"
 *       500:
 *         description: "Failed to retrieve classes"
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to retrieve classes"
 */

/**
 * @swagger
 * /classes/{id}:
 *   get:
 *     summary: "Get class by ID"
 *     description: "Retrieve a specific class by its ID, including its category and media."
 *     tags:
 *       - "Classes"
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: "Class ID"
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: "Class details retrieved successfully"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/definitions/Class"
 *       404:
 *         description: "Class not found"
 *       500:
 *         description: "Failed to retrieve class"
 */

/**
 * @swagger
 * /classes:
 *   post:
 *     summary: "Create a new class"
 *     description: "Create a new class with the associated category, location, price, rating, and media."
 *     tags:
 *       - "Classes"
 *     security:
 *       - bearerAuth: []
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
 *               location:
 *                 type: string
 *               coordinates:
 *                 type: string
 *               price:
 *                 type: number
 *                 format: float
 *               rating:
 *                 type: number
 *                 format: float
 *               categoryId:
 *                 type: integer
 *               ownerId:
 *                 type: integer
 *               media:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     type:
 *                       type: string
 *                       enum: [photo, video, reel]
 *                     url:
 *                       type: string
 *                     title:
 *                       type: string
 *                     description:
 *                       type: string
 *                     tags:
 *                       type: string
 *     responses:
 *       201:
 *         description: "Class created successfully"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/definitions/Class"
 *       500:
 *         description: "Failed to create class"
 */

/**
 * @swagger
 * /classes/{id}:
 *   put:
 *     summary: "Update class by ID"
 *     description: "Update an existing class by its ID, including details and media."
 *     tags:
 *       - "Classes"
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: "Class ID"
 *     security:
 *       - bearerAuth: []
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
 *               location:
 *                 type: string
 *               price:
 *                 type: number
 *                 format: float
 *               rating:
 *                 type: number
 *                 format: float
 *               categoryId:
 *                 type: integer
 *               media:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     type:
 *                       type: string
 *                       enum: [photo, video, reel]
 *                     url:
 *                       type: string
 *                     title:
 *                       type: string
 *                     description:
 *                       type: string
 *                     tags:
 *                       type: string
 *     responses:
 *       200:
 *         description: "Class updated successfully"
 *         content:
 *           application/json:
 *             schema:
 *               $ref: "#/definitions/Class"
 *       404:
 *         description: "Class not found"
 *       500:
 *         description: "Failed to update class"
 */

/**
 * @swagger
 * /classes/{id}:
 *   delete:
 *     summary: "Delete class by ID"
 *     description: "Delete a class and its associated media by ID."
 *     tags:
 *       - "Classes"
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: "Class ID"
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: "Class deleted successfully"
 *       404:
 *         description: "Class not found"
 *       500:
 *         description: "Failed to delete class"
 */

/**
 * @swagger
 * /classes/search:
 *   post:
 *     summary: "Search classes"
 *     description: "Search for classes based on various filters such as location, category, price, and rating."
 *     tags:
 *       - "Classes"
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               location:
 *                 type: string
 *               categoryId:
 *                 type: integer
 *               priceRange:
 *                 type: array
 *                 items:
 *                   type: number
 *               rating:
 *                 type: number
 *               sortBy:
 *                 type: string
 *                 enum: [price, rating]
 *               limit:
 *                 type: integer
 *               offset:
 *                 type: integer
 *     responses:
 *       200:
 *         description: "List of filtered classes"
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: "#/definitions/Class"
 *       500:
 *         description: "Failed to search classes"
 */


/**
 * @swagger
 * components:
 *   securitySchemes:
 *     bearerAuth:
 *       type: http
 *       scheme: bearer
 *       bearerFormat: JWT
 */



/**
 * @swagger
 * definitions:
 *   Class:
 *     type: object
 *     properties:
 *       id:
 *         type: integer
 *       name:
 *         type: string
 *       description:
 *         type: string
 *       categoryId:
 *         type: integer
 *       location:
 *         type: string
 *       price:
 *         type: number
 *         format: float
 *       rating:
 *         type: number
 *         format: float
 *       media:
 *         type: array
 *         items:
 *           $ref: "#/definitions/Media"
 *   Media:
 *     type: object
 *     properties:
 *       id:
 *         type: integer
 *       type:
 *         type: string
 *         enum: [photo, video, reel]
 *       url:
 *         type: string
 *       title:
 *         type: string
 *       description:
 *         type: string
 *       tags:
 *         type: string
 *       upload_date:
 *         type: string
 *         format: date-time
 *       classId:
 *         type: integer
 *   Category:
 *     type: object
 *     properties:
 *       id:
 *         type: integer
 *       name:
 *         type: string
 */