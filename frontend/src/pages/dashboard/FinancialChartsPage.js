import React, { useState, useEffect } from 'react';
import {
    Chart as ChartJS,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    RadialLinearScale,
    Filler,
} from 'chart.js';
import { Line, Bar, Doughnut } from 'react-chartjs-2';
import { transactionsAPI, budgetsAPI } from '../../services/api';
import { useAuth } from '../../context/AuthContext';
import './FinancialChartsPage.css';
import './DashboardPage.css';

ChartJS.register(
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    BarElement,
    Title,
    Tooltip,
    Legend,
    ArcElement,
    RadialLinearScale,
    Filler
);

const FinancialChartsPage = () => {
    const { user } = useAuth();
    const [transactions, setTransactions] = useState([]);
    const [budgets, setBudgets] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true);
                const [transactionsRes, budgetsRes] = await Promise.all([
                    transactionsAPI.getAll(),
                    budgetsAPI.getAll(),
                ]);

                const txData = Array.isArray(transactionsRes.data) ? transactionsRes.data : transactionsRes.data.data || [];
                const bgData = Array.isArray(budgetsRes.data) ? budgetsRes.data : budgetsRes.data.data || [];

                setTransactions(txData);
                setBudgets(bgData);
            } catch (error) {
                console.error("Error fetching data for charts:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, []);

    // --- Data Processing Helpers ---

    // 1. Net Wealth Trend
    const processNetWealthData = () => {
        const sortedTx = [...transactions].sort((a, b) => new Date(a.date) - new Date(b.date));
        const labels = [];
        const dataPoints = [];
        let currentBalance = 0;

        const monthlyBalances = {};

        sortedTx.forEach(tx => {
            const monthKey = new Date(tx.date).toLocaleString('default', { month: 'short', year: 'numeric' });
            const amount = Number(tx.amount);
            if (tx.type === 'income') currentBalance += amount;
            else currentBalance -= amount;

            monthlyBalances[monthKey] = currentBalance;
        });

        const monthKeys = Object.keys(monthlyBalances);
        const recentMonths = monthKeys.slice(-6);

        recentMonths.forEach(key => labels.push(key));
        recentMonths.forEach(key => dataPoints.push(monthlyBalances[key]));

        return {
            labels,
            datasets: [
                {
                    label: 'Net Wealth',
                    data: dataPoints,
                    fill: true,
                    backgroundColor: 'rgba(75, 192, 192, 0.2)',
                    borderColor: 'rgba(75, 192, 192, 1)',
                    tension: 0.4,
                },
            ],
        };
    };

    // 2. Income vs Expense
    const processIncomeVsExpenseData = () => {
        const monthlyData = {};

        transactions.forEach(tx => {
            const monthKey = new Date(tx.date).toLocaleString('default', { month: 'short' });
            if (!monthlyData[monthKey]) monthlyData[monthKey] = { income: 0, expense: 0 };

            if (tx.type === 'income') monthlyData[monthKey].income += Number(tx.amount);
            else monthlyData[monthKey].expense += Number(tx.amount);
        });

        const labels = Object.keys(monthlyData).slice(-6);
        const incomeData = labels.map(label => monthlyData[label].income);
        const expenseData = labels.map(label => monthlyData[label].expense);

        return {
            labels,
            datasets: [
                {
                    label: 'Income',
                    data: incomeData,
                    backgroundColor: 'rgba(16, 185, 129, 0.6)',
                },
                {
                    label: 'Expense',
                    data: expenseData,
                    backgroundColor: 'rgba(239, 68, 68, 0.6)',
                },
            ],
        };
    };

    // 3. Expense by Category
    const processCategoryData = () => {
        const categoryData = {};

        transactions
            .filter(tx => tx.type === 'expense')
            .forEach(tx => {
                const cat = tx.category;
                categoryData[cat] = (categoryData[cat] || 0) + Number(tx.amount);
            });

        const sortedCategories = Object.entries(categoryData)
            .sort(([, a], [, b]) => b - a)
            .slice(0, 6);

        return {
            labels: sortedCategories.map(([cat]) => cat),
            datasets: [
                {
                    data: sortedCategories.map(([, amount]) => amount),
                    backgroundColor: [
                        '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899',
                    ],
                    borderWidth: 1,
                },
            ],
        };
    };

    // 4. Monthly Savings Rate
    const processSavingsRateData = () => {
        const monthlyData = {};

        transactions.forEach(tx => {
            const monthKey = new Date(tx.date).toLocaleString('default', { month: 'short' });
            if (!monthlyData[monthKey]) monthlyData[monthKey] = { income: 0, expense: 0 };

            if (tx.type === 'income') monthlyData[monthKey].income += Number(tx.amount);
            else monthlyData[monthKey].expense += Number(tx.amount);
        });

        const labels = Object.keys(monthlyData).slice(-6);
        const savingsRate = labels.map(label => {
            const { income, expense } = monthlyData[label];
            if (income === 0) return 0;
            return ((income - expense) / income) * 100;
        });

        return {
            labels,
            datasets: [
                {
                    label: 'Savings Rate (%)',
                    data: savingsRate,
                    borderColor: '#8b5cf6',
                    backgroundColor: '#8b5cf6',
                    tension: 0.3,
                },
                {
                    label: 'Target (20%)',
                    data: labels.map(() => 20),
                    borderColor: '#10b981',
                    borderDash: [5, 5],
                    pointRadius: 0,
                    fill: false
                }
            ],
        };
    };

    // 5. Monthly Burn Down
    const processBurnDownData = () => {
        const today = new Date();
        const currentMonthTx = transactions.filter(tx => {
            const d = new Date(tx.date);
            return d.getMonth() === today.getMonth() && d.getFullYear() === today.getFullYear() && tx.type === 'expense';
        }).sort((a, b) => new Date(a.date) - new Date(b.date));

        const daysInMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).getDate();
        const labels = Array.from({ length: daysInMonth }, (_, i) => i + 1);

        const cumulativeSpend = new Array(daysInMonth).fill(null);
        let runningTotal = 0;

        // let currentDayIndex = 0;

        for (let i = 1; i <= today.getDate(); i++) {
            const dailyTx = currentMonthTx.filter(tx => new Date(tx.date).getDate() === i);
            const dailySum = dailyTx.reduce((sum, tx) => sum + Number(tx.amount), 0);
            runningTotal += dailySum;
            cumulativeSpend[i - 1] = runningTotal;
        }

        const spendingLimit = user?.spendingLimit || 0;

        return {
            labels,
            datasets: [
                {
                    label: 'Cumulative Spend',
                    data: cumulativeSpend,
                    borderColor: '#ef4444',
                    backgroundColor: '#ef4444',
                    tension: 0.1,
                },
                {
                    label: 'Limit',
                    data: labels.map(() => spendingLimit),
                    borderColor: '#94a3b8',
                    borderDash: [5, 5],
                    pointRadius: 0,
                    fill: false
                }
            ],
        };
    };

    // 6. Budget vs Actual (Grouped Bar Chart)
    const processBudgetVsActualData = () => {
        const actualSpending = {};
        transactions
            .filter(tx => tx.type === 'expense')
            .forEach(tx => {
                const cat = tx.category;
                actualSpending[cat] = (actualSpending[cat] || 0) + Number(tx.amount);
            });

        let labels = budgets.map(b => b.category);

        if (labels.length === 0) {
            labels = Object.keys(actualSpending).sort((a, b) => actualSpending[b] - actualSpending[a]).slice(0, 5);
        }

        const budgetData = labels.map(label => {
            const budgetItem = budgets.find(b => b.category === label);
            return budgetItem ? Number(budgetItem.amount) : 0;
        });

        const actualData = labels.map(label => actualSpending[label] || 0);

        return {
            labels,
            datasets: [
                {
                    label: 'Budget Limit',
                    data: budgetData,
                    backgroundColor: 'rgba(148, 163, 184, 0.5)',
                    borderColor: 'rgba(148, 163, 184, 1)',
                    borderWidth: 1,
                },
                {
                    label: 'Actual Spend',
                    data: actualData,
                    backgroundColor: actualData.map((actual, i) => actual > budgetData[i] ? 'rgba(239, 68, 68, 0.7)' : 'rgba(16, 185, 129, 0.7)'),
                    borderColor: actualData.map((actual, i) => actual > budgetData[i] ? 'rgba(239, 68, 68, 1)' : 'rgba(16, 185, 129, 1)'),
                    borderWidth: 1,
                },
            ],
        };
    };

    // 7. Spending Activity by Day (Bar Chart)
    const processSpendingActivityData = () => {
        const daysOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        const dayTotals = new Array(7).fill(0);

        transactions
            .filter(tx => tx.type === 'expense')
            .forEach(tx => {
                const date = new Date(tx.date);
                const dayIndex = date.getDay(); // 0 is Sunday
                dayTotals[dayIndex] += Number(tx.amount);
            });

        return {
            labels: daysOfWeek,
            datasets: [
                {
                    label: 'Total Spending Volume',
                    data: dayTotals,
                    backgroundColor: 'rgba(59, 130, 246, 0.6)',
                    borderRadius: 4,
                },
            ],
        };
    };

    if (loading) {
        return <div className="p-8 text-center text-gray-500">Loading Financial Insights...</div>;
    }

    const commonOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { position: 'bottom' },
        }
    };

    return (
        <div className="financial-charts-page">
            <div className="page-header">
                <div>
                    <h1>Financial Insights</h1>
                    <p className="page-subtitle">Deep dive into your financial health with interactive visualizations.</p>
                </div>
            </div>

            <div className="charts-grid">

                {/* Row 1 */}
                <div className="chart-card wide">
                    <h3>Net Wealth Trend</h3>
                    <div className="chart-container">
                        <Line data={processNetWealthData()} options={commonOptions} />
                    </div>
                </div>
                <div className="chart-card">
                    <h3>Income vs Expense</h3>
                    <div className="chart-container">
                        <Bar data={processIncomeVsExpenseData()} options={commonOptions} />
                    </div>
                </div>

                {/* Row 2 */}
                <div className="chart-card">
                    <h3>Top Spending Categories</h3>
                    <div className="chart-container">
                        <Doughnut data={processCategoryData()} options={commonOptions} />
                    </div>
                </div>
                <div className="chart-card wide">
                    <h3>Monthly Savings Rate</h3>
                    <div className="chart-container">
                        <Line data={processSavingsRateData()} options={commonOptions} />
                    </div>
                </div>

                {/* Row 3 */}
                <div className="chart-card wide">
                    <h3>Monthly Burn Down (Spending Limit)</h3>
                    <div className="chart-container">
                        <Line data={processBurnDownData()} options={commonOptions} />
                    </div>
                </div>

                {/* New Row 4 */}
                <div className="chart-card wide">
                    <h3>Budget Compliance (Actual vs Limit)</h3>
                    <div className="chart-container">
                        <Bar data={processBudgetVsActualData()} options={commonOptions} />
                    </div>
                </div>

                <div className="chart-card wide">
                    <h3>Spending Activity by Day</h3>
                    <div className="chart-container">
                        <Bar data={processSpendingActivityData()} options={commonOptions} />
                    </div>
                </div>

            </div>
        </div>
    );
};

export default FinancialChartsPage;
