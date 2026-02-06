// server/models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  date: {
    type: Date,
    default: Date.now
  },
  spendingLimit: {
    type: Number,
    default: 0
  },
  monthlyIncome: {
    type: Number,
    default: 0
  },
  flowState: {
    needsTotal: { type: Number, default: 0 },
    wantsTotal: { type: Number, default: 0 },
    surplus: { type: Number, default: 0 },
    savingsGoal: { type: Number, default: 0 },
    lastCalculated: { type: Date }
  }
});

// Hash password before saving
UserSchema.pre('save', async function (next) {
  if (!this.isModified('password')) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

// Match password
UserSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', UserSchema);