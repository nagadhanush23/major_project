import React, { useState, useEffect } from 'react';
import { budgetsAPI, transactionsAPI, aiAPI } from '../../services/api';
import BudgetManager from '../../components/budgets/BudgetManager';
import { FaBullseye, FaLightbulb, FaChartPie, FaPiggyBank } from 'react-icons/fa';
import '../dashboard/DashboardPage.css';

const GoalsAndLimitsPage = () => {
    const [activeTab, setActiveTab] = useState('limits'); // 'limits' or 'goals'

    // --- Budgets State ---
    const [budgets, setBudgets] = useState([]);
    const [loadingBudgets, setLoadingBudgets] = useState(true);

    // --- Savings Goals State ---
    const [loadingGoals, setLoadingGoals] = useState(true);
    const [goals, setGoals] = useState([]);
    const [stats, setStats] = useState(null);
    const [aiGoalAnalysis, setAiGoalAnalysis] = useState({});
    const [newGoal, setNewGoal] = useState({
        name: '',
        targetAmount: '',
        targetDate: '',
        priority: 'medium',
    });
    const [showGoalForm, setShowGoalForm] = useState(false);

    // --- Initial Load ---
    useEffect(() => {
        loadBudgets();
        loadGoalsData();
    }, []);

    useEffect(() => {
        if (goals.length > 0 && stats) {
            loadAllAIGoalAnalysis();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [goals, stats]);

    // --- Budget Functions ---
    const loadBudgets = async () => {
        try {
            setLoadingBudgets(true);
            const res = await budgetsAPI.getAll({
                period: 'monthly',
                year: new Date().getFullYear(),
                month: new Date().getMonth() + 1
            });
            setBudgets(res.data);
        } catch (error) {
            console.error('Error loading budgets:', error);
        } finally {
            setLoadingBudgets(false);
        }
    };

    const handleAddBudget = async (budgetData) => {
        const res = await budgetsAPI.create(budgetData);
        setBudgets([...budgets, res.data]);
    };

    const handleUpdateBudget = async (id, budgetData) => {
        const res = await budgetsAPI.update(id, budgetData);
        setBudgets(budgets.map(b => b._id === id ? res.data : b));
    };

    const handleDeleteBudget = async (id) => {
        await budgetsAPI.delete(id);
        setBudgets(budgets.filter(b => b._id !== id));
    };

    // --- Savings Goal Functions ---
    const loadGoalsData = async () => {
        try {
            setLoadingGoals(true);
            // Load stats for calculation
            const response = await transactionsAPI.getStats();
            const statsData = response.data.data || response.data;
            setStats(statsData);

            // Load saved goals from localStorage
            const savedGoals = localStorage.getItem('savingsGoals');
            if (savedGoals) {
                setGoals(JSON.parse(savedGoals));
            }
        } catch (error) {
            console.error('Error loading goals data:', error);
        } finally {
            setLoadingGoals(false);
        }
    };

    const calculateGoalProgress = (goal) => {
        const currentBalance = stats?.balance || 0;
        const progress = Math.min((currentBalance / goal.targetAmount) * 100, 100);
        const remaining = Math.max(goal.targetAmount - currentBalance, 0);

        const targetDate = new Date(goal.targetDate);
        const today = new Date();
        const monthsRemaining = Math.max(
            (targetDate.getFullYear() - today.getFullYear()) * 12 +
            (targetDate.getMonth() - today.getMonth()),
            0
        );

        const monthlySavings = (stats?.totalIncome || 0) - (stats?.totalExpense || 0);
        const requiredMonthly = monthsRemaining > 0 ? remaining / monthsRemaining : 0;
        const isOnTrack = monthlySavings >= requiredMonthly || progress >= 100;

        return {
            progress,
            remaining,
            monthsRemaining,
            requiredMonthly,
            isOnTrack,
        };
    };

    const loadAllAIGoalAnalysis = async () => {
        try {
            const response = await aiAPI.getSavingsGoalAnalysis(goals);
            const analyzedGoals = response.data.goals || [];
            const analysisMap = {};
            analyzedGoals.forEach(goal => {
                analysisMap[goal.id] = goal;
            });
            setAiGoalAnalysis(analysisMap);
        } catch (error) {
            console.error('Error loading AI goal analysis:', error);
        }
    };

    const generateAIOptimizations = (goal, progress) => {
        const optimizations = [];
        if (!progress.isOnTrack && progress.monthsRemaining > 0) {
            optimizations.push({
                type: 'adjustment',
                message: `Increase monthly savings by ${formatCurrency(progress.requiredMonthly - ((stats?.totalIncome || 0) - (stats?.totalExpense || 0)))} to meet your goal.`,
            });
        }
        if (progress.progress < 30) {
            optimizations.push({
                type: 'suggestion',
                message: 'Consider breaking this goal into smaller milestones for better motivation.',
            });
        }
        if (progress.progress >= 100) {
            optimizations.push({
                type: 'success',
                message: 'Congratulations! You\'ve reached your goal. Consider setting a new one!',
            });
        }
        return optimizations;
    };

    const handleAddGoal = () => {
        if (newGoal.name && newGoal.targetAmount && newGoal.targetDate) {
            const goal = {
                id: Date.now(),
                ...newGoal,
                targetAmount: Number(newGoal.targetAmount),
                createdAt: new Date().toISOString(),
            };

            const updatedGoals = [...goals, goal];
            setGoals(updatedGoals);
            localStorage.setItem('savingsGoals', JSON.stringify(updatedGoals));

            setNewGoal({ name: '', targetAmount: '', targetDate: '', priority: 'medium' });
            setShowGoalForm(false);
        }
    };

    const handleDeleteGoal = (id) => {
        const updatedGoals = goals.filter(g => g.id !== id);
        setGoals(updatedGoals);
        localStorage.setItem('savingsGoals', JSON.stringify(updatedGoals));
    };

    const formatCurrency = (amount) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
        }).format(amount);
    };

    return (
        <div className="dashboard-page">
            <div className="page-header">
                <div>
                    <h1>Goals & Limits</h1>
                    <p className="page-subtitle">Manage your spending limits and savings targets in one place</p>
                </div>
            </div>

            {/* Tabs */}
            <div className="transaction-tabs">
                <button
                    className={`tab-btn ${activeTab === 'limits' ? 'active' : ''}`}
                    onClick={() => setActiveTab('limits')}
                >
                    <FaChartPie /> Spending Limits
                </button>
                <button
                    className={`tab-btn ${activeTab === 'goals' ? 'active' : ''}`}
                    onClick={() => setActiveTab('goals')}
                >
                    <FaPiggyBank /> Savings Goals
                </button>
            </div>

            {/* Tab Content */}
            {activeTab === 'limits' ? (
                // --- LIMITS (BUDGETS) CONTENT ---
                <div className="animate-fade-in">
                    {loadingBudgets ? (
                        <div className="page-loading">
                            <div className="spinner"></div>
                            <p>Loading budgets...</p>
                        </div>
                    ) : (
                        <BudgetManager
                            budgets={budgets}
                            onAdd={handleAddBudget}
                            onUpdate={handleUpdateBudget}
                            onDelete={handleDeleteBudget}
                        />
                    )}
                </div>
            ) : (
                // --- GOALS CONTENT ---
                <div className="goals-container animate-fade-in">
                    <div className="transaction-list-header">
                        <h2>Your Savings Targets</h2>
                        <button className="btn-primary" onClick={() => setShowGoalForm(!showGoalForm)}>
                            <FaBullseye /> {showGoalForm ? 'Cancel' : 'Add New Goal'}
                        </button>
                    </div>

                    {showGoalForm && (
                        <div className="analytics-card" style={{ marginBottom: '2rem' }}>
                            <h3 style={{ marginBottom: '1.5rem' }}>Create New Savings Goal</h3>
                            <div className="goal-form">
                                <div className="form-group">
                                    <label>Goal Name</label>
                                    <input
                                        type="text"
                                        value={newGoal.name}
                                        onChange={(e) => setNewGoal({ ...newGoal, name: e.target.value })}
                                        placeholder="e.g., Vacation, Emergency Fund"
                                        className="form-control"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Target Amount</label>
                                    <input
                                        type="number"
                                        value={newGoal.targetAmount}
                                        onChange={(e) => setNewGoal({ ...newGoal, targetAmount: e.target.value })}
                                        placeholder="Enter target amount"
                                        min="0"
                                        className="form-control"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Target Date</label>
                                    <input
                                        type="date"
                                        value={newGoal.targetDate}
                                        onChange={(e) => setNewGoal({ ...newGoal, targetDate: e.target.value })}
                                        className="form-control"
                                    />
                                </div>
                                <div className="form-group">
                                    <label>Priority</label>
                                    <select
                                        value={newGoal.priority}
                                        onChange={(e) => setNewGoal({ ...newGoal, priority: e.target.value })}
                                        className="form-control"
                                    >
                                        <option value="low">Low</option>
                                        <option value="medium">Medium</option>
                                        <option value="high">High</option>
                                    </select>
                                </div>
                                <button className="btn-primary" onClick={handleAddGoal} style={{ marginTop: '1rem' }}>
                                    Create Goal
                                </button>
                            </div>
                        </div>
                    )}

                    {loadingGoals ? (
                        <div className="page-loading">
                            <div className="spinner"></div>
                            <p>Loading goals...</p>
                        </div>
                    ) : goals.length === 0 ? (
                        <div className="analytics-card">
                            <div className="empty-state">
                                <FaBullseye size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                                <p>No savings goals yet. Create your first goal to get started!</p>
                            </div>
                        </div>
                    ) : (
                        <div className="goals-grid">
                            {goals.map((goal) => {
                                const progress = calculateGoalProgress(goal);
                                const aiGoal = aiGoalAnalysis[goal.id];
                                const optimizations = aiGoal?.optimizations || generateAIOptimizations(goal, progress);

                                return (
                                    <div key={goal.id} className="goal-card">
                                        <div className="goal-header">
                                            <div>
                                                <h3>{goal.name}</h3>
                                                <span className={`goal-priority ${goal.priority}`}>{goal.priority}</span>
                                            </div>
                                            <button
                                                className="action-btn delete"
                                                onClick={() => handleDeleteGoal(goal.id)}
                                            >
                                                ×
                                            </button>
                                        </div>

                                        <div className="goal-progress">
                                            <div className="progress-info">
                                                <span className="progress-amount">
                                                    {formatCurrency(progress.remaining <= 0 ? goal.targetAmount : (stats?.balance || 0))} / {formatCurrency(goal.targetAmount)}
                                                </span>
                                                <span className="progress-percentage">{progress.progress.toFixed(1)}%</span>
                                            </div>
                                            <div className="progress-bar">
                                                <div
                                                    className="progress-fill"
                                                    style={{ width: `${progress.progress}%` }}
                                                ></div>
                                            </div>
                                        </div>

                                        <div className="goal-details">
                                            <div className="goal-detail-item">
                                                <span className="detail-label">Remaining</span>
                                                <span className="detail-value">{formatCurrency(progress.remaining)}</span>
                                            </div>
                                            <div className="goal-detail-item">
                                                <span className="detail-label">Months Left</span>
                                                <span className="detail-value">{progress.monthsRemaining}</span>
                                            </div>
                                            <div className="goal-detail-item">
                                                <span className="detail-label">Required Monthly</span>
                                                <span className={`detail-value ${progress.isOnTrack ? 'positive' : 'warning'}`}>
                                                    {formatCurrency(progress.requiredMonthly)}
                                                </span>
                                            </div>
                                            <div className="goal-detail-item">
                                                <span className="detail-label">Status</span>
                                                <span className={`detail-value ${progress.isOnTrack ? 'positive' : 'warning'}`}>
                                                    {progress.isOnTrack ? 'On Track' : 'Needs Attention'}
                                                </span>
                                            </div>
                                        </div>

                                        {optimizations.length > 0 && (
                                            <div className="goal-optimizations">
                                                <h4><FaLightbulb /> AI Recommendations</h4>
                                                {optimizations.map((opt, index) => (
                                                    <div key={index} className={`optimization-item ${opt.type}`}>
                                                        <p>{opt.message}</p>
                                                    </div>
                                                ))}
                                            </div>
                                        )}
                                    </div>
                                );
                            })}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default GoalsAndLimitsPage;
