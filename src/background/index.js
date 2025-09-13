// Background script for Koala Chrome Extension

// Extension installation/update handler
chrome.runtime.onInstalled.addListener((details) => {
  console.log('Koala Extension installed/updated:', details.reason);
  
  // Set default values in storage
  chrome.storage.sync.set({
    count: 0,
    settings: {
      theme: 'light',
      notifications: true
    }
  });
});

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
      
    default:
      console.log('Unknown action:', message.action);
  }
});

// Handle tab updates
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    console.log('Tab updated:', tab.url);
    
    // You can add logic here to inject content scripts on specific pages
    // or perform other actions when pages load
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
