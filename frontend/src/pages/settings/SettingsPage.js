import React, { useState, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { userAPI } from '../../services/api';
import { FaUser, FaLock, FaSave, FaCheckCircle, FaMoon, FaSun, FaWallet } from 'react-icons/fa';
import '../dashboard/DashboardPage.css';

const SettingsPage = () => {
  const { user, loadUser } = useAuth();
  const { toggleTheme, isDark } = useTheme();
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Profile form state
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    spendingLimit: 0,
  });

  // Password form state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || '',
        spendingLimit: user.spendingLimit || 0,
      });
    }
  }, [user]);

  const handleProfileChange = (e) => {
    const { name, value } = e.target;
    setProfileData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setSuccessMessage('');
    setErrorMessage('');
  };

  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setSuccessMessage('');
    setErrorMessage('');
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMessage('');
    setErrorMessage('');

    try {
      await userAPI.updateProfile(profileData);
      await loadUser();
      setSuccessMessage('Profile updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setSuccessMessage('');
    setErrorMessage('');

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setErrorMessage('New passwords do not match');
      setLoading(false);
      return;
    }

    if (passwordData.newPassword.length < 6) {
      setErrorMessage('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      await userAPI.changePassword({
        currentPassword: passwordData.currentPassword,
        newPassword: passwordData.newPassword,
      });
      setSuccessMessage('Password changed successfully!');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (error) {
      setErrorMessage(error.response?.data?.message || 'Failed to change password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <div>
          <h1>Settings</h1>
          <p className="page-subtitle">Manage your account settings and preferences</p>
        </div>
      </div>

      <div className="settings-container">
        {/* Profile Section */}
        <div className="settings-section">
          <div className="settings-section-header">
            <div className="settings-icon">
              <FaUser />
            </div>
            <div>
              <h2>Profile Information</h2>
              <p>Update your personal information</p>
            </div>
          </div>

          <form className="settings-form" onSubmit={handleProfileSubmit}>
            <div className="form-group">
              <label htmlFor="name">Full Name</label>
              <input
                type="text"
                id="name"
                name="name"
                value={profileData.name}
                onChange={handleProfileChange}
                placeholder="Enter your full name"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                type="email"
                id="email"
                name="email"
                value={profileData.email}
                onChange={handleProfileChange}
                placeholder="Enter your email"
                required
              />
            </div>

            {successMessage && (
              <div className="success-message">
                <FaCheckCircle /> {successMessage}
              </div>
            )}

            {errorMessage && (
              <div className="error-message">{errorMessage}</div>
            )}

            <button type="submit" className="btn-primary" disabled={loading}>
              <FaSave /> {loading ? 'Saving...' : 'Save Changes'}
            </button>
          </form>
        </div>

        {/* Spending Preferences Section */}
        <div className="settings-section">
          <div className="settings-section-header">
            <div className="settings-icon">
              <FaWallet />
            </div>
            <div>
              <h2>Spending Preferences</h2>
              <p>Set your monthly spending limits and alerts</p>
            </div>
          </div>

          <form className="settings-form" onSubmit={handleProfileSubmit}>
            <div className="form-group">
              <label htmlFor="spendingLimit">Monthly Spending Limit Alert (₹)</label>
              <input
                type="number"
                id="spendingLimit"
                name="spendingLimit"
                value={profileData.spendingLimit}
                onChange={handleProfileChange}
                placeholder="e.g. 50000"
                min="0"
              />
              <small style={{ color: 'var(--text-secondary)', marginTop: '0.5rem', display: 'block' }}>
                If your total monthly expenses exceed this amount, your dashboard will show a red alert.
                Set to 0 to disable.
              </small>
            </div>

            <button type="submit" className="btn-primary" disabled={loading}>
              <FaSave /> {loading ? 'Saving...' : 'Save Preferences'}
            </button>
          </form>
        </div>

        {/* Password Section */}
        <div className="settings-section">
          <div className="settings-section-header">
            <div className="settings-icon">
              <FaLock />
            </div>
            <div>
              <h2>Change Password</h2>
              <p>Update your password to keep your account secure</p>
            </div>
          </div>

          <form className="settings-form" onSubmit={handlePasswordSubmit}>
            <div className="form-group">
              <label htmlFor="currentPassword">Current Password</label>
              <input
                type="password"
                id="currentPassword"
                name="currentPassword"
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                placeholder="Enter current password"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="newPassword">New Password</label>
              <input
                type="password"
                id="newPassword"
                name="newPassword"
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                placeholder="Enter new password (min 6 characters)"
                required
                minLength="6"
              />
            </div>

            <div className="form-group">
              <label htmlFor="confirmPassword">Confirm New Password</label>
              <input
                type="password"
                id="confirmPassword"
                name="confirmPassword"
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                placeholder="Confirm new password"
                required
                minLength="6"
              />
            </div>

            {successMessage && (
              <div className="success-message">
                <FaCheckCircle /> {successMessage}
              </div>
            )}

            {errorMessage && (
              <div className="error-message">{errorMessage}</div>
            )}

            <button type="submit" className="btn-primary" disabled={loading}>
              <FaLock /> {loading ? 'Updating...' : 'Update Password'}
            </button>
          </form>
        </div>

        {/* Theme Settings Section */}
        <div className="settings-section">
          <div className="settings-section-header">
            <div className="settings-icon">
              {isDark ? <FaMoon /> : <FaSun />}
            </div>
            <div>
              <h2>Appearance</h2>
              <p>Choose your preferred theme</p>
            </div>
          </div>

          <div className="theme-toggle-container">
            <div className="theme-option" onClick={toggleTheme}>
              <div className="theme-info">
                <div className="theme-icon light">
                  <FaSun />
                </div>
                <div>
                  <h3>Light Mode</h3>
                  <p>Clean and bright interface</p>
                </div>
              </div>
              <div className={`theme-radio ${!isDark ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="theme"
                  value="light"
                  checked={!isDark}
                  onChange={toggleTheme}
                />
                <span className="radio-indicator"></span>
              </div>
            </div>

            <div className="theme-option" onClick={toggleTheme}>
              <div className="theme-info">
                <div className="theme-icon dark">
                  <FaMoon />
                </div>
                <div>
                  <h3>Dark Mode</h3>
                  <p>Easy on the eyes, especially at night</p>
                </div>
              </div>
              <div className={`theme-radio ${isDark ? 'active' : ''}`}>
                <input
                  type="radio"
                  name="theme"
                  value="dark"
                  checked={isDark}
                  onChange={toggleTheme}
                />
                <span className="radio-indicator"></span>
              </div>
            </div>
          </div>
        </div>

        {/* Profile Summary Card */}
        <div className="settings-section profile-summary">
          <div className="settings-section-header">
            <div className="settings-icon">
              <FaUser />
            </div>
            <div>
              <h2>Account Summary</h2>
              <p>Your account details</p>
            </div>
          </div>

          <div className="profile-details">
            <div className="profile-detail-item">
              <span className="detail-label">Name</span>
              <span className="detail-value">{user?.name || 'N/A'}</span>
            </div>
            <div className="profile-detail-item">
              <span className="detail-label">Email</span>
              <span className="detail-value">{user?.email || 'N/A'}</span>
            </div>
            <div className="profile-detail-item">
              <span className="detail-label">User ID</span>
              <span className="detail-value">{user?._id || 'N/A'}</span>
            </div>
            <div className="profile-detail-item">
              <span className="detail-label">Account Status</span>
              <span className="detail-value status-active">Active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;

