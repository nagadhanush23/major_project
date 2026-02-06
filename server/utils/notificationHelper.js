// server/utils/notificationHelper.js
const Notification = require('../models/Notification');

// Create notification (email service removed for now)
const createNotification = async (userId, notificationData) => {
  try {
    const notification = await Notification.create({
      user: userId,
      ...notificationData
    });

    return notification;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

module.exports = {
  createNotification
};

