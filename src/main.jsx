// Disable all console methods in production
if (process.env.NODE_ENV === 'production') {
  // Override console methods
  Object.keys(console).forEach((method) => {
    console[method] = function () {
      // Do nothing
    };
  });

  // Optional: Disable access to console altogether
  Object.defineProperty(window, 'console', {
    configurable: false,
    get: function () {
      throw new Error('Console access is disabled for security reasons.');
    }
  });
}

// Import React and ReactDOM after disabling console
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';

// Render the application
ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
