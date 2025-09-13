import React, { useState, useEffect } from 'react';

const Popup = () => {
  const [count, setCount] = useState(0);
  const [currentUrl, setCurrentUrl] = useState('');
  const [interceptConfig, setInterceptConfig] = useState({
    targetWebsite: 'https://example.com',
    enabled: true
  });

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

    // Load interception configuration
    chrome.runtime.sendMessage({ action: 'getInterceptConfig' }, (response) => {
      if (response && response.config) {
        setInterceptConfig(response.config);
      }
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

  const handleToggleIntercept = () => {
    const newConfig = { ...interceptConfig, enabled: !interceptConfig.enabled };
    setInterceptConfig(newConfig);
    chrome.runtime.sendMessage({ 
      action: 'updateInterceptConfig', 
      config: newConfig 
    });
  };

  const handleUpdateTargetWebsite = (e) => {
    const newConfig = { ...interceptConfig, targetWebsite: e.target.value };
    setInterceptConfig(newConfig);
    chrome.runtime.sendMessage({ 
      action: 'updateInterceptConfig', 
      config: newConfig 
    });
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

        <div className="intercept-section">
          <h3>URL Interception</h3>
          <div className="intercept-controls">
            <label className="toggle-label">
              <input 
                type="checkbox" 
                checked={interceptConfig.enabled}
                onChange={handleToggleIntercept}
                className="toggle-input"
              />
              <span className="toggle-slider"></span>
              Enable Interception
            </label>
            
            <div className="input-group">
              <label>Target Website:</label>
              <input 
                type="text" 
                value={interceptConfig.targetWebsite}
                onChange={handleUpdateTargetWebsite}
                className="config-input"
                placeholder="https://example.com"
              />
            </div>
            
            <div className="info-text">
              <p>When you visit the target website, you'll see a custom React page instead!</p>
            </div>
          </div>
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
