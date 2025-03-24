import axios from "axios";
import { getCachedData, CACHE_GROUPS } from './CacheManager';

async function getRecommendedSongs(id) {
  // Create a cache key for recommendations
  const cacheKey = `recommendations_${id}`;
  
  // Define the fetch function that will be called if cache miss
  const fetchFunction = async () => {
    let config = {
      method: 'get',
      maxBodyLength: Infinity,
      url: `https://jiosavan-api-with-playlist.vercel.app/api/songs/${id}/suggestions`,
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
  
  // Use cache manager with 30 minute expiration for recommendations
  try {
    return await getCachedData(cacheKey, fetchFunction, 30, CACHE_GROUPS.RECOMMENDATIONS);
  } catch (error) {
    console.error(`Error getting recommendations for song ID ${id}:`, error);
    throw error;
  }
}

export {getRecommendedSongs}
