import React, { useState, useEffect } from 'react';
import { transactionsAPI, budgetsAPI, analyticsAPI } from '../../services/api';
import StatsCards from '../../components/analytics/StatsCards';
import TransactionList from '../../components/transactions/TransactionList';
import BudgetManager from '../../components/budgets/BudgetManager';
import AnalyticsPanel from '../../components/analytics/AnalyticsPanel';
import { useAuth } from '../../context/AuthContext';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { FaCloudDownloadAlt, FaMedal, FaTrophy, FaStar } from 'react-icons/fa';
import './DashboardPage.css';

const OverviewPage = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState([]);
  const [budgets, setBudgets] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [stats, setStats] = useState({
    totalIncome: 0,
    totalExpense: 0,
    balance: 0,
  });
  const [loading, setLoading] = useState(true);
  const [badges, setBadges] = useState([]);
  const dashboardRef = React.useRef(null);

  const loadData = React.useCallback(async () => {
    try {
      setLoading(true);
      const [transactionsRes, budgetsRes, statsRes, trendsRes, projectionsRes] = await Promise.all([
        transactionsAPI.getAll(),
        budgetsAPI.getAll({ period: 'monthly', year: new Date().getFullYear(), month: new Date().getMonth() + 1 }),
        transactionsAPI.getStats(),
        analyticsAPI.getTrends({ months: 6 }).catch(() => ({ data: null })),
        analyticsAPI.getProjections({ months: 3 }).catch(() => ({ data: null })),
      ]);

      // Handle paginated/structured responses
      const transactionsData = transactionsRes.data.data || transactionsRes.data;
      const statsData = statsRes.data.data || statsRes.data;

      setTransactions(Array.isArray(transactionsData) ? transactionsData.slice(0, 5) : []);
      setBudgets(Array.isArray(budgetsRes.data) ? budgetsRes.data.slice(0, 3) : []);
      setStats({
        totalIncome: statsData.totalIncome || 0,
        totalExpense: statsData.totalExpense || 0,
        balance: statsData.balance || 0,
      });

      // Set analytics if available
      if (trendsRes.data || projectionsRes.data) {
        setAnalytics({
          trends: trendsRes.data,
          projections: projectionsRes.data,
        });
      }

      // Calculate Badges
      const earnedBadges = [];
      const income = statsData.totalIncome || 0;
      const expense = statsData.totalExpense || 0;

      // Badge 1: Super Saver (Savings > 20% of Income)
      if (income > 0 && (income - expense) / income >= 0.2) {
        earnedBadges.push({
          id: 'saver',
          label: 'Super Saver',
          icon: <FaMedal style={{ color: '#FFD700' }} />,
          description: 'Saved > 20% of income'
        });
      }

      // Badge 2: Budget Master (Under Spending Limit)
      if (user?.spendingLimit > 0 && expense < user.spendingLimit) {
        earnedBadges.push({
          id: 'budget-master',
          label: 'Budget Master',
          icon: <FaTrophy style={{ color: '#00E096' }} />,
          description: 'Stayed under monthly limit'
        });
      }

      // Badge 3: Wealth Builder (Positive Balance > 10000)
      if (statsData.balance > 10000) {
        earnedBadges.push({
          id: 'wealth',
          label: 'Wealth Builder',
          icon: <FaStar style={{ color: '#667eea' }} />,
          description: 'Balance > ₹10,000'
        });
      }

      setBadges(earnedBadges);

    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  }, [user]); // Added dependency on user for badge calculation

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleDownloadPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;
    const pageHeight = doc.internal.pageSize.height;

    // -- Brand Colors --
    const secondaryColor = [51, 65, 85]; // Slate 700
    const accentColor = [241, 245, 249]; // Slate 100

    // -- Header Background --
    doc.setFillColor(...secondaryColor);
    doc.rect(0, 0, pageWidth, 40, 'F');

    // -- Logo/Title --
    doc.setFontSize(26);
    doc.setTextColor(255, 255, 255);
    doc.text('ExpenseEase', 14, 25);

    doc.setFontSize(10);
    doc.setTextColor(200, 200, 200);
    doc.text('Financial Management Solutions', 14, 32);

    // -- Company Details (Top Right) --
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text('ExpenseEase Inc.', pageWidth - 14, 15, { align: 'right' });
    doc.text('Level 5, Cyber Towers, Hitech City', pageWidth - 14, 20, { align: 'right' });
    doc.text('Hyderabad, TS 500081', pageWidth - 14, 25, { align: 'right' });
    doc.text('support@expenseease.com', pageWidth - 14, 30, { align: 'right' });

    // -- Report Title & Date --
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(18);
    doc.text('FINANCIAL REPORT', 14, 55);

    doc.setDrawColor(...secondaryColor);
    doc.setLineWidth(0.5);
    doc.line(14, 58, 65, 58);

    doc.setFontSize(10);
    doc.setTextColor(100);
    doc.text(`Date Generated: ${new Date().toLocaleDateString()}`, 14, 65);
    doc.text(`Report ID: REF-${Math.floor(Math.random() * 100000)}`, 14, 70);

    // -- Bill To / User Details --
    doc.setFontSize(11);
    doc.setTextColor(0);
    doc.text('Report For:', pageWidth - 80, 55);
    doc.setFontSize(10);
    doc.setTextColor(80);
    doc.text(user?.name || 'Valued Member', pageWidth - 80, 60);
    doc.text(user?.email || 'N/A', pageWidth - 80, 65);

    // -- Financial Summary Box --
    const summaryY = 80;
    doc.setFillColor(...accentColor);
    doc.setDrawColor(200, 200, 200);
    doc.roundedRect(14, summaryY, pageWidth - 28, 25, 3, 3, 'FD');

    doc.setFontSize(9);
    doc.setTextColor(100);
    doc.text('TOTAL INCOME', 30, summaryY + 8);
    doc.text('TOTAL EXPENSES', pageWidth / 2, summaryY + 8, { align: 'center' });
    doc.text('NET BALANCE', pageWidth - 30, summaryY + 8, { align: 'right' });

    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(16, 185, 129); // Green
    doc.text(`Rs. ${stats.totalIncome.toLocaleString()}`, 30, summaryY + 18);

    doc.setTextColor(239, 68, 68); // Red
    doc.text(`Rs. ${stats.totalExpense.toLocaleString()}`, pageWidth / 2, summaryY + 18, { align: 'center' });

    doc.setTextColor(51, 65, 85); // Slate
    const balanceColor = stats.balance >= 0 ? [16, 185, 129] : [239, 68, 68];
    doc.setTextColor(...balanceColor);
    doc.text(`Rs. ${stats.balance.toLocaleString()}`, pageWidth - 30, summaryY + 18, { align: 'right' });

    // -- Transactions Table --
    doc.setFontSize(12);
    doc.setTextColor(0);
    doc.setFont('helvetica', 'bold');
    const tableHeaderY = summaryY + 35;
    doc.text('Detailed Transaction History', 14, tableHeaderY);

    const tableRows = transactions.map(t => [
      new Date(t.date).toLocaleDateString(),
      t.title,
      t.category,
      t.type === 'income' ? 'Income' : 'Expense',
      `Rs. ${t.amount.toLocaleString()}`
    ]);

    autoTable(doc, {
      startY: tableHeaderY + 5,
      head: [['Date', 'Description', 'Category', 'Type', 'Amount']],
      body: tableRows,
      theme: 'grid',
      headStyles: {
        fillColor: secondaryColor,
        textColor: 255,
        fontStyle: 'bold',
        halign: 'left'
      },
      styles: {
        fontSize: 9,
        cellPadding: 3,
        textColor: 50,
        lineColor: [230, 230, 230],
        lineWidth: 0.1
      },
      alternateRowStyles: {
        fillColor: [250, 250, 255]
      },
      columnStyles: {
        0: { cellWidth: 30 },
        1: { cellWidth: 'auto' }, // Description gets auto width
        2: { cellWidth: 30 },
        3: { cellWidth: 25 },
        4: { halign: 'right', fontStyle: 'bold', cellWidth: 35 }
      },
      didParseCell: function (data) {
        if (data.section === 'body' && data.column.index === 4) {
          const type = data.row.raw[3];
          if (type === 'Expense') data.cell.styles.textColor = [220, 38, 38];
          if (type === 'Income') data.cell.styles.textColor = [22, 163, 74];
        }
      }
    });

    // -- Footer --
    const pageCount = doc.internal.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      doc.setPage(i);

      // Footer Line
      doc.setDrawColor(200);
      doc.setLineWidth(0.1);
      doc.line(14, pageHeight - 20, pageWidth - 14, pageHeight - 20);

      // Contact Info
      doc.setFontSize(8);
      doc.setTextColor(150);
      doc.text('ExpenseEase Inc. | www.expenseease.com | +91 8000 9000', 14, pageHeight - 12);
      doc.text(`Page ${i} of ${pageCount}`, pageWidth - 14, pageHeight - 12, { align: 'right' });

      doc.setFontSize(7);
      doc.setTextColor(180);
      doc.text('This is a computer-generated document. No signature is required.', pageWidth / 2, pageHeight - 8, { align: 'center' });
    }

    doc.save(`ExpenseEase_Report_${new Date().toISOString().split('T')[0]}.pdf`);
  };

  const handleDeleteTransaction = async (id) => {
    try {
      await transactionsAPI.delete(id);
      setTransactions(transactions.filter(t => t._id !== id));
      await refreshStats();
    } catch (error) {
      console.error('Error deleting transaction:', error);
    }
  };

  const refreshStats = async () => {
    try {
      const statsRes = await transactionsAPI.getStats();
      const statsData = statsRes.data.data || statsRes.data;
      setStats({
        totalIncome: statsData.totalIncome || 0,
        totalExpense: statsData.totalExpense || 0,
        balance: statsData.balance || 0,
      });
    } catch (error) {
      console.error('Error refreshing stats:', error);
    }
  };

  if (loading) {
    return (
      <div className="page-loading">
        <div className="spinner"></div>
        <p>Loading overview...</p>
      </div>
    );
  }

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <div>
          <h1>Overview & Analytics</h1>
          <p className="page-subtitle">Your complete financial dashboard with insights and analytics</p>

          {/* Badge Showcase */}
          {badges.length > 0 && (
            <div className="badges-container" style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
              {badges.map(badge => (
                <div key={badge.id} className="financial-badge glass-panel" title={badge.description}>
                  <span className="badge-icon">{badge.icon}</span>
                  <span className="badge-label">{badge.label}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <button className="btn-primary no-print" onClick={handleDownloadPDF} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <FaCloudDownloadAlt /> Download Report
        </button>
      </div>

      <div ref={dashboardRef}>
        {/* Printable Content Wrapper */}
        <StatsCards stats={stats} spendingLimit={user?.spendingLimit} />

        <div className="overview-grid">
          <div className="overview-section">
            <div className="section-header">
              <h2>Recent Transactions</h2>
            </div>
            <TransactionList
              transactions={transactions}
              onDelete={handleDeleteTransaction}
              compact
            />
          </div>

          <div className="overview-section">
            <div className="section-header">
              <h2>Active Budgets</h2>
            </div>
            <BudgetManager
              budgets={budgets}
              compact
            />
          </div>
        </div>

        {analytics && (
          <div style={{ marginTop: '2rem' }}>
            <AnalyticsPanel analytics={analytics} />
          </div>
        )}
      </div>
    </div>
  );
};

export default OverviewPage;
