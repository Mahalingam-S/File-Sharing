const express = require('express');
const router = express.Router();
const { 
  submitHelpRequest, 
  getAllHelpRequests, 
  updateRequestStatus, 
  deleteHelpRequest 
} = require('../controllers/helpController');
const { protect, authorize } = require('../middleware/authMiddleware');

// User route to submit request
router.post('/request', protect, submitHelpRequest);

// Admin routes
router.get('/admin/requests', protect, authorize('admin'), getAllHelpRequests);
router.patch('/admin/requests/:id', protect, authorize('admin'), updateRequestStatus);
router.delete('/admin/requests/:id', protect, authorize('admin'), deleteHelpRequest);

module.exports = router;
