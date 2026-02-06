// server/controllers/budgetController.js
const Budget = require('../models/Budget');
const Transaction = require('../models/Transaction');

// @desc    Get all budgets
// @route   GET /api/budgets
// @access  Private
const getBudgets = async (req, res) => {
  try {
    const { period, month, year } = req.query;
    const query = { user: req.user._id };
    
    if (year) query.year = parseInt(year);
    if (period) query.period = period;
    if (month) query.month = parseInt(month);
    
    const budgets = await Budget.find(query).sort({ category: 1 });
    
    // Calculate actual spending for each budget
    const budgetsWithSpending = await Promise.all(
      budgets.map(async (budget) => {
        let dateQuery = { user: req.user._id, category: budget.category, type: 'expense' };
        
        if (budget.period === 'monthly') {
          dateQuery.date = {
            $gte: new Date(budget.year, budget.month - 1, 1),
            $lt: new Date(budget.year, budget.month, 1)
          };
        } else if (budget.period === 'weekly') {
          // Calculate week start date
          const yearStart = new Date(budget.year, 0, 1);
          const weekStart = new Date(yearStart);
          weekStart.setDate(yearStart.getDate() + (budget.week - 1) * 7);
          const weekEnd = new Date(weekStart);
          weekEnd.setDate(weekStart.getDate() + 7);
          
          dateQuery.date = { $gte: weekStart, $lt: weekEnd };
        } else if (budget.period === 'yearly') {
          dateQuery.date = {
            $gte: new Date(budget.year, 0, 1),
            $lt: new Date(budget.year + 1, 0, 1)
          };
        }
        
        const actualSpending = await Transaction.aggregate([
          { $match: dateQuery },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        
        const spent = actualSpending[0]?.total || 0;
        const remaining = budget.amount - spent;
        const percentage = (spent / budget.amount) * 100;
        
        return {
          ...budget.toObject(),
          spent,
          remaining,
          percentage: Math.min(percentage, 100),
          exceeded: spent > budget.amount
        };
      })
    );
    
    res.json(budgetsWithSpending);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Create or update budget
// @route   POST /api/budgets
// @access  Private
const createBudget = async (req, res) => {
  try {
    const { category, amount, period, month, year, week } = req.body;
    
    if (!category || !amount || !period || !year) {
      return res.status(400).json({ message: 'Please provide category, amount, period, and year' });
    }
    
    const currentDate = new Date();
    const currentYear = year || currentDate.getFullYear();
    const currentMonth = month || currentDate.getMonth() + 1;
    
    // Check if budget already exists for this period
    const existingQuery = {
      user: req.user._id,
      category,
      period,
      year: currentYear
    };
    
    if (period === 'monthly') {
      existingQuery.month = currentMonth;
    } else if (period === 'weekly') {
      existingQuery.week = week || Math.ceil((currentDate - new Date(currentYear, 0, 1)) / (7 * 24 * 60 * 60 * 1000));
    }
    
    let budget = await Budget.findOne(existingQuery);
    
    if (budget) {
      // Update existing budget
      budget.amount = amount;
      budget.updatedAt = new Date();
      await budget.save();
    } else {
      // Create new budget
      budget = await Budget.create({
        user: req.user._id,
        category,
        amount,
        period,
        year: currentYear,
        month: period === 'monthly' ? currentMonth : undefined,
        week: period === 'weekly' ? (week || Math.ceil((currentDate - new Date(currentYear, 0, 1)) / (7 * 24 * 60 * 60 * 1000))) : undefined
      });
    }
    
    res.status(201).json(budget);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Update budget
// @route   PUT /api/budgets/:id
// @access  Private
const updateBudget = async (req, res) => {
  try {
    const { amount } = req.body;
    const budget = await Budget.findById(req.params.id);
    
    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }
    
    if (budget.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'User not authorized' });
    }
    
    budget.amount = amount || budget.amount;
    budget.updatedAt = new Date();
    await budget.save();
    
    res.json(budget);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Delete budget
// @route   DELETE /api/budgets/:id
// @access  Private
const deleteBudget = async (req, res) => {
  try {
    const budget = await Budget.findById(req.params.id);
    
    if (!budget) {
      return res.status(404).json({ message: 'Budget not found' });
    }
    
    if (budget.user.toString() !== req.user._id.toString()) {
      return res.status(401).json({ message: 'User not authorized' });
    }
    
    await Budget.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Budget removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get budget summary
// @route   GET /api/budgets/summary
// @access  Private
const getBudgetSummary = async (req, res) => {
  try {
    const { month, year } = req.query;
    const currentDate = new Date();
    const queryYear = year ? parseInt(year) : currentDate.getFullYear();
    const queryMonth = month ? parseInt(month) : currentDate.getMonth() + 1;
    
    const budgets = await Budget.find({
      user: req.user._id,
      period: 'monthly',
      year: queryYear,
      month: queryMonth
    });
    
    const summary = await Promise.all(
      budgets.map(async (budget) => {
        const startDate = new Date(queryYear, queryMonth - 1, 1);
        const endDate = new Date(queryYear, queryMonth, 1);
        
        const spending = await Transaction.aggregate([
          {
            $match: {
              user: req.user._id,
              category: budget.category,
              type: 'expense',
              date: { $gte: startDate, $lt: endDate }
            }
          },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);
        
        const spent = spending[0]?.total || 0;
        
        return {
          category: budget.category,
          budgeted: budget.amount,
          spent,
          remaining: budget.amount - spent,
          percentage: Math.min((spent / budget.amount) * 100, 100),
          exceeded: spent > budget.amount
        };
      })
    );
    
    res.json(summary);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getBudgets,
  createBudget,
  updateBudget,
  deleteBudget,
  getBudgetSummary
};

