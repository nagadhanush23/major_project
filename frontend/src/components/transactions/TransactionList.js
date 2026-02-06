import React, { useState } from 'react';
import { FaPlus, FaEdit, FaTrash, FaTimes } from 'react-icons/fa';
import { useToast } from '../common/Toast';
import TransactionForm from './TransactionForm';

const TransactionList = ({
  transactions = [],
  onAdd,
  onUpdate,
  onDelete,
  compact = false
}) => {
  const { showSuccess, showError } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [editingTransaction, setEditingTransaction] = useState(null);
  const [filter, setFilter] = useState('all'); // all, income, expense

  const filteredTransactions = transactions.filter(t => {
    if (filter === 'all') return true;
    return t.type === filter;
  });

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
    }).format(amount);
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const handleEdit = (transaction) => {
    setEditingTransaction(transaction);
    setShowForm(true);
  };

  const handleFormSubmit = async (formData) => {
    try {
      if (editingTransaction) {
        await onUpdate(editingTransaction._id, formData);
        showSuccess('Transaction updated successfully!');
        setEditingTransaction(null);
      } else {
        await onAdd(formData);
        showSuccess('Transaction added successfully!');
      }
      setShowForm(false);
      // Trigger notification refresh after a short delay
      setTimeout(() => {
        window.dispatchEvent(new CustomEvent('refreshNotifications'));
      }, 1000);
    } catch (error) {
      console.error('Error saving transaction:', error);
      showError(error.response?.data?.message || 'Failed to save transaction');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        await onDelete(id);
        showSuccess('Transaction deleted successfully!');
        // Trigger notification refresh after a short delay
        setTimeout(() => {
          window.dispatchEvent(new CustomEvent('refreshNotifications'));
        }, 1000);
      } catch (error) {
        console.error('Error deleting transaction:', error);
        showError('Failed to delete transaction');
      }
    }
  };

  return (
    <div className="transaction-list-container">
      {!compact && (
        <div className="transaction-list-header">
          <h2>Transactions</h2>
          <div className="transaction-controls">
            <div className="filter-buttons">
              <button
                className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                onClick={() => setFilter('all')}
              >
                All
              </button>
              <button
                className={`filter-btn ${filter === 'income' ? 'active' : ''}`}
                onClick={() => setFilter('income')}
              >
                Income
              </button>
              <button
                className={`filter-btn ${filter === 'expense' ? 'active' : ''}`}
                onClick={() => setFilter('expense')}
              >
                Expenses
              </button>
            </div>
            <button className="btn-primary" onClick={() => setShowForm(true)}>
              <FaPlus /> Add Transaction
            </button>
          </div>
        </div>
      )}

      {showForm && (
        <div className="modal-overlay" onClick={() => { setShowForm(false); setEditingTransaction(null); }}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editingTransaction ? 'Edit Transaction' : 'Add Transaction'}</h3>
              <button className="close-btn" onClick={() => { setShowForm(false); setEditingTransaction(null); }}>
                <FaTimes />
              </button>
            </div>
            <TransactionForm
              transaction={editingTransaction}
              onSubmit={handleFormSubmit}
              onCancel={() => { setShowForm(false); setEditingTransaction(null); }}
            />
          </div>
        </div>
      )}

      {filteredTransactions.length === 0 ? (
        <div className="empty-state">
          <p>No transactions found. {!compact && 'Add your first transaction to get started!'}</p>
        </div>
      ) : (
        <div className="transaction-items">
          {filteredTransactions.map((transaction) => (
            <div key={transaction._id} className={`transaction-item ${transaction.type}`}>
              <div className="transaction-main">
                <div className="transaction-info">
                  <h4>{transaction.title}</h4>
                  <div className="transaction-meta">
                    <span className="transaction-category">{transaction.category}</span>
                    <span className="transaction-date">{formatDate(transaction.date)}</span>
                    {transaction.reference && (
                      <span className="transaction-ref">Ref: {transaction.reference}</span>
                    )}
                  </div>
                </div>
                <div className="transaction-amount">
                  <span className={`amount ${transaction.type}`}>
                    {transaction.type === 'income' ? '+' : '-'}
                    {formatCurrency(Math.abs(transaction.amount))}
                  </span>
                </div>
              </div>
              {!compact && (
                <div className="transaction-actions">
                  <button
                    className="action-btn edit"
                    onClick={() => handleEdit(transaction)}
                    title="Edit"
                  >
                    <FaEdit />
                  </button>
                  <button
                    className="action-btn delete"
                    onClick={() => handleDelete(transaction._id)}
                    title="Delete"
                  >
                    <FaTrash />
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TransactionList;

