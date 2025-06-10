import * as RNFS from 'react-native-fs';
import { Platform } from 'react-native';
import { analyticsService, AnalyticsEvents } from './AnalyticsUtils';

/**
 * Ensures that a path is converted to a string, with fallbacks for object paths
 * @param {any} path - Path that might be an object or string
 * @returns {string} A string representation of the path
 */
export const safePath = (path) => {
  // Handle null, undefined or empty values
  if (path === null || path === undefined) {
    console.warn('NULL or undefined path provided to safePath');
    return '';
  }
  
  // If it's already a string, just return it
  if (typeof path === 'string') {
    return path;
  }
  
  // Special handling for path objects
  try {
    // Log object type for debugging - will help identify the issue
    console.log('Received non-string path:', 
      typeof path, 
      path && path.constructor ? path.constructor.name : 'unknown'
    );
    
    // If it's an array, return empty string to prevent errors
    if (Array.isArray(path)) {
      console.warn('Array provided as path, returning empty string');
      return '';
    }
    
    // Handle specific file objects from RNFS
    if (path.path && typeof path.path === 'string') {
      return path.path;
    }
    
    // Handle file objects that may have a name property too
    if (path.name && typeof path.name === 'string') {
      if (path.path && typeof path.path === 'string') {
        return path.path;
      }
    }
    
    // Handle URI objects (like image sources)
    if (path.uri && typeof path.uri === 'string') {
      return path.uri;
    }
    
    // Handle Promise objects - this could be causing the error
    if (path instanceof Promise || (path.then && typeof path.then === 'function')) {
      console.warn('Promise provided as path, returning empty string to prevent errors');
      return '';
    }
    
    // Try to convert to string without calling methods that might throw
    try {
      if (path.toString && typeof path.toString === 'function' && 
          path.toString !== Object.prototype.toString) {
        const result = path.toString();
        if (typeof result === 'string') {
          return result;
        }
      }
    } catch (stringError) {
      console.warn('toString() failed:', stringError);
      // Continue to next fallback
    }
    
    // Final fallback with extra safety
    try {
      return '' + path; // String coercion
    } catch (coerceError) {
      console.warn('String coercion failed:', coerceError);
      return '';
    }
  } catch (e) {
    console.error('Failed to convert path to string:', e);
    return ''; // Return empty string as fallback
  }
};

/**
 * Safely checks if a file exists, handling non-string paths
 * @param {any} path - Path to check 
 * @returns {Promise<boolean>} True if file exists, false otherwise
 */
export const safeExists = async (path) => {
  try {
    const stringPath = safePath(path);
    if (!stringPath) {
      console.warn('Empty path provided to safeExists');
      return false;
    }
    return await RNFS.exists(stringPath);
  } catch (error) {
    console.error('Error in safeExists:', error);
    return false;
  }
};

/**
 * Safely deletes a file, handling non-string paths and non-existent files
 * @param {any} path - Path to delete
 * @returns {Promise<boolean>} True if successfully deleted or didn't exist
 */
export const safeUnlink = async (path) => {
  try {
    const stringPath = safePath(path);
    if (!stringPath) {
      console.warn('Empty path provided to safeUnlink');
      return false;
    }
    
    try {
      if (await safeExists(stringPath)) {
        await RNFS.unlink(stringPath);
        return true;
      }
      return true; // File didn't exist, so technically "deleted"
    } catch (unlinkError) {
      console.error('Error unlinking file:', unlinkError);
      return false;
    }
  } catch (error) {
    console.error('Error in safeUnlink:', error);
    return false;
  }
};

/**
 * Safely creates a directory, handling non-string paths
 * @param {any} path - Path to create
 * @returns {Promise<boolean>} True if successfully created or already existed
 */
export const safeMkdir = async (path) => {
  try {
    const stringPath = safePath(path);
    if (!stringPath) {
      console.warn('Empty path provided to safeMkdir');
      return false;
    }
    
    try {
      const exists = await safeExists(stringPath);
      if (!exists) {
        await RNFS.mkdir(stringPath);
      }
      return true;
    } catch (mkdirError) {
      console.error('Error creating directory:', mkdirError);
      return false;
    }
  } catch (error) {
    console.error('Error in safeMkdir:', error);
    return false;
  }
};

/**
 * Safely reads a file, handling non-string paths
 * @param {any} path - Path to read
 * @returns {Promise<string|null>} File contents or null if error
 */
export const safeReadFile = async (path, encoding = 'utf8') => {
  try {
    const stringPath = safePath(path);
    if (!stringPath) {
      console.warn('Empty path provided to safeReadFile');
      return null;
    }
    
    try {
      if (await safeExists(stringPath)) {
        const contents = await RNFS.readFile(stringPath, encoding);
        return contents;
      }
      return null; // File doesn't exist
    } catch (readError) {
      console.error('Error reading file:', readError);
      return null;
    }
  } catch (error) {
    console.error('Error in safeReadFile:', error);
    return null;
  }
};

/**
 * Safely writes to a file, handling non-string paths
 * @param {any} path - Path to write to
 * @param {string} contents - Contents to write
 * @returns {Promise<boolean>} True if successfully written
 */
export const safeWriteFile = async (path, contents, encoding = 'utf8') => {
  try {
    const stringPath = safePath(path);
    if (!stringPath) {
      console.warn('Empty path provided to safeWriteFile');
      return false;
    }
    
    try {
      await RNFS.writeFile(stringPath, contents, encoding);
      return true;
    } catch (writeError) {
      console.error('Error writing file:', writeError);
      return false;
    }
  } catch (error) {
    console.error('Error in safeWriteFile:', error);
    return false;
  }
};

/**
 * Safely downloads a file, handling non-string paths
 * @param {string} url - URL to download from
 * @param {any} path - Path to save to
 * @returns {Promise<boolean>} True if successfully downloaded
 */
export const safeDownloadFile = async (url, path) => {
  const stringPath = safePath(path);
  try {
    if (!url || typeof url !== 'string') {
      console.warn('Invalid URL provided to safeDownloadFile');
      return false;
    }

    if (!stringPath) {
      console.warn('Empty path provided to safeDownloadFile');
      return false;
    }

    const result = await RNFS.downloadFile({
      fromUrl: url,
      toFile: stringPath,
    }).promise;

    if (result.statusCode === 200) {
      if (Platform.OS === 'android') {
        try {
          await RNFS.scanFile(stringPath);
        } catch (scanError) {
          console.warn(`Failed to scan file ${stringPath}:`, scanError);
        }
      }
      return true;
    } else {
      console.error(`Download failed with status code: ${result.statusCode}`);
      await safeUnlink(stringPath);
      return false;
    }
  } catch (error) {
    console.error('Error in safeDownloadFile:', error);
    await safeUnlink(stringPath);
    return false;
  }
};

/**
 * Downloads a file with analytics tracking
 * @param {string} url - URL to download from
 * @param {any} path - Path to save to
 * @param {Object} metadata - Metadata about the content being downloaded
 * @returns {Promise<boolean>} True if successfully downloaded
 */
export const downloadFileWithAnalytics = async (url, path, metadata = {}) => {
  const { id, name, type = 'song' } = metadata;
  
  try {
    // Track download start
    if (id && name) {
      analyticsService.logDownloadStart(id, type, name);
    }
    
    // Perform the download
    const success = await safeDownloadFile(url, path);
    
    // Track download completion
    if (id && name) {
      analyticsService.logDownloadComplete(id, type, name, success);
    }
    
    return success;
  } catch (error) {
    console.error('Error in downloadFileWithAnalytics:', error);
    
    // Track failed download
    if (id && name) {
      analyticsService.logDownloadComplete(id, type, name, false);
    }
    
    return false;
  }
};

/**
 * Ensures a directory exists with multiple fallback mechanisms
 * @param {string} dirPath - Path of directory to create
 * @returns {Promise<boolean>} Success status
 */
export const ensureDirectoryExists = async (dirPath) => {
  try {
    // Convert to string if needed
    const path = safePath(dirPath);
    if (!path) return false;
    
    try {
      // First check if the directory already exists
      const exists = await safeExists(path);
      if (exists) return true;
      
      // Try to create directory
      await RNFS.mkdir(path);
      console.log(`Created directory: ${path}`);
      return true;
    } catch (firstError) {
      console.error(`First attempt to create directory failed: ${path}`, firstError);
      
      // Second attempt with extra error handling
      try {
        // Try a different approach using mkdirAssets
        if (RNFS.mkdirAssets) {
          await RNFS.mkdirAssets(path, { NSURLIsExcludedFromBackupKey: true });
          return true;
        }
        
        // If that fails, try creating parent directories recursively
        const parts = path.split('/');
        let currentPath = '';
        
        for (let i = 1; i < parts.length; i++) {
          currentPath += '/' + parts[i];
          try {
            const exists = await RNFS.exists(currentPath);
            if (!exists) {
              await RNFS.mkdir(currentPath);
            }
          } catch (e) {
            // Ignore errors on individual directories
          }
        }
        
        // Check if our target directory was created
        return await RNFS.exists(path);
      } catch (secondError) {
        console.error(`All attempts to create directory failed: ${path}`, secondError);
        return false;
      }
    }
  } catch (error) {
    console.error('Error in ensureDirectoryExists:', error);
    return false;
  }
}; 