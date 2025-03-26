import axios from "axios";
import { getCachedData, CACHE_GROUPS, isOfflineMode } from './CacheManager';

async function getPlaylistData(id) {
  // Create a cache key for the playlist
  const cacheKey = `playlist_${id}`;
  
  // Check if we're offline before doing anything
  if (isOfflineMode()) {
    console.log(`Device is offline - looking for cached playlist ${id}`);
    
    try {
      // Try to get the cached data directly (getCachedData handles this but just to be safe)
      const result = await getCachedData(cacheKey, null, 30, CACHE_GROUPS.PLAYLISTS);
      if (result && !result.error) {
        return result;
      }
      
      // Return a standardized offline response without error
      return {
        success: false,
        offlineMode: true,
        message: 'Playlist not available offline'
      };
    } catch (cacheError) {
      console.log(`No cached data found for playlist ${id} in offline mode`);
      return {
        success: false,
        offlineMode: true,
        message: 'Playlist not available offline'
      };
    }
  }
  
  // Define the fetch function that will be called if cache miss
  const fetchFunction = async () => {
    let config = {
      method: 'get',
      maxBodyLength: Infinity,
      url: `https://jiosavan-api-with-playlist.vercel.app/api/playlists?id=${id}&limit=100000`,
      headers: { },
      timeout: 10000 // Add timeout to prevent hanging requests
    };
    
    try {
      const response = await axios.request(config);
      return response.data;
    }
    catch (error) {
      // Don't throw error, return error object
      console.log(`Error fetching playlist ${id}:`, error.message || 'Unknown error');
      return {
        success: false,
        error: error.message || 'Network error',
        message: 'Failed to load playlist'
      };
    }
  };
  
  // Use cache manager with 30 minute expiration for playlist data
  try {
    console.log(`Fetching playlist data for ID: ${id}`);
    return await getCachedData(cacheKey, fetchFunction, 30, CACHE_GROUPS.PLAYLISTS);
  } catch (error) {
    // Don't throw error, return error object
    console.log(`Error getting playlist data for ID ${id}:`, error.message || 'Unknown error');
    return {
      success: false,
      error: error.message || 'Unknown error',
      message: 'Failed to load playlist'
    };
  }
}

async function getSearchPlaylistData(searchText, page, limit) {
  // Create a cache key based on the search parameters
  const cacheKey = `playlist_search_${searchText}_page${page}_limit${limit}`;
  
  // Check if we're offline before doing anything
  if (isOfflineMode()) {
    console.log(`Device is offline - looking for cached playlist search ${searchText}`);
    
    try {
      // Try to get the cached data directly
      const result = await getCachedData(cacheKey, null, 5, CACHE_GROUPS.SEARCH);
      if (result && !result.error) {
        return result;
      }
      
      // Return a standardized offline response without error
      return {
        success: false,
        offlineMode: true,
        message: 'Search not available offline'
      };
    } catch (cacheError) {
      console.log(`No cached data found for playlist search ${searchText} in offline mode`);
      return {
        success: false,
        offlineMode: true,
        message: 'Search not available offline'
      };
    }
  }
  
  // Define the fetch function that will be called if cache miss
  const fetchFunction = async () => {
    let config = {
      method: 'get',
      maxBodyLength: Infinity,
      url: `https://jio-savan-api-sigma.vercel.app/search/playlists?query=${searchText}&page=${page}&limit=${limit}`,
      headers: { },
      timeout: 8000 // Add timeout to prevent hanging requests
    };
    
    try {
      const response = await axios.request(config);
      return response.data;
    }
    catch (error) {
      // Don't throw error, return error object
      console.log(`Error searching playlists for "${searchText}":`, error.message || 'Unknown error');
      return {
        success: false,
        error: error.message || 'Network error',
        message: 'Failed to search playlists'
      };
    }
  };
  
  // Use cache manager with 5 minute expiration for playlist search results
  try {
    return await getCachedData(cacheKey, fetchFunction, 5, CACHE_GROUPS.SEARCH);
  } catch (error) {
    // Don't throw error, return error object
    console.log(`Error getting playlist search data for "${searchText}":`, error.message || 'Unknown error');
    return {
      success: false,
      error: error.message || 'Unknown error',
      message: 'Failed to search playlists'
    };
  }
}

export {getPlaylistData, getSearchPlaylistData}
