import React, { useState, useEffect } from 'react';
import './dashboard.css';

const Dashboard = () => {
  const [blockedSites, setBlockedSites] = useState([]);
  const [newSite, setNewSite] = useState('');
  const [isEnabled, setIsEnabled] = useState(true);
  const [stats, setStats] = useState({
    totalBlocked: 0,
    todayBlocked: 0,
    lastBlocked: null
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    // Load blocked sites
    chrome.storage.sync.get(['blockedSites', 'interceptConfig', 'blockStats'], (result) => {
      setBlockedSites(result.blockedSites || []);
      setIsEnabled(result.interceptConfig?.enabled || true);
      setStats(result.blockStats || { totalBlocked: 0, todayBlocked: 0, lastBlocked: null });
    });
  };

  const addSite = () => {
    if (!newSite.trim()) return;

    const siteToAdd = newSite.trim().toLowerCase();
    
    // Basic URL validation
    if (!siteToAdd.includes('.') && !siteToAdd.startsWith('http')) {
      alert('Please enter a valid website (e.g., facebook.com or https://facebook.com)');
      return;
    }

    // Check if site already exists
    if (blockedSites.some(site => site.url === siteToAdd)) {
      alert('This website is already in your blocked list!');
      return;
    }

    const newBlockedSite = {
      id: Date.now(),
      url: siteToAdd,
      name: extractDomainName(siteToAdd),
      addedDate: new Date().toISOString(),
      blockedCount: 0
    };

    const updatedSites = [...blockedSites, newBlockedSite];
    setBlockedSites(updatedSites);
    setNewSite('');

    // Save to storage
    chrome.storage.sync.set({ blockedSites: updatedSites }, () => {
      console.log('Site added to blocked list');
    });
  };

  const removeSite = (id) => {
    const updatedSites = blockedSites.filter(site => site.id !== id);
    setBlockedSites(updatedSites);

    chrome.storage.sync.set({ blockedSites: updatedSites }, () => {
      console.log('Site removed from blocked list');
    });
  };

  const toggleExtension = () => {
    const newEnabled = !isEnabled;
    setIsEnabled(newEnabled);

    chrome.storage.sync.set({ 
      interceptConfig: { 
        enabled: newEnabled,
        blockedSites: blockedSites 
      } 
    }, () => {
      console.log('Extension toggled:', newEnabled);
    });
  };

  const extractDomainName = (url) => {
    try {
      const domain = url.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
      return domain.charAt(0).toUpperCase() + domain.slice(1);
    } catch {
      return url;
    }
  };

  const clearAllSites = () => {
    if (window.confirm('Are you sure you want to clear all blocked sites?')) {
      setBlockedSites([]);
      chrome.storage.sync.set({ blockedSites: [] }, () => {
        console.log('All sites cleared');
      });
    }
  };

  const exportSites = () => {
    const dataStr = JSON.stringify(blockedSites, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'koala-blocked-sites.json';
    link.click();
    URL.revokeObjectURL(url);
  };

  const importSites = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const importedSites = JSON.parse(e.target.result);
        if (Array.isArray(importedSites)) {
          setBlockedSites(importedSites);
          chrome.storage.sync.set({ blockedSites: importedSites }, () => {
            console.log('Sites imported successfully');
          });
        }
      } catch (error) {
        alert('Error importing sites. Please check the file format.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>🦥 Koala Extension Dashboard</h1>
          <p>Manage your blocked websites and extension settings</p>
        </div>
        <div className="header-stats">
          <div className="stat-item">
            <span className="stat-number">{blockedSites.length}</span>
            <span className="stat-label">Sites Blocked</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{stats.totalBlocked}</span>
            <span className="stat-label">Total Blocks</span>
          </div>
        </div>
      </header>

      <div className="dashboard-content">
        <div className="main-controls">
          <div className="extension-toggle">
            <label className="toggle-container">
              <input 
                type="checkbox" 
                checked={isEnabled}
                onChange={toggleExtension}
                className="toggle-input"
              />
              <span className="toggle-slider"></span>
              <span className="toggle-label">
                {isEnabled ? 'Extension Active' : 'Extension Disabled'}
              </span>
            </label>
          </div>

          <div className="add-site-section">
            <h2>Add New Site to Block</h2>
            <div className="add-site-form">
              <input
                type="text"
                value={newSite}
                onChange={(e) => setNewSite(e.target.value)}
                placeholder="Enter website (e.g., facebook.com, twitter.com)"
                className="site-input"
                onKeyPress={(e) => e.key === 'Enter' && addSite()}
              />
              <button onClick={addSite} className="add-btn">
                Add Site
              </button>
            </div>
          </div>
        </div>

        <div className="blocked-sites-section">
          <div className="section-header">
            <h2>Blocked Websites ({blockedSites.length})</h2>
            <div className="section-actions">
              <button onClick={exportSites} className="action-btn secondary">
                Export
              </button>
              <label className="action-btn secondary">
                Import
                <input
                  type="file"
                  accept=".json"
                  onChange={importSites}
                  style={{ display: 'none' }}
                />
              </label>
              <button onClick={clearAllSites} className="action-btn danger">
                Clear All
              </button>
            </div>
          </div>

          {blockedSites.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">🚫</div>
              <h3>No sites blocked yet</h3>
              <p>Add websites above to start blocking them</p>
            </div>
          ) : (
            <div className="sites-grid">
              {blockedSites.map((site) => (
                <div key={site.id} className="site-card">
                  <div className="site-info">
                    <div className="site-name">{site.name}</div>
                    <div className="site-url">{site.url}</div>
                    <div className="site-meta">
                      Added: {new Date(site.addedDate).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="site-actions">
                    <button 
                      onClick={() => removeSite(site.id)}
                      className="remove-btn"
                      title="Remove site"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="info-section">
          <h2>How It Works</h2>
          <div className="info-cards">
            <div className="info-card">
              <div className="info-icon">🎯</div>
              <h3>Target Blocking</h3>
              <p>When you visit any of the blocked websites, you'll see a custom React page instead.</p>
            </div>
            <div className="info-card">
              <div className="info-icon">⚡</div>
              <h3>Instant Redirect</h3>
              <p>The extension intercepts the request and immediately shows your custom page.</p>
            </div>
            <div className="info-card">
              <div className="info-icon">🔧</div>
              <h3>Easy Management</h3>
              <p>Add, remove, and manage your blocked sites from this dashboard.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
