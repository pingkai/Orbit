/**
 * Utility for handling errors globally in the application
 */

// Import native ErrorUtils if available in React Native
const nativeErrorUtils = global.ErrorUtils || null;

/**
 * A wrapper for React Native's ErrorUtils with additional functionality
 * for suppressing and handling certain types of errors
 */
export const ErrorUtils = {
  // Original handler reference
  _originalHandler: null,
  // Current custom handler
  _customHandler: null,

  /**
   * Set a global error handler that will be called before the default handler
   * @param {Function} handler - A function that takes an error and returns true if handled, false otherwise
   * @returns {Object} Subscription object with remove() method
   */
  setGlobalHandler: function(handler) {
    // If no native ErrorUtils, we can't do anything
    if (!nativeErrorUtils) {
      console.warn('Native ErrorUtils not available');
      return null;
    }

    // Store the custom handler
    this._customHandler = handler;

    // If this is the first time setting a handler, save the original
    if (!this._originalHandler) {
      this._originalHandler = nativeErrorUtils.getGlobalHandler();
    }

    // Set our wrapper as the global handler
    nativeErrorUtils.setGlobalHandler((error, isFatal) => {
      // If we have a custom handler and it returns true, the error is handled
      if (this._customHandler && this._customHandler(error, isFatal)) {
        // Error is handled, don't propagate
        return;
      }

      // Otherwise, call the original handler
      if (this._originalHandler) {
        this._originalHandler(error, isFatal);
      }
    });

    // Return a subscription object
    return {
      remove: () => {
        if (this._originalHandler) {
          nativeErrorUtils.setGlobalHandler(this._originalHandler);
        }
        this._customHandler = null;
      }
    };
  },

  /**
   * Get the current global error handler
   * @returns {Function} The current global error handler
   */
  getGlobalHandler: function() {
    return nativeErrorUtils ? nativeErrorUtils.getGlobalHandler() : null;
  },

  /**
   * Handle a specific error with the current custom handler
   * @param {Error} error - The error to handle
   * @param {boolean} isFatal - Whether the error is fatal
   * @returns {boolean} True if the error was handled
   */
  handleError: function(error, isFatal = false) {
    if (this._customHandler) {
      return this._customHandler(error, isFatal);
    }
    return false;
  }
};

export default ErrorUtils; 