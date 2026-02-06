import React, { useState, useEffect } from 'react';
import { FaSave, FaTimes, FaMagic } from 'react-icons/fa';
import { aiAPI } from '../../services/api';

const CATEGORIES = {
  income: ['Salary', 'Freelance', 'Investment', 'Business', 'Gift', 'Other'],
  expense: ['Food', 'Transport', 'Shopping', 'Bills', 'Entertainment', 'Healthcare', 'Education', 'Travel', 'Other'],
};

const TransactionForm = ({ transaction, onSubmit, onCancel }) => {
  const [formData, setFormData] = useState({
    title: '',
    amount: '',
    type: 'expense',
    category: '',
    date: new Date().toISOString().split('T')[0],
    reference: '',
  });

  useEffect(() => {
    if (transaction) {
      setFormData({
        title: transaction.title || '',
        amount: transaction.amount || '',
        type: transaction.type || 'expense',
        category: transaction.category || '',
        date: transaction.date ? new Date(transaction.date).toISOString().split('T')[0] : new Date().toISOString().split('T')[0],
        reference: transaction.reference || '',
      });
    }
  }, [transaction]);

  const [categorizing, setCategorizing] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      // Reset category when type changes
      ...(name === 'type' && { category: '' }),
    }));
  };

  const handleSmartCategorize = async () => {
    if (!formData.title || !formData.amount) {
      alert('Please enter title and amount first');
      return;
    }

    try {
      setCategorizing(true);
      const response = await aiAPI.smartCategorize(
        formData.title,
        parseFloat(formData.amount),
        formData.reference || ''
      );

      if (response.data && response.data.category) {
        setFormData(prev => ({
          ...prev,
          category: response.data.category
        }));
      }
    } catch (error) {
      console.error('Smart categorization error:', error);
    } finally {
      setCategorizing(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit({
      ...formData,
      amount: parseFloat(formData.amount),
      date: new Date(formData.date),
    });
  };

  return (
    <form className="transaction-form" onSubmit={handleSubmit}>
      <div className="form-group">
        <label htmlFor="type">Type *</label>
        <div className="type-selector">
          <button
            type="button"
            className={`type-option ${formData.type === 'income' ? 'active' : ''}`}
            onClick={() => setFormData({ ...formData, type: 'income', category: '' })}
          >
            Income
          </button>
          <button
            type="button"
            className={`type-option ${formData.type === 'expense' ? 'active' : ''}`}
            onClick={() => setFormData({ ...formData, type: 'expense', category: '' })}
          >
            Expense
          </button>
        </div>
      </div>

      <div className="form-group">
        <label htmlFor="title">Title *</label>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title}
          onChange={handleChange}
          placeholder="e.g., Grocery Shopping"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="amount">Amount *</label>
        <input
          type="number"
          id="amount"
          name="amount"
          value={formData.amount}
          onChange={handleChange}
          placeholder="0.00"
          step="0.01"
          min="0"
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="category">
          Category *
          {formData.title && formData.amount && (
            <button
              type="button"
              className="smart-categorize-btn"
              onClick={handleSmartCategorize}
              disabled={categorizing}
              title="AI Smart Categorization"
            >
              <FaMagic /> {categorizing ? 'Categorizing...' : 'Auto-Categorize'}
            </button>
          )}
        </label>
        <select
          id="category"
          name="category"
          value={formData.category}
          onChange={handleChange}
          required
        >
          <option value="">Select a category</option>
          {CATEGORIES[formData.type].map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      <div className="form-group">
        <label htmlFor="date">Date *</label>
        <input
          type="date"
          id="date"
          name="date"
          value={formData.date}
          onChange={handleChange}
          required
        />
      </div>

      <div className="form-group">
        <label htmlFor="reference">Reference (Optional)</label>
        <input
          type="text"
          id="reference"
          name="reference"
          value={formData.reference}
          onChange={handleChange}
          placeholder="e.g., Invoice #123"
        />
      </div>

      <div className="form-actions">
        <button type="button" className="btn-secondary" onClick={onCancel}>
          <FaTimes /> Cancel
        </button>
        <button type="submit" className="btn-primary">
          <FaSave /> {transaction ? 'Update' : 'Add'} Transaction
        </button>
      </div>
    </form>
  );
};

export default TransactionForm;

