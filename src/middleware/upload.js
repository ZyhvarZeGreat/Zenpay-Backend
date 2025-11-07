const multer = require('multer');
const logger = require('../utils/logger');

// Configure multer for memory storage (for CSV processing)
const storage = multer.memoryStorage();

// File filter - only allow CSV files
const fileFilter = (req, file, cb) => {
  if (file.mimetype === 'text/csv' || file.originalname.endsWith('.csv')) {
    cb(null, true);
  } else {
    cb(new Error('Only CSV files are allowed'), false);
  }
};

// Configure multer
const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB max file size
  },
});

// Middleware for single CSV file upload
const uploadCSV = (req, res, next) => {
  upload.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          error: 'File size exceeds 10MB limit',
        });
      }
      return res.status(400).json({
        success: false,
        error: err.message,
      });
    } else if (err) {
      return res.status(400).json({
        success: false,
        error: err.message,
      });
    }
    
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded. Please upload a CSV file.',
      });
    }
    
    logger.info(`CSV file uploaded: ${req.file.originalname} (${req.file.size} bytes)`);
    next();
  });
};

module.exports = {
  upload,
  uploadCSV,
};

