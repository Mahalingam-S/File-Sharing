const HelpRequest = require('../models/HelpRequest');
const User = require('../models/User');

// @desc    Submit a help request
// @route   POST /api/help/request
// @access  Private
const submitHelpRequest = async (req, res) => {
  try {
    console.log('Help Request Body:', req.body);
    const { subject, message, type } = req.body;

    if (!subject || !message) {
      return res.status(400).json({ message: 'Subject and message are required.' });
    }

    const request = await HelpRequest.create({
      userId: req.user._id,
      subject,
      message,
      type
    });

    res.status(201).json({ message: 'Help request submitted successfully!', request });
  } catch (error) {
    console.error('Help Request Error:', error);
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get all help requests (Admin only)
// @route   GET /api/help/admin/requests
// @access  Private/Admin
const getAllHelpRequests = async (req, res) => {
  try {
    const requests = await HelpRequest.find()
      .populate('userId', 'name email role department')
      .sort({ createdAt: -1 });
    res.status(200).json(requests);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update help request status (Admin only)
// @route   PATCH /api/help/admin/requests/:id
// @access  Private/Admin
const updateRequestStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const request = await HelpRequest.findByIdAndUpdate(
      req.params.id,
      { status },
      { new: true }
    );

    if (!request) return res.status(404).json({ message: 'Request not found' });

    res.status(200).json({ message: 'Status updated successfully', request });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete help request (Admin only)
// @route   DELETE /api/help/admin/requests/:id
// @access  Private/Admin
const deleteHelpRequest = async (req, res) => {
  try {
    const request = await HelpRequest.findByIdAndDelete(req.params.id);
    if (!request) return res.status(404).json({ message: 'Request not found' });
    res.status(200).json({ message: 'Request deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  submitHelpRequest,
  getAllHelpRequests,
  updateRequestStatus,
  deleteHelpRequest
};
