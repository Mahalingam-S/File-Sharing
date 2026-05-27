const express = require('express');
const router = express.Router();
const { getSystemLogs, getSystemStats, getAllUsers, getUserFiles, clearLogs, deleteLog, deleteUserFile, verifyFile, deleteUser, approveUser } = require('../controllers/adminController');
const { protect, authorize } = require('../middleware/authMiddleware');

// Apply protect middleware to all routes
router.use(protect);
// Apply Admin-only authorization to all routes
router.use(authorize('admin'));

router.get('/logs', getSystemLogs);
router.delete('/logs', clearLogs);
router.delete('/logs/:id', deleteLog);
router.get('/stats', getSystemStats);
router.get('/users', getAllUsers);
router.get('/users/:id/files', getUserFiles);
router.delete('/users/:id', deleteUser);
router.delete('/files/:id', deleteUserFile);
router.patch('/users/:id/approve', approveUser);
router.patch('/files/:id/verify', verifyFile);

module.exports = router;
