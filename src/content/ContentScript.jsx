import React, { useState, useEffect } from 'react';
import './content.css';

const ContentScript = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [pageInfo, setPageInfo] = useState({
    title: '',
    url: '',
    wordCount: 0
  });

  useEffect(() => {
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
