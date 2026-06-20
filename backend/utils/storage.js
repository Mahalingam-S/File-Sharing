const { S3Client, PutObjectCommand, GetObjectCommand, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const fs = require('fs');
const path = require('path');
const os = require('os');

const getLocalStorageDir = () => {
  const isServerless = process.env.VERCEL || process.env.AWS_LAMBDA_FUNCTION_NAME || process.env.LAMBDA_TASK_ROOT || __dirname.includes('/var/task') || __dirname.startsWith('/var/task');
  if (isServerless) {
    return path.join(os.tmpdir(), 'storage');
  }
  return path.join(__dirname, '../storage');
};

const s3Configured = !!(
  process.env.SUPABASE_S3_ENDPOINT &&
  process.env.SUPABASE_S3_ACCESS_KEY &&
  process.env.SUPABASE_S3_SECRET_KEY &&
  process.env.SUPABASE_BUCKET
);

let s3 = null;
if (s3Configured) {
  try {
    s3 = new S3Client({
      endpoint: process.env.SUPABASE_S3_ENDPOINT,
      region: process.env.SUPABASE_S3_REGION || 'ap-southeast-1',
      credentials: {
        accessKeyId: process.env.SUPABASE_S3_ACCESS_KEY,
        secretAccessKey: process.env.SUPABASE_S3_SECRET_KEY,
      },
      forcePathStyle: true,
    });
    console.log('☁️ Supabase Cloud Storage Client initialized successfully.');
  } catch (error) {
    console.error('❌ Failed to initialize Supabase S3 client:', error);
  }
} else {
  console.log('📁 Local storage mode: Supabase S3 environment variables not detected. Falling back to local disk storage.');
}

/**
 * Uploads a file to cloud storage (or local storage if not configured)
 * @param {Buffer} fileBuffer 
 * @param {string} storageName 
 * @param {string} mimeType 
 */
const uploadToStorage = async (fileBuffer, storageName, mimeType) => {
  if (s3Configured && s3) {
    const command = new PutObjectCommand({
      Bucket: process.env.SUPABASE_BUCKET,
      Key: storageName,
      Body: fileBuffer,
      ContentType: mimeType,
    });
    await s3.send(command);
  } else {
    // Local fallback
    const targetDir = getLocalStorageDir();
    if (!fs.existsSync(targetDir)) {
      fs.mkdirSync(targetDir, { recursive: true });
    }
    const targetPath = path.join(targetDir, storageName);
    fs.writeFileSync(targetPath, fileBuffer);
  }
};

/**
 * Downloads/Streams a file from cloud storage (or local storage if not configured)
 * @param {string} storageName 
 * @param {object} res - Express Response object
 * @param {string} originalName 
 */
const downloadFromStorage = async (storageName, res, originalName) => {
  if (s3Configured && s3) {
    const command = new GetObjectCommand({
      Bucket: process.env.SUPABASE_BUCKET,
      Key: storageName,
    });

    const response = await s3.send(command);
    res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(originalName)}"`);
    res.setHeader('Content-Type', response.ContentType || 'application/octet-stream');
    
    // Pipe the S3 readable stream to Express response
    response.Body.pipe(res);
  } else {
    // Local fallback
    const targetDir = getLocalStorageDir();
    const filePath = path.join(targetDir, storageName);
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ message: 'Physical file not found on disk' });
    }
    res.download(filePath, originalName);
  }
};

/**
 * Deletes a file from cloud storage (or local storage if not configured)
 * @param {string} storageName 
 */
const deleteFromStorage = async (storageName) => {
  if (s3Configured && s3) {
    try {
      const command = new DeleteObjectCommand({
        Bucket: process.env.SUPABASE_BUCKET,
        Key: storageName,
      });
      await s3.send(command);
    } catch (error) {
      console.error(`Failed to delete file "${storageName}" from Cloud Storage:`, error.message);
    }
  } else {
    // Local fallback
    const targetDir = getLocalStorageDir();
    const filePath = path.join(targetDir, storageName);
    if (fs.existsSync(filePath)) {
      try {
        fs.unlinkSync(filePath);
      } catch (err) {
        console.error(`Failed to delete physical file locally: ${filePath}`, err);
      }
    }
  }
};

module.exports = {
  s3Configured,
  uploadToStorage,
  downloadFromStorage,
  deleteFromStorage,
};
