// server/routes/notifications.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { standardRateLimiter } = require('../middleware/rateLimiter');
const {
  getNotifications,
  markAsRead,
  markAllAsRead,
  deleteNotification
} = require('../controllers/notificationController');

router.route('/')
  .get(protect, standardRateLimiter, getNotifications);

router.put('/read-all', protect, standardRateLimiter, markAllAsRead);
router.put('/:id/read', protect, standardRateLimiter, markAsRead);
router.delete('/:id', protect, standardRateLimiter, deleteNotification);

module.exports = router;


