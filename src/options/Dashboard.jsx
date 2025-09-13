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
  const [flashcards, setFlashcards] = useState([]);
  const [newFlashcard, setNewFlashcard] = useState({
    front: '',
    back: '',
    category: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    // Load blocked sites and flashcards
    chrome.storage.sync.get(['blockedSites', 'interceptConfig', 'blockStats', 'flashcards'], (result) => {
      setBlockedSites(result.blockedSites || []);
      console.log(result.interceptConfig?.enabled);
      setIsEnabled(result.interceptConfig?.enabled ?? true);
      console.log(isEnabled);
      setStats(result.blockStats || { totalBlocked: 0, todayBlocked: 0, lastBlocked: null });
      setFlashcards(result.flashcards || []);
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

  const parseCSV = (csvText) => {
    const lines = csvText.split('\n').filter(line => line.trim());
    const flashcards = [];
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // Handle CSV parsing with proper quote handling
      const columns = [];
      let current = '';
      let inQuotes = false;
      
      for (let j = 0; j < line.length; j++) {
        const char = line[j];
        
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === ',' && !inQuotes) {
          columns.push(current.trim());
          current = '';
        } else {
          current += char;
        }
      }
      columns.push(current.trim());
      
      // Remove quotes from the beginning and end of each column
      const cleanColumns = columns.map(col => 
        col.replace(/^"(.*)"$/, '$1').trim()
      );
      
      if (cleanColumns.length >= 2) {
        const front = cleanColumns[0];
        const back = cleanColumns[1];
        const category = cleanColumns[2] || 'Imported';
        
        if (front && back) {
          flashcards.push({
            id: Date.now() + i, // Ensure unique IDs
            front: front,
            back: back,
            category: category
          });
        }
      }
    }
    
    return flashcards;
  };

  const importFlashcardsCSV = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Check file type
    if (!file.name.toLowerCase().endsWith('.csv')) {
      alert('Please select a CSV file.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const csvText = e.target.result;
        const importedFlashcards = parseCSV(csvText);
        
        if (importedFlashcards.length === 0) {
          alert('No valid flashcards found in the CSV file. Please check the format.');
          return;
        }
        
        // Merge with existing flashcards
        const updatedFlashcards = [...flashcards, ...importedFlashcards];
        setFlashcards(updatedFlashcards);
        
        chrome.storage.sync.set({ flashcards: updatedFlashcards }, () => {
          console.log(`Successfully imported ${importedFlashcards.length} flashcards from CSV`);
          alert(`Successfully imported ${importedFlashcards.length} flashcards from CSV!`);
        });
        
        // Reset file input
        event.target.value = '';
        
      } catch (error) {
        console.error('Error importing flashcards:', error);
        alert('Error importing flashcards. Please check the CSV format.');
      }
    };
    
    reader.readAsText(file);
  };

  const addFlashcard = () => {
    if (!newFlashcard.front.trim() || !newFlashcard.back.trim()) {
      alert('Please fill in both front and back of the flashcard');
      return;
    }

    const flashcardToAdd = {
      id: Date.now(),
      front: newFlashcard.front.trim(),
      back: newFlashcard.back.trim(),
      category: newFlashcard.category.trim() || 'General'
    };

    const updatedFlashcards = [...flashcards, flashcardToAdd];
    setFlashcards(updatedFlashcards);
    setNewFlashcard({ front: '', back: '', category: '' });

    chrome.storage.sync.set({ flashcards: updatedFlashcards }, () => {
      console.log('Flashcard added successfully');
    });
  };

  const removeFlashcard = (id) => {
    const updatedFlashcards = flashcards.filter(card => card.id !== id);
    setFlashcards(updatedFlashcards);

    chrome.storage.sync.set({ flashcards: updatedFlashcards }, () => {
      console.log('Flashcard removed successfully');
    });
  };

  return (
    <div className="dashboard">
      <header className="dashboard-header">
        <div className="header-content">
          <h1>🦥 Koala Extension Dashboard</h1>
          <p>Manage your blocked websites and flashcards</p>
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

        <div className="flashcards-section">
          <div className="section-header">
            <h2>📚 Flashcards ({flashcards.length})</h2>
            <div className="section-actions">
              <label className="action-btn secondary">
                📥 Import CSV
                <input
                  type="file"
                  accept=".csv"
                  onChange={importFlashcardsCSV}
                  style={{ display: 'none' }}
                />
              </label>
            </div>
          </div>

          <div className="add-flashcard-section">
            <h3>Add New Flashcard</h3>
            <div className="csv-import-info">
              <p><strong>CSV Import:</strong> Upload a CSV file with format: <code>front,back,category</code></p>
              <p>Example: <code>"What is the capital of France?","Paris","Geography"</code></p>
              <p>Supports Quizlet exports and other CSV formats with question/answer pairs.</p>
            </div>
            <div className="flashcard-form">
              <div className="form-group">
                <label>Front (Question):</label>
                <input
                  type="text"
                  value={newFlashcard.front}
                  onChange={(e) => setNewFlashcard({...newFlashcard, front: e.target.value})}
                  placeholder="Enter the question or front text"
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Back (Answer):</label>
                <input
                  type="text"
                  value={newFlashcard.back}
                  onChange={(e) => setNewFlashcard({...newFlashcard, back: e.target.value})}
                  placeholder="Enter the answer or back text"
                  className="form-input"
                />
              </div>
              <div className="form-group">
                <label>Category (Optional):</label>
                <input
                  type="text"
                  value={newFlashcard.category}
                  onChange={(e) => setNewFlashcard({...newFlashcard, category: e.target.value})}
                  placeholder="e.g., Math, Science, Language"
                  className="form-input"
                />
              </div>
              <button onClick={addFlashcard} className="add-flashcard-btn">
                Add Flashcard
              </button>
            </div>
          </div>

          {flashcards.length === 0 ? (
            <div className="empty-state">
              <div className="empty-icon">📚</div>
              <h3>No flashcards yet</h3>
              <p>Add flashcards above to see them when sites are blocked</p>
            </div>
          ) : (
            <div className="flashcards-grid">
              {flashcards.map((card) => (
                <div key={card.id} className="flashcard-preview">
                  <div className="flashcard-preview-content">
                    <div className="flashcard-preview-front">
                      <strong>Front:</strong> {card.front}
                    </div>
                    <div className="flashcard-preview-back">
                      <strong>Back:</strong> {card.back}
                    </div>
                    <div className="flashcard-preview-category">
                      Category: {card.category}
                    </div>
                  </div>
                  <button 
                    onClick={() => removeFlashcard(card.id)}
                    className="remove-flashcard-btn"
                    title="Remove flashcard"
                  >
                    ✕
                  </button>
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
              <div className="info-icon">📚</div>
              <h3>Flashcard Learning</h3>
              <p>Study with flashcards while sites are blocked. Add your own cards above!</p>
            </div>
            <div className="info-card">
              <div className="info-icon">🔧</div>
              <h3>Easy Management</h3>
              <p>Add, remove, and manage your blocked sites and flashcards from this dashboard.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
