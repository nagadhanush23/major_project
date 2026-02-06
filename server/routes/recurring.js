// server/routes/recurring.js
const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const { standardRateLimiter } = require('../middleware/rateLimiter');
const {
  getRecurringTransactions,
  createRecurringTransaction,
  processRecurringTransactions,
  checkReminders,
  updateRecurringTransaction,
  deleteRecurringTransaction
} = require('../controllers/recurringController');

router.route('/')
  .get(protect, standardRateLimiter, getRecurringTransactions)
  .post(protect, standardRateLimiter, createRecurringTransaction);

router.post('/process', protect, processRecurringTransactions);
router.post('/reminders', protect, checkReminders);

router.route('/:id')
  .put(protect, standardRateLimiter, updateRecurringTransaction)
  .delete(protect, standardRateLimiter, deleteRecurringTransaction);

module.exports = router;


