import { useContext } from 'react';
import { useThemeContext } from '../../../Context/ThemeContext';

/**
 * useThemeManager - Custom hook for theme management in music player components
 * 
 * This hook provides easy access to theme-related functionality including:
 * - Current theme and theme mode
 * - Theme-aware styling functions
 * - Dynamic color calculations
 * - Responsive theme utilities
 */

export const useThemeManager = () => {
  const { theme, themeMode } = useThemeContext();
  
  // Theme-aware styling functions
  const getBackgroundOverlay = () => {
    return themeMode === 'light' 
      ? 'rgba(255,255,255,0.1)' 
      : 'rgba(0,0,0,0.44)';
  };

  const getGradientColors = () => {
    return themeMode === 'light' 
      ? ['rgba(255,255,255,0.80)', 'rgba(255,255,255,0.9)', 'rgba(255,255,255,1)']
      : ['rgba(4,4,4,0.23)', 'rgba(9,9,9,0.47)', 'rgba(0,0,0,0.65)', 'rgba(0,0,0,0.89)', 'rgba(0,0,0,0.9)', 'rgba(0,0,0,1)'];
  };

  const getTextColor = (type = 'primary') => {
    switch (type) {
      case 'primary':
        return themeMode === 'light' ? theme.colors.text : 'white';
      case 'secondary':
        return themeMode === 'light' ? '#555555' : '#FFFFFF';
      case 'icon':
        return themeMode === 'light' ? theme.colors.text : theme.colors.icon;
      default:
        return theme.colors.text;
    }
  };

  const getPressedBackgroundColor = () => {
    return themeMode === 'light' 
      ? 'rgba(0, 0, 0, 0.1)' 
      : 'rgba(255, 255, 255, 0.1)';
  };

  const getButtonBackgroundColor = (opacity = 0.1) => {
    return `rgba(255,255,255,${opacity})`;
  };

  const getBorderColor = (opacity = 0.2) => {
    return `rgba(255,255,255,${opacity})`;
  };

  // Dynamic theme styles object
  const getThemeStyles = () => ({
    backgroundOverlay: getBackgroundOverlay(),
    gradientColors: getGradientColors(),
    textColors: {
      primary: getTextColor('primary'),
      secondary: getTextColor('secondary'),
      icon: getTextColor('icon')
    },
    buttonColors: {
      pressed: getPressedBackgroundColor(),
      background: getButtonBackgroundColor(),
      border: getBorderColor()
    },
    isLight: themeMode === 'light',
    isDark: themeMode === 'dark'
  });

  // Utility functions for common theme operations
  const getConditionalStyle = (lightStyle, darkStyle) => {
    return themeMode === 'light' ? lightStyle : darkStyle;
  };

  const getOpacityColor = (baseColor, opacity) => {
    // Helper to add opacity to any color
    if (baseColor.startsWith('#')) {
      // Convert hex to rgba
      const hex = baseColor.replace('#', '');
      const r = parseInt(hex.substr(0, 2), 16);
      const g = parseInt(hex.substr(2, 2), 16);
      const b = parseInt(hex.substr(4, 2), 16);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    }
    return baseColor; // Return as-is if not hex
  };

  return {
    theme,
    themeMode,
    getBackgroundOverlay,
    getGradientColors,
    getTextColor,
    getPressedBackgroundColor,
    getButtonBackgroundColor,
    getBorderColor,
    getThemeStyles,
    getConditionalStyle,
    getOpacityColor,
    isLight: themeMode === 'light',
    isDark: themeMode === 'dark'
  };
};
