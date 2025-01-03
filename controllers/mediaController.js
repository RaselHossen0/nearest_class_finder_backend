const { uploadFile, deleteFile } = require('./couldStorage');  // Corrected the import statement
const Media = require('../models/Media');
const Class = require('../models/Class');
const fs = require('fs').promises;

// Function to handle file upload to S3 for all types of files
async function handleFileUpload(file) {
  const filePath = file.path;
  const fileBuffer = await fs.readFile(filePath); // Read the file as a buffer
  const fileUrl = await uploadFile(fileBuffer, file.originalname, file.mimetype);
  
  // Optionally delete the file from local storage after processing
  await fs.unlink(filePath);
  
  return fileUrl;
}

// Modify the uploadMedia function to handle all file types and upload them to S3
exports.uploadMedia = async (req, res) => {
  try {
    const { classId } = req.params;
    const { title, description, tags, type, isCoverImage } = req.body;
    console.log(req.body);
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: 'File is required' });
    }

    const classDetail = await Class.findByPk(classId);
    if (!classDetail) {
      return res.status(404).json({ error: 'Class not found' });
    }

    // Upload file to S3 for all file types (image, video, documents, etc.)
    const fileUrl = await handleFileUpload(file);

    // Save the media information in the database
    const media = await Media.create({
      type,
      url: fileUrl,
      title,
      description,
      tags,
      upload_date: new Date(),
      isCoverImage,
      classId,
    });

    res.status(201).json({ message: 'Media uploaded successfully', media });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to upload media' });
  }
};

// Function to delete media
exports.deleteMedia = async (req, res) => {
  try {
    const { id } = req.params;

    const media = await Media.findByPk(id);
    if (!media) {
      return res.status(404).json({ error: 'Media not found' });
    }

    // Delete the media file from the cloud storage (S3)
    await deleteFile(media.url);

    // Remove media record from database
    await media.destroy();
    res.json({ message: 'Media deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Failed to delete media' });
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
 *               isCoverImage:
 *                 type: boolean
 *                 description: is media a cover image
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