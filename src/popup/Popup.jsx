import React, { useState, useEffect } from "react";

const Popup = () => {
  const [count, setCount] = useState(0);
  const [currentUrl, setCurrentUrl] = useState("");
  const [interceptConfig, setInterceptConfig] = useState({
    targetWebsite: "https://example.com",
    enabled: true,
  });
  const [blockedSites, setBlockedSites] = useState([]);
  const [blockStats, setBlockStats] = useState({
    totalBlocked: 0,
    todayBlocked: 0,
    lastBlocked: null,
  });
  const [isEnabled, setIsEnabled] = useState(true);
  const [score, setScore] = useState(0);

  useEffect(() => {
    // Get current tab URL
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        setCurrentUrl(tabs[0].url);
      }
    });

    // Load saved count from storage
    chrome.storage.sync.get(["count"], (result) => {
      setCount(result.count || 0);
    });

    // Load interception configuration
    chrome.runtime.sendMessage({ action: "getInterceptConfig" }, (response) => {
      if (response && response.config) {
        setInterceptConfig(response.config);
      }
    });

    // Load blocked sites
    chrome.runtime.sendMessage({ action: "getBlockedSites" }, (response) => {
      if (response && response.sites) {
        setBlockedSites(response.sites);
      }
    });

    // Load block statistics
    chrome.storage.sync.get(["blockStats"], (result) => {
      if (result.blockStats) {
        setBlockStats(result.blockStats);
      }
    });

    // Load score
    chrome.storage.sync.get(["score"], (result) => {
      setScore(result.score || 0);
    });

    // Load extension enabled state
    chrome.storage.sync.get(["interceptConfig"], (result) => {
      if (result.interceptConfig) {
        setIsEnabled(result.interceptConfig.enabled ?? true);
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

  const resetScore = () => {
      setScore(0);
      chrome.storage.sync.set({ score: 0 }, () => {
        console.log("Score reset successfully");
      });
  };

  const toggleExtension = () => {
    if (isEnabled) {
      if (!confirm("Are you sure? This will reset your Koala Kudos!")) return;
      else {
        resetScore();
      }
    }

    const newEnabled = !isEnabled;
    setIsEnabled(newEnabled);

    chrome.storage.sync.set(
      {
        interceptConfig: {
          enabled: newEnabled,
          targetWebsite: interceptConfig.targetWebsite,
        },
      },
      () => {
        console.log("Extension toggled:", newEnabled);
      }
    );
  };

  const handleToggleIntercept = () => {
    const newConfig = { ...interceptConfig, enabled: !interceptConfig.enabled };
    setInterceptConfig(newConfig);
    chrome.runtime.sendMessage({
      action: "updateInterceptConfig",
      config: newConfig,
    });
  };

  const handleUpdateTargetWebsite = (e) => {
    const newConfig = { ...interceptConfig, targetWebsite: e.target.value };
    setInterceptConfig(newConfig);
    chrome.runtime.sendMessage({
      action: "updateInterceptConfig",
      config: newConfig,
    });
  };

  return (
    <div className="popup-container">
      <div className="header">
        <h1>🦥 Koala</h1>
        {/* Tailwind Test Button */}
        {/* <button className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded mb-2">
          Tailwind Test Button
        </button> */}
      </div>

      <div className="content">
        {/* <div className="url-section">
          <h3>Current Page:</h3>
          <p className="url">{currentUrl}</p>
        </div> */}

        <div className="extension-toggle-section">
          <label className="toggle-container">
            <input
              type="checkbox"
              checked={isEnabled}
              onChange={toggleExtension}
              className="toggle-input"
            />
            <span className="toggle-slider"></span>
            <span className="toggle-label">
              {isEnabled ? "Extension Active" : "Extension Disabled"}
            </span>
          </label>
        </div>

        <div className="stats-section">
          <h3>Stats</h3>
          <div className="stats-grid">
            <div className="stat-item">
              <span className="stat-label">Sites Blocked:</span>
              <span className="stat-value">{blockedSites.length}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Total Blocks:</span>
              <span className="stat-value">{blockStats.totalBlocked}</span>
            </div>
            <div className="stat-item">
              <span className="stat-label">Koala Kudos:</span>
              <span className={`stat-value ${score >= 0 ? 'positive-score' : 'negative-score'}`}>
                {score}
              </span>
            </div>
          </div>
        </div>

        {/* <div className="intercept-section">
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
        </div> */}

        <div className="actions">
          <button onClick={handleOpenOptions} className="btn btn-outline">
            Open Dashboard
          </button>
          {/* <button onClick={resetScore} className="btn btn-danger">
            Reset Points
          </button> */}
        </div>
      </div>
    </div>
  );
};

export default Popup;
