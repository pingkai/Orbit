import { useEffect, useCallback } from 'react';
import { BackHandler } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import navigationBreadcrumbs from '../Utils/NavigationBreadcrumbs';

/**
 * Custom hook for managing navigation breadcrumbs
 * This provides a simple way to track navigation history and handle back navigation
 * 
 * @param {Object} options - Configuration options
 * @param {string} options.screenName - Name of the current screen
 * @param {string} options.displayName - Display name for breadcrumbs
 * @param {Object} options.params - Screen parameters
 * @param {string} options.source - Source of navigation
 * @param {boolean} options.enableBackHandler - Whether to enable hardware back button handling
 * @returns {Object} Navigation functions and state
 */
export const useNavigationBreadcrumbs = (options = {}) => {
  const {
    screenName,
    displayName,
    params = {},
    source = 'unknown',
    enableBackHandler = true
  } = options;

  const navigation = useNavigation();

  // Add breadcrumb when screen is focused
  useFocusEffect(
    useCallback(() => {
      if (screenName) {
        navigationBreadcrumbs.addBreadcrumb({
          screenName,
          displayName: displayName || screenName,
          params,
          source
        });
      }
    }, [screenName, displayName, params, source])
  );

  // Handle hardware back button
  useEffect(() => {
    if (!enableBackHandler) return;

    const handleBackPress = () => {
      try {
        console.log(`useNavigationBreadcrumbs: Back pressed on ${screenName}`);

        // Debug: Log current breadcrumbs
        const debugInfo = navigationBreadcrumbs.getDebugInfo();
        console.log('useNavigationBreadcrumbs: Current breadcrumbs:', debugInfo);

        if (navigationBreadcrumbs.canGoBack()) {
          navigationBreadcrumbs.navigateBack(navigation);
          return true; // Prevent default back action
        } else {
          // No breadcrumbs to go back to, allow default behavior or go to safe screen
          console.log('useNavigationBreadcrumbs: No breadcrumbs, going to Search');
          navigation.navigate('MainRoute', {
            screen: 'Home',
            params: { screen: 'Search' }
          });
          return true;
        }
      } catch (error) {
        console.error('useNavigationBreadcrumbs: Error handling back press:', error);
        return false; // Allow default back behavior on error
      }
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);

    return () => {
      backHandler.remove();
    };
  }, [navigation, screenName, enableBackHandler]);

  // Navigate to a screen and add breadcrumb
  const navigateToScreen = useCallback((targetScreenName, targetParams = {}, targetDisplayName = null) => {
    try {
      console.log(`useNavigationBreadcrumbs: Navigating from ${screenName} to ${targetScreenName}`);
      
      // Navigate first
      switch (targetScreenName) {
        case 'ArtistPage':
          navigation.navigate('MainRoute', {
            screen: 'Home',
            params: {
              screen: 'ArtistPage',
              params: targetParams
            }
          });
          break;

        case 'Album':
          navigation.navigate('Album', targetParams);
          break;

        case 'Search':
          navigation.navigate('MainRoute', {
            screen: 'Home',
            params: { screen: 'Search' }
          });
          break;

        default:
          navigation.navigate(targetScreenName, targetParams);
          break;
      }
      
    } catch (error) {
      console.error('useNavigationBreadcrumbs: Error navigating to screen:', error);
    }
  }, [navigation, screenName]);

  // Go back using breadcrumbs
  const goBack = useCallback(() => {
    try {
      if (navigationBreadcrumbs.canGoBack()) {
        navigationBreadcrumbs.navigateBack(navigation);
      } else {
        // Fallback to Search
        navigation.navigate('MainRoute', {
          screen: 'Home',
          params: { screen: 'Search' }
        });
      }
    } catch (error) {
      console.error('useNavigationBreadcrumbs: Error going back:', error);
      // Final fallback
      navigation.navigate('MainRoute', {
        screen: 'Home',
        params: { screen: 'Search' }
      });
    }
  }, [navigation]);

  // Clear breadcrumbs (useful for resetting navigation state)
  const clearBreadcrumbs = useCallback(() => {
    navigationBreadcrumbs.clearBreadcrumbs();
  }, []);

  // Get current breadcrumb path for display
  const getBreadcrumbPath = useCallback(() => {
    return navigationBreadcrumbs.getBreadcrumbPath();
  }, []);

  // Get all breadcrumbs
  const getBreadcrumbs = useCallback(() => {
    return navigationBreadcrumbs.getBreadcrumbs();
  }, []);

  // Check if can go back
  const canGoBack = useCallback(() => {
    return navigationBreadcrumbs.canGoBack();
  }, []);

  // Get debug info
  const getDebugInfo = useCallback(() => {
    return navigationBreadcrumbs.getDebugInfo();
  }, []);

  return {
    // Navigation functions
    navigateToScreen,
    goBack,
    
    // Breadcrumb management
    clearBreadcrumbs,
    getBreadcrumbPath,
    getBreadcrumbs,
    canGoBack,
    
    // Debug
    getDebugInfo,
    
    // Direct access to navigation object
    navigation
  };
};

/**
 * Simplified hook for screens that just need basic breadcrumb tracking
 * @param {string} screenName - Name of the screen
 * @param {string} displayName - Display name for breadcrumbs
 * @param {Object} params - Screen parameters
 * @returns {Object} Basic navigation functions
 */
export const useSimpleBreadcrumbs = (screenName, displayName = null, params = {}) => {
  return useNavigationBreadcrumbs({
    screenName,
    displayName: displayName || screenName,
    params,
    enableBackHandler: true
  });
};

export default useNavigationBreadcrumbs;
