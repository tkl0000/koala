import React, { useState, useEffect } from 'react';
import './content.css';

const ContentScript = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [pageInfo, setPageInfo] = useState({
    title: '',
    url: '',
    wordCount: 0
  });
  const [isBlocked, setIsBlocked] = useState(false);

  useEffect(() => {
    // Check if this page should be blocked
    checkIfBlocked();

    // Get page information
    const title = document.title;
    const url = window.location.href;
    const wordCount = document.body.innerText.split(/\s+/).length;

    setPageInfo({ title, url, wordCount });

    // Listen for messages from popup
    const handleMessage = (message, sender, sendResponse) => {
      if (message.action === 'toggleContentScript') {
        setIsVisible(!isVisible);
      }
    };

    chrome.runtime.onMessage.addListener(handleMessage);

    return () => {
      chrome.runtime.onMessage.removeListener(handleMessage);
    };
  }, [isVisible]);

  const checkIfBlocked = () => {
    chrome.storage.sync.get(['interceptConfig', 'blockedSites'], (result) => {
      const config = result.interceptConfig || { enabled: true };
      const blockedSites = result.blockedSites || [];
      
      if (!config.enabled || blockedSites.length === 0) {
        return;
      }

      const currentUrl = window.location.href.toLowerCase();
      console.log('Content script checking URL:', currentUrl);
      console.log('Blocked sites:', blockedSites);

      // Check if the current URL is blocked
      const isBlocked = blockedSites.some(site => {
        const siteUrl = site.url.toLowerCase();
        
        // Remove protocol and www for comparison
        const cleanSiteUrl = siteUrl.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
        const cleanCurrentUrl = currentUrl.replace(/^https?:\/\//, '').replace(/^www\./, '').split('/')[0];
        
        console.log('Content script comparing:', cleanSiteUrl, 'vs', cleanCurrentUrl);
        
        return cleanCurrentUrl === cleanSiteUrl || cleanCurrentUrl.includes(cleanSiteUrl);
      });

      if (isBlocked) {
        console.log('🚫 Content script: This page is blocked!');
        setIsBlocked(true);
        redirectToCustomPage();
      }
    });
  };

  const redirectToCustomPage = () => {
    const customPageUrl = chrome.runtime.getURL('custom-page.html');
    const finalUrl = `${customPageUrl}?original=${encodeURIComponent(window.location.href)}`;
    
    console.log('🔄 Content script redirecting to:', finalUrl);
    
    // Update block statistics
    chrome.storage.sync.get(['blockStats'], (result) => {
      const stats = result.blockStats || { totalBlocked: 0, todayBlocked: 0, lastBlocked: null };
      const today = new Date().toDateString();
      const newStats = {
        totalBlocked: stats.totalBlocked + 1,
        todayBlocked: stats.lastBlocked === today ? stats.todayBlocked + 1 : 1,
        lastBlocked: today
      };
      
      chrome.storage.sync.set({ blockStats: newStats });
    });
    
    // Redirect to custom page
    window.location.href = finalUrl;
  };

  const handleClose = () => {
    setIsVisible(false);
  };

  const handleHighlight = () => {
    // Simple text highlighting functionality
    const selection = window.getSelection();
    if (selection.toString().trim()) {
      const range = selection.getRangeAt(0);
      const span = document.createElement('span');
      span.style.backgroundColor = 'yellow';
      span.style.padding = '2px';
      span.style.borderRadius = '3px';
      
      try {
        range.surroundContents(span);
      } catch (e) {
        // Handle case where selection spans multiple elements
        console.log('Cannot highlight selection that spans multiple elements');
      }
    }
  };

  // If page is blocked, show blocking message
  if (isBlocked) {
    return (
      <div className="blocking-overlay">
        <div className="blocking-message">
          <h2>🚫 Site Blocked</h2>
          <p>This site is in your blocked list.</p>
          <p>Redirecting to custom page...</p>
        </div>
      </div>
    );
  }

  if (!isVisible) {
    return (
      <div className="koala-toggle">
        <button 
          onClick={() => setIsVisible(true)}
          className="toggle-btn"
          title="Open Koala Extension"
        >
          🦥
        </button>
      </div>
    );
  }

  return (
    <div className="koala-content-script">
      <div className="koala-header">
        <h3>🦥 Koala Extension</h3>
        <button onClick={handleClose} className="close-btn">×</button>
      </div>
      
      <div className="koala-content">
        <div className="page-info">
          <h4>Page Information</h4>
          <p><strong>Title:</strong> {pageInfo.title}</p>
          <p><strong>URL:</strong> {pageInfo.url}</p>
          <p><strong>Word Count:</strong> {pageInfo.wordCount}</p>
        </div>

        <div className="actions">
          <button onClick={handleHighlight} className="action-btn">
            Highlight Selection
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContentScript;
