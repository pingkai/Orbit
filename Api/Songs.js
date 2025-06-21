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

async function getArtistSongs(artistId) {
  const cacheKey = `artist_songs_${artistId}`;

  const fetchFunction = async () => {
    let config = {
      method: 'get',
      maxBodyLength: Infinity,
      url: `https://jiosavan-api-with-playlist.vercel.app/api/artists/${artistId}/songs`,
      headers: {},
    };

    try {
      const response = await axios.request(config);
      return response.data;
    } catch (error) {
      console.error(`API error fetching songs for artist ID ${artistId}:`, error.response ? `Status: ${error.response.status}` : error.message || error);
      throw error;
    }
  };

  try {
    return await getCachedData(cacheKey, fetchFunction, 60, CACHE_GROUPS.SEARCH);
  } catch (error) {
    console.error(`Error getting songs for artist ID ${artistId}:`, error);
    throw error;
  }
}

async function getArtistSongsPaginated(artistId, page = 1, limit = 10) {
  const cacheKey = `artist_songs_paginated_${artistId}_page${page}_limit${limit}`;

  const fetchFunction = async () => {
    let config = {
      method: 'get',
      maxBodyLength: Infinity,
      url: `https://jiosavan-api-with-playlist.vercel.app/api/artists/${artistId}/songs?page=${page}&limit=${limit}`,
      headers: {},
    };

    try {
      const response = await axios.request(config);
      return response.data;
    } catch (error) {
      console.error(`API error fetching paginated songs for artist ID ${artistId}:`, error.response ? `Status: ${error.response.status}` : error.message || error);
      throw error;
    }
  };

  try {
    return await getCachedData(cacheKey, fetchFunction, 30, CACHE_GROUPS.SEARCH); // Shorter cache for paginated data
  } catch (error) {
    console.error(`Error getting paginated songs for artist ID ${artistId}:`, error);
    throw error;
  }
}

async function getAlbumSongs(albumId) {
  const cacheKey = `album_songs_${albumId}`;

  const fetchFunction = async () => {
    let config = {
      method: 'get',
      maxBodyLength: Infinity,
      url: `https://jiosavan-api-with-playlist.vercel.app/api/albums/${albumId}`,
      headers: {},
    };

    try {
      const response = await axios.request(config);
      return response.data;
    } catch (error) {
      console.error(`API error fetching songs for album ID ${albumId}:`, error.response ? `Status: ${error.response.status}` : error.message || error);
      throw error;
    }
  };

  try {
    return await getCachedData(cacheKey, fetchFunction, 60, CACHE_GROUPS.SEARCH);
  } catch (error) {
    console.error(`Error getting songs for album ID ${albumId}:`, error);
    throw error;
  }
}

// Helper function to check if an artist has valid image and songs
async function validateArtist(artistId) {
  try {
    // Check if artist has songs
    const songsResponse = await getArtistSongs(artistId);
    const hasSongs = songsResponse?.data?.songs?.length > 0;

    if (!hasSongs) {
      return false;
    }

    // Check artist details for additional validation
    const detailsResponse = await getArtistDetails(artistId);
    const artistData = detailsResponse?.data;

    // Check if artist has proper image (not default placeholder)
    const hasValidImage = artistData?.image?.some(img =>
      img.url && !img.url.includes('artist-default') && !img.url.includes('share-image')
    );

    // Check follower count (real artists usually have more followers)
    const hasFollowers = artistData?.followerCount > 100;

    // Check if artist has bio information
    const hasBio = artistData?.bio?.length > 0;

    // Artist is valid if it has songs AND (valid image OR followers OR bio)
    return hasSongs && (hasValidImage || hasFollowers || hasBio);
  } catch (error) {
    console.error(`Error validating artist ${artistId}:`, error);
    return false;
  }
}

// Helper function to normalize artist names for comparison
function normalizeArtistName(name) {
  if (!name) return '';

  return name
    .toLowerCase()
    .trim()
    // Remove all Unicode control characters and invisible characters
    .replace(/[\u0000-\u001F\u007F-\u009F\u200B-\u200F\u2028-\u202F\u205F-\u206F\uFEFF]/g, '')
    // Remove extra whitespace
    .replace(/\s+/g, ' ')
    .trim();
}

// Helper function to filter artists based on image and songs availability
function filterValidArtists(artists) {
  if (!artists || !Array.isArray(artists)) {
    return [];
  }

  // First filter for valid artists
  const validArtists = artists.filter(artist => {
    // Quick filter: Check if artist has non-default image
    const hasValidImage = artist?.image?.some(img =>
      img.url &&
      !img.url.includes('artist-default') &&
      !img.url.includes('share-image') &&
      !img.url.includes('_i/3.0/')
    );

    // Filter out obvious collaborative/dummy artists by name patterns
    const isDummyArtist = artist?.name?.includes('&') ||
                         artist?.name?.includes(',') ||
                         artist?.name?.includes('amp;');

    return hasValidImage && !isDummyArtist;
  });

  // Remove duplicates based on artist ID and normalized name
  const uniqueArtists = validArtists.filter((artist, index, self) => {
    const normalizedName = normalizeArtistName(artist.name);

    return index === self.findIndex(a => {
      const otherNormalizedName = normalizeArtistName(a.name);
      return a.id === artist.id || normalizedName === otherNormalizedName;
    });
  });

  return uniqueArtists;
}

async function getSearchArtistData(searchText, page, limit) {
  // Create a cache key based on the search parameters
  const cacheKey = `artist_search_${searchText}_page${page}_limit${limit}`;

  // Define the fetch function that will be called if cache miss
  const fetchFunction = async () => {
    let config = {
      method: 'get',
      maxBodyLength: Infinity,
      url: `https://jiosavan-api-with-playlist.vercel.app/api/search/artists?query=${searchText}&page=${page}&limit=${limit}`,
      headers: { },
    };

    try {
      const response = await axios.request(config);

      // Filter the results to show only valid artists
      if (response.data?.data?.results) {
        const filteredResults = filterValidArtists(response.data.data.results);

        return {
          ...response.data,
          data: {
            ...response.data.data,
            results: filteredResults,
            total: filteredResults.length
          }
        };
      }

      return response.data;
    }
    catch (error) {
      throw error;
    }
  };

  try {
    return await getCachedData(cacheKey, fetchFunction, 30, CACHE_GROUPS.SEARCH);
  } catch (error) {
    console.error(`Error getting artist search data for "${searchText}":`, error);
    throw error;
  }
}

async function getArtistDetails(artistId) {
  const cacheKey = `artist_details_${artistId}`;

  const fetchFunction = async () => {
    let config = {
      method: 'get',
      maxBodyLength: Infinity,
      url: `https://jiosavan-api-with-playlist.vercel.app/api/artists/${artistId}`,
      headers: {},
    };

    try {
      const response = await axios.request(config);
      return response.data;
    } catch (error) {
      console.error(`API error fetching artist details for ID ${artistId}:`, error.response ? `Status: ${error.response.status}` : error.message || error);
      throw error;
    }
  };

  try {
    return await getCachedData(cacheKey, fetchFunction, 120, CACHE_GROUPS.SEARCH); // Cache for 2 hours
  } catch (error) {
    console.error(`Error getting artist details for ID ${artistId}:`, error);
    throw error;
  }
}

async function getArtistAlbums(artistId) {
  const cacheKey = `artist_albums_${artistId}`;

  const fetchFunction = async () => {
    let config = {
      method: 'get',
      maxBodyLength: Infinity,
      url: `https://jiosavan-api-with-playlist.vercel.app/api/artists/${artistId}/albums`,
      headers: {},
    };

    try {
      const response = await axios.request(config);
      return response.data;
    } catch (error) {
      console.error(`API error fetching albums for artist ID ${artistId}:`, error.response ? `Status: ${error.response.status}` : error.message || error);
      throw error;
    }
  };

  try {
    return await getCachedData(cacheKey, fetchFunction, 120, CACHE_GROUPS.SEARCH); // Cache for 2 hours
  } catch (error) {
    console.error(`Error getting albums for artist ID ${artistId}:`, error);
    throw error;
  }
}

export { getSearchSongData, getLyricsSongData, getArtistSongs, getArtistSongsPaginated, getAlbumSongs, getSearchArtistData, getArtistDetails, getArtistAlbums, validateArtist, filterValidArtists };
