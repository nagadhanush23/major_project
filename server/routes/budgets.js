// server/routes/budgets.js
const express = require('express');
const router = express.Router();
const { 
  getBudgets, 
  createBudget, 
  updateBudget, 
  deleteBudget,
  getBudgetSummary
} = require('../controllers/budgetController');
const { protect } = require('../middleware/auth');

router.route('/')
  .get(protect, getBudgets)
  .post(protect, createBudget);

router.route('/summary')
  .get(protect, getBudgetSummary);

router.route('/:id')
  .put(protect, updateBudget)
  .delete(protect, deleteBudget);

module.exports = router;

