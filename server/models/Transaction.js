// server/models/Transaction.js
const mongoose = require('mongoose');

// Predefined categories with colors
const CATEGORIES = {
  income: ['Salary', 'Freelance', 'Investment', 'Business', 'Gift', 'Other'],
  expense: ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Healthcare', 'Education', 'Travel', 'Other']
};

const CATEGORY_COLORS = {
  // Income colors
  'Salary': '#10b981',
  'Freelance': '#3b82f6',
  'Investment': '#8b5cf6',
  'Business': '#f59e0b',
  'Gift': '#ec4899',
  // Expense colors
  'Food': '#ef4444',
  'Transport': '#f97316',
  'Shopping': '#06b6d4',
  'Bills': '#6366f1',
  'Entertainment': '#a855f7',
  'Healthcare': '#14b8a6',
  'Education': '#0ea5e9',
  'Travel': '#eab308',
  'Other': '#64748b'
};

const TransactionSchema = new mongoose.Schema({
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
    required: true
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
  necessity: {
    type: String,
    enum: ['Need', 'Want', 'Savings', 'Investment'],
    default: 'Want'
  },
  date: {
    type: Date,
    default: Date.now,
    required: true
  },
  reference: {
    type: String,
    trim: true
  },
  vendor: {
    type: String,
    trim: true
  },
  payment_method: {
    type: String,
    enum: ['credit_card', 'debit_card', 'cash', 'bank_transfer', 'upi', 'other'],
    default: 'other'
  },
  receipt_url: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Transaction', TransactionSchema);
module.exports.CATEGORIES = CATEGORIES;
module.exports.CATEGORY_COLORS = CATEGORY_COLORS;