import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';

/**
 * CacheManager - A utility for managing API response caching
 * 
 * Features:
 * - Cache API responses with configurable expiration
 * - Check for cached data before making API calls
 * - Automatic cache invalidation based on time
 * - Network status detection for offline fallback
 * - Enhanced performance by reducing redundant API calls
 */

// Default cache expiration time (in minutes)
const DEFAULT_CACHE_EXPIRATION = 30;

// Cache groups for batch invalidation
const CACHE_GROUPS = {
  HOME: 'home',
  SEARCH: 'search', 
  SONGS: 'songs',
  PLAYLISTS: 'playlists',
  ALBUMS: 'albums',
  LYRICS: 'lyrics',
  RECOMMENDATIONS: 'recommendations'
};

// Memory cache for search results and playlists/albums
const searchMemoryCache = new Map();
const playlistMemoryCache = new Map();
const albumMemoryCache = new Map();

// Maximum number of items to keep in each memory cache
const MAX_MEMORY_ITEMS = {
  SEARCH: 5,
  PLAYLISTS: 10,
  ALBUMS: 10
};

/**
 * Check if the network is available
 * @returns {Promise<boolean>} Whether network is available
 */
const isNetworkAvailable = async () => {
  try {
    const state = await NetInfo.fetch();
    return state.isConnected && state.isInternetReachable;
  } catch (error) {
    console.error('Error checking network status:', error);
    return false;
  }
};

/**
 * Clean a memory cache to keep it under the size limit
 * @param {Map} cache The memory cache to clean
 * @param {number} maxItems Maximum number of items to keep
 */
const cleanMemoryCache = (cache, maxItems) => {
  if (cache.size <= maxItems) return;
  
  // Find the oldest entries and delete them
  const entries = [...cache.entries()];
  entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
  
  const toRemove = entries.slice(0, entries.length - maxItems);
  for (const [key] of toRemove) {
    cache.delete(key);
  }
};

/**
 * Get data from cache
 * @param {string} key Cache key
 * @returns {Promise<Object|null>} Cached data or null if not found/expired
 */
const getFromCache = async (key) => {
  try {
    // Check memory caches first
    
    // Check search memory cache
    if (key.includes('search_')) {
      const memItem = searchMemoryCache.get(key);
      if (memItem) {
        const { data, timestamp, expiration } = memItem;
        const currentTime = new Date().getTime();
        
        // Check if memory cache has expired
        if (currentTime - timestamp > expiration * 60 * 1000) {
          searchMemoryCache.delete(key);
          return null;
        }
        
        return data;
      }
      return null;
    }
    
    // Check playlist memory cache
    if (key.includes('playlist_')) {
      const memItem = playlistMemoryCache.get(key);
      if (memItem) {
        const { data, timestamp, expiration } = memItem;
        const currentTime = new Date().getTime();
        
        // Check if memory cache has expired
        if (currentTime - timestamp > expiration * 60 * 1000) {
          playlistMemoryCache.delete(key);
          return null;
        }
        
        return data;
      }
    }
    
    // Check album memory cache
    if (key.includes('album_') && !key.includes('album_search_')) {
      const memItem = albumMemoryCache.get(key);
      if (memItem) {
        const { data, timestamp, expiration } = memItem;
        const currentTime = new Date().getTime();
        
        // Check if memory cache has expired
        if (currentTime - timestamp > expiration * 60 * 1000) {
          albumMemoryCache.delete(key);
          return null;
        }
        
        return data;
      }
    }
    
    // If not in memory, try AsyncStorage as fallback
    try {
      const cachedItem = await AsyncStorage.getItem(key);
      
      if (!cachedItem) return null;
      
      const { data, timestamp, expiration } = JSON.parse(cachedItem);
      const currentTime = new Date().getTime();
      
      // Check if cache has expired
      if (currentTime - timestamp > expiration * 60 * 1000) {
        // Cache expired, remove it
        await AsyncStorage.removeItem(key);
        return null;
      }
      
      // Store in memory for faster access next time
      if (key.includes('playlist_')) {
        playlistMemoryCache.set(key, { data, timestamp, expiration });
        cleanMemoryCache(playlistMemoryCache, MAX_MEMORY_ITEMS.PLAYLISTS);
      } else if (key.includes('album_') && !key.includes('album_search_')) {
        albumMemoryCache.set(key, { data, timestamp, expiration });
        cleanMemoryCache(albumMemoryCache, MAX_MEMORY_ITEMS.ALBUMS);
      }
      
      return data;
    } catch (storageError) {
      console.warn('AsyncStorage access failed:', storageError);
      return null;
    }
  } catch (error) {
    console.error(`Error retrieving from cache for key ${key}:`, error);
    return null;
  }
};

/**
 * Save data to cache
 * @param {string} key Cache key
 * @param {Object} data Data to cache
 * @param {number} expiration Expiration time in minutes
 * @param {string|null} group Cache group for batch invalidation
 * @returns {Promise<void>}
 */
const saveToCache = async (key, data, expiration = DEFAULT_CACHE_EXPIRATION, group = null) => {
  try {
    const cacheItem = {
      data,
      timestamp: new Date().getTime(),
      expiration,
      group
    };
    
    // Store search results in memory only
    if (key.includes('search_') || group === CACHE_GROUPS.SEARCH) {
      // Clean up memory cache to stay under limit
      cleanMemoryCache(searchMemoryCache, MAX_MEMORY_ITEMS.SEARCH);
      searchMemoryCache.set(key, cacheItem);
      return;
    }
    
    // Store playlists in memory first
    if (key.includes('playlist_') || group === CACHE_GROUPS.PLAYLISTS) {
      cleanMemoryCache(playlistMemoryCache, MAX_MEMORY_ITEMS.PLAYLISTS);
      playlistMemoryCache.set(key, cacheItem);
    }
    
    // Store albums in memory first
    if ((key.includes('album_') && !key.includes('album_search_')) || 
        (group === CACHE_GROUPS.ALBUMS && !key.includes('search_'))) {
      cleanMemoryCache(albumMemoryCache, MAX_MEMORY_ITEMS.ALBUMS);
      albumMemoryCache.set(key, cacheItem);
    }
    
    // For playlists and albums, we'll try to store in AsyncStorage as well
    // but only if it's not too big and as a best effort (won't fail if storage is full)
    try {
      // Only attempt to store moderate-sized data to prevent SQLite errors
      const dataSize = JSON.stringify(data).length;
      if (dataSize < 500000) { // 500 KB limit per item
        await AsyncStorage.setItem(key, JSON.stringify(cacheItem));
        
        // Add to group index if appropriate
        if (group && group !== CACHE_GROUPS.SEARCH) {
          const groupKey = `cache_group_${group}`;
          const groupItems = await AsyncStorage.getItem(groupKey) || '[]';
          const items = JSON.parse(groupItems);
          
          if (!items.includes(key)) {
            items.push(key);
            // Limit group size to avoid ever-growing lists
            if (items.length > 20) {
              items.splice(0, items.length - 20);
            }
            await AsyncStorage.setItem(groupKey, JSON.stringify(items));
          }
        }
      } else {
        console.log(`Data for ${key} is too large (${dataSize} bytes), keeping in memory only`);
      }
    } catch (storageError) {
      // Ignore storage errors since we have memory cache as backup
      console.warn(`AsyncStorage save failed for ${key}, keeping in memory only:`, storageError.message);
    }
  } catch (error) {
    console.error(`Error saving to cache for key ${key}:`, error);
  }
};

/**
 * Clear all cache or specific group
 * @param {string|null} group Optional group to clear
 * @returns {Promise<void>}
 */
const clearCache = async (group = null) => {
  try {
    // Always clear memory caches appropriately
    if (!group || group === CACHE_GROUPS.SEARCH) {
      searchMemoryCache.clear();
    }
    
    if (!group || group === CACHE_GROUPS.PLAYLISTS) {
      playlistMemoryCache.clear();
    }
    
    if (!group || group === CACHE_GROUPS.ALBUMS) {
      albumMemoryCache.clear();
    }
    
    // Try to clear AsyncStorage as well
    try {
      if (group) {
        // Clear specific group
        const groupKey = `cache_group_${group}`;
        const groupItems = await AsyncStorage.getItem(groupKey) || '[]';
        const items = JSON.parse(groupItems);
        
        // Remove all items in the group
        for (const key of items) {
          await AsyncStorage.removeItem(key);
        }
        
        // Clear the group index
        await AsyncStorage.removeItem(groupKey);
      } else {
        // Get all keys
        const keys = await AsyncStorage.getAllKeys();
        
        // Filter only cache keys (ignore other app settings)
        const cacheKeys = keys.filter(key => 
          key.startsWith('api_cache_') || key.startsWith('cache_group_')
        );
        
        // Clear all cache keys
        if (cacheKeys.length > 0) {
          await AsyncStorage.multiRemove(cacheKeys);
        }
      }
    } catch (storageError) {
      console.warn('AsyncStorage clear failed:', storageError);
    }
  } catch (error) {
    console.error(`Error clearing cache${group ? ` for group ${group}` : ''}:`, error);
  }
};

/**
 * Get data with cache support
 * @param {string} key Cache key
 * @param {Function} fetchFunction Function to call if cache miss
 * @param {number} expiration Cache expiration in minutes
 * @param {string|null} group Cache group
 * @param {boolean} forceRefresh Force refresh from API
 * @returns {Promise<Object>} Data from cache or API
 */
const getCachedData = async (key, fetchFunction, expiration = DEFAULT_CACHE_EXPIRATION, group = null, forceRefresh = false) => {
  try {
    // Prefix all keys for API cache
    const cacheKey = `api_cache_${key}`;
    
    // Adjust expiration based on content type
    if (key.includes('search_') || group === CACHE_GROUPS.SEARCH) {
      expiration = 2; // 2 minutes for search results
    } else if (key.includes('playlist_') || group === CACHE_GROUPS.PLAYLISTS) {
      expiration = 30; // 30 minutes for playlists
    } else if (key.includes('album_') || group === CACHE_GROUPS.ALBUMS) {
      expiration = 60; // 60 minutes for albums
    }
    
    // Check network status
    const isOnline = await isNetworkAvailable();
    
    // If not online, always try to get from cache
    if (!isOnline) {
      const cachedData = await getFromCache(cacheKey);
      if (cachedData) {
        return { ...cachedData, fromCache: true, offline: true };
      } else {
        throw new Error('No network connection and no cached data available');
      }
    }
    
    // If online and not forcing refresh, try cache first
    if (!forceRefresh) {
      const cachedData = await getFromCache(cacheKey);
      if (cachedData) {
        return { ...cachedData, fromCache: true };
      }
    }
    
    // Fetch fresh data
    const freshData = await fetchFunction();
    
    // Save to cache
    await saveToCache(cacheKey, freshData, expiration, group);
    
    return { ...freshData, fromCache: false };
  } catch (error) {
    // If it's a storage error, log it and return the fresh data if available
    if (error.message && (error.message.includes('SQLITE_FULL') || error.message.includes('storage_full'))) {
      console.warn(`Storage full when accessing ${key}, attempting to return raw data`);
      try {
        // Try to fetch data directly and bypass caching
        const freshData = await fetchFunction();
        return { ...freshData, fromCache: false, cacheBypass: true };
      } catch (fetchError) {
        console.error(`Failed to get data for ${key} after cache error:`, fetchError);
        throw fetchError;
      }
    }
    
    console.error(`Error in getCachedData for key ${key}:`, error);
    throw error;
  }
};

export {
  getCachedData,
  clearCache,
  isNetworkAvailable,
  CACHE_GROUPS,
  DEFAULT_CACHE_EXPIRATION
}; 