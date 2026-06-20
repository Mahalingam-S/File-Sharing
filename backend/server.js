require('dotenv').config();
const express = require('express');
const cors = require('cors');
const mongoSanitize = require('express-mongo-sanitize');
const connectDB = require('./config/db');

// Connect to Database
connectDB();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/folders', require('./routes/folderRoutes'));
app.use('/api/files', require('./routes/fileRoutes'));
app.use('/api/admin', require('./routes/adminRoutes'));
app.use('/api/help', require('./routes/helpRoutes'));
app.use('/api/departments', require('./routes/departmentRoutes'));

// Base Route
app.get('/', (req, res) => {
  res.send('Campus Drive API is running...');
});

// Diagnostic Route
app.get('/api/diagnostic', (req, res) => {
  if (req.query.secret !== 'debug123') {
    return res.status(403).send('Forbidden');
  }
  const os = require('os');
  const path = require('path');
  const { s3Configured } = require('./utils/storage');
  
  const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.LAMBDA_TASK_ROOT || __dirname.includes('/var/task') || __dirname.startsWith('/var/task');
  const targetDir = isServerless 
    ? path.join(os.tmpdir(), 'storage') 
    : path.join(__dirname, '../storage');

  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: {
      VERCEL: process.env.VERCEL || null,
      AWS_LAMBDA_FUNCTION_NAME: process.env.AWS_LAMBDA_FUNCTION_NAME || null,
      LAMBDA_TASK_ROOT: process.env.LAMBDA_TASK_ROOT || null,
      NODE_ENV: process.env.NODE_ENV || null,
      isServerless,
      __dirname,
      targetDir,
      tmpdir: os.tmpdir(),
    },
    s3: {
      s3Configured,
      SUPABASE_BUCKET: process.env.SUPABASE_BUCKET || null,
      SUPABASE_S3_ENDPOINT: process.env.SUPABASE_S3_ENDPOINT ? 'PRESENT' : 'MISSING',
      SUPABASE_S3_ACCESS_KEY: process.env.SUPABASE_S3_ACCESS_KEY ? 'PRESENT' : 'MISSING',
      SUPABASE_S3_SECRET_KEY: process.env.SUPABASE_S3_SECRET_KEY ? 'PRESENT' : 'MISSING',
    }
  });
});

const PORT = process.env.PORT || 5000;

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server running in development mode on port ${PORT}`);
  });
}

module.exports = app;
