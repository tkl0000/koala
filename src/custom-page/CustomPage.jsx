import React, { useState, useEffect } from 'react';
import './custom-page.css';

const CustomPage = () => {
  const [originalUrl, setOriginalUrl] = useState('');
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    // Get the original URL from URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const original = urlParams.get('original') || 'Unknown';
    setOriginalUrl(original);

    // Update time every second
    const timer = setInterval(() => {
      setTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleGoBack = () => {
    if (originalUrl && originalUrl !== 'Unknown') {
      window.location.href = originalUrl;
    } else {
      window.history.back();
    }
  };

  const handleGoToGoogle = () => {
    window.location.href = 'https://www.google.com';
  };

  const handleGoToGitHub = () => {
    window.location.href = 'https://github.com';
  };

  return (
    <div className="custom-page">
      <div className="custom-header">
        <h1>🦥 Koala Extension Intercepted!</h1>
        <p>This page was loaded by the Koala Chrome Extension</p>
      </div>

      <div className="custom-content">
        <div className="info-card">
          <h2>Page Information</h2>
          <div className="info-item">
            <strong>Original URL:</strong>
            <span className="url">{originalUrl}</span>
          </div>
          <div className="info-item">
            <strong>Current Time:</strong>
            <span className="time">{time.toLocaleString()}</span>
          </div>
          <div className="info-item">
            <strong>Extension Status:</strong>
            <span className="status active">Active</span>
          </div>
        </div>

        <div className="actions-card">
          <h2>Quick Actions</h2>
          <div className="action-buttons">
            <button onClick={handleGoBack} className="action-btn primary">
              ← Go Back to Original
            </button>
            <button onClick={handleGoToGoogle} className="action-btn secondary">
              🔍 Go to Google
            </button>
            <button onClick={handleGoToGitHub} className="action-btn secondary">
              🐙 Go to GitHub
            </button>
          </div>
        </div>

        <div className="features-card">
          <h2>Extension Features</h2>
          <ul className="features-list">
            <li>✅ URL Interception</li>
            <li>✅ Custom React Page</li>
            <li>✅ Real-time Clock</li>
            <li>✅ Quick Navigation</li>
            <li>✅ Beautiful UI</li>
          </ul>
        </div>
      </div>

      <div className="custom-footer">
        <p>Powered by Koala Chrome Extension 🦥</p>
      </div>
    </div>
  );
};

export default CustomPage;
