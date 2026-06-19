require('dotenv').config();
const { uploadToStorage, downloadFromStorage, deleteFromStorage, s3Configured } = require('./utils/storage');
const fs = require('fs');
const path = require('path');

const runTest = async () => {
  console.log(`Starting storage tests. S3 Configured: ${s3Configured}`);
  
  const testFileName = `test-file-${Date.now()}.txt`;
  const fileContent = 'Hello, this is a test upload for Supabase Cloud Storage fallback!';
  const fileBuffer = Buffer.from(fileContent);

  try {
    // 1. Upload Test
    console.log(`1. Uploading test file: ${testFileName}...`);
    await uploadToStorage(fileBuffer, testFileName, 'text/plain');
    console.log('Upload successful.');

    // 2. Download/Retrieve Test
    console.log(`2. Retrieving/Downloading test file: ${testFileName}...`);
    // Mock Response object to simulate Express response object behavior
    const mockRes = {
      headers: {},
      statusCode: 200,
      setHeader(name, value) {
        this.headers[name] = value;
      },
      status(code) {
        this.statusCode = code;
        return this;
      },
      json(obj) {
        console.log('Mock Response JSON:', obj);
        return this;
      },
      download(filePath, originalName) {
        console.log(`Mock Response Local Download triggered: filePath=${filePath}, originalName=${originalName}`);
        const content = fs.readFileSync(filePath, 'utf8');
        console.log(`Downloaded file content: "${content}"`);
      }
    };

    // If S3 is configured, downloadFromStorage will pipe response.Body.
    // In our mock response, we can attach a write/end pipeline or just simulate it.
    if (s3Configured) {
      // In S3 mode, mockRes must support standard Writable stream properties.
      const stream = require('stream');
      const mockWritable = new stream.Writable({
        write(chunk, encoding, callback) {
          if (!this.data) this.data = '';
          this.data += chunk.toString();
          callback();
        }
      });
      mockWritable.headers = {};
      mockWritable.setHeader = (name, value) => {
        mockWritable.headers[name] = value;
      };
      
      await downloadFromStorage(testFileName, mockWritable, 'downloaded-name.txt');
      
      // Wait briefly for stream to pipe fully
      await new Promise(resolve => setTimeout(resolve, 1000));
      console.log(`Downloaded file content from Cloud Storage: "${mockWritable.data}"`);
    } else {
      await downloadFromStorage(testFileName, mockRes, 'downloaded-name.txt');
    }

    // 3. Delete Test
    console.log(`3. Deleting test file: ${testFileName}...`);
    await deleteFromStorage(testFileName);
    console.log('Delete successful.');

    console.log('✨ All storage tests completed successfully!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Storage test failed:', error);
    process.exit(1);
  }
};

runTest();
