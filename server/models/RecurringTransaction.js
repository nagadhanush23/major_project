// server/models/RecurringTransaction.js
const mongoose = require('mongoose');

const RecurringTransactionSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  type: {
    type: String,
    required: true,
    enum: ['income', 'expense']
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  frequency: {
    type: String,
    required: true,
    enum: ['daily', 'weekly', 'biweekly', 'monthly', 'quarterly', 'yearly'],
    default: 'monthly'
  },
  startDate: {
    type: Date,
    required: true,
    default: Date.now
  },
  endDate: {
    type: Date,
    default: null // null means recurring indefinitely
  },
  nextDueDate: {
    type: Date,
    required: true
  },
  isActive: {
    type: Boolean,
    default: true
  },
  reminderDays: {
    type: Number,
    default: 3 // Remind 3 days before due date
  },
  lastProcessed: {
    type: Date,
    default: null
  },
  reference: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Index for efficient queries
RecurringTransactionSchema.index({ user: 1, nextDueDate: 1, isActive: 1 });

module.exports = mongoose.model('RecurringTransaction', RecurringTransactionSchema);


