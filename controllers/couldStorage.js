// services/cloudStorage.js
const AWS = require('aws-sdk');
const fs = require('fs');


// Configure AWS with your access and secret keys
const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,     // Your AWS Access Key
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,  // Your AWS Secret Key
  region: process.env.AWS_REGION   // Your AWS Region
});

// Bucket name from your AWS S3 configuration
const BUCKET_NAME = process.env.AWS_BUCKET_NAME;

/**
 * Uploads a file to S3 and returns the file's URL
 * @param {Buffer} fileBuffer - The file data in buffer form
 * @param {string} fileName - The name of the file (including extension)
 * @param {string} fileType - The MIME type of the file (e.g., 'image/jpeg')
 * @returns {string} - The public URL of the uploaded file
 */
const uploadFile = async (fileBuffer, fileName, fileType) => {
  try { 

   //store locally for testing
    
   

    const params = {
      Bucket: BUCKET_NAME,
      Key: `${Date.now()}-${fileName}`,  // Using timestamp to ensure unique filenames
      Body: fileBuffer,
      ContentType: fileType,
      ACL: 'public-read', // Make the file public so it can be accessed via URL
    };

    const s3Response = await s3.upload(params).promise();  // Upload to S3
    return s3Response.Location;  // Return the public URL of the uploaded file
  } catch (error) {
    console.error('Error uploading to S3:', error);
    throw new Error('Failed to upload file to cloud storage');
  }
};

module.exports = { uploadFile };