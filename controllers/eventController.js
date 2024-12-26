const { Event, EventMedia,EventUser } = require('../models/Event');
const fs = require('fs');
const path = require('path');
const User = require('../models/User');
const Class = require('../models/Class');
const e = require('express');
const { error } = require('console');
exports.getEvents = async (req, res) => {
  try {
    const events = await Event.findAll({ include: EventMedia });
    res.json(events);
  } catch (error) {
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
    const { classId, ...eventData } = req.body;
    //find the class
    const classFound = await Class.findByPk(classId);
    if (!classFound) return res.status(404).json({ error: 'Class not found' });

     newEvent = await Event.create({ ...eventData, classId });

    if (req.files && req.files.length > 0) {
      // Update the event media instances with the new URLs and types
    const updatedEventMediaInstances = req.files.map((file, index) => ({
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
    const [updated] = await Event.update(req.body, { where: { id } });

    if (!updated) return res.status(404).json({ error: 'Event not found' });

    res.json({ message: 'Event updated successfully' });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update event' });
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
    const { eventId ,userId} = req.params;
    const event = await Event.findByPk(eventId);
    if (!event) return res.status(404).json({ error: 'Event not found' });
    const user = await User.findByPk(userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    
    await EventUser.create({ eventId: eventId, userId });
    res.json({ message: 'User joined event successfully' });
    } catch (error) {
    res.status(500).json({ error: 'Failed to join event' });
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
  try {
    const { classId } = req.params;
    const events = await Event.findAll({ where: { classId }, include: EventMedia });

    if (events.length === 0) return res.status(404).json({ error: 'No events found for this class' });

    res.json(events);
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
 *                 type: string       
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
 *             $ref: '#/components/schemas/Event'
 *     responses:
 *       200:
 *         description: Event updated successfully
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