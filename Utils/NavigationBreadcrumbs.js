/**
 * NavigationBreadcrumbs - Simple breadcrumb-based navigation system
 * This replaces the complex NavigationHistoryManager with a simpler approach
 * that tracks the user's navigation path like breadcrumbs
 */

class NavigationBreadcrumbs {
  constructor() {
    this.breadcrumbs = [];
    this.maxBreadcrumbs = 10; // Reasonable limit
  }

  /**
   * Add a breadcrumb to the navigation path
   * @param {Object} breadcrumb - Breadcrumb information
   * @param {string} breadcrumb.screenName - Name of the screen
   * @param {string} breadcrumb.displayName - Display name for the breadcrumb
   * @param {Object} breadcrumb.params - Screen parameters
   * @param {string} breadcrumb.source - Where this navigation came from
   */
  addBreadcrumb(breadcrumb) {
    try {
      if (!breadcrumb || !breadcrumb.screenName) {
        console.warn('NavigationBreadcrumbs: Invalid breadcrumb data');
        return;
      }

      const newBreadcrumb = {
        screenName: breadcrumb.screenName,
        displayName: breadcrumb.displayName || breadcrumb.screenName,
        params: breadcrumb.params || {},
        source: breadcrumb.source || 'unknown',
        timestamp: Date.now(),
        id: `${breadcrumb.screenName}_${Date.now()}`
      };

      // Check if we're going back to a previous breadcrumb
      const existingIndex = this.breadcrumbs.findIndex(b => 
        b.screenName === breadcrumb.screenName && 
        JSON.stringify(b.params) === JSON.stringify(breadcrumb.params)
      );

      if (existingIndex !== -1) {
        // User is going back to a previous screen, trim breadcrumbs after that point
        this.breadcrumbs = this.breadcrumbs.slice(0, existingIndex + 1);
        console.log(`NavigationBreadcrumbs: Went back to ${breadcrumb.displayName}, trimmed breadcrumbs`);
      } else {
        // New screen, add to breadcrumbs
        this.breadcrumbs.push(newBreadcrumb);
        
        // Trim if too many breadcrumbs
        if (this.breadcrumbs.length > this.maxBreadcrumbs) {
          this.breadcrumbs = this.breadcrumbs.slice(-this.maxBreadcrumbs);
        }
        
        console.log(`NavigationBreadcrumbs: Added ${breadcrumb.displayName} (${this.breadcrumbs.length} breadcrumbs)`);
      }

      this.logBreadcrumbs();
    } catch (error) {
      console.error('NavigationBreadcrumbs: Error adding breadcrumb:', error);
    }
  }

  /**
   * Get the previous breadcrumb (where to go back to)
   * @returns {Object|null} Previous breadcrumb or null if none
   */
  getPreviousBreadcrumb() {
    try {
      if (this.breadcrumbs.length < 2) {
        return null;
      }
      return this.breadcrumbs[this.breadcrumbs.length - 2];
    } catch (error) {
      console.error('NavigationBreadcrumbs: Error getting previous breadcrumb:', error);
      return null;
    }
  }

  /**
   * Get current breadcrumb
   * @returns {Object|null} Current breadcrumb or null if none
   */
  getCurrentBreadcrumb() {
    try {
      if (this.breadcrumbs.length === 0) {
        return null;
      }
      return this.breadcrumbs[this.breadcrumbs.length - 1];
    } catch (error) {
      console.error('NavigationBreadcrumbs: Error getting current breadcrumb:', error);
      return null;
    }
  }

  /**
   * Navigate back to previous breadcrumb
   * @param {Object} navigation - React Navigation object
   */
  navigateBack(navigation) {
    try {
      const previous = this.getPreviousBreadcrumb();
      
      if (!previous) {
        // No previous breadcrumb, go to default
        console.log('NavigationBreadcrumbs: No previous breadcrumb, going to Search');
        navigation.navigate('MainRoute', {
          screen: 'Home',
          params: { screen: 'Search' }
        });
        return;
      }

      // Remove current breadcrumb
      this.breadcrumbs.pop();
      
      console.log(`NavigationBreadcrumbs: Navigating back to ${previous.displayName}`);
      
      // Navigate to previous screen
      this.navigateToScreen(navigation, previous);
      
    } catch (error) {
      console.error('NavigationBreadcrumbs: Error navigating back:', error);
      // Fallback to Search
      navigation.navigate('MainRoute', {
        screen: 'Home',
        params: { screen: 'Search' }
      });
    }
  }

  /**
   * Navigate to a specific screen based on breadcrumb
   * @param {Object} navigation - React Navigation object
   * @param {Object} breadcrumb - Breadcrumb to navigate to
   */
  navigateToScreen(navigation, breadcrumb) {
    try {
      switch (breadcrumb.screenName) {
        case 'Search':
          navigation.navigate('MainRoute', {
            screen: 'Home',
            params: { screen: 'Search' }
          });
          break;

        case 'ArtistPage':
          navigation.navigate('MainRoute', {
            screen: 'Home',
            params: {
              screen: 'ArtistPage',
              params: breadcrumb.params
            }
          });
          break;

        case 'Album':
          navigation.navigate('Album', breadcrumb.params);
          break;
          
        case 'FullScreenMusic':
          // Special case - don't navigate to FullScreenMusic, go to previous instead
          const prevBreadcrumb = this.getPreviousBreadcrumb();
          if (prevBreadcrumb) {
            this.navigateToScreen(navigation, prevBreadcrumb);
          } else {
            navigation.navigate('MainRoute', {
              screen: 'Home',
              params: { screen: 'Search' }
            });
          }
          break;
          
        default:
          // Default fallback
          navigation.navigate('MainRoute', {
            screen: 'Home',
            params: { screen: 'Search' }
          });
          break;
      }
    } catch (error) {
      console.error('NavigationBreadcrumbs: Error navigating to screen:', error);
      navigation.navigate('MainRoute', {
        screen: 'Home',
        params: { screen: 'Search' }
      });
    }
  }

  /**
   * Clear all breadcrumbs
   */
  clearBreadcrumbs() {
    try {
      this.breadcrumbs = [];
      console.log('NavigationBreadcrumbs: Cleared all breadcrumbs');
    } catch (error) {
      console.error('NavigationBreadcrumbs: Error clearing breadcrumbs:', error);
    }
  }

  /**
   * Get all breadcrumbs for display
   * @returns {Array} Array of breadcrumbs
   */
  getBreadcrumbs() {
    return [...this.breadcrumbs];
  }

  /**
   * Get breadcrumb path as string for debugging
   * @returns {string} Breadcrumb path
   */
  getBreadcrumbPath() {
    try {
      return this.breadcrumbs.map(b => b.displayName).join(' > ');
    } catch (error) {
      console.error('NavigationBreadcrumbs: Error getting breadcrumb path:', error);
      return 'Error getting path';
    }
  }

  /**
   * Log current breadcrumbs for debugging
   */
  logBreadcrumbs() {
    try {
      const path = this.getBreadcrumbPath();
      console.log(`NavigationBreadcrumbs: Current path: ${path} (${this.breadcrumbs.length} breadcrumbs)`);
      console.log('NavigationBreadcrumbs: Full breadcrumbs:', this.breadcrumbs.map(b => ({
        screen: b.screenName,
        display: b.displayName,
        source: b.source
      })));
    } catch (error) {
      console.error('NavigationBreadcrumbs: Error logging breadcrumbs:', error);
    }
  }

  /**
   * Check if we can go back
   * @returns {boolean} True if there's a previous breadcrumb
   */
  canGoBack() {
    return this.breadcrumbs.length > 1;
  }

  /**
   * Get debug information
   * @returns {Object} Debug information
   */
  getDebugInfo() {
    try {
      return {
        breadcrumbCount: this.breadcrumbs.length,
        currentScreen: this.getCurrentBreadcrumb()?.displayName || 'None',
        previousScreen: this.getPreviousBreadcrumb()?.displayName || 'None',
        fullPath: this.getBreadcrumbPath(),
        canGoBack: this.canGoBack()
      };
    } catch (error) {
      console.error('NavigationBreadcrumbs: Error getting debug info:', error);
      return { error: 'Failed to get debug info' };
    }
  }
}

// Create singleton instance
const navigationBreadcrumbs = new NavigationBreadcrumbs();

export default navigationBreadcrumbs;
