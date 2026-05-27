const express = require('express');
const router = express.Router();
const { uploadFile, downloadFile, generateFileShareLink, downloadSharedFile, getSharedFileInfo, deleteFile, getDepartmentFiles, toggleDepartmentPublish, getRecentFiles, getSharedByMeFiles, revokeFileShareLink, notifyUsers } = require('../controllers/fileController');
const { protect } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');

router.post('/', protect, upload.single('file'), uploadFile);
router.get('/recent', protect, getRecentFiles);
router.get('/shared-by-me', protect, getSharedByMeFiles);
router.get('/department', protect, getDepartmentFiles);
router.get('/download/:id', protect, downloadFile);
router.put('/:id/publish', protect, toggleDepartmentPublish);
router.put('/:id/revoke', protect, revokeFileShareLink);
router.delete('/:id', protect, deleteFile);
router.post('/:id/notify', protect, notifyUsers);
router.post('/share/:id', protect, generateFileShareLink);
router.get('/shared/info/:token', getSharedFileInfo);
router.get('/shared/:token', downloadSharedFile);

module.exports = router;
