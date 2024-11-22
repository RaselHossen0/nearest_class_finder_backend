// controllers/mediaController.js
const { uploadFile } = require('./couldStorage');  // Corrected the import statement
const Media = require('../models/Media');
const Class = require('../models/Class');

// Controller function to upload media
exports.uploadMedia = async (req, res) => {
  try {
    const { classId } = req.params;  // Get classId from route parameter
    const { title, description, tags, type } = req.body;  // Get metadata from request body
    const file = req.file;  // Get uploaded file from request
    // console.log(file);
    console.log(req.body);
    console.log(req.params);

    // Check if the class exists
    const classDetail = await Class.findByPk(classId);
    if (!classDetail) {
      return res.status(404).json({ error: 'Class not found' });
    }

    // Use the cloud storage service to upload the file to S3
    // const fileUrl = await uploadFile(file.buffer, file.originalname, file.mimetype);
    const  fileUrl = `/uploads/${req.file.filename}`;

    // Create a new media record in the database
    const media = await Media.create({
      type,
      url: fileUrl,
      title,
      description,
      tags,
      upload_date: new Date(),
      classId
    });

    res.status(201).json({ message: 'Media uploaded successfully', media });
  } catch (error) {
    console.error(error);
    // console.log(req.body);
    //delete media if upload fails
    // await Media.destroy({ where: { url: fileUrl } });
    // //also delete from local storage
    // fs.unlinkSync(fileUrl);
    
    res.status(500).json({ error: 'Failed to upload media' });
  }
};


/**
 * @swagger
 * /media/upload/{classId}:
 *   post:
 *     summary: Upload media
 *     description: Upload a media file to a specific class.
 *     tags:
 *       - Media
 *     security:
 *      - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: classId
 *         required: true
 *         description: ID of the class to upload media to
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               mediaFile:
 *                 type: string
 *                 format: binary
 *                 description: The media file to upload
 *               title:
 *                 type: string
 *                 description: Title of the media
 *               description:
 *                 type: string
 *                 description: Description of the media
 *               tags:
 *                 type: string
 *                 description: Tags for the media
 *               type:
 *                 type: string
 *                 description: Type of the media
 *     responses:
 *       201:
 *         description: Media uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Media uploaded successfully
 *                 media:
 *                   $ref: '#/components/schemas/Media'
 *       404:
 *         description: Class not found
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Class not found
 *       500:
 *         description: Failed to upload media
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 error:
 *                   type: string
 *                   example: Failed to upload media
 */
