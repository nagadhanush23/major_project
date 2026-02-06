import React from 'react';
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, BarElement, Title, Tooltip, Legend, ArcElement } from 'chart.js';
import { Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

const AnalyticsPanel = ({ analytics }) => {
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  if (!analytics) {
    return (
      <div className="analytics-loading">
        <div className="spinner"></div>
        <p>Loading analytics...</p>
      </div>
    );
  }

  // Prepare trends data
  const trendsData = analytics.trends || [];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  // Group trends by month
  const trendsByMonth = {};
  trendsData.forEach((trend) => {
    const monthKey = `${trend._id.year}-${trend._id.month}`;
    if (!trendsByMonth[monthKey]) {
      trendsByMonth[monthKey] = {};
    }
    trendsByMonth[monthKey][trend._id.category] = trend.total;
  });

  const monthLabels = Object.keys(trendsByMonth)
    .sort()
    .slice(-6)
    .map((key) => {
      const [year, month] = key.split('-');
      return `${months[parseInt(month) - 1]} ${year}`;
    });

  const categories = [...new Set(trendsData.map((t) => t._id.category))];
  const categoryColors = [
    '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
    '#ec4899', '#06b6d4', '#14b8a6', '#eab308',
  ];

  const trendsChartData = {
    labels: monthLabels,
    datasets: categories.slice(0, 5).map((category, index) => ({
      label: category,
      data: monthLabels.map((_, i) => {
        const monthKey = Object.keys(trendsByMonth).sort().slice(-6)[i];
        return trendsByMonth[monthKey]?.[category] || 0;
      }),
      borderColor: categoryColors[index % categoryColors.length],
      backgroundColor: categoryColors[index % categoryColors.length] + '20',
      tension: 0.4,
    })),
  };

  // Projections data
  const projections = analytics.projections?.projections || [];
  const projectionsData = {
    labels: projections.map((p) => `Month ${p.month}`),
    datasets: [
      {
        label: 'Projected Income',
        data: projections.map((p) => p.projectedIncome),
        borderColor: '#10b981',
        backgroundColor: '#10b98120',
        tension: 0.4,
      },
      {
        label: 'Projected Expenses',
        data: projections.map((p) => p.projectedExpense),
        borderColor: '#ef4444',
        backgroundColor: '#ef444420',
        tension: 0.4,
      },
      {
        label: 'Projected Balance',
        data: projections.map((p) => p.projectedBalance),
        borderColor: '#3b82f6',
        backgroundColor: '#3b82f620',
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      tooltip: {
        callbacks: {
          label: (context) => `${context.dataset.label}: ${formatCurrency(context.parsed.y)}`,
        },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => formatCurrency(value),
        },
      },
    },
  };

  return (
    <div className="analytics-panel">
      <h2>Analytics & Insights</h2>

      {/* Projection Stats as Separate Cards */}
      {analytics.projections && (
        <div className="stats-cards" style={{ marginBottom: '2rem' }}>
          <div className="stat-card balance positive">
            <div className="stat-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="1" x2="12" y2="23"></line>
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"></path>
              </svg>
            </div>
            <div className="stat-content">
              <p className="stat-label">Current Balance</p>
              <p className="stat-value">{formatCurrency(analytics.projections.currentBalance || 0)}</p>
            </div>
          </div>

          <div className="stat-card income">
            <div className="stat-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <polyline points="19 12 12 19 5 12"></polyline>
              </svg>
            </div>
            <div className="stat-content">
              <p className="stat-label">Avg Monthly Income</p>
              <p className="stat-value">{formatCurrency(analytics.projections.averageMonthlyIncome || 0)}</p>
            </div>
          </div>

          <div className="stat-card expense">
            <div className="stat-icon">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <polyline points="5 12 12 5 19 12"></polyline>
              </svg>
            </div>
            <div className="stat-content">
              <p className="stat-label">Avg Monthly Expense</p>
              <p className="stat-value">{formatCurrency(analytics.projections.averageMonthlyExpense || 0)}</p>
            </div>
          </div>
        </div>
      )}

      <div className="analytics-grid">
        {analytics.projections && (
          <div className="analytics-card">
            <h3>Financial Projections</h3>
            <div className="chart-container">
              <Line data={projectionsData} options={chartOptions} />
            </div>
          </div>
        )}

        {trendsData.length > 0 && (
          <div className="analytics-card">
            <h3>Spending Trends (Last 6 Months)</h3>
            <div className="chart-container">
              <Line data={trendsChartData} options={chartOptions} />
            </div>
          </div>
        )}

        {!analytics.projections && trendsData.length === 0 && (
          <div className="empty-state">
            <p>No analytics data available yet. Start adding transactions to see insights!</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalyticsPanel;

