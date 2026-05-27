const express = require('express');
const router = express.Router();
const { getFolderContents, createFolder, deleteFolder, generateDropFolderLink, getDropFolderInfo, revokeDropFolderLink, toggleFolderDepartmentPublish } = require('../controllers/folderController');
const { protect } = require('../middleware/authMiddleware');

router.route('/')
  .post(protect, createFolder)
  .get(protect, getFolderContents);

router.route('/:id')
  .delete(protect, deleteFolder);

router.put('/:id/publish', protect, toggleFolderDepartmentPublish);
router.post('/share/:id', protect, generateDropFolderLink);
router.put('/:id/revoke', protect, revokeDropFolderLink);
router.get('/drop/:token', getDropFolderInfo);

router.route('/:parentId')
  .get(protect, getFolderContents);

module.exports = router;
