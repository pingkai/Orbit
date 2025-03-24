import axios from "axios";
import { getCachedData, CACHE_GROUPS } from './CacheManager';

async function getPlaylistData(id) {
  // Create a cache key for the playlist
  const cacheKey = `playlist_${id}`;
  
  // Define the fetch function that will be called if cache miss
  const fetchFunction = async () => {
    let config = {
      method: 'get',
      maxBodyLength: Infinity,
      url: `https://jiosavan-api-with-playlist.vercel.app/api/playlists?id=${id}&limit=100000`,
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
  
  // Use cache manager with 30 minute expiration for playlist data
  try {
    console.log(`Fetching playlist data for ID: ${id}`);
    return await getCachedData(cacheKey, fetchFunction, 30, CACHE_GROUPS.PLAYLISTS);
  } catch (error) {
    // If there's a storage error, try fetching directly without caching
    if (error.message && (error.message.includes('SQLITE_FULL') || error.message.includes('storage_full'))) {
      console.warn(`Storage full when fetching playlist ${id}, bypassing cache`);
      try {
        // Fetch directly without caching
        const data = await fetchFunction();
        return { ...data, fromCache: false, cacheBypass: true };
      } catch (fetchError) {
        console.error(`Direct fetch failed for playlist ${id}:`, fetchError);
        throw fetchError;
      }
    }
    
    console.error(`Error getting playlist data for ID ${id}:`, error);
    throw error;
  }
}

async function getSearchPlaylistData(searchText, page, limit) {
  // Create a cache key based on the search parameters
  const cacheKey = `playlist_search_${searchText}_page${page}_limit${limit}`;
  
  // Define the fetch function that will be called if cache miss
  const fetchFunction = async () => {
    let config = {
      method: 'get',
      maxBodyLength: Infinity,
      url: `https://jio-savan-api-sigma.vercel.app/search/playlists?query=${searchText}&page=${page}&limit=${limit}`,
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
  
  // Use cache manager with 5 minute expiration for playlist search results
  try {
    return await getCachedData(cacheKey, fetchFunction, 5, CACHE_GROUPS.SEARCH);
  } catch (error) {
    // If there's a storage error, try fetching directly without caching
    if (error.message && (error.message.includes('SQLITE_FULL') || error.message.includes('storage_full'))) {
      console.warn(`Storage full when searching playlists "${searchText}", bypassing cache`);
      try {
        // Fetch directly without caching
        const data = await fetchFunction();
        return { ...data, fromCache: false, cacheBypass: true };
      } catch (fetchError) {
        console.error(`Direct fetch failed for playlist search "${searchText}":`, fetchError);
        throw fetchError;
      }
    }
    
    console.error(`Error getting playlist search data for "${searchText}":`, error);
    throw error;
  }
}

export {getPlaylistData, getSearchPlaylistData}
