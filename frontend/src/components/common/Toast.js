// frontend/src/components/Toast.js
import React, { createContext, useContext, useCallback } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import './Toast.css';

const ToastContext = createContext();

export const useToast = () => {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
};

export const ToastProvider = ({ children }) => {
  const showToast = useCallback((message, type = 'info') => {
    const options = {
      position: 'top-right',
      autoClose: 3000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
    };

    switch (type) {
      case 'success':
        toast.success(message, options);
        break;
      case 'error':
        toast.error(message, options);
        break;
      case 'warning':
        toast.warning(message, options);
        break;
      case 'info':
      default:
        toast.info(message, options);
        break;
    }
  }, []);

  const showSuccess = useCallback((message) => showToast(message, 'success'), [showToast]);
  const showError = useCallback((message) => showToast(message, 'error'), [showToast]);
  const showWarning = useCallback((message) => showToast(message, 'warning'), [showToast]);
  const showInfo = useCallback((message) => showToast(message, 'info'), [showToast]);

  return (
    <ToastContext.Provider value={{ showToast, showSuccess, showError, showWarning, showInfo }}>
      {children}
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="colored"
      />
    </ToastContext.Provider>
  );
};

export default ToastProvider;

