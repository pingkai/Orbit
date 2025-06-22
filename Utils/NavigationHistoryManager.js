/**
 * NavigationHistoryManager - Manages navigation history for proper back navigation
 * This utility helps prevent navigation loops and provides intelligent back navigation
 */

class NavigationHistoryManager {
  constructor() {
    this.history = [];
    this.maxHistorySize = 20; // Prevent memory issues
  }

  /**
   * Add a screen to navigation history
   * @param {Object} screenData - Screen information
   * @param {string} screenData.screenName - Name of the screen
   * @param {Object} screenData.params - Screen parameters
   */
  addScreen(screenData) {
    try {
      if (!screenData || !screenData.screenName) {
        console.warn('NavigationHistoryManager: Invalid screen data');
        return;
      }

      const entry = {
        screenName: screenData.screenName,
        params: screenData.params || {},
        timestamp: Date.now(),
        id: `${screenData.screenName}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
      };

      // Add to history
      this.history.push(entry);

      // Trim history if it gets too long
      if (this.history.length > this.maxHistorySize) {
        this.history = this.history.slice(-this.maxHistorySize);
      }

      console.log(`NavigationHistoryManager: Added ${screenData.screenName} to history (${this.history.length} entries)`);
    } catch (error) {
      console.error('NavigationHistoryManager: Error adding screen to history:', error);
    }
  }

  /**
   * Get the previous screen in history
   * @returns {Object|null} Previous screen data or null if none
   */
  getPreviousScreen() {
    try {
      if (this.history.length < 2) {
        return null;
      }

      // Return the second-to-last entry (last entry is current screen)
      return this.history[this.history.length - 2];
    } catch (error) {
      console.error('NavigationHistoryManager: Error getting previous screen:', error);
      return null;
    }
  }

  /**
   * Get back navigation action based on history
   * @param {Object} navigation - React Navigation object
   * @returns {Function} Back navigation function
   */
  getBackNavigationAction(navigation) {
    try {
      const previousScreen = this.getPreviousScreen();
      
      if (!previousScreen) {
        // No history, go to default screen
        return () => {
          console.log('NavigationHistoryManager: No history, navigating to Search');
          navigation.navigate('MainRoute', {
            screen: 'Home',
            params: {
              screen: 'Search'
            }
          });
        };
      }

      // Navigate back to previous screen
      return () => {
        console.log(`NavigationHistoryManager: Navigating back to ${previousScreen.screenName}`);
        
        // Remove current screen from history
        this.history.pop();
        
        // Navigate to previous screen
        if (previousScreen.screenName === 'Search') {
          navigation.navigate('MainRoute', {
            screen: 'Home',
            params: {
              screen: 'Search'
            }
          });
        } else if (previousScreen.screenName === 'ArtistPage') {
          navigation.navigate('MainRoute', {
            screen: 'Home',
            params: {
              screen: 'ArtistPage',
              params: previousScreen.params
            }
          });
        } else if (previousScreen.screenName === 'Album') {
          navigation.navigate('Album', previousScreen.params);
        } else {
          // Default fallback
          navigation.navigate('MainRoute', {
            screen: 'Home',
            params: {
              screen: 'Search'
            }
          });
        }
      };
    } catch (error) {
      console.error('NavigationHistoryManager: Error getting back navigation action:', error);
      
      // Return safe fallback
      return () => {
        navigation.navigate('MainRoute', {
          screen: 'Home',
          params: {
            screen: 'Search'
          }
        });
      };
    }
  }

  /**
   * Clear navigation history
   */
  clearHistory() {
    try {
      this.history = [];
      console.log('NavigationHistoryManager: History cleared');
    } catch (error) {
      console.error('NavigationHistoryManager: Error clearing history:', error);
    }
  }

  /**
   * Get current navigation history
   * @returns {Array} Current history array
   */
  getHistory() {
    return [...this.history]; // Return copy to prevent external modification
  }

  /**
   * Get history length
   * @returns {number} Number of entries in history
   */
  getHistoryLength() {
    return this.history.length;
  }

  /**
   * Check if a specific screen is in history
   * @param {string} screenName - Screen name to check
   * @returns {boolean} True if screen is in history
   */
  hasScreen(screenName) {
    try {
      return this.history.some(entry => entry.screenName === screenName);
    } catch (error) {
      console.error('NavigationHistoryManager: Error checking screen in history:', error);
      return false;
    }
  }

  /**
   * Count occurrences of a screen in history
   * @param {string} screenName - Screen name to count
   * @returns {number} Number of occurrences
   */
  countScreen(screenName) {
    try {
      return this.history.filter(entry => entry.screenName === screenName).length;
    } catch (error) {
      console.error('NavigationHistoryManager: Error counting screen in history:', error);
      return 0;
    }
  }

  /**
   * Remove last occurrence of a specific screen from history
   * @param {string} screenName - Screen name to remove
   */
  removeLastOccurrence(screenName) {
    try {
      for (let i = this.history.length - 1; i >= 0; i--) {
        if (this.history[i].screenName === screenName) {
          this.history.splice(i, 1);
          console.log(`NavigationHistoryManager: Removed last occurrence of ${screenName}`);
          break;
        }
      }
    } catch (error) {
      console.error('NavigationHistoryManager: Error removing screen from history:', error);
    }
  }

  /**
   * Get navigation state for debugging
   * @returns {Object} Current state information
   */
  getDebugInfo() {
    try {
      return {
        historyLength: this.history.length,
        currentScreen: this.history.length > 0 ? this.history[this.history.length - 1].screenName : null,
        previousScreen: this.getPreviousScreen()?.screenName || null,
        fullHistory: this.history.map(entry => ({
          screen: entry.screenName,
          timestamp: new Date(entry.timestamp).toISOString()
        }))
      };
    } catch (error) {
      console.error('NavigationHistoryManager: Error getting debug info:', error);
      return {
        error: 'Failed to get debug info'
      };
    }
  }

  /**
   * Reset history to a specific screen
   * @param {Object} screenData - Screen to reset to
   */
  resetToScreen(screenData) {
    try {
      this.clearHistory();
      this.addScreen(screenData);
      console.log(`NavigationHistoryManager: Reset to ${screenData.screenName}`);
    } catch (error) {
      console.error('NavigationHistoryManager: Error resetting to screen:', error);
    }
  }
}

// Create singleton instance
const navigationHistoryManager = new NavigationHistoryManager();

export default navigationHistoryManager;
