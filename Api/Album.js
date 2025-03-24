import axios from "axios";
import { getCachedData, CACHE_GROUPS } from './CacheManager';

async function getAlbumData(id) {
  // Create a cache key for the album
  const cacheKey = `album_${id}`;
  
  // Define the fetch function that will be called if cache miss
  const fetchFunction = async () => {
    let config = {
      method: 'get',
      maxBodyLength: Infinity,
      url: "https://jiosavan-api-with-playlist.vercel.app/api/albums?id=" + id,
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
  
  // Use cache manager with 60 minute expiration for album data
  try {
    console.log(`Fetching album data for ID: ${id}`);
    return await getCachedData(cacheKey, fetchFunction, 60, CACHE_GROUPS.ALBUMS);
  } catch (error) {
    // If there's a storage error, try fetching directly without caching
    if (error.message && (error.message.includes('SQLITE_FULL') || error.message.includes('storage_full'))) {
      console.warn(`Storage full when fetching album ${id}, bypassing cache`);
      try {
        // Fetch directly without caching
        const data = await fetchFunction();
        return { ...data, fromCache: false, cacheBypass: true };
      } catch (fetchError) {
        console.error(`Direct fetch failed for album ${id}:`, fetchError);
        throw fetchError;
      }
    }
    
    console.error(`Error getting album data for ID ${id}:`, error);
    throw error;
  }
}

async function getSearchAlbumData(searchText, page, limit) {
  // Create a cache key based on the search parameters
  const cacheKey = `album_search_${searchText}_page${page}_limit${limit}`;
  
  // Define the fetch function that will be called if cache miss
  const fetchFunction = async () => {
    let config = {
      method: 'get',
      maxBodyLength: Infinity,
      url: `https://jiosavan-api-with-playlist.vercel.app/api/search/albums?query=${searchText}&page=${page}&limit=${limit}`,
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
  
  // Use cache manager with 5 minute expiration for album search results
  try {
    return await getCachedData(cacheKey, fetchFunction, 5, CACHE_GROUPS.SEARCH);
  } catch (error) {
    // If there's a storage error, try fetching directly without caching
    if (error.message && (error.message.includes('SQLITE_FULL') || error.message.includes('storage_full'))) {
      console.warn(`Storage full when searching albums "${searchText}", bypassing cache`);
      try {
        // Fetch directly without caching
        const data = await fetchFunction();
        return { ...data, fromCache: false, cacheBypass: true };
      } catch (fetchError) {
        console.error(`Direct fetch failed for album search "${searchText}":`, fetchError);
        throw fetchError;
      }
    }
    
    console.error(`Error getting album search data for "${searchText}":`, error);
    throw error;
  }
}

export {getAlbumData, getSearchAlbumData}
