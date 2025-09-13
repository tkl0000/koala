import React, { useState, useEffect } from 'react';

const Popup = () => {
  const [count, setCount] = useState(0);
  const [currentUrl, setCurrentUrl] = useState('');

  useEffect(() => {
    // Get current tab URL
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        setCurrentUrl(tabs[0].url);
      }
    });

    // Load saved count from storage
    chrome.storage.sync.get(['count'], (result) => {
      setCount(result.count || 0);
    });
  }, []);

  const handleIncrement = () => {
    const newCount = count + 1;
    setCount(newCount);
    chrome.storage.sync.set({ count: newCount });
  };

  const handleReset = () => {
    setCount(0);
    chrome.storage.sync.set({ count: 0 });
  };

  const handleOpenOptions = () => {
    chrome.runtime.openOptionsPage();
  };

  return (
    <div className="popup-container">
      <div className="header">
        <h1>🦥 Koala Extension</h1>
      </div>
      
      <div className="content">
        <div className="url-section">
          <h3>Current Page:</h3>
          <p className="url">{currentUrl}</p>
        </div>

        <div className="counter-section">
          <h3>Counter: {count}</h3>
          <div className="buttons">
            <button onClick={handleIncrement} className="btn btn-primary">
              Increment
            </button>
            <button onClick={handleReset} className="btn btn-secondary">
              Reset
            </button>
          </div>
        </div>

        <div className="actions">
          <button onClick={handleOpenOptions} className="btn btn-outline">
            Options
          </button>
        </div>
      </div>
    </div>
  );
};

export default Popup;
