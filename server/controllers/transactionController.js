// server/controllers/transactionController.js
const Transaction = require('../models/Transaction');
const validator = require('../middleware/validator');
const { createNotification } = require('../utils/notificationHelper');

// @desc    Get all transactions
// @route   GET /api/transactions
// @access  Private
const getTransactions = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;
    
    // Build query
    const query = { user: req.user._id };
    
    // Filter by type if provided
    if (req.query.type && ['income', 'expense'].includes(req.query.type)) {
      query.type = req.query.type;
    }
    
    // Filter by category if provided
    if (req.query.category) {
      query.category = req.query.category;
    }
    
    // Date range filter
    if (req.query.startDate || req.query.endDate) {
      query.date = {};
      if (req.query.startDate) {
        query.date.$gte = new Date(req.query.startDate);
      }
      if (req.query.endDate) {
        query.date.$lte = new Date(req.query.endDate);
      }
    }
    
    const transactions = await Transaction.find(query)
      .sort({ date: -1 })
      .limit(limit)
      .skip(skip);
    
    const total = await Transaction.countDocuments(query);
    
    res.json({
      success: true,
      data: transactions,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Add transaction
// @route   POST /api/transactions
// @access  Private
const addTransaction = async (req, res) => {
  try {
    const { title, amount, type, category, date, reference } = req.body;
    
    // Validation
    if (!title || amount === undefined || !type || !category) {
      return res.status(400).json({ 
        success: false, 
        message: 'Please provide title, amount, type, and category' 
      });
    }
    
    // Validate amount
    if (!validator.isValidAmount(amount)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Amount must be a positive number and less than 100 million' 
      });
    }
    
    // Validate type
    if (!['income', 'expense'].includes(type)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Type must be either income or expense' 
      });
    }
    
    // Sanitize inputs
    const sanitizedTitle = validator.sanitizeString(title);
    if (sanitizedTitle.length < 1) {
      return res.status(400).json({ 
        success: false, 
        message: 'Title cannot be empty' 
      });
    }
    
    // Validate date
    const transactionDate = date ? new Date(date) : new Date();
    if (!validator.isValidDate(transactionDate)) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid date format' 
      });
    }
    
    const transaction = await Transaction.create({
      user: req.user._id,
      title: sanitizedTitle,
      amount: parseFloat(amount),
      type,
      category: validator.sanitizeString(category),
      date: transactionDate,
      reference: reference ? validator.sanitizeString(reference) : undefined
    });
    
    // Create notification for new transaction
    try {
      await createNotification(req.user._id, {
        type: 'system',
        title: `${type === 'income' ? 'Income' : 'Expense'} Added`,
        message: `${sanitizedTitle} of ₹${parseFloat(amount).toLocaleString('en-IN')} has been ${type === 'income' ? 'added' : 'recorded'}`,
        priority: 'low',
        actionUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/transactions`,
        metadata: {
          transactionId: transaction._id,
          type: type,
          amount: parseFloat(amount)
        }
      });
    } catch (notifError) {
      console.error('Failed to create notification:', notifError);
      // Don't fail transaction creation if notification fails
    }
    
    res.status(201).json({ success: true, data: transaction });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete transaction
// @route   DELETE /api/transactions/:id
// @access  Private
const deleteTransaction = async (req, res) => {
  try {
    const transaction = await Transaction.findById(req.params.id);
    
    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }
    
    // Check if user owns the transaction
    if (transaction.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ success: false, message: 'User not authorized' });
    }
    
    // Create notification for deleted transaction
    try {
      await createNotification(req.user._id, {
        type: 'system',
        title: 'Transaction Deleted',
        message: `${transaction.title} has been deleted`,
        priority: 'low',
        actionUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/transactions`,
        metadata: {
          transactionId: transaction._id
        }
      });
    } catch (notifError) {
      console.error('Failed to create notification:', notifError);
      // Don't fail transaction deletion if notification fails
    }
    
    await Transaction.findByIdAndDelete(req.params.id);
    
    res.json({ success: true, message: 'Transaction removed' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Update transaction
// @route   PUT /api/transactions/:id
// @access  Private
const updateTransaction = async (req, res) => {
  try {
    const { title, amount, type, category, date, reference } = req.body;
    
    const transaction = await Transaction.findById(req.params.id);
    
    if (!transaction) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }
    
    // Check if user owns the transaction
    if (transaction.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ success: false, message: 'User not authorized' });
    }
    
    transaction.title = title || transaction.title;
    transaction.amount = amount || transaction.amount;
    transaction.type = type || transaction.type;
    transaction.category = category || transaction.category;
    transaction.date = date || transaction.date;
    transaction.reference = reference || transaction.reference;
    
    const updatedTransaction = await transaction.save();
    
    // Create notification for updated transaction
    try {
      await createNotification(req.user._id, {
        type: 'system',
        title: 'Transaction Updated',
        message: `${updatedTransaction.title} has been updated`,
        priority: 'low',
        actionUrl: `${process.env.FRONTEND_URL || 'http://localhost:3000'}/dashboard/transactions`,
        metadata: {
          transactionId: updatedTransaction._id
        }
      });
    } catch (notifError) {
      console.error('Failed to create notification:', notifError);
      // Don't fail transaction update if notification fails
    }
    
    res.json({ success: true, data: updatedTransaction });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
};

// @desc    Get transaction stats
// @route   GET /api/transactions/stats
// @access  Private
const getTransactionStats = async (req, res) => {
  try {
    // Get total income
    const totalIncome = await Transaction.aggregate([
      { $match: { user: req.user._id, type: 'income' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    // Get total expense
    const totalExpense = await Transaction.aggregate([
      { $match: { user: req.user._id, type: 'expense' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    // Get monthly transactions
    const monthlyData = await Transaction.aggregate([
      { $match: { user: req.user._id } },
      {
        $group: {
          _id: { 
            month: { $month: '$date' },
            year: { $year: '$date' },
            type: '$type'
          },
          total: { $sum: '$amount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);
    
    // Get transactions by category
    const expensesByTitle = await Transaction.aggregate([
      { $match: { user: req.user._id, type: 'expense' } },
      { $group: { _id: '$title', total: { $sum: '$amount' } } },
      { $sort: { total: -1 } }
    ]);
    
    // Get expenses by category
    const expensesByCategory = await Transaction.aggregate([
      { $match: { user: req.user._id, type: 'expense' } },
      { $group: { _id: '$category', total: { $sum: '$amount' } } },
      { $sort: { total: -1 } }
    ]);
    
    // Get income by category
    const incomeByCategory = await Transaction.aggregate([
      { $match: { user: req.user._id, type: 'income' } },
      { $group: { _id: '$category', total: { $sum: '$amount' } } },
      { $sort: { total: -1 } }
    ]);
    
    res.json({
      success: true,
      data: {
        totalIncome: totalIncome[0]?.total || 0,
        totalExpense: totalExpense[0]?.total || 0,
        balance: (totalIncome[0]?.total || 0) - (totalExpense[0]?.total || 0),
        monthlyData,
        expensesByTitle,
        expensesByCategory,
        incomeByCategory
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get unified AI data (transactions + stats in one call)
// @route   GET /api/transactions/ai-data
// @access  Private
const getAIData = async (req, res) => {
  try {
    // Get transactions (limit to last 100 for AI analysis)
    const transactions = await Transaction.find({ user: req.user._id })
      .sort({ date: -1 })
      .limit(100)
      .select('title amount type category date')
      .lean();
    
    // Get stats using existing logic
    const totalIncome = await Transaction.aggregate([
      { $match: { user: req.user._id, type: 'income' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    const totalExpense = await Transaction.aggregate([
      { $match: { user: req.user._id, type: 'expense' } },
      { $group: { _id: null, total: { $sum: '$amount' } } }
    ]);
    
    const expensesByCategory = await Transaction.aggregate([
      { $match: { user: req.user._id, type: 'expense' } },
      { $group: { _id: '$category', total: { $sum: '$amount' } } },
      { $sort: { total: -1 } },
      { $limit: 10 }
    ]);
    
    const monthlyData = await Transaction.aggregate([
      { $match: { user: req.user._id } },
      {
        $group: {
          _id: { 
            month: { $month: '$date' },
            year: { $year: '$date' },
            type: '$type'
          },
          total: { $sum: '$amount' }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } }
    ]);
    
    res.json({
      success: true,
      data: {
        transactions: transactions.reverse(), // Reverse to get chronological order
        stats: {
          totalIncome: totalIncome[0]?.total || 0,
          totalExpense: totalExpense[0]?.total || 0,
          balance: (totalIncome[0]?.total || 0) - (totalExpense[0]?.total || 0),
          expensesByCategory: expensesByCategory.map(c => ({ category: c._id, amount: c.total })),
          monthlyData
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  getTransactions,
  addTransaction,
  deleteTransaction,
  updateTransaction,
  getTransactionStats,
  getAIData
};