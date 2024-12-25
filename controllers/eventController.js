const { Event, EventMedia } = require('../models/Event');
const fs = require('fs');
const path = require('path');

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
