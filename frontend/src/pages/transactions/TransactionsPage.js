import React, { useState, useEffect, useCallback } from 'react';
import { useToast } from '../../components/common/Toast';
import { transactionsAPI, recurringAPI } from '../../services/api';
import TransactionList from '../../components/transactions/TransactionList';
import { FaPlus, FaEdit, FaTrash, FaCalendar, FaTimes, FaDownload, FaFilter, FaSearch } from 'react-icons/fa';
import './TransactionsPage.css';

const TransactionsPage = () => {
  const { showError, showSuccess } = useToast();
  const [transactions, setTransactions] = useState([]);
  const [recurringTransactions, setRecurringTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('transactions'); // 'transactions' or 'recurring'
  const [searchTerm, setSearchTerm] = useState('');
  const [showRecurringForm, setShowRecurringForm] = useState(false);
  const [editingRecurring, setEditingRecurring] = useState(null);
  const [recurringFormData, setRecurringFormData] = useState({
    title: '',
    amount: '',
    type: 'expense',
    category: 'Bills',
    frequency: 'monthly',
    startDate: new Date().toISOString().split('T')[0],
    reminderDays: 3,
    reference: ''
  });
  const [showExportFilters, setShowExportFilters] = useState(false);
  const [exportFilters, setExportFilters] = useState({
    startDate: '',
    endDate: '',
    type: '',
    category: ''
  });
  const [exporting, setExporting] = useState(false);

  const loadTransactions = useCallback(async () => {
    try {
      setLoading(true);
      const res = await transactionsAPI.getAll();
      // Handle paginated response
      if (res.data.success && res.data.data) {
        setTransactions(res.data.data);
      } else if (res.data.data) {
        setTransactions(res.data.data);
      } else if (Array.isArray(res.data)) {
        setTransactions(res.data);
      } else {
        setTransactions([]);
      }
    } catch (error) {
      console.error('Error loading transactions:', error);
      // Show user-friendly error message
      if (error.response?.status === 429) {
        showError('Too many requests. Please wait a moment and try again.');
      } else {
        showError('Failed to load transactions. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  }, [showError]);

  const loadRecurringTransactions = useCallback(async () => {
    try {
      const res = await recurringAPI.getAll();
      setRecurringTransactions(res.data.data || []);
    } catch (error) {
      console.error('Error loading recurring transactions:', error);
      showError('Failed to load recurring transactions');
    }
  }, [showError]);

  useEffect(() => {
    loadTransactions();
    loadRecurringTransactions();
  }, [loadTransactions, loadRecurringTransactions]);

  const handleAddTransaction = async (transactionData) => {
    try {
      const res = await transactionsAPI.create(transactionData);
      const newTransaction = res.data.data || res.data;
      setTransactions([newTransaction, ...transactions]);
      loadTransactions(); // Refresh to get updated stats
    } catch (error) {
      throw error;
    }
  };

  const handleUpdateTransaction = async (id, transactionData) => {
    try {
      const res = await transactionsAPI.update(id, transactionData);
      const updatedTransaction = res.data.data || res.data;
      setTransactions(transactions.map(t => t._id === id ? updatedTransaction : t));
      loadTransactions(); // Refresh to get updated stats
    } catch (error) {
      throw error;
    }
  };

  const handleDeleteTransaction = async (id) => {
    try {
      await transactionsAPI.delete(id);
      setTransactions(transactions.filter(t => t._id !== id));
    } catch (error) {
      throw error;
    }
  };

  const handleExportCSV = async () => {
    try {
      setExporting(true);
      const params = new URLSearchParams();

      if (exportFilters.startDate) params.append('startDate', exportFilters.startDate);
      if (exportFilters.endDate) params.append('endDate', exportFilters.endDate);
      if (exportFilters.type) params.append('type', exportFilters.type);
      if (exportFilters.category) params.append('category', exportFilters.category);

      const token = localStorage.getItem('token');
      const API_URL = 'http://localhost:5000/api';
      const response = await fetch(`${API_URL}/transactions/export/csv?${params.toString()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      const dateStr = exportFilters.startDate && exportFilters.endDate
        ? `${exportFilters.startDate}_to_${exportFilters.endDate}`
        : new Date().toISOString().split('T')[0];
      a.download = `transactions-${dateStr}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      showSuccess('Transactions exported successfully!');
      setShowExportFilters(false);
    } catch (error) {
      console.error('Export error:', error);
      showError('Failed to export transactions. Please try again.');
    } finally {
      setExporting(false);
    }
  };

  const handleRecurringSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingRecurring) {
        await recurringAPI.update(editingRecurring._id, recurringFormData);
        showSuccess('Recurring transaction updated successfully!');
      } else {
        await recurringAPI.create(recurringFormData);
        showSuccess('Recurring transaction created successfully!');
      }
      setShowRecurringForm(false);
      setEditingRecurring(null);
      setRecurringFormData({
        title: '',
        amount: '',
        type: 'expense',
        category: 'Bills',
        frequency: 'monthly',
        startDate: new Date().toISOString().split('T')[0],
        reminderDays: 3,
        reference: ''
      });
      loadRecurringTransactions();
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('refreshNotifications'));
      }, 1000);
    } catch (error) {
      showError(error.response?.data?.message || 'Failed to save recurring transaction');
    }
  };

  const handleEditRecurring = (item) => {
    setEditingRecurring(item);
    setRecurringFormData({
      title: item.title,
      amount: item.amount,
      type: item.type,
      category: item.category,
      frequency: item.frequency,
      startDate: new Date(item.startDate).toISOString().split('T')[0],
      reminderDays: item.reminderDays,
      reference: item.reference || ''
    });
    setShowRecurringForm(true);
  };

  const handleDeleteRecurring = async (id) => {
    if (window.confirm('Are you sure you want to delete this recurring transaction?')) {
      try {
        await recurringAPI.delete(id);
        showSuccess('Recurring transaction deleted successfully!');
        loadRecurringTransactions();
      } catch (error) {
        showError('Failed to delete recurring transaction');
      }
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getFrequencyLabel = (frequency) => {
    const labels = {
      daily: 'Daily',
      weekly: 'Weekly',
      biweekly: 'Bi-weekly',
      monthly: 'Monthly',
      quarterly: 'Quarterly',
      yearly: 'Yearly'
    };
    return labels[frequency] || frequency;
  };

  // Calculate Metrics
  const calculateMetrics = () => {
    const currentMonth = new Date().getMonth();
    const currentYear = new Date().getFullYear();

    const thisMonthExpenses = transactions
      .filter(t => t.type === 'expense')
      .filter(t => {
        const d = new Date(t.date);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .reduce((acc, curr) => acc + curr.amount, 0);

    const totalCount = transactions.length;

    // Average expenses only
    const expenseTransactions = transactions.filter(t => t.type === 'expense');
    const totalExpenseAmount = expenseTransactions.reduce((acc, curr) => acc + curr.amount, 0);
    const averageExpense = expenseTransactions.length > 0
      ? totalExpenseAmount / expenseTransactions.length
      : 0;

    const allTimeTotal = transactions
      .filter(t => t.type === 'expense')
      .reduce((acc, curr) => acc + curr.amount, 0);

    return { thisMonthExpenses, totalCount, averageExpense, allTimeTotal };
  };

  const metrics = calculateMetrics();

  // Filter transactions based on search term
  const filteredTransactions = transactions.filter(t =>
    t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    t.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="page-loading">
        <div className="spinner" style={{ borderTopColor: '#8b5cf6' }}></div>
        <p>Loading transactions...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <div>
          <h1>Transactions</h1>
          <p className="page-subtitle">Manage your income, expenses, and recurring bills</p>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="metrics-grid">
        <div className="metric-card">
          <div className="metric-content">
            <span className="metric-label">This Month</span>
            <span className="metric-value">{formatCurrency(metrics.thisMonthExpenses)}</span>
            <span className="metric-subtext">January 2026</span>
          </div>
          <div className="metric-icon-wrapper purple">
            <FaCalendar />
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-content">
            <span className="metric-label">Total Transactions</span>
            <span className="metric-value">{metrics.totalCount}</span>
            <span className="metric-subtext">All time</span>
          </div>
          <div className="metric-icon-wrapper green">
            <FaSearch />
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-content">
            <span className="metric-label">Average</span>
            <span className="metric-value">{formatCurrency(metrics.averageExpense)}</span>
            <span className="metric-subtext">Per expense</span>
          </div>
          <div className="metric-icon-wrapper yellow">
            <FaFilter />
          </div>
        </div>

        <div className="metric-card">
          <div className="metric-content">
            <span className="metric-label">All Time</span>
            <span className="metric-value">{formatCurrency(metrics.allTimeTotal)}</span>
            <span className="metric-subtext">Total spent</span>
          </div>
          <div className="metric-icon-wrapper red">
            <FaDownload />
          </div>
        </div>
      </div>

      {/* Controls & Search */}
      <div className="controls-section">
        <div className="search-bar-wrapper">
          <FaSearch className="search-icon" />
          <input
            type="text"
            className="search-input"
            placeholder="Search transactions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="action-buttons">
          <button
            className="btn-secondary"
            onClick={() => setShowExportFilters(!showExportFilters)}
          >
            <FaFilter /> Filter
          </button>
          <button
            className="btn-secondary"
            onClick={handleExportCSV}
            disabled={exporting}
          >
            <FaDownload /> Export
          </button>
        </div>
      </div>

      {/* Export Filters */}
      {showExportFilters && (
        <div className="export-filters-card" style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ marginBottom: '1rem', fontSize: '1.1rem' }}>Export Filters</h3>
          <div className="export-filters-grid">
            <div className="form-group">
              <label>Start Date</label>
              <input
                type="date"
                value={exportFilters.startDate}
                onChange={(e) => setExportFilters({ ...exportFilters, startDate: e.target.value })}
                className="form-control"
              />
            </div>
            <div className="form-group">
              <label>End Date</label>
              <input
                type="date"
                value={exportFilters.endDate}
                onChange={(e) => setExportFilters({ ...exportFilters, endDate: e.target.value })}
                className="form-control"
              />
            </div>
            <div className="form-group">
              <label>Type</label>
              <select
                value={exportFilters.type}
                onChange={(e) => setExportFilters({ ...exportFilters, type: e.target.value })}
                className="form-control"
              >
                <option value="">All Types</option>
                <option value="income">Income</option>
                <option value="expense">Expense</option>
              </select>
            </div>
            <div className="form-group">
              <label>Category</label>
              <select
                value={exportFilters.category}
                onChange={(e) => setExportFilters({ ...exportFilters, category: e.target.value })}
                className="form-control"
              >
                <option value="">All Categories</option>
                <option value="Food">Food</option>
                <option value="Transport">Transport</option>
                <option value="Shopping">Shopping</option>
                <option value="Bills">Bills</option>
                <option value="Entertainment">Entertainment</option>
                <option value="Healthcare">Healthcare</option>
                <option value="Education">Education</option>
                <option value="Travel">Travel</option>
                <option value="Salary">Salary</option>
                <option value="Freelance">Freelance</option>
                <option value="Investment">Investment</option>
                <option value="Business">Business</option>
                <option value="Gift">Gift</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>
          <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
            <button
              className="btn-secondary"
              onClick={() => {
                setExportFilters({ startDate: '', endDate: '', type: '', category: '' });
                setShowExportFilters(false);
              }}
            >
              Clear Filters
            </button>
            <button
              className="btn-primary"
              onClick={handleExportCSV}
              disabled={exporting}
            >
              {exporting ? 'Exporting...' : 'Export Now'}
            </button>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="transaction-tabs">
        <button
          className={`tab-btn ${activeTab === 'transactions' ? 'active' : ''}`}
          onClick={() => setActiveTab('transactions')}
        >
          Regular Transactions
        </button>
        <button
          className={`tab-btn ${activeTab === 'recurring' ? 'active' : ''}`}
          onClick={() => setActiveTab('recurring')}
        >
          <FaCalendar /> Recurring Bills
        </button>
      </div>

      {/* Regular Transactions Tab */}
      {activeTab === 'transactions' && (
        <TransactionList
          transactions={filteredTransactions}
          onAdd={handleAddTransaction}
          onUpdate={handleUpdateTransaction}
          onDelete={handleDeleteTransaction}
        />
      )}

      {/* Recurring Transactions Tab */}
      {activeTab === 'recurring' && (
        <div className="recurring-transactions-container">
          <div className="transaction-list-header">
            <h2>Recurring Bills</h2>
            <button className="btn-primary" onClick={() => setShowRecurringForm(true)}>
              <FaPlus /> Add Recurring Bill
            </button>
          </div>

          {showRecurringForm && (
            <div className="modal-overlay" onClick={() => { setShowRecurringForm(false); setEditingRecurring(null); }}>
              <div className="modal-content" onClick={(e) => e.stopPropagation()}>
                <div className="modal-header">
                  <h3>{editingRecurring ? 'Edit Recurring Bill' : 'Add Recurring Bill'}</h3>
                  <button className="close-btn" onClick={() => { setShowRecurringForm(false); setEditingRecurring(null); }}>
                    <FaTimes />
                  </button>
                </div>
                <form className="transaction-form" onSubmit={handleRecurringSubmit}>
                  <div className="form-group">
                    <label>Title</label>
                    <input
                      type="text"
                      value={recurringFormData.title}
                      onChange={(e) => setRecurringFormData({ ...recurringFormData, title: e.target.value })}
                      placeholder="e.g., Netflix Subscription"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Amount</label>
                    <input
                      type="number"
                      step="0.01"
                      value={recurringFormData.amount}
                      onChange={(e) => setRecurringFormData({ ...recurringFormData, amount: e.target.value })}
                      placeholder="0.00"
                      required
                      min="0"
                    />
                  </div>
                  <div className="form-group">
                    <label>Type</label>
                    <select
                      value={recurringFormData.type}
                      onChange={(e) => setRecurringFormData({ ...recurringFormData, type: e.target.value })}
                      required
                    >
                      <option value="expense">Expense</option>
                      <option value="income">Income</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Category</label>
                    <select
                      value={recurringFormData.category}
                      onChange={(e) => setRecurringFormData({ ...recurringFormData, category: e.target.value })}
                      required
                    >
                      <option value="Bills">Bills</option>
                      <option value="Food">Food</option>
                      <option value="Transport">Transport</option>
                      <option value="Entertainment">Entertainment</option>
                      <option value="Healthcare">Healthcare</option>
                      <option value="Education">Education</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Frequency</label>
                    <select
                      value={recurringFormData.frequency}
                      onChange={(e) => setRecurringFormData({ ...recurringFormData, frequency: e.target.value })}
                      required
                    >
                      <option value="daily">Daily</option>
                      <option value="weekly">Weekly</option>
                      <option value="biweekly">Bi-weekly</option>
                      <option value="monthly">Monthly</option>
                      <option value="quarterly">Quarterly</option>
                      <option value="yearly">Yearly</option>
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Start Date</label>
                    <input
                      type="date"
                      value={recurringFormData.startDate}
                      onChange={(e) => setRecurringFormData({ ...recurringFormData, startDate: e.target.value })}
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Reminder Days Before Due</label>
                    <input
                      type="number"
                      value={recurringFormData.reminderDays}
                      onChange={(e) => setRecurringFormData({ ...recurringFormData, reminderDays: parseInt(e.target.value) })}
                      min="0"
                      max="30"
                      required
                    />
                  </div>
                  <div className="form-group">
                    <label>Reference (Optional)</label>
                    <input
                      type="text"
                      value={recurringFormData.reference}
                      onChange={(e) => setRecurringFormData({ ...recurringFormData, reference: e.target.value })}
                      placeholder="e.g., Account number, Bill ID"
                    />
                  </div>
                  <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                    <button type="submit" className="btn-primary">
                      {editingRecurring ? 'Update' : 'Create'} Recurring Bill
                    </button>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => { setShowRecurringForm(false); setEditingRecurring(null); }}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {recurringTransactions.length === 0 ? (
            <div className="empty-state">
              <p>No recurring bills found. Add your first recurring bill to get started!</p>
            </div>
          ) : (
            <div className="transaction-items">
              {recurringTransactions.map((item) => (
                <div key={item._id} className={`transaction-item ${item.type}`}>
                  <div className="transaction-main">
                    <div className="transaction-info">
                      <h4>
                        {item.title}
                        <span className="recurring-badge">
                          <FaCalendar /> {getFrequencyLabel(item.frequency)}
                        </span>
                      </h4>
                      <div className="transaction-meta">
                        <span className="transaction-category">{item.category}</span>
                        <span className="transaction-date">
                          Next: {formatDate(item.nextDueDate)}
                        </span>
                        {item.reference && (
                          <span className="transaction-ref">Ref: {item.reference}</span>
                        )}
                      </div>
                    </div>
                    <div className="transaction-amount">
                      <span className={`amount ${item.type}`}>
                        {item.type === 'income' ? '+' : '-'}
                        {formatCurrency(Math.abs(item.amount))}
                      </span>
                    </div>
                  </div>
                  <div className="transaction-actions">
                    <button
                      className="action-btn edit"
                      onClick={() => handleEditRecurring(item)}
                      title="Edit"
                    >
                      <FaEdit />
                    </button>
                    <button
                      className="action-btn delete"
                      onClick={() => handleDeleteRecurring(item._id)}
                      title="Delete"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default TransactionsPage;

