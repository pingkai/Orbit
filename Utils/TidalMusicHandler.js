import { getTidalStreamingUrl } from '../Api/TidalAPI';
import { ToastAndroid } from 'react-native';
import tidalPreloadManager from './TidalPreloadManager';
import tidalResultCache from './TidalResultCache';

/**
 * TidalMusicHandler - Handles Tidal-specific music operations
 * This file contains functions to handle Tidal music playback,
 * format conversion, and streaming URL generation.
 */

/**
 * Convert Tidal song data to app format for music player
 * @param {Object} tidalSong - Song data from Tidal API
 * @returns {Promise<Object>} Formatted song object for music player
 */
async function formatTidalSongForPlayer(tidalSong) {
  try {
    // Validate input
    if (!tidalSong || !tidalSong.tidalUrl) {
      throw new Error('Invalid Tidal song data - missing tidalUrl');
    }

    // Enhanced URL retrieval with multiple fallback strategies
    let streamingUrl = tidalPreloadManager.getPreloadedUrl(tidalSong.tidalUrl);

    if (!streamingUrl) {
      // Check result cache for previously fetched URLs
      streamingUrl = tidalResultCache.getCachedStreamingUrl(tidalSong.tidalUrl);
    }

    if (!streamingUrl) {
      // Check if song is in temp cache for faster processing
      tidalPreloadManager.getTempCachedSong(tidalSong.tidalUrl);

      // Show loading message for user feedback
      ToastAndroid.show('Getting Tidal streaming URL...', ToastAndroid.SHORT);

      // Enhanced timeout handling with multiple retry attempts
      const maxRetries = 3;
      let lastError;

      for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
          const timeoutDuration = 8000 + (attempt * 2000); // Increasing timeout per attempt

          streamingUrl = await Promise.race([
            getTidalStreamingUrl(tidalSong.tidalUrl, 'LOSSLESS'),
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error(`Tidal streaming URL timeout (attempt ${attempt})`)), timeoutDuration)
            )
          ]);

          // Success - break out of retry loop
          break;

        } catch (error) {
          lastError = error;
          console.log(`Attempt ${attempt} failed:`, error.message);

          if (attempt < maxRetries) {
            // Exponential backoff between retries
            const backoffDelay = 1000 * Math.pow(2, attempt - 1);
            console.log(`Waiting ${backoffDelay}ms before retry...`);
            await new Promise(resolve => setTimeout(resolve, backoffDelay));
          }
        }
      }

      // If all retries failed, throw the last error
      if (!streamingUrl) {
        throw lastError || new Error('Failed to get Tidal streaming URL after all retries');
      }

      // Cache the successfully retrieved streaming URL for future use
      tidalResultCache.cacheStreamingUrl(tidalSong.tidalUrl, streamingUrl);
    }

    // Enhanced streaming URL validation
    if (!streamingUrl || typeof streamingUrl !== 'string' || !streamingUrl.startsWith('http')) {
      throw new Error('Failed to get valid streaming URL from Tidal');
    }

    console.log('Successfully obtained Tidal streaming URL');

    return {
      url: streamingUrl,
      title: tidalSong.title || tidalSong.name,
      artist: tidalSong.artist || 'Unknown Artist',
      artwork: tidalSong.image?.[2]?.url || tidalSong.image?.[0]?.url || null,
      image: tidalSong.image?.[2]?.url || tidalSong.image?.[0]?.url || null,
      duration: tidalSong.duration || 0,
      id: tidalSong.id,
      language: tidalSong.language || 'en',
      artistID: tidalSong.primary_artists_id || '',
      source: 'tidal',
      sourceType: 'tidal'
    };
  } catch (error) {
    console.error('Error formatting Tidal song for player:', error);

    // Enhanced error handling with specific user messages
    if (error.message?.includes('timeout')) {
      ToastAndroid.show('Tidal streaming timed out. Please check your connection and try again.', ToastAndroid.LONG);
    } else if (error.message?.includes('rate limit')) {
      ToastAndroid.show('Tidal rate limit reached. Please wait a moment and try again.', ToastAndroid.LONG);
    } else if (error.message?.includes('server')) {
      ToastAndroid.show('Tidal server temporarily unavailable. Please try again later.', ToastAndroid.LONG);
    } else {
      ToastAndroid.show('Failed to get Tidal streaming URL. Please try again.', ToastAndroid.SHORT);
    }
    throw error;
  }
}

/**
 * Convert multiple Tidal songs for playlist
 * @param {Array} tidalSongs - Array of Tidal song objects
 * @returns {Promise<Array>} Array of formatted song objects
 */
async function formatTidalSongsForPlaylist(tidalSongs) {
  try {
    const formattedSongs = [];
    
    // Process songs in batches to avoid overwhelming the API
    const batchSize = 3;
    for (let i = 0; i < tidalSongs.length; i += batchSize) {
      const batch = tidalSongs.slice(i, i + batchSize);
      
      const batchPromises = batch.map(async (song) => {
        try {
          return await formatTidalSongForPlayer(song);
        } catch (error) {
          console.error(`Failed to format song ${song.title}:`, error);
          return null; // Skip failed songs
        }
      });
      
      const batchResults = await Promise.all(batchPromises);
      formattedSongs.push(...batchResults.filter(song => song !== null));
      
      // Small delay between batches to be respectful to the API
      if (i + batchSize < tidalSongs.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    return formattedSongs;
  } catch (error) {
    console.error('Error formatting Tidal songs for playlist:', error);
    throw error;
  }
}

/**
 * Check if a song is from Tidal source
 * @param {Object} song - Song object
 * @returns {boolean} True if song is from Tidal
 */
function isTidalSong(song) {
  return song?.source === 'tidal' || song?.sourceType === 'tidal';
}

/**
 * Get quality options for Tidal
 * @returns {Array} Available quality options
 */
function getTidalQualityOptions() {
  return [
    { value: 'LOW', label: '96 kbps' },
    { value: 'HIGH', label: '320 kbps' },
    { value: 'LOSSLESS', label: 'FLAC (Lossless)' }
  ];
}

/**
 * Handle Tidal-specific download operations
 * Note: This is a placeholder for future implementation
 * @param {Object} song - Tidal song object
 * @returns {Promise<boolean>} Success status
 */
async function downloadTidalSong(song) {
  try {
    // For now, show message that download is not implemented
    ToastAndroid.show('Tidal downloads will be implemented in future updates', ToastAndroid.LONG);
    return false;
  } catch (error) {
    console.error('Error downloading Tidal song:', error);
    return false;
  }
}

/**
 * Show unsupported feature message for Tidal
 * @param {string} feature - Feature name (e.g., 'playlists', 'albums')
 */
function showTidalUnsupportedMessage(feature) {
  ToastAndroid.show(
    `${feature} are not supported with Tidal. Please use Saavn for ${feature}.`,
    ToastAndroid.LONG
  );
}

/**
 * Get appropriate error message for Tidal operations
 * @param {Error} error - Error object
 * @returns {string} User-friendly error message
 */
function getTidalErrorMessage(error) {
  if (error.message?.includes('timeout')) {
    return 'Tidal service is taking too long to respond. Please try again.';
  } else if (error.message?.includes('network')) {
    return 'Network error while connecting to Tidal. Check your internet connection.';
  } else if (error.message?.includes('streaming URL')) {
    return 'Unable to get streaming URL from Tidal. The track may not be available.';
  } else {
    return 'An error occurred with Tidal service. Please try again or use Saavn.';
  }
}

/**
 * Preload Tidal streaming URL for faster playback using intelligent manager
 * @param {Object} tidalSong - Tidal song object
 * @param {number} priority - Priority for preloading (0 = highest)
 * @returns {Promise<void>}
 */
async function preloadTidalStreamingUrl(tidalSong, priority = 10) {
  try {
    if (tidalSong.tidalUrl) {
      // Use the preload manager to handle rate limiting and prioritization
      tidalPreloadManager.addToPreloadQueue(tidalSong, priority);
    }
  } catch (error) {
    // Silently fail preloading
  }
}

/**
 * Enhanced preload strategy for Tidal songs with temp caching
 * @param {Array} tidalSongs - Array of Tidal song objects
 * @param {number} maxCount - Maximum number of songs to preload (default: 3)
 */
function preloadTopTidalSongs(tidalSongs, maxCount = 3) {
  if (!tidalSongs || tidalSongs.length === 0) {
    console.log('TidalMusicHandler: No Tidal songs to preload');
    return;
  }

  // Reset for new search only if not processing
  const status = tidalPreloadManager.getStatus();
  if (!status.isProcessing) {
    tidalPreloadManager.resetForNewSearch();
  }

  // Process all songs - top 3 for preloading, rest for temp caching
  tidalSongs.forEach((song, index) => {
    if (index < maxCount) {
      // Top songs get preloaded for instant playback
      preloadTidalStreamingUrl(song, index);
    } else {
      // Other songs go to temp cache for faster future access
      tidalPreloadManager.addToTempCache(song);
    }
  });
}

export {
  formatTidalSongForPlayer,
  formatTidalSongsForPlaylist,
  isTidalSong,
  getTidalQualityOptions,
  downloadTidalSong,
  showTidalUnsupportedMessage,
  getTidalErrorMessage,
  preloadTidalStreamingUrl,
  preloadTopTidalSongs
};
