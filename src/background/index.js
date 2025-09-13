// Background script for Koala Chrome Extension

// Configuration for URL interception
const INTERCEPT_CONFIG = {
  targetWebsite: 'https://example.com', // Change this to your target website
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
    interceptConfig: INTERCEPT_CONFIG
  });

  // Set up web request listener
  setupWebRequestListener();
});

// Function to set up web request listener
function setupWebRequestListener() {
  // Remove existing listener if any
  if (chrome.webRequest.onBeforeRequest.hasListener(handleWebRequest)) {
    chrome.webRequest.onBeforeRequest.removeListener(handleWebRequest);
  }

  // Add new listener
  chrome.webRequest.onBeforeRequest.addListener(
    handleWebRequest,
    { urls: ["<all_urls>"] },
    ["blocking"]
  );
}

// Handle web requests and redirect if needed
function handleWebRequest(details) {
  return new Promise((resolve) => {
    chrome.storage.sync.get(['interceptConfig'], (result) => {
      const config = result.interceptConfig || INTERCEPT_CONFIG;
      
      if (!config.enabled) {
        resolve({ cancel: false });
        return;
      }

      const targetUrl = config.targetWebsite;
      
      // Check if the request is for our target website
      if (details.url.includes(targetUrl) || details.url === targetUrl) {
        console.log(`Intercepting request to: ${details.url}`);
        
        // Get the extension's custom page URL
        const customPageUrl = chrome.runtime.getURL('custom-page.html');
        const finalUrl = `${customPageUrl}?original=${encodeURIComponent(details.url)}`;
        
        console.log(`Redirecting to custom React page: ${finalUrl}`);
        
        // Redirect the tab to our custom React page
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          if (tabs[0]) {
            chrome.tabs.update(tabs[0].id, { url: finalUrl });
          }
        });
        
        resolve({ cancel: true });
      } else {
        resolve({ cancel: false });
      }
    });
  });
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
