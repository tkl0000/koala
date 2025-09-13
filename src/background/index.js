// Background script for Koala Chrome Extension

// Configuration for URL interception
const INTERCEPT_CONFIG = {
  enabled: true // Toggle to enable/disable interception
};

// Extension installation/update handler
chrome.runtime.onInstalled.addListener((details) => {
  console.log('Koala Extension installed/updated:', details.reason);
  
  // Set default values in storage
  chrome.storage.sync.set({
    count: 0,
    settings: {
      theme: 'light',
      notifications: true
    },
    interceptConfig: INTERCEPT_CONFIG,
    blockedSites: [],
    blockStats: {
      totalBlocked: 0,
      todayBlocked: 0,
      lastBlocked: null
    }
  });

  // Set up web request listener
  setupWebRequestListener();
});

// Function to set up web request listener (simplified for content script approach)
function setupWebRequestListener() {
  console.log('Background script: Content script will handle blocking');
}

// Handle messages from popup and content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log('Background received message:', message);
  
  switch (message.action) {
    case 'getTabInfo':
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          sendResponse({
            url: tabs[0].url,
            title: tabs[0].title,
            id: tabs[0].id
          });
        }
      });
      return true; // Keep message channel open for async response
      
    case 'incrementCounter':
      chrome.storage.sync.get(['count'], (result) => {
        const newCount = (result.count || 0) + 1;
        chrome.storage.sync.set({ count: newCount });
        sendResponse({ count: newCount });
      });
      return true;
      
    case 'resetCounter':
      chrome.storage.sync.set({ count: 0 });
      sendResponse({ count: 0 });
      break;
      
    case 'toggleContentScript':
      // Send message to content script
      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        if (tabs[0]) {
          chrome.tabs.sendMessage(tabs[0].id, { action: 'toggleContentScript' });
        }
      });
      break;

    case 'updateInterceptConfig':
      // Update interception configuration
      chrome.storage.sync.set({ interceptConfig: message.config }, () => {
        setupWebRequestListener(); // Re-setup listener with new config
        sendResponse({ success: true });
      });
      return true;

    case 'getInterceptConfig':
      // Get current interception configuration
      chrome.storage.sync.get(['interceptConfig'], (result) => {
        sendResponse({ config: result.interceptConfig || INTERCEPT_CONFIG });
      });
      return true;

    case 'getBlockedSites':
      // Get blocked sites list
      chrome.storage.sync.get(['blockedSites'], (result) => {
        sendResponse({ sites: result.blockedSites || [] });
      });
      return true;

    case 'updateBlockedSites':
      // Update blocked sites list
      chrome.storage.sync.set({ blockedSites: message.sites }, () => {
        setupWebRequestListener(); // Re-setup listener with new sites
        sendResponse({ success: true });
      });
      return true;
      
    default:
      console.log('Unknown action:', message.action);
  }
});

// Handle tab updates (simplified - content script handles blocking)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    console.log('Tab updated:', tab.url);
    // Content script will handle blocking logic
  }
});

// Handle browser action click (when popup is not defined)
chrome.action.onClicked.addListener((tab) => {
  console.log('Extension icon clicked on tab:', tab.id);
  
  // If you want to open a new tab instead of popup, uncomment below:
  // chrome.tabs.create({ url: 'https://example.com' });
});

// Context menu setup (optional)
chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'koala-highlight',
    title: 'Highlight with Koala',
    contexts: ['selection']
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId === 'koala-highlight') {
    // Send message to content script to highlight selected text
    chrome.tabs.sendMessage(tab.id, {
      action: 'highlightText',
      text: info.selectionText
    });
  }
});
