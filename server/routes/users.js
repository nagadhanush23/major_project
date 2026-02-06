// server/routes/users.js
const express = require('express');
const router = express.Router();
const { 
  registerUser, 
  loginUser, 
  getUserProfile, 
  updateUserProfile, 
  changePassword 
} = require('../controllers/userController');
const { protect } = require('../middleware/auth');
const { authRateLimiter } = require('../middleware/rateLimiter');

// Apply rate limiting to auth routes
router.post('/', authRateLimiter, registerUser);
router.post('/login', authRateLimiter, loginUser);
router.get('/profile', protect, getUserProfile);
router.put('/profile', protect, updateUserProfile);
router.put('/password', protect, changePassword);

module.exports = router;