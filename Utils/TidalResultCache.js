/**
 * Temporary result caching for Tidal to reduce API calls
 * Stores streaming URLs temporarily for non-preloaded songs
 */

class TidalResultCache {
  constructor() {
    this.streamingUrlCache = new Map();
    this.searchResultCache = new Map();
    this.maxCacheSize = 50; // Limit cache size to prevent memory issues
    this.defaultExpiry = 15 * 60 * 1000; // 15 minutes default expiry
    this.streamingUrlExpiry = 20 * 60 * 1000; // 20 minutes for streaming URLs
    
    // Start cleanup process
    this.startCleanup();
  }

  /**
   * Cache a streaming URL temporarily
   * @param {string} tidalUrl - Original Tidal URL
   * @param {string} streamingUrl - Resolved streaming URL
   */
  cacheStreamingUrl(tidalUrl, streamingUrl) {
    // Clean up if cache is getting too large
    if (this.streamingUrlCache.size >= this.maxCacheSize) {
      this.cleanupOldestEntries(this.streamingUrlCache, Math.floor(this.maxCacheSize / 2));
    }

    this.streamingUrlCache.set(tidalUrl, {
      url: streamingUrl,
      cachedAt: Date.now(),
      expiresAt: Date.now() + this.streamingUrlExpiry,
      accessCount: 0
    });

    console.log(`TidalResultCache: Cached streaming URL for ${tidalUrl}`);
  }

  /**
   * Get cached streaming URL if available
   * @param {string} tidalUrl - Original Tidal URL
   * @returns {string|null} Cached streaming URL or null
   */
  getCachedStreamingUrl(tidalUrl) {
    const cached = this.streamingUrlCache.get(tidalUrl);
    
    if (!cached) {
      return null;
    }

    // Check if expired
    if (Date.now() > cached.expiresAt) {
      this.streamingUrlCache.delete(tidalUrl);
      return null;
    }

    // Update access count and return URL
    cached.accessCount++;
    console.log(`TidalResultCache: Retrieved cached streaming URL for ${tidalUrl} (accessed ${cached.accessCount} times)`);
    return cached.url;
  }

  /**
   * Cache search results temporarily
   * @param {string} searchQuery - Search query
   * @param {Array} results - Search results
   */
  cacheSearchResults(searchQuery, results) {
    // Clean up if cache is getting too large
    if (this.searchResultCache.size >= this.maxCacheSize) {
      this.cleanupOldestEntries(this.searchResultCache, Math.floor(this.maxCacheSize / 2));
    }

    this.searchResultCache.set(searchQuery.toLowerCase(), {
      results: results,
      cachedAt: Date.now(),
      expiresAt: Date.now() + this.defaultExpiry,
      accessCount: 0
    });

    console.log(`TidalResultCache: Cached search results for "${searchQuery}" (${results.length} results)`);
  }

  /**
   * Get cached search results if available
   * @param {string} searchQuery - Search query
   * @returns {Array|null} Cached search results or null
   */
  getCachedSearchResults(searchQuery) {
    const cached = this.searchResultCache.get(searchQuery.toLowerCase());
    
    if (!cached) {
      return null;
    }

    // Check if expired
    if (Date.now() > cached.expiresAt) {
      this.searchResultCache.delete(searchQuery.toLowerCase());
      return null;
    }

    // Update access count and return results
    cached.accessCount++;
    console.log(`TidalResultCache: Retrieved cached search results for "${searchQuery}" (${cached.results.length} results, accessed ${cached.accessCount} times)`);
    return cached.results;
  }

  /**
   * Clean up oldest entries from a cache map
   * @param {Map} cacheMap - Cache map to clean
   * @param {number} removeCount - Number of entries to remove
   */
  cleanupOldestEntries(cacheMap, removeCount) {
    const entries = Array.from(cacheMap.entries());
    
    // Sort by cached time (oldest first)
    entries.sort((a, b) => a[1].cachedAt - b[1].cachedAt);
    
    // Remove oldest entries
    for (let i = 0; i < removeCount && i < entries.length; i++) {
      cacheMap.delete(entries[i][0]);
    }
    
    console.log(`TidalResultCache: Cleaned up ${removeCount} oldest entries`);
  }

  /**
   * Clean up expired entries
   */
  cleanupExpiredEntries() {
    const now = Date.now();
    let cleanedCount = 0;

    // Clean streaming URL cache
    for (const [key, data] of this.streamingUrlCache.entries()) {
      if (now > data.expiresAt) {
        this.streamingUrlCache.delete(key);
        cleanedCount++;
      }
    }

    // Clean search result cache
    for (const [key, data] of this.searchResultCache.entries()) {
      if (now > data.expiresAt) {
        this.searchResultCache.delete(key);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`TidalResultCache: Cleaned up ${cleanedCount} expired entries`);
    }
  }

  /**
   * Start automatic cleanup process
   */
  startCleanup() {
    // Clean up expired entries every 5 minutes
    setInterval(() => {
      this.cleanupExpiredEntries();
    }, 5 * 60 * 1000);
  }

  /**
   * Clear all cached data
   */
  clearAll() {
    this.streamingUrlCache.clear();
    this.searchResultCache.clear();
    console.log('TidalResultCache: Cleared all cached data');
  }

  /**
   * Get cache statistics
   */
  getStats() {
    return {
      streamingUrlCacheSize: this.streamingUrlCache.size,
      searchResultCacheSize: this.searchResultCache.size,
      maxCacheSize: this.maxCacheSize,
      totalCacheSize: this.streamingUrlCache.size + this.searchResultCache.size
    };
  }

  /**
   * Check if a streaming URL is cached
   * @param {string} tidalUrl - Original Tidal URL
   * @returns {boolean} True if cached and not expired
   */
  hasStreamingUrl(tidalUrl) {
    const cached = this.streamingUrlCache.get(tidalUrl);
    return cached && Date.now() <= cached.expiresAt;
  }

  /**
   * Check if search results are cached
   * @param {string} searchQuery - Search query
   * @returns {boolean} True if cached and not expired
   */
  hasSearchResults(searchQuery) {
    const cached = this.searchResultCache.get(searchQuery.toLowerCase());
    return cached && Date.now() <= cached.expiresAt;
  }
}

// Create singleton instance
const tidalResultCache = new TidalResultCache();

export default tidalResultCache;
