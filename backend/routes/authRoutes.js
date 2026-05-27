const express = require('express');
const router = express.Router();
const { registerUser, loginUser, googleLogin, getMe, deleteMe, getDepartmentStudents } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/google', googleLogin);
router.get('/me', protect, getMe);
router.delete('/me', protect, deleteMe);
router.get('/students', protect, getDepartmentStudents);

module.exports = router;
