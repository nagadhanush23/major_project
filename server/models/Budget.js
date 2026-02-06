// server/models/Budget.js
const mongoose = require('mongoose');

const BudgetSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  period: {
    type: String,
    required: true,
    enum: ['weekly', 'monthly', 'yearly'],
    default: 'monthly'
  },
  month: {
    type: Number,
    min: 1,
    max: 12
  },
  year: {
    type: Number,
    required: true
  },
  week: {
    type: Number,
    min: 1,
    max: 53
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
BudgetSchema.index({ user: 1, category: 1, year: 1, month: 1 });

module.exports = mongoose.model('Budget', BudgetSchema);

