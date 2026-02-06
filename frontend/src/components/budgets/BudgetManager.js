import React, { useState } from 'react';
import { FaPlus, FaEdit, FaTrash, FaTimes, FaSave } from 'react-icons/fa';

const EXPENSE_CATEGORIES = ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Healthcare', 'Education', 'Travel', 'Other'];

const BudgetManager = ({ budgets = [], onAdd, onUpdate, onDelete, compact = false }) => {
  const [showForm, setShowForm] = useState(false);
  const [editingBudget, setEditingBudget] = useState(null);
  const [formData, setFormData] = useState({
    category: '',
    amount: '',
    period: 'monthly',
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const handleEdit = (budget) => {
    setEditingBudget(budget);
    setFormData({
      category: budget.category,
      amount: budget.amount,
      period: budget.period,
      month: budget.month || new Date().getMonth() + 1,
      year: budget.year,
    });
    setShowForm(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingBudget) {
        await onUpdate(editingBudget._id, { amount: parseFloat(formData.amount) });
      } else {
        await onAdd({
          category: formData.category,
          amount: parseFloat(formData.amount),
          period: formData.period,
          month: formData.period === 'monthly' ? parseInt(formData.month) : undefined,
          year: parseInt(formData.year),
        });
      }
      setShowForm(false);
      setEditingBudget(null);
      setFormData({
        category: '',
        amount: '',
        period: 'monthly',
        month: new Date().getMonth() + 1,
        year: new Date().getFullYear(),
      });
    } catch (error) {
      console.error('Error saving budget:', error);
      alert(error.response?.data?.message || 'Failed to save budget');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this budget?')) {
      try {
        await onDelete(id);
      } catch (error) {
        console.error('Error deleting budget:', error);
        alert('Failed to delete budget');
      }
    }
  };

  return (
    <div className="budget-manager-container">
      {!compact && (
        <div className="budget-header">
          <h2>Budgets</h2>
          <button className="btn-primary" onClick={() => setShowForm(true)}>
            <FaPlus /> Add Budget
          </button>
        </div>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={() => { setShowForm(false); setEditingBudget(null); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingBudget ? 'Edit Budget' : 'Add Budget'}</h3>
              <button className="close-btn" onClick={() => { setShowForm(false); setEditingBudget(null); }}>
                <FaTimes />
              </button>
            </div>
            <form className="budget-form" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="category">Category *</label>
                <select
                  id="category"
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                  required
                  disabled={!!editingBudget}
                >
                  <option value="">Select category</option>
                  {EXPENSE_CATEGORIES.map((cat) => (
                    <option key={cat} value={cat}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="amount">Amount *</label>
                <input
                  type="number"
                  id="amount"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="period">Period *</label>
                <select
                  id="period"
                  value={formData.period}
                  onChange={(e) => setFormData({ ...formData, period: e.target.value })}
                  required
                  disabled={!!editingBudget}
                >
                  <option value="monthly">Monthly</option>
                  <option value="weekly">Weekly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>

              {formData.period === 'monthly' && (
                <div className="form-group">
                  <label htmlFor="month">Month *</label>
                  <input
                    type="number"
                    id="month"
                    value={formData.month}
                    onChange={(e) => setFormData({ ...formData, month: e.target.value })}
                    min="1"
                    max="12"
                    required
                    disabled={!!editingBudget}
                  />
                </div>
              )}

              <div className="form-group">
                <label htmlFor="year">Year *</label>
                <input
                  type="number"
                  id="year"
                  value={formData.year}
                  onChange={(e) => setFormData({ ...formData, year: e.target.value })}
                  min="2020"
                  max="2030"
                  required
                  disabled={!!editingBudget}
                />
              </div>

              <div className="form-actions">
                <button type="button" className="btn-secondary" onClick={() => { setShowForm(false); setEditingBudget(null); }}>
                  <FaTimes /> Cancel
                </button>
                <button type="submit" className="btn-primary">
                  <FaSave /> {editingBudget ? 'Update' : 'Add'} Budget
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {budgets.length === 0 ? (
        <div className="empty-state">
          <p>No budgets set. {!compact && 'Create a budget to track your spending goals!'}</p>
        </div>
      ) : (
        <div className="budget-grid">
          {budgets.map((budget) => {
            const percentage = budget.percentage || 0;
            const exceeded = budget.exceeded || false;

            return (
              <div key={budget._id} className={`budget-card ${exceeded ? 'exceeded' : ''}`}>
                <div className="budget-header-card">
                  <div>
                    <h4>{budget.category}</h4>
                    <p className="budget-period">
                      {budget.period === 'monthly' && `Month ${budget.month}/${budget.year}`}
                      {budget.period === 'weekly' && `Week ${budget.week}/${budget.year}`}
                      {budget.period === 'yearly' && `Year ${budget.year}`}
                    </p>
                  </div>
                  {!compact && (
                    <div className="budget-actions">
                      <button className="action-btn edit" onClick={() => handleEdit(budget)} title="Edit">
                        <FaEdit />
                      </button>
                      <button className="action-btn delete" onClick={() => handleDelete(budget._id)} title="Delete">
                        <FaTrash />
                      </button>
                    </div>
                  )}
                </div>

                <div className="budget-amounts">
                  <div className="budget-amount-row">
                    <span>Budgeted</span>
                    <span className="amount">{formatCurrency(budget.amount)}</span>
                  </div>
                  <div className="budget-amount-row">
                    <span>Spent</span>
                    <span className={`amount ${exceeded ? 'exceeded' : ''}`}>
                      {formatCurrency(budget.spent || 0)}
                    </span>
                  </div>
                  <div className="budget-amount-row">
                    <span>Remaining</span>
                    <span className={`amount ${(budget.remaining || 0) < 0 ? 'exceeded' : ''}`}>
                      {formatCurrency(budget.remaining || budget.amount)}
                    </span>
                  </div>
                </div>

                <div className="budget-progress">
                  <div className="progress-bar">
                    <div
                      className={`progress-fill ${exceeded ? 'exceeded' : ''}`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    ></div>
                  </div>
                  <p className="progress-text">
                    {percentage.toFixed(1)}% used
                    {exceeded && <span className="exceeded-badge">Exceeded</span>}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default BudgetManager;

