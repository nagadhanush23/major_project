import React from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  FaHome,
  FaWallet,
  FaSignOutAlt,
  FaUser,
  FaCog,
  FaDollarSign,
  FaBrain,
  FaBriefcase,
  FaStream,

  FaComments,
  FaSun,
  FaMoon,
  FaCrosshairs
} from 'react-icons/fa';
import { useTheme } from '../context/ThemeContext';
import NotificationBell from '../components/common/NotificationBell';
import './DashboardLayout.css';

const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const { toggleTheme, isDark } = useTheme();
  const location = useLocation();

  const navItems = [
    { path: '/dashboard', icon: FaHome, label: 'Overview' },
    { path: '/dashboard/transactions', icon: FaWallet, label: 'Transactions' },
    { path: '/dashboard/goals-limits', icon: FaCrosshairs, label: 'Goals & Limits' },
    { path: '/dashboard/financial-flow', icon: FaStream, label: 'Financial Flow' },
    { path: '/dashboard/ai-analysis', icon: FaBrain, label: 'AI Analysis' },
    { path: '/dashboard/investment-advisor', icon: FaBriefcase, label: 'Investments' },
    { path: '/dashboard/ai-chat', icon: FaComments, label: 'AI Assistant' },
    { path: '/dashboard/settings', icon: FaCog, label: 'Settings' },
  ];

  return (
    <div className="dashboard-layout">
      <aside className="dashboard-sidebar">
        <div className="sidebar-header">
          <div className="logo">
            <div className="logo-icon">
              <FaDollarSign />
            </div>
            <span className="logo-text">ExpenseEase</span>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navItems.filter(item => item.path !== '/dashboard/settings').map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`nav-item ${isActive ? 'active' : ''}`}
              >
                <Icon className="nav-icon" />
                <span className="nav-label">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      </aside>

      <main className="dashboard-main">
        <div className="dashboard-header">
          <div className="profile-actions">
            <button className="profile-action-btn" onClick={toggleTheme} title={isDark ? "Current: Dark Mode" : "Current: Light Mode"}>
              {isDark ? <FaMoon /> : <FaSun />}
            </button>
            <NotificationBell />
            <Link to="/dashboard/settings" className="profile-action-btn" title="Settings">
              <FaCog />
            </Link>
            <div className="user-profile-circle" title={`${user?.name} (${user?.email})`}>
              <FaUser />
            </div>
            <button className="profile-action-btn logout-action" onClick={logout} title="Logout">
              <FaSignOutAlt />
            </button>
          </div>
        </div>
        <Outlet />
      </main>
    </div>
  );
};

export default DashboardLayout;

