// Global Theme Manager for Koala Extension
// This utility manages dark mode state across all components

class ThemeManager {
  constructor() {
    this.listeners = new Set();
    this.isDarkMode = false;
    this.init();
  }

  init() {
    // Load initial theme state
    this.loadTheme();
    
    // Listen for storage changes from other components
    chrome.storage.onChanged.addListener((changes, namespace) => {
      if (namespace === 'sync' && changes.isDarkMode) {
        this.isDarkMode = changes.isDarkMode.newValue;
        this.applyThemeToDocument();
        this.notifyListeners();
      }
    });
  }

  async loadTheme() {
    return new Promise((resolve) => {
      chrome.storage.sync.get(['isDarkMode'], (result) => {
        this.isDarkMode = result.isDarkMode || false;
        this.applyThemeToDocument();
        this.notifyListeners();
        resolve(this.isDarkMode);
      });
    });
  }

  async setDarkMode(isDark) {
    this.isDarkMode = isDark;
    this.applyThemeToDocument();
    await new Promise((resolve) => {
      chrome.storage.sync.set({ isDarkMode: isDark }, () => {
        console.log('Theme updated globally:', isDark ? 'dark' : 'light');
        resolve();
      });
    });
  }

  toggleDarkMode() {
    this.setDarkMode(!this.isDarkMode);
  }

  getDarkMode() {
    return this.isDarkMode;
  }

  // Subscribe to theme changes
  subscribe(callback) {
    this.listeners.add(callback);
    // Return unsubscribe function
    return () => {
      this.listeners.delete(callback);
    };
  }

  // Notify all listeners of theme changes
  notifyListeners() {
    this.listeners.forEach(callback => {
      try {
        callback(this.isDarkMode);
      } catch (error) {
        console.error('Error in theme listener:', error);
      }
    });
  }

  // Apply theme to document body (for global CSS variables)
  applyThemeToDocument() {
    if (typeof document !== 'undefined') {
      if (this.isDarkMode) {
        document.body.classList.add('dark-mode');
      } else {
        document.body.classList.remove('dark-mode');
      }
    }
  }
}

// Create global instance
const themeManager = new ThemeManager();

// Export for use in components
export default themeManager;

// Also make it available globally for non-module scripts
if (typeof window !== 'undefined') {
  window.themeManager = themeManager;
}
