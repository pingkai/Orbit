import axios from "axios";
import { getCachedData, CACHE_GROUPS } from './CacheManager';

async function getHomePageData(languages) {
  // Create a cache key based on the languages
  const cacheKey = `home_${languages}`;
  
  // Define the fetch function that will be called if cache miss
  const fetchFunction = async () => {
    let config = {
      method: 'get',
      maxBodyLength: Infinity,
      url: 'https://jio-savan-api-sigma.vercel.app/modules?language=' + languages,
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
  
  // Use cache manager with 60 minute expiration for homepage data
  try {
    return await getCachedData(cacheKey, fetchFunction, 60, CACHE_GROUPS.HOME);
  } catch (error) {
    console.error(`Error getting homepage data for languages ${languages}:`, error);
    throw error;
  }
}

export {getHomePageData}
