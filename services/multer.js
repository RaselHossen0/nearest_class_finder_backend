const multer = require('multer');
const path = require('path');

// Configure multer to save images locally in the "public/uploads" directory
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, './uploads'); // Directory where images will be saved
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`); // Add timestamp to filename for uniqueness
  },
});

// Only allow image files (jpeg, png)


const upload = multer({ storage });

module.exports = upload;