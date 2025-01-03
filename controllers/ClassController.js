// controllers/ClassController.js
const Class = require('../models/Class');
const Category = require('../models/Category');
const Media = require('../models/Media');
const ClassOwner = require('../models/ClassOwner');
const User = require('../models/User');
const { Op } = require('sequelize');
const geolib = require('geolib'); 
const haversine = require('haversine');


exports.getAllClasses1 = async (req, res) => {
  try {
    console.log('Get all classes');
    const { page = 1, limit = 10, search = '' } = req.query; // Pagination and search query
    const offset = (page - 1) * limit;
   
    // const allClasses = await ClassOwner.findAll();
    // console.log(allClasses);

    // Fetch classes with optional search
    const { count, rows: classes } = await ClassOwner.findAndCountAll({
      // where: {
      //   // Search by mobile number or experience (example)
      //   name: { [Op.like]: `%${search}%` }

      // },
      include: [
        {
          model: User, // Include associated User data
          attributes: ['id', 'name', 'email','adminVerified'], // Only fetch selected User attributes
        },
        {
          model: Class, // Include associated Class data
        //  attributes: ['id', 'name', 'description', 'location', 'price', 'rating'], // Only fetch selected Class attributes
        // }
        }
      ],
      offset,
      limit: parseInt(limit),
    });
 


    return res.status(200).json({
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / limit),
      classes,
    });
  } catch (error) {
    console.error('Error fetching classes:', error);
    res.status(500).json({ error: `Failed to fetch classes: ${error.message}` });
  }
};

exports.getAllClasses = async (req, res) => {
  try {
    console.log('Get all classes', req.query);
    const {
      page = 1,
      limit = 5,
      search = '',
      minPrice,
      maxPrice,
      category,
    } = req.query;

    const offset = (page - 1) * limit;

    // Build search conditions
    const searchConditions = {};

    if (search) {
      searchConditions[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
        { location: { [Op.like]: `%${search}%` } },
      ];
    }

    if (minPrice) {
      searchConditions.price = { [Op.gte]: parseFloat(minPrice) };
    }

    if (maxPrice) {
      searchConditions.price = {
        ...searchConditions.price,
        [Op.lte]: parseFloat(maxPrice),
      };
    }

    if (category) {
      console.log('Category:', category);
      searchConditions.categoryId = category;
    }

    // Fetch paginated classes
    const { count, rows: classes } = await Class.findAndCountAll({
      where: searchConditions,
      include: [
        { model: Category },
        { model: Media },
        { model: ClassOwner, attributes: ['userId', 'id'] },
      ],
      limit: parseInt(limit),
      offset,
      order: [['createdAt', 'DESC']],
    });
    console.log(classes);

    res.status(200).json({
      total: count,
      page: parseInt(page),
      totalPages: Math.ceil(count / limit),
      classes,
    });
  } catch (error) {
    console.error('Error fetching classes:', error);
    res.status(500).json({ error: `Failed to fetch classes: ${error.message}` });
  }
};

// Install with `npm install geolib`

exports.getAllClass = async (req, res) => {
  try {
    console.log('Get all classes',req.query);
    const {
      page = 1,
      limit = 3,
      search = '',
      coordinates = '[]',
      minPrice,
      maxPrice,
      category,
      distance = 400000, // Default to 400 km if not provided
    } = req.query;

    const offset = (page - 1) * limit;

    // Parse coordinates
    let parsedCoordinates;
    try {
      parsedCoordinates = JSON.parse(coordinates);
    } catch (err) {
      return res.status(400).json({ error: 'Invalid coordinates format' });
    }

    if (!Array.isArray(parsedCoordinates) || parsedCoordinates.length !== 2) {
      return res.status(400).json({
        error: 'Coordinates must be an array of [latitude, longitude]',
      });
    }

    const [latitude, longitude] = parsedCoordinates;

    // Build search conditions
    const searchConditions = {};

    if (search) {
      searchConditions[Op.or] = [
        { name: { [Op.like]: `%${search}%` } },
        { description: { [Op.like]: `%${search}%` } },
        { location: { [Op.like]: `%${search}%` } },
      ];
    }

    if (minPrice) {
      searchConditions.price = { [Op.gte]: parseFloat(minPrice) };
    }

    if (maxPrice) {
      searchConditions.price = {
        ...searchConditions.price,
        [Op.lte]: parseFloat(maxPrice),
      };
    }

    if (category) {
      console.log('Category:', category);
      searchConditions.categoryId = category; // Assuming `categoryId` maps to a valid category
    }


    // Fetch all classes with filters applied
    const allClasses = await Class.findAll({
      where: searchConditions,
      include: [
        { model: Category },
        { model: Media },
        { model: ClassOwner, attributes: ['userId','id'] },
      ],
    });
     console.log(allClasses.length);

    // Filter classes by proximity
    const filteredClasses = allClasses.filter((classItem) => {
      const cords = classItem.coordinates['coordinates'];

      const classCoordinates = {
        latitude: cords[0],
        longitude: cords[1],
      };

      const start = { latitude, longitude };
      const end = classCoordinates;
      const distanceToClass = geolib.getDistance(start, end); // Distance in meters
      // console.log(distanceToClass, distance);
      // console.log(distanceToClass <= parseInt(distance));
      return distanceToClass/1000 <= parseInt(distance);
    });
    // console.log(filteredClasses);

    // Paginate the filtered results
    const paginatedClasses = filteredClasses.slice(offset, offset + limit);

    res.status(200).json({
      total: filteredClasses.length,
      page: parseInt(page),
      totalPages: Math.ceil(filteredClasses.length / limit),
      classes: paginatedClasses,
    });
  } catch (error) {
    console.error('Error fetching classes:', error);
    res.status(500).json({ error: `Failed to fetch classes: ${error.message}` });
  }
};

// GET class by ID
exports.getClassById = async (req, res) => {
  try {
    console.log('Get class by ID');
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
    console.log('Delete class by ID');

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
 * /classes/owners/all:
 *   get:
 *     summary: Get All Classes
 *     description: Retrieve all ClassOwner records with optional pagination and search.
 *     tags:
 *       - Classes
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: page
 *         in: query
 *         required: false
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination.
 *       - name: limit
 *         in: query
 *         required: false
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of records per page.
 *       - name: search
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *         description: Search keyword for filtering classes by mobile number.
 *     responses:
 *       200:
 *         description: List of ClassOwner records.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                   example: 100
 *                 page:
 *                   type: integer
 *                   example: 1
 *                 totalPages:
 *                   type: integer
 *                   example: 10
 *                 classes:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       userId:
 *                         type: integer
 *                         example: 5
 *                       mobileNumber:
 *                         type: string
 *                         example: "1234567890"
 *                       alternateMobileNumber:
 *                         type: string
 *                         example: "0987654321"
 *                       experience:
 *                         type: string
 *                         example: "5 years"
 *                       user:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                             example: 5
 *                           name:
 *                             type: string
 *                             example: "John Doe"
 *                           email:
 *                             type: string
 *                             example: "john.doe@example.com"
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to fetch classes: An unexpected error occurred."
 */

/**
 * @swagger
 * /classes/get/all:
 *   get:
 *     summary: Get All Classes
 *     description: Retrieve all ClassOwner records with optional pagination and search.
 *     tags:
 *       - Classes
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: page
 *         in: query
 *         required: false
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Page number for pagination.
 *       - name: limit
 *         in: query
 *         required: false
 *         schema:
 *           type: integer
 *           default: 10
 *         description: Number of records per page.
 *       - name: search
 *         in: query
 *         required: false
 *         schema:
 *           type: string
 *         description: Search keyword for filtering classes by mobile number.
 *     responses:
 *       200:
 *         description: List of ClassOwner records.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 total:
 *                   type: integer
 *                   example: 100
 *                 page:
 *                   type: integer
 *                   example: 1
 *                 totalPages:
 *                   type: integer
 *                   example: 10
 *                 classes:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: integer
 *                         example: 1
 *                       userId:
 *                         type: integer
 *                         example: 5
 *                       mobileNumber:
 *                         type: string
 *                         example: "1234567890"
 *                       alternateMobileNumber:
 *                         type: string
 *                         example: "0987654321"
 *                       experience:
 *                         type: string
 *                         example: "5 years"
 *                       user:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: integer
 *                             example: 5
 *                           name:
 *                             type: string
 *                             example: "John Doe"
 *                           email:
 *                             type: string
 *                             example: "john.doe@example.com"
 *       500:
 *         description: Internal server error.
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: "Failed to fetch classes: An unexpected error occurred."
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