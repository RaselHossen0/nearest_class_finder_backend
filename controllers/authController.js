
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const argon2 = require('argon2');
const { sendOTP } = require('../config/email'); 
const multer = require('multer');
const path = require('path');
const ClassOwner = require('../models/ClassOwner');
const sequelize = require('../config/database'); // Import your sequelize instance
const Class = require('../models/Class');
const Category = require('../models/Category');
const fs = require('fs');

const createAdminUser = async () => {
try {
  const adminExists = await User.findOne({ where: { email: 'admin@gmail.com' } });
  if (!adminExists) {
    const hashedPassword = await argon2.hash('12345678');
    await User.create({
      name: 'admin',
      email: 'admin@gmail.com',
      password: hashedPassword,
      role: 'admin',
      adminVerified: true
    });
    console.log('Admin user created');
  } else {
    console.log('Admin user already exists');
  }
} catch (error) {
  console.log(error);
  console.error('Failed to create admin user');
}
};

createAdminUser();
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
        email,
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
        return res.status(200).json({ error: 1, message: 'Missing required fields or files' });
      }

      // Check if the user exists and is not already registered as a class owner
      const user = await User.findOne({ where: { email } });
      if (!user) {
        return res.status(200).json({ error: 1, message: 'User not found' });
      } 
      const userId = user.id;
      console.log(userId);  
      const existingClassOwner = await ClassOwner.findOne({ where: { userId } });
      if (existingClassOwner) {
        return res.status(200).json({ error: 1, message: 'Class owner already exists' });
      }
     

      // Check if the category is valid
      const category = await Category.findByPk(categoryId);
      if (!category) {
        return res.status(200).json({ error: 1, message: 'Invalid category' });
      }
      //check duplicacy of aadhar card number and pan card number
      const aadharCard = await ClassOwner.findOne({ where: { aadhaarCardNumber } });
      if (aadharCard) {
        return res.status(200).json({ error: 1, message: 'Aadhar card number already exists' });
      }
      const panCard = await ClassOwner.findOne({ where: { panCardNumber } });
      if (panCard) {
        return res.status(200).json({ error: 1, message: 'Pan card number already exists' });
      } 
      let parsedCoordinates;
      try {
        
      
        // Check if the input is a JSON string or a comma-separated string
        if (typeof coordinates === 'string') {
          if (coordinates.includes(',')) {
            // Handle comma-separated format like "12,23"
            parsedCoordinates = coordinates.split(',').map((val) => parseFloat(val.trim()));
          } else {
            // Attempt to parse as JSON
            parsedCoordinates = JSON.parse(coordinates);
          }
        } else {
          // Assume the input is already parsed (e.g., when directly sent as an array)
          parsedCoordinates = coordinates;
        }
      
        // Validate the parsedCoordinates
        if (!Array.isArray(parsedCoordinates) || parsedCoordinates.length !== 2) {
          return res.status(400).json({ error: 'Coordinates must be an array of [latitude, longitude]' });
        }
      
        const [latitude, longitude] = parsedCoordinates.map((val) => {
          if (isNaN(val)) {
            throw new Error('Invalid number in coordinates');
          }
          return val;
        });
      
        console.log('Parsed Coordinates:', { latitude, longitude });
      
        // Proceed with your logic using latitude and longitude
      } catch (err) {
        console.error('Error parsing coordinates:', err.message);
        return res.status(400).json({ error: 'Invalid coordinates format' });
      }
      // console.log(parsedCoordinates);
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
       
      }, { transaction });
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
        classId: newClass.id,
      }, { transaction });
      // Parse coordinates correctly
    

     

      await transaction.commit(); // Commit transaction

      res.status(200).json({
        error: 0,
        message: 'Your class is successfully created. Please wait for admin approval.',
        classOwner,
        newClass,
      });
    } catch (error) {
      await transaction.rollback(); // Rollback transaction in case of error
      console.error(error);
      //delete all files if transaction fails
      if (req.files) {
        req.files.aadhaarCardFile.forEach((file) => {
          fs.unlink(file.path, (err) => {
            if (err) {
              console.error('Failed to delete Aadhaar card file:', err);
            } else {
              console.log('Aadhaar card file deleted successfully');
            }
          });
        });
        req.files.panCardFile.forEach((file) => {
          fs.unlink(file.path, (err) => {
            if (err) {
              console.error('Failed to delete PAN card file:', err);
            } else {
              console.log('PAN card file deleted successfully');
            }
          });
        });
        req.files.photographFile.forEach((file) => {
          fs.unlink(file.path, (err) => {
            if (err) {
              console.error('Failed to delete photograph file:', err);
            } else {
              console.log('Photograph file deleted successfully');
            }
          });
        });
        if (req.files.certificatesFile) {
          req.files.certificatesFile.forEach((file) => {
            fs.unlink(file.path, (err) => {
              if (err) {
                console.error('Failed to delete certificates file:', err);
              } else {
                console.log('Certificates file deleted successfully');
              }
            });
          });
        }
      }
      res.status(200).json({ error: 1, message: `Failed to complete signup: ${error.message}` });
    }
  },
];

exports.signup = async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    //check if user already exists
    const userOld = await User.findOne({ where: { email } });
    if (userOld) {
        return res.status(200).json({ error: 1, message: 'User already exists' });
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

    res.status(200).json({ error: 0, message: message, token });
  } catch (error) {
    console.log(error);
    //delete user if registration fails
    await User.destroy({ where: { email: req.body.email } });
    res.status(200).json({ error: 1, message: `User registration failed  ${error}` });
  }
};

exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });

    if (!user) {
      return res.status(200).json({ error: 1, message: 'User not found' });
    }

    // Verify password
    if (!(await argon2.verify(user.password, password))) {
      return res.status(200).json({ error: 1, message: 'Invalid email or password' });
    }

    // Check if ClassOwner is verified
    if (user.role === 'class_owner' && !user.adminVerified) {
      return res.status(200).json({ error: 1, message: 'Your account is under review. Please wait for admin approval.' });
    }

    // Generate JWT token
    const token = jwt.sign({ id: user.id, role: user.role }, process.env.JWT_SECRET, { expiresIn: '2 days' });

    res.status(200).json({ error: 0, message: 'Login successful', token });
  } catch (error) {
    console.error(error);
    res.status(200).json({ error: 1, message: 'Login failed' });
  }
};

exports.getUserDetails = async (req, res) => {
  try {
    const token = req.headers.authorization.split(' ')[1];
    console.log(token);
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findByPk(decoded.id, {
      attributes: { exclude: ['password'] },
    });

    if (!user) {
      return res.status(200).json({ error: 1, message: 'User not found' });
    }
    //if user is class owner then fetch class owner details
    if (user.role === 'class_owner') {
      const classOwner = await ClassOwner.findOne({ where: { userId: user.id } });
      if (classOwner) {
        user.classOwner = classOwner;
      }
    }

    res.status(200).json({ error: 0, user });
  } catch (error) {
    console.error(error);
    res.status(200).json({ error: 1, message: 'Failed to get user details' });
  }
};

exports.changeProfileImage = async (req, res) => {
  try {
    const user = req.user;
    console.log(user);
    const userId = user.id;
    const updatedUser = await User.findByPk(userId);
    if (!updatedUser) {
      return res.status(404).json({ error: 1, message: 'User not found' });
    }


    try {
     
    //delete old profile image
    if (updatedUser.profileImage !== '/uploads/default.jpg') {
      const oldImagePath = path.join(__dirname, '..', updatedUser.profileImage);
      fs.unlink(oldImagePath, (err) => {
        if (err) {
          console.error('Failed to delete old profile image:', err);
        } else {
          console.log('Old profile image deleted successfully');
        }
      });
    }
    } catch (error) {
      console.error('Failed to delete old profile image:', error);
    }

    if (req.file) {
      updatedUser.profileImage = req.file.path;
      await updatedUser.save();
    }
        

    res.status(200).json({ error: 0, message: 'Profile image updated successfully', updatedUser });
  } catch (error) {
    console.error(error);
    res.status(200).json({ error: 1, message: 'Failed to update profile image' });
  }
}

exports.sendOtp= async (req, res) => {
  const { email } = req.body;
  const otp = Math.floor(100000 + Math.random() * 900000);
  try {
    // const user = await User.findOne({ where: { email } });
    // if (!user) {
    //   return res.status(200).json({ error: 1, message: 'User not found' });
    // }

    // Send OTP to the user's email
    await sendOTP(email, otp);
    res.status(200).json({ error: 0, message: 'OTP sent successfully',otp:otp });
  } catch (error) {
    console.error(error);
    res.status(200).json({ error: 1, message: 'Failed to send OTP' });
  }
}

exports.changePassword = async (req, res) => {
  const { email, password, otp } = req.body;
  try {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return res.status(200).json({ error: 1, message: 'User not found' });
    }

    // Verify OTP (assuming you have a method to verify OTP)
    // const isOtpValid = await verifyOtp(email, otp);
    // if (!isOtpValid) {
    //   return res.status(200).json({ error: 1, message: 'Invalid OTP' });
    // }

    // Hash the new password
    const hashedPassword = await argon2.hash(password);

    // Update the user's password
    user.password = hashedPassword;
    await user.save();

    res.status(200).json({ error: 0, message: 'Password changed successfully' });
  } catch (error) {
    console.error(error);
    res.status(200).json({ error: 1, message: 'Failed to change password' });
  }
};
//edit profile 
exports.editProfile = async (req, res) => {
  const { name, email, mobileNumber, alternateMobileNumber, aadhaarCardNumber, panCardNumber ,password} = req.body;
  try {
    console.log(req.body);
    const userFromReq = req.user;
    const user = await User.findByPk(userFromReq.id);
    console.log(user);
    if (!user) {
      return res.status(200).json({ error: 1, message: 'User not found' });
    }

    // Update user fields if provided
    if (name) user.name = name;
    if (mobileNumber) user.mobileNumber = mobileNumber;
    if (alternateMobileNumber) user.alternateMobileNumber = alternateMobileNumber;
    if (aadhaarCardNumber) user.aadhaarCardNumber = aadhaarCardNumber;
    if (panCardNumber) user.panCardNumber = panCardNumber;

    if (password) {
      // Hash the new password
      const hashedPassword = await argon2.hash(password);
      user.password = hashedPassword;
    }

    // Handle profile image update
    if (req.file) {
      // Delete old profile image if it exists and is not the default
      if (user.profileImage && user.profileImage !== '/uploads/default.jpg') {
        const oldImagePath = path.join(__dirname, '..', user.profileImage);
        fs.unlink(oldImagePath, (err) => {
          if (err) {
            console.error('Failed to delete old profile image:', err);
          } else {
            console.log('Old profile image deleted successfully');
          }
        });
      }
      user.profileImage = req.file.path;
    }

    await user.save();

    res.status(200).json({ error: 0, message: 'Profile updated successfully', user });
  } catch (error) {
    console.error(error);
    res.status(200).json({ error: 1, message: 'Failed to update profile' });
  }
};
exports.getAllUsers= async (req, res) => {
  try {
    const users = await User.findAll();
    if (!users) {
      return res.status(200).json({ error: 1, message: 'Users not found' });
    }
    res.status(200).json({ error: 0, users });
  } catch (error) {
    console.error(error);
    res.status(200).json({ error: 1, message: 'Failed to get users' });
  }
}
exports.deleteUser= async (req, res) => {
  const {id } = req.params;
  try {
    const user = await User.findByPk(id);
    if (!user) {
      return res.status(200).json({ error: 1, message: 'User not found' });
    }
    await user.destroy();
    res.status(200).json({ error: 0, message: 'User deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(200).json({ error: 1, message: 'Failed to delete user' });
  }
}

/**
 * @swagger
 * /auth/delete-user/{id}:
 *   delete:
 *     summary: Delete a user by ID
 *     tags: [Auth]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The ID of the user to delete
 *     responses:
 *       200:
 *         description: User deleted successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: User deleted successfully
 *       404:
 *         description: User not found
 *       500:
 *         description: Failed to delete user
 */

/**
 * @swagger
 * /auth/get-all-users:
 *   get:
 *     summary: Get all users
 *     tags: [Auth]
 *     responses:
 *       200:
 *         description: Users retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 users:
 *                   type: array
 *                   items:
 *                     type: object
 *                     description: User object
 *       500:
 *         description: Failed to get users
 */

/**
 * @swagger
 * /auth/edit-profile:
 *   post:
 *     summary: Edit the user's profile
 *     security:
 *      - bearerAuth: []
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
 *               mobileNumber:
 *                 type: string
 *                 description: The user's mobile number
 *               alternateMobileNumber:
 *                 type: string
 *                 description: The user's alternate mobile number
 *               aadhaarCardNumber:
 *                 type: string
 *                 description: The user's Aadhaar card number
 *               panCardNumber:
 *                 type: string
 *                 description: The user's PAN card number
 *             example:
 *               name: John Doe
 *               email: johndoe@example.com
 *               mobileNumber: "1234567890"
 *               alternateMobileNumber: "0987654321"
 *               aadhaarCardNumber: "1234-5678-9012"
 *               panCardNumber: "ABCDE1234F"
 *     responses:
 *       200:
 *         description: Profile updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Profile updated successfully
 *                 user:
 *                   type: object
 *                   description: The updated user object
 *       404:
 *         description: User not found
 *       500:
 *         description: Failed to update profile
 */

/**
 * @swagger
 * /auth/send-otp:
 *   post:
 *     summary: Send an OTP to the user's email
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
 *                 description: The user's email address
 *             example:
 *               email: johndoe@example.com
 *     responses:
 *       200:
 *         description: OTP sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: OTP sent successfully
 *       500:
 *         description: Failed to send OTP
 */

/**
 * @swagger
 * /auth/change-password:
 *   post:
 *     summary: Change the user's password using OTP
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
 *                 description: The new password
 *               otp:
 *                 type: string
 *                 description: The OTP sent to the user's email
 *             example:
 *               email: johndoe@example.com
 *               password: "newpassword123"
 *               otp: "123456"
 *     responses:
 *       200:
 *         description: Password changed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Password changed successfully
 *       400:
 *         description: Invalid OTP or user not found
 *       500:
 *         description: Failed to change password
 */

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
 *               email:
 *                 type: string
 *                 description: The email address of the user
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
 *                 type: array
 *                 items:
 *                   type: number
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

/**
 * @swagger
 * /auth/user-details:
 *   get:
 *     summary: Get user details by token
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User details retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 user:
 *                   type: object
 *                   description: The user details
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: User not found
 *       500:
 *         description: Failed to get user details
 */

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

/**
 * @swagger
 * /auth/change-profile-image:
 *   post:
 *     summary: Change the profile image of the user
 *     tags: [Auth]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               profileImage:
 *                 type: string
 *                 format: binary
 *                 description: The profile image file
 *     responses:
 *       200:
 *         description: Profile image updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Profile image updated successfully
 */
