import React, { useState, useEffect } from 'react';
import { FaBell } from 'react-icons/fa';
import { notificationsAPI } from '../../services/api';
import './NotificationBell.css';

const NotificationBell = () => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);

  useEffect(() => {
    loadNotifications();
    // Refresh every 30 seconds
    const interval = setInterval(loadNotifications, 30000);

    // Listen for custom refresh events
    const handleRefresh = () => {
      loadNotifications();
    };
    window.addEventListener('refreshNotifications', handleRefresh);

    return () => {
      clearInterval(interval);
      window.removeEventListener('refreshNotifications', handleRefresh);
    };
  }, []);

  const loadNotifications = async () => {
    try {
      const res = await notificationsAPI.getAll(true); // Get unread only for count
      setUnreadCount(res.data.unreadCount || 0);

      const allRes = await notificationsAPI.getAll(false);
      setNotifications(allRes.data.data || []);
    } catch (error) {
      console.error('Error loading notifications:', error);
    }
  };

  const handleMarkAsRead = async (id) => {
    try {
      await notificationsAPI.markAsRead(id);
      loadNotifications();
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await notificationsAPI.markAllAsRead();
      loadNotifications();
    } catch (error) {
      console.error('Error marking all as read:', error);
    }
  };

  const formatDate = (date) => {
    const now = new Date();
    const notifDate = new Date(date);
    const diffMs = now - notifDate;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return notifDate.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
  };

  return (
    <div className="notification-bell-container">
      <button
        className="notification-bell"
        onClick={() => setShowDropdown(!showDropdown)}
      >
        <FaBell />
        {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
      </button>

      {showDropdown && (
        <>
          <div className="notification-overlay" onClick={() => setShowDropdown(false)} />
          <div className="notification-dropdown">
            <div className="notification-header">
              <h3>Notifications</h3>
              {unreadCount > 0 && (
                <button className="mark-all-read-btn" onClick={handleMarkAllAsRead}>
                  Mark all read
                </button>
              )}
            </div>
            <div className="notification-list">
              {notifications.length === 0 ? (
                <div className="notification-empty">
                  <p>No notifications</p>
                </div>
              ) : (
                notifications.slice(0, 10).map((notif) => (
                  <div
                    key={notif._id}
                    className={`notification-item ${!notif.isRead ? 'unread' : ''}`}
                    onClick={() => {
                      if (!notif.isRead) handleMarkAsRead(notif._id);
                      if (notif.actionUrl) window.location.href = notif.actionUrl;
                    }}
                  >
                    <div className="notification-content">
                      <div className="notification-title">{notif.title}</div>
                      <div className="notification-message">{notif.message}</div>
                      <div className="notification-time">{formatDate(notif.createdAt)}</div>
                    </div>
                    {!notif.isRead && <div className="notification-dot" />}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationBell;


