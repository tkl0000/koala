import { useState, useEffect } from 'react';
import themeManager from '../utils/themeManager';

// Custom hook for managing theme state across components
export const useTheme = () => {
  const [isDarkMode, setIsDarkMode] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Load initial theme state
    const loadTheme = async () => {
      try {
        const darkMode = await themeManager.loadTheme();
        setIsDarkMode(darkMode);
        setIsLoading(false);
      } catch (error) {
        console.error('Error loading theme:', error);
        setIsLoading(false);
      }
    };

    loadTheme();

    // Subscribe to theme changes
    const unsubscribe = themeManager.subscribe((darkMode) => {
      setIsDarkMode(darkMode);
    });

    // Cleanup subscription on unmount
    return unsubscribe;
  }, []);

  const toggleDarkMode = async () => {
    try {
      await themeManager.toggleDarkMode();
    } catch (error) {
      console.error('Error toggling theme:', error);
    }
  };

  const setDarkMode = async (isDark) => {
    try {
      await themeManager.setDarkMode(isDark);
    } catch (error) {
      console.error('Error setting theme:', error);
    }
  };

  return {
    isDarkMode,
    isLoading,
    toggleDarkMode,
    setDarkMode,
  };
};
