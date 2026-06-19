const multer = require('multer');
const path = require('path');
const crypto = require('crypto');

// Set up storage securely in memory for serverless cloud/local usage
const storage = multer.memoryStorage();

// Define file type limits for basic security
const checkFileType = (file, cb) => {
  // Disallow scripts like .exe, .sh, .bat
  const disallowedMimeTypes = ['application/x-msdownload', 'application/x-sh', 'application/x-bat'];
  if (disallowedMimeTypes.includes(file.mimetype)) {
    return cb(new Error('Executable scripts are strictly forbidden.'), false);
  }
  return cb(null, true);
};

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // 50MB max file size
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  }
});

module.exports = upload;
