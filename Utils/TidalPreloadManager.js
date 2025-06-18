import { getTidalStreamingUrl } from '../Api/TidalAPI';

/**
 * Intelligent Tidal preloading manager to prevent rate limiting
 * Only preloads top 3 songs and manages request queue
 */
class TidalPreloadManager {
  constructor() {
    this.preloadQueue = [];
    this.preloadedUrls = new Map(); // Cache preloaded URLs
    this.tempCachedUrls = new Map(); // Temporary cache for non-preloaded URLs
    this.isProcessing = false;
    this.requestCount = 0;
    this.lastRequestTime = 0;
    this.maxRequestsPerMinute = 3; // Tidal API limit
    this.requestInterval = 60000; // 1 minute in milliseconds
    this.maxPreloadCount = 3; // Only preload top 3 songs
    this.currentPreloadCount = 0;

    // Enhanced caching strategy
    this.tempCacheExpiry = 10 * 60 * 1000; // 10 minutes for temp cache
    this.preloadCacheExpiry = 15 * 60 * 1000; // 15 minutes for preloaded URLs

    // Proxy rotation for rate limit bypass
    this.proxyList = [
      null, // No proxy (default)
      // Add proxy servers here if available
      // 'http://proxy1:port',
      // 'http://proxy2:port',
    ];
    this.currentProxyIndex = 0;

    // Auto-cleanup expired cache entries
    this.startCacheCleanup();
  }

  /**
   * Add song to preload queue (only if within top 3) or temp cache
   * @param {Object} tidalSong - Tidal song object
   * @param {number} priority - Priority (0 = highest, for top songs)
   */
  addToPreloadQueue(tidalSong, priority = 10) {
    // For top 3 songs, add to preload queue
    if (priority < 3 && this.currentPreloadCount < this.maxPreloadCount) {
      // Check if already preloaded or in queue
      if (this.preloadedUrls.has(tidalSong.tidalUrl)) {
        console.log(`Already preloaded: ${tidalSong.title || tidalSong.name}`);
        return;
      }

      // Check if already in queue
      const existingIndex = this.preloadQueue.findIndex(item => item.tidalUrl === tidalSong.tidalUrl);
      if (existingIndex !== -1) {
        console.log(`Already in queue: ${tidalSong.title || tidalSong.name}`);
        return;
      }

      // Add to preload queue with priority
      this.preloadQueue.push({
        ...tidalSong,
        priority,
        addedAt: Date.now()
      });

      // Sort by priority (lower number = higher priority)
      this.preloadQueue.sort((a, b) => a.priority - b.priority);

      console.log(`Added to preload queue: ${tidalSong.title || tidalSong.name} (Priority: ${priority})`);

      // Start processing if not already running
      if (!this.isProcessing) {
        this.processQueue();
      }
    } else {
      // For other songs, add to temporary cache for future use
      this.addToTempCache(tidalSong);
    }
  }

  /**
   * Add song to temporary cache for later use
   * @param {Object} tidalSong - Tidal song object
   */
  addToTempCache(tidalSong) {
    if (!this.tempCachedUrls.has(tidalSong.tidalUrl)) {
      this.tempCachedUrls.set(tidalSong.tidalUrl, {
        song: tidalSong,
        cachedAt: Date.now(),
        expiresAt: Date.now() + this.tempCacheExpiry
      });
      console.log(`Added to temp cache: ${tidalSong.title || tidalSong.name}`);
    }
  }

  /**
   * Process the preload queue with rate limiting
   */
  async processQueue() {
    if (this.isProcessing || this.preloadQueue.length === 0) {
      return;
    }

    this.isProcessing = true;

    while (this.preloadQueue.length > 0 && this.currentPreloadCount < this.maxPreloadCount) {
      // Check rate limiting
      if (!this.canMakeRequest()) {
        const waitTime = this.getWaitTime();
        console.log(`Tidal rate limit: waiting ${waitTime}ms before next request`);
        await this.sleep(waitTime);
      }

      const song = this.preloadQueue.shift();
      
      try {
        await this.preloadSingleSong(song);
        this.currentPreloadCount++;
      } catch (error) {
        console.log(`Preload failed for ${song.title}:`, error.message);
        
        // If rate limited, wait longer and try again
        if (error.message.includes('429') || error.message.includes('rate limit')) {
          console.log('Rate limited, waiting 30 seconds before retry...');
          await this.sleep(30000); // Wait 30 seconds

          // Re-add to queue with same priority for retry
          this.preloadQueue.unshift(song);
          continue;
        }
      }

      // Small delay between requests
      await this.sleep(200);
    }

    this.isProcessing = false;
  }

  /**
   * Preload a single song's streaming URL
   * @param {Object} song - Song object
   */
  async preloadSingleSong(song) {
    try {
      console.log(`Preloading Tidal URL for: ${song.title}`);
      
      const streamingUrl = await getTidalStreamingUrl(song.tidalUrl, 'LOSSLESS');
      
      // Cache the preloaded URL with longer expiry
      this.preloadedUrls.set(song.tidalUrl, {
        url: streamingUrl,
        preloadedAt: Date.now(),
        expiresAt: Date.now() + this.preloadCacheExpiry // 15 minutes expiry
      });

      this.updateRequestCount();
      console.log(`Successfully preloaded: ${song.title}`);

    } catch (error) {
      this.updateRequestCount();
      throw error;
    }
  }

  /**
   * Get preloaded streaming URL if available
   * @param {string} tidalUrl - Tidal URL
   * @returns {string|null} Cached streaming URL or null
   */
  getPreloadedUrl(tidalUrl) {
    const cached = this.preloadedUrls.get(tidalUrl);
    
    if (!cached) {
      return null;
    }

    // Check if expired
    if (Date.now() > cached.expiresAt) {
      this.preloadedUrls.delete(tidalUrl);
      return null;
    }

    return cached.url;
  }

  /**
   * Check if song is in temporary cache
   * @param {string} tidalUrl - Original Tidal URL
   * @returns {Object|null} Cached song object or null
   */
  getTempCachedSong(tidalUrl) {
    const cached = this.tempCachedUrls.get(tidalUrl);
    if (cached && Date.now() < cached.expiresAt) {
      return cached.song;
    }

    // Remove expired entry
    if (cached) {
      this.tempCachedUrls.delete(tidalUrl);
    }

    return null;
  }

  /**
   * Start automatic cache cleanup
   */
  startCacheCleanup() {
    // Clean up expired entries every 5 minutes
    setInterval(() => {
      this.cleanupExpiredEntries();
    }, 5 * 60 * 1000);
  }

  /**
   * Clean up expired cache entries
   */
  cleanupExpiredEntries() {
    const now = Date.now();
    let cleanedCount = 0;

    // Clean preloaded URLs
    for (const [url, data] of this.preloadedUrls.entries()) {
      if (now > data.expiresAt) {
        this.preloadedUrls.delete(url);
        cleanedCount++;
      }
    }

    // Clean temp cached URLs
    for (const [url, data] of this.tempCachedUrls.entries()) {
      if (now > data.expiresAt) {
        this.tempCachedUrls.delete(url);
        cleanedCount++;
      }
    }

    if (cleanedCount > 0) {
      console.log(`TidalPreloadManager: Cleaned up ${cleanedCount} expired cache entries`);
    }
  }

  /**
   * Check if we can make a request based on rate limiting
   */
  canMakeRequest() {
    const now = Date.now();

    // Reset counter if a minute has passed since first request in current window
    if (this.requestCount > 0 && now - this.lastRequestTime > this.requestInterval) {
      console.log('TidalPreloadManager: Rate limit window reset');
      this.requestCount = 0;
    }

    const canMake = this.requestCount < this.maxRequestsPerMinute;
    console.log(`TidalPreloadManager: Can make request: ${canMake} (${this.requestCount}/${this.maxRequestsPerMinute})`);
    return canMake;
  }

  /**
   * Calculate wait time until next request is allowed
   */
  getWaitTime() {
    const now = Date.now();
    const timeSinceLastReset = now - this.lastRequestTime;
    return Math.max(0, this.requestInterval - timeSinceLastReset);
  }

  /**
   * Update request count and timestamp
   */
  updateRequestCount() {
    this.requestCount++;
    this.lastRequestTime = Date.now();
  }

  /**
   * Rotate to next proxy to bypass rate limits
   */
  rotateProxy() {
    this.currentProxyIndex = (this.currentProxyIndex + 1) % this.proxyList.length;
    console.log(`Rotating to proxy index: ${this.currentProxyIndex}`);
  }

  /**
   * Get current proxy
   */
  getCurrentProxy() {
    return this.proxyList[this.currentProxyIndex];
  }

  /**
   * Sleep utility
   */
  sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Clear all preloaded data and temp cache
   */
  clearCache() {
    this.preloadedUrls.clear();
    this.tempCachedUrls.clear();
    this.preloadQueue = [];
    this.currentPreloadCount = 0;
    this.isProcessing = false;
  }

  /**
   * Reset preload count for new search results
   */
  resetForNewSearch() {
    this.currentPreloadCount = 0;
    this.preloadQueue = [];
    this.isProcessing = false;
    // Keep cached URLs as they might still be useful
    console.log('TidalPreloadManager: Reset for new search');
  }

  /**
   * Get current status for debugging
   */
  getStatus() {
    return {
      preloadedCount: this.preloadedUrls.size,
      tempCachedCount: this.tempCachedUrls.size,
      queueLength: this.preloadQueue.length,
      currentPreloadCount: this.currentPreloadCount,
      maxPreloadCount: this.maxPreloadCount,
      requestCount: this.requestCount,
      maxRequestsPerMinute: this.maxRequestsPerMinute,
      canMakeRequest: this.canMakeRequest(),
      isProcessing: this.isProcessing
    };
  }
}

// Create singleton instance
const tidalPreloadManager = new TidalPreloadManager();

export default tidalPreloadManager;
