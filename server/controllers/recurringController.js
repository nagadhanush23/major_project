// server/controllers/recurringController.js
const RecurringTransaction = require('../models/RecurringTransaction');
const Transaction = require('../models/Transaction');
const Notification = require('../models/Notification');

// Helper to calculate next due date
const calculateNextDueDate = (currentDate, frequency) => {
  const next = new Date(currentDate);
  switch (frequency) {
    case 'daily':
      next.setDate(next.getDate() + 1);
      break;
    case 'weekly':
      next.setDate(next.getDate() + 7);
      break;
    case 'biweekly':
      next.setDate(next.getDate() + 14);
      break;
    case 'monthly':
      next.setMonth(next.getMonth() + 1);
      break;
    case 'quarterly':
      next.setMonth(next.getMonth() + 3);
      break;
    case 'yearly':
      next.setFullYear(next.getFullYear() + 1);
      break;
  }
  return next;
};

// @desc    Get all recurring transactions
// @route   GET /api/recurring
// @access  Private
const getRecurringTransactions = async (req, res) => {
  try {
    const recurring = await RecurringTransaction.find({ 
      user: req.user._id,
      isActive: true 
    }).sort({ nextDueDate: 1 });
    
    res.json({ success: true, data: recurring });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Create recurring transaction
// @route   POST /api/recurring
// @access  Private
const createRecurringTransaction = async (req, res) => {
  try {
    const { title, amount, type, category, frequency, startDate, endDate, reminderDays, reference } = req.body;
    
    if (!title || !amount || !type || !category || !frequency) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide title, amount, type, category, and frequency' 
      });
    }
    
    const start = startDate ? new Date(startDate) : new Date();
    const nextDue = calculateNextDueDate(start, frequency);
    
    const recurring = await RecurringTransaction.create({
      user: req.user._id,
      title,
      amount: parseFloat(amount),
      type,
      category,
      frequency,
      startDate: start,
      endDate: endDate ? new Date(endDate) : null,
      nextDueDate: nextDue,
      reminderDays: reminderDays || 3,
      reference: reference || ''
    });
    
    res.status(201).json({ success: true, data: recurring });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Process recurring transactions (should be called by cron job)
// @route   POST /api/recurring/process
// @access  Private (or system)
const processRecurringTransactions = async (req, res) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Find all due recurring transactions
    const dueRecurring = await RecurringTransaction.find({
      isActive: true,
      nextDueDate: { $lte: today },
      $or: [
        { endDate: null },
        { endDate: { $gte: today } }
      ]
    });
    
    const processed = [];
    
    for (const recurring of dueRecurring) {
      // Create actual transaction
      const transaction = await Transaction.create({
        user: recurring.user,
        title: recurring.title,
        amount: recurring.amount,
        type: recurring.type,
        category: recurring.category,
        date: recurring.nextDueDate,
        reference: recurring.reference || `Recurring: ${recurring.frequency}`
      });
      
      // Update recurring transaction
      const nextDue = calculateNextDueDate(recurring.nextDueDate, recurring.frequency);
      recurring.nextDueDate = nextDue;
      recurring.lastProcessed = new Date();
      await recurring.save();
      
      processed.push(transaction);
    }
    
    res.json({ 
      success: true, 
      message: `Processed ${processed.length} recurring transactions`,
      processed 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Check and create reminders
// @route   POST /api/recurring/reminders
// @access  Private
const checkReminders = async (req, res) => {
  try {
    const today = new Date();
    const reminders = [];
    
    const upcomingRecurring = await RecurringTransaction.find({
      user: req.user._id,
      isActive: true
    });
    
    for (const recurring of upcomingRecurring) {
      const daysUntilDue = Math.ceil(
        (recurring.nextDueDate - today) / (1000 * 60 * 60 * 24)
      );
      
      if (daysUntilDue <= recurring.reminderDays && daysUntilDue >= 0) {
        // Check if reminder already exists
        const existingReminder = await Notification.findOne({
          user: req.user._id,
          type: 'bill_reminder',
          'metadata.recurringId': recurring._id.toString(),
          createdAt: { $gte: new Date(today.setHours(0, 0, 0, 0)) }
        });
        
        if (!existingReminder) {
          const { createNotification } = require('../utils/notificationHelper');
          const reminder = await createNotification(
            req.user._id,
            {
              type: 'bill_reminder',
              title: `Reminder: ${recurring.title} due soon`,
              message: `Your ${recurring.title} of ₹${recurring.amount.toLocaleString('en-IN')} is due in ${daysUntilDue} day(s)`,
              priority: daysUntilDue === 0 ? 'urgent' : 'high',
              actionUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/recurring`,
              metadata: {
                recurringId: recurring._id,
                amount: recurring.amount,
                dueDate: recurring.nextDueDate
              }
            }
          );
          reminders.push(reminder);
        }
      }
    }
    
    res.json({ 
      success: true, 
      message: `Created ${reminders.length} reminders`,
      reminders 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update recurring transaction
// @route   PUT /api/recurring/:id
// @access  Private
const updateRecurringTransaction = async (req, res) => {
  try {
    const recurring = await RecurringTransaction.findById(req.params.id);
    
    if (!recurring || recurring.user.toString() !== req.user._id.toString()) {
      return res.status(404).json({ success: false, message: 'Recurring transaction not found' });
    }
    
    const { title, amount, frequency, isActive, reminderDays } = req.body;
    
    if (title) recurring.title = title;
    if (amount !== undefined) recurring.amount = parseFloat(amount);
    if (frequency) {
      recurring.frequency = frequency;
      recurring.nextDueDate = calculateNextDueDate(recurring.startDate, frequency);
    }
    if (isActive !== undefined) recurring.isActive = isActive;
    if (reminderDays !== undefined) recurring.reminderDays = reminderDays;
    
    recurring.updatedAt = new Date();
    await recurring.save();
    
    res.json({ success: true, data: recurring });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete recurring transaction
// @route   DELETE /api/recurring/:id
// @access  Private
const deleteRecurringTransaction = async (req, res) => {
  try {
    const recurring = await RecurringTransaction.findById(req.params.id);
    
    if (!recurring || recurring.user.toString() !== req.user._id.toString()) {
      return res.status(404).json({ success: false, message: 'Recurring transaction not found' });
    }
    
    await RecurringTransaction.findByIdAndDelete(req.params.id);
    
    res.json({ success: true, message: 'Recurring transaction deleted' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getRecurringTransactions,
  createRecurringTransaction,
  processRecurringTransactions,
  checkReminders,
  updateRecurringTransaction,
  deleteRecurringTransaction
};


