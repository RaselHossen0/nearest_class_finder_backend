
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const argon2 = require('argon2');

const multer = require('multer');
const path = require('path');
const ClassOwner = require('../models/ClassOwner');
const sequelize = require('../config/database'); // Import your sequelize instance
const Class = require('../models/Class');
const Category = require('../models/Category');

// Configure Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Save files to the 'uploads' directory
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

const upload = multer({ storage });

// API Endpoint
exports.completeSignup = [
  upload.fields([
    { name: 'aadhaarCardFile', maxCount: 1 },
    { name: 'panCardFile', maxCount: 1 },
    { name: 'photographFile', maxCount: 1 },
    { name: 'certificatesFile', maxCount: 5 }, // Optional multiple certificates
  ]),
  async (req, res) => {
    console.log(req.body);
    const transaction = await sequelize.transaction(); // Use transaction for atomicity
    try {
      const {
        userId,
        mobileNumber,
        alternateMobileNumber,
        aadhaarCardNumber,
        panCardNumber,
        className,
        description,
        location,
        coordinates, // Coordinates as an array [longitude, latitude]
        price,
        rating,
        categoryId,
      } = req.body;

      // Validate required fields
      if (
        !userId ||
        !mobileNumber ||
        !aadhaarCardNumber ||
        !panCardNumber ||
        !req.files.aadhaarCardFile ||
        !req.files.panCardFile ||
        !req.files.photographFile ||
        !className ||
        !location ||
        !coordinates ||
        !categoryId
      ) {
        return res.status(400).json({ error: 'Missing required fields or files' });
      }

      // Check if the user exists and is not already registered as a class owner
      const user = await User.findByPk(userId);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      const existingClassOwner = await ClassOwner.findOne({ where: { userId } });
      if (existingClassOwner) {
        return res.status(400).json({ error: 'Class owner already exists' });
      }

      // Check if the category is valid
      const category = await Category.findByPk(categoryId);
      if (!category) {
        return res.status(400).json({ error: 'Invalid category' });
      }

      // Create ClassOwner record
      const classOwner = await ClassOwner.create({
        userId,
        mobileNumber,
        alternateMobileNumber: alternateMobileNumber || null,
        aadhaarCardNumber,
        panCardNumber,
        aadhaarCardFile: req.files.aadhaarCardFile[0].path,
        panCardFile: req.files.panCardFile[0].path,
        photographFile: req.files.photographFile[0].path,
        certificatesFile: req.files.certificatesFile
          ? req.files.certificatesFile.map(file => file.path).join(',')
          : null,
      }, { transaction });
      // Parse coordinates correctly
      console.log(coordinates);
      const parsedCoordinates = coordinates.split(',').map(coord => parseFloat(coord.trim()));
      console.log(parsedCoordinates);
      if (parsedCoordinates.length !== 2 || isNaN(parsedCoordinates[0]) || isNaN(parsedCoordinates[1])) {
        return res.status(400).json({ error: 'Invalid coordinates format' });
      }

      // Create the class record
      const geoCoordinates = {
        type: 'Point',
        coordinates: parsedCoordinates, // Ensure coordinates are passed as an array [longitude, latitude]
      };

      const newClass = await Class.create({
        name: className,
        description,
        location,
        coordinates: geoCoordinates,
        price,
        rating,
        categoryId,
        ownerId: userId,
      }, { transaction });

      await transaction.commit(); // Commit transaction

      res.status(201).json({
        message: 'Class owner signup and class creation completed successfully',
        classOwner,
        newClass,
      });
    } catch (error) {
      await transaction.rollback(); // Rollback transaction in case of error
      console.error(error);
      res.status(500).json({ error: `Failed to complete signup: ${error.message}` });
    }
  },
];

/**
 * @swagger
 * /auth/class-owner/complete-signup:
 *   post:
 *     summary: Complete the signup process for a class owner and create a class
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               userId:
 *                 type: string
 *                 description: The user ID
 *               mobileNumber:
 *                 type: string
 *                 description: The mobile number
 *               alternateMobileNumber:
 *                 type: string
 *                 description: The alternate mobile number
 *               aadhaarCardNumber:
 *                 type: string
 *                 description: The Aadhaar card number
 *               panCardNumber:
 *                 type: string
 *                 description: The PAN card number
 *               aadhaarCardFile:
 *                 type: string
 *                 format: binary
 *                 description: The Aadhaar card file
 *               panCardFile:
 *                 type: string
 *                 format: binary
 *                 description: The PAN card file
 *               photographFile:
 *                 type: string
 *                 format: binary
 *                 description: The photograph file
 *               certificatesFile:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: The certificates files
 *               className:
 *                 type: string
 *                 description: The name of the class
 *               description:
 *                 type: string
 *                 description: A brief description of the class
 *               location:
 *                 type: string
 *                 description: The address or location of the class
 *               coordinates:
 *                 type: string
 *                 description: The GeoJSON coordinates of the class as a JSON array [longitude, latitude]
 *               price:
 *                 type: number
 *                 description: The price of the class
 *               rating:
 *                 type: number
 *                 description: The initial rating of the class
 *               categoryId:
 *                 type: integer
 *                 description: The ID of the class category
 *     responses:
 *       201:
 *         description: Class owner signup and class creation completed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Class owner signup and class creation completed successfully
 *                 classOwner:
 *                   type: object
 *                   description: The created ClassOwner object
 *                 newClass:
 *                   type: object
 *                   description: The created Class object
 *       400:
 *         description: Missing required fields, invalid data, or files
 *       404:
 *         description: User or category not found
 *       500:
 *         description: Failed to complete signup
 */
exports.signup = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    //check if user already exists
    const userOld = await User.findOne({ where: { email } });
    if (userOld) {
        return res.status(400).json({ error: 'User already exists' });
    }

    //hash password
    const hashedPassword = await argon2.hash(password);
    let adminVerified = true;

    // console.log(hashedPassword);
    // Create a new user
    if (role === 'class_owner' || role === 'admin') {
     adminVerified = false;
     
    }
    const user = await User.create({ name, email,password: hashedPassword, role,adminVerified });

    // Generate JWT token
    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '2 days' });
    const message= role === 'class_owner' || role === 'admin' ? 'User registered successfully. Please complete the signup process' : 'User registered successfully';

    res.status(201).json({ message: message, token });
  } catch (error) {
    console.log(error);
    //delete user if registration fails
    await User.destroy({ where: { email: req.body.email } });
    res.status(500).json({ error: `User registration failed  ${error}` });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
   
    // console.log(await argon2.verify( user.password, password));
    if (!user){
      return res.status(401).json({ error: 'User not found ' });
    }

    if (!user || !(await argon2.verify( user.password, password))) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

   const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '2 days' });

    res.json({ message: 'Login successful', token });
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 'Login failed' });
  }
};


/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: User authentication routes
 */

/**
 * @swagger
 * /auth/signup:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: The user's name
 *               email:
 *                 type: string
 *                 format: email
 *                 description: The user's email address
 *              
 *               password:
 *                 type: string
 *                 format: password
 *                 description: The user's password
 *               role:
 *                 type: string
 *                 description: The user's role
 *             example:
 *               name: John Doe
 *               email: johndoe@example.com
 *               password: "password123"
 *               role: user
 *     responses:
 *       201:
 *         description: User registered successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User registered successfully
 *                 token:
 *                   type: string
 *                   description: JWT token for authentication
 *       500:
 *         description: User registration failed
 */

/**
 * @swagger
 * /auth/login:
 *   post:
 *     summary: Log in an existing user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 format: email
 *                 description: The user's email address
 *               password:
 *                 type: string
 *                 format: password
 *                 description: The user's password
 *             example:
 *               email: johndoe@example.com
 *               password: "password123"
 *     responses:
 *       200:
 *         description: Login successful
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Login successful
 *                 token:
 *                   type: string
 *                   description: JWT token for authentication
 *       401:
 *         description: Invalid email or password
 *       500:
 *         description: Login failed
 */