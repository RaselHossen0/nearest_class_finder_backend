const { Event, EventMedia,EventUser } = require('../models/Event');
const fs = require('fs');
const path = require('path');
const User = require('../models/User');
const Class = require('../models/Class');
const e = require('express');
const { error } = require('console');
const ClassOwner = require('../models/ClassOwner');
exports.getEvents = async (req, res) => {
  const { page = 1, limit = 10 } = req.query; // Default to page 1, 10 items per page
  const offset = (page - 1) * limit;

  try {
    const events = await Event.findAndCountAll({
      include: [
        {
          model: EventMedia,
          // attributes: ['url', 'type'],
        },
        {
          model: Class,
          // include:[
          //   {
          //     model:ClassOwner
          //   }
          // ]
            attributes: ['name','id'], // Assuming `name` is a column in the `Classes` table
         
        },
        
      ],
      limit: parseInt(limit), // Convert to number
      offset: parseInt(offset), // Convert to number
      order: [['date', 'DESC']], // Order events by date (latest first)
    });

    res.json({
      total: events.count, // Total number of events
      currentPage: parseInt(page),
      totalPages: Math.ceil(events.count / limit),
      data: events.rows, // Paginated event data
    });
  } catch (error) {
    console.error('Error fetching events:', error);
    res.status(500).json({ error: 'Failed to retrieve events' });
  }
};

exports.getEventById = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await Event.findByPk(id, { include: EventMedia });

    if (!event) return res.status(404).json({ error: 'Event not found' });

    res.json(event);
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve event' });
  }
};

exports.createEvent = async (req, res) => {
  let newEvent;
  try {
    const { classId, coordinates, ...eventData } = req.body;
    // Find the class
    const classFound = await Class.findByPk(classId);
    if (!classFound) return res.status(404).json({ error: 'Class not found' });
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
    newEvent = await Event.create({ ...eventData, classId,coordinates: geoCoordinates });

    if (req.files && req.files.length > 0) {
      // Update the event media instances with the new URLs and types
      const updatedEventMediaInstances = req.files.map((file) => ({
        url: file.path,
        type: file.mimetype,
        eventId: newEvent.id,
      }));
      await EventMedia.bulkCreate(updatedEventMediaInstances);
    }

    const createdEvent = await Event.findByPk(newEvent.id, { include: EventMedia });
    res.status(201).json(createdEvent);
  } catch (error) {
    console.log(error);
    // Delete uploaded media files if event creation fails
    if (req.files && req.files.length > 0) {
      req.files.forEach((file) => {
        fs.unlinkSync(file.path);
      });
    }
    // Delete event if media upload fails
    if (newEvent) {
      await Event.destroy({ where: { id: newEvent.id } });
    }

    res.status(500).json({ error: 'Failed to create event' });
  }
};


exports.updateEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, date, description, location, coordinates, classId, media, users } = req.body;

    // Find the event
    const event = await Event.findByPk(id);
    if (!event) {
      return res.status(404).json({ error: 'Event not found' });
    }

    // Update individual fields if they are provided in the request
    if (title !== undefined) event.title = title;
    if (date !== undefined) event.date = new Date(date);
    if (description !== undefined) event.description = description;
    if (location !== undefined) event.location = location;

    if (coordinates !== undefined) {
      let parsedCoordinates;
      try {
        if (typeof coordinates === 'string') {
          if (coordinates.includes(',')) {
            parsedCoordinates = coordinates.split(',').map((val) => parseFloat(val.trim()));
          } else {
            parsedCoordinates = JSON.parse(coordinates);
          }
        } else {
          parsedCoordinates = coordinates;
        }

        if (!Array.isArray(parsedCoordinates) || parsedCoordinates.length !== 2) {
          return res.status(400).json({ error: 'Coordinates must be an array of [latitude, longitude]' });
        }

        event.coordinates = {
          type: 'Point',
          coordinates: [parsedCoordinates[1], parsedCoordinates[0]], // GeoJSON requires [longitude, latitude]
        };
      } catch (error) {
        return res.status(400).json({ error: 'Invalid coordinates format' });
      }
    }

    if (classId !== undefined) event.classId = classId;

    // Save the updated event
    await event.save();

    // Handle related media (if provided)
    if (Array.isArray(media)) {
      await EventMedia.destroy({ where: { eventId: id } }); // Remove existing media
      const mediaData = media.map((item) => ({
        eventId: id,
        url: item.url,
        type: item.type,
      }));
      await EventMedia.bulkCreate(mediaData); // Add new media
    }

    // Handle related users (if provided)
    if (Array.isArray(users)) {
      await EventUser.destroy({ where: { eventId: id } }); // Remove existing event users
      const userData = users.map((userId) => ({
        eventId: id,
        userId,
      }));
      await EventUser.bulkCreate(userData); // Add new event users
    }

    return res.json({ message: 'Event updated successfully', event });
  } catch (error) {
    console.error('Error updating event:', error.message);
    return res.status(500).json({ error: 'Failed to update event' });
  }
};

exports.deleteEvent = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await Event.findByPk(id, { include: EventMedia });

    if (!event) return res.status(404).json({ error: 'Event not found' });

    // Delete associated media files from the server
    for (const media of event.EventMedia) {
      fs.unlinkSync(media.filePath);
    }

    // Delete event and associated media
    await EventMedia.destroy({ where: { eventId: id } });
    await Event.destroy({ where: { id } });

    res.json({ message: 'Event deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete event' });
  }
};
//upload event media
exports.uploadEventMedia = async (req, res) => {
  try {
    const { id } = req.params;
    const event = await Event.findByPk(id);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    if (!req.files || req.files.length === 0) return res.status(400).json({ error: 'No files uploaded' });
    // console.log(req.files);
    const updatedEventMediaInstances = req.files.map((file, index) => ({
      url: file.path,
      type: file.mimetype,
      eventId: event.id,
    }));
    await EventMedia.bulkCreate(updatedEventMediaInstances);
    res.json({error:0, message: 'Media uploaded successfully' });
  } catch (error) {
    if (req.files && req.files.length > 0) {
      req.files.forEach((file) => {
        fs.unlinkSync(file.path);
      });

    }
    // console.log(error);
    // await EventMedia.destroy({ where: { eventId: id } });
    // await fs.unlinkSync(req.files[0].path);
    res.status(500).json({ error: 'Failed to upload media' });
  }
};

//join event 
exports.joinEvent = async (req, res) => {
  try {
    const { eventId, userId } = req.params;
    const event = await Event.findByPk(eventId);
    if (!event) return res.status(404).json({ error: 1, message: 'Event not found' });
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ error: 1, message: 'User not found' });
    // Check if user already joined event
    const userEvent = await EventUser.findOne({ where: { eventId, userId } });
    if (userEvent) return res.status(400).json({ error: 1, message: 'User already joined event',isJoined:true });
    await EventUser.create({ eventId, userId });
    res.json({ error: 0, message: 'User joined event successfully' ,isJoined:true});
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: 1, message: 'Failed to join event' });
  }
};

  //get users who joined an event
  exports.getUsersForEvent = async (req, res) => {
    try {
      const { eventId } = req.params;
      const users = await EventUser.findAll({ where: { eventId }, 
        include: [
          {
            model: User,
            attributes: ['id', 'name', 'email','profileImage']
          }

        ],
        
      
      });

      if (users.length === 0) return res.status(404).json({ error: 'No users found for this event' });

      res.json(users);
    } catch (error) {
      console.log(error);
      res.status(500).json({ error: 'Failed to retrieve users for event' });
    }
  };

//get events for a class
exports.getEventsForClass = async (req, res) => {
  const { page = 1, limit = 10 } = req.query; // Default to page 1, 10 items per page
  const offset = (page - 1) * limit;

  try {
    const { classId } = req.params;
    const events = await Event.findAndCountAll({
      where: { classId },
      include: EventMedia,
      limit: parseInt(limit), // Convert to number
      offset: parseInt(offset), // Convert to number
      order: [['date', 'DESC']], // Order events by date (latest first)
    });

    if (events.count === 0) return res.status(404).json({ error: 'No events found for this class' });

    res.json({
      total: events.count, // Total number of events
      currentPage: parseInt(page),
      totalPages: Math.ceil(events.count / limit),
      data: events.rows, // Paginated event data
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to retrieve events' });
  }
};

/**
 * @swagger
 * tags:
 *   name: Events
 *   description: Event management
 */

/**
 * @swagger
 * /events:
 *   get:
 *     summary: Retrieve a list of events
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of events
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Event'
 *       500:
 *         description: Failed to retrieve events
 */

/**
 * @swagger
 * /events/{id}:
 *   get:
 *     summary: Retrieve an event by ID
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: The event ID
 *     responses:
 *       200:
 *         description: An event
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Event'
 *       404:
 *         description: Event not found
 *       500:
 *         description: Failed to retrieve event
 */

//upload event media
/**
 * @swagger
 * /events/{id}/media:
 *   post:
 *     summary: Upload media for an event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: The event ID
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Media uploaded successfully
 *       404:
 *         description: Event not found
 *       500:
 *         description: Failed to upload media
 */

/**
 * @swagger
 * /events:
 *   post:
 *     summary: Create a new event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date
 *               description:
 *                 type: string
 *               classId:
 *                 type: integer
 *               location:
 *                type: string
 *               coordinates:
 *                 type: string
 *                 description: Coordinates in the format [latitude, longitude] or "latitude,longitude"
 *               files:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Event created successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Event'
 *       400:
 *         description: Invalid coordinates format
 *       404:
 *         description: Class not found
 *       500:
 *         description: Failed to create event
 */
/**
 * @swagger
 * /events/{id}:
 *   put:
 *     summary: Update an event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: The event ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *               date:
 *                 type: string
 *                 format: date
 *               description:
 *                 type: string
 *               classId:
 *                 type: integer
 *               coordinates:
 *                 type: string
 *                 description: Coordinates in the format [latitude, longitude] or "latitude,longitude"
 *               location:
 *                 type: string
 *               media:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     url:
 *                       type: string
 *                     type:
 *                       type: string
 *               users:
 *                 type: array
 *                 items:
 *                   type: integer
 *     responses:
 *       200:
 *         description: Event updated successfully
 *       400:
 *         description: Invalid coordinates format
 *       404:
 *         description: Event not found
 *       500:
 *         description: Failed to update event
 */

/**
 * @swagger
 * /events/{id}:
 *   delete:
 *     summary: Delete an event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: integer
 *         required: true
 *         description: The event ID
 *     responses:
 *       200:
 *         description: Event deleted successfully
 *       404:
 *         description: Event not found
 *       500:
 *         description: Failed to delete event
 */

/**
 * @swagger
 * components:
 *   schemas:
 *     Event:
 *       type: object
 *       required:
 *         - name
 *         - date
 *       properties:
 *         id:
 *           type: integer
 *           description: The auto-generated ID of the event
 *         name:
 *           type: string
 *           description: The name of the event
 *         date:
 *           type: string
 *           format: date
 *           description: The date of the event
 *         description:
 *           type: string
 *           description: The description of the event
 *         classId:
 *           type: integer
 *           description: The ID of the associated class
 *         EventMedia:
 *           type: array
 *           items:
 *             $ref: '#/components/schemas/EventMedia'
 *     EventMedia:
 *       type: object
 *       required:
 *         - fileName
 *         - filePath
 *       properties:
 *         id:
 *           type: integer
 *           description: The auto-generated ID of the event media
 *         fileName:
 *           type: string
 *           description: The name of the media file
 *         filePath:
 *           type: string
 *           description: The path to the media file
 *         eventId:
 *           type: integer
 *           description: The ID of the associated event
 */

/**
 * @swagger
 * /events/class/{classId}:
 *   get:
 *     summary: Retrieve a list of events for a class
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: classId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The class ID
 *     responses:
 *       200:
 *         description: A list of events
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Event'
 *       404:
 *         description: No events found for this class
 *       500:
 *         description: Failed to retrieve events
 */

/**
 * @swagger
 * /events/join/{eventId}/{userId}:
 *   post:
 *     summary: Join an event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The event ID
 *       - in: path
 *         name: userId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The user ID
 *     responses:
 *       200:
 *         description: User joined event successfully
 *       404:
 *         description: Event or User not found
 *       500:
 *         description: Failed to join event
 */

//get users who joined an event

/**
 * @swagger
 * /events/{eventId}/users:
 *   get:
 *     summary: Get users who joined an event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         schema:
 *           type: integer
 *         required: true
 *         description: The event ID
 *     responses:
 *       200:
 *         description: A list of users
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/User'
 *       404:
 *         description: No users found for this event
 *       500:
 *         description: Failed to retrieve users for event
 */