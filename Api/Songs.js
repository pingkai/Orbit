import axios from "axios";
import { getCachedData, CACHE_GROUPS } from './CacheManager';

async function getSearchSongData(searchText, page, limit) {
  // Create a cache key based on the search parameters
  const cacheKey = `search_${searchText}_page${page}_limit${limit}`;
  
  // Define the fetch function that will be called if cache miss
  const fetchFunction = async () => {
    let config = {
      method: 'get',
      maxBodyLength: Infinity,
      url: `https://jiosavan-api-with-playlist.vercel.app/api/search/songs?query=${searchText}&page=${page}&limit=${limit}`,
      headers: { },
    };
    
    try {
      const response = await axios.request(config);
      return response.data;
    }
    catch (error) {
      throw error;
    }
  };
  
  // Use cache manager with 5 minute expiration for search results
  try {
    return await getCachedData(cacheKey, fetchFunction, 5, CACHE_GROUPS.SEARCH);
  } catch (error) {
    // If there's a storage error, try fetching directly without caching
    if (error.message && (error.message.includes('SQLITE_FULL') || error.message.includes('storage_full'))) {
      console.warn(`Storage full when searching "${searchText}", bypassing cache`);
      try {
        // Fetch directly without caching
        const data = await fetchFunction();
        return { ...data, fromCache: false, cacheBypass: true };
      } catch (fetchError) {
        console.error(`Direct fetch failed for "${searchText}":`, fetchError);
        throw fetchError;
      }
    }
    
    console.error(`Error getting search data for "${searchText}":`, error);
    throw error;
  }
}

async function getLyricsSongData(id) {
  // Create a cache key for lyrics - these rarely change so longer cache time
  const cacheKey = `lyrics_${id}`;
  
  // Define the fetch function that will be called if cache miss
  const fetchFunction = async () => {
    let config = {
      method: 'get',
      maxBodyLength: Infinity,
      url: `https://jiosavan-api-with-playlist.vercel.app/api/songs/${id}/lyrics`,
      headers: { },
    };
    
    try {
      const response = await axios.request(config);
      return response.data;
    }
    catch (error) {
      // Return a proper formatted response for 404 errors
      if (error.response && error.response.status === 404) {
        console.log(`No lyrics found for song ID ${id} (404)`);
        // Return a properly formatted empty result rather than throwing
        return {
          success: false,
          status: "NOT_FOUND",
          message: "No lyrics available for this song",
          data: { lyrics: "" }
        };
      }
      
      // For other errors, log and rethrow
      console.error(`API error fetching lyrics for song ID ${id}:`, 
        error.response ? `Status: ${error.response.status}` : error.message || error);
      throw error;
    }
  };
  
  // Use cache manager with 1 day (1440 minutes) expiration for lyrics
  try {
    return await getCachedData(cacheKey, fetchFunction, 1440, CACHE_GROUPS.LYRICS);
  } catch (error) {
    console.error(`Error getting lyrics for song ID ${id}:`, error);
    // Return failure instead of throwing to prevent app crashes
    return {
      success: false,
      status: "ERROR",
      message: "Failed to get lyrics",
      data: { lyrics: "" }
    };
  }
}

export {getSearchSongData, getLyricsSongData}
