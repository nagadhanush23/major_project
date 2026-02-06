import React from 'react';

const StatsCards = ({ stats, spendingLimit = 0 }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const isOverLimit = spendingLimit > 0 && stats.totalExpense > spendingLimit;

  return (
    <div className="stats-cards">
      <div className="stat-card income">
        <div className="stat-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        </div>
        <div className="stat-content">
          <p className="stat-label">Total Income</p>
          <h2 className="stat-value">{formatCurrency(stats.totalIncome)}</h2>
        </div>
      </div>

      <div className={`stat-card expense ${isOverLimit ? 'over-limit' : ''}`}>
        <div className="stat-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2v20M6 5h5.5a3.5 3.5 0 0 1 0 7H6M6 12h7a3.5 3.5 0 0 1 0 7H6" />
          </svg>
        </div>
        <div className="stat-content">
          <p className="stat-label">Total Expenses</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <h2 className="stat-value">{formatCurrency(stats.totalExpense)}</h2>
            {isOverLimit && (
              <span className="limit-warning" title={`Limit: ${formatCurrency(spendingLimit)}`}>
                ⚠️ Over Limit
              </span>
            )}
          </div>
        </div>
      </div>

      <div className={`stat-card balance ${stats.balance >= 0 ? 'positive' : 'negative'}`}>
        <div className="stat-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="12" cy="12" r="10" />
            <path d="M12 6v6l4 2" />
          </svg>
        </div>
        <div className="stat-content">
          <p className="stat-label">Balance</p>
          <h2 className="stat-value">{formatCurrency(stats.balance)}</h2>
        </div>
      </div>
    </div>
  );
};

export default StatsCards;

