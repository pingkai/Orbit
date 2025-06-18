import axios from "axios";
import { getCachedData, CACHE_GROUPS } from './CacheManager';
import tidalResultCache from '../Utils/TidalResultCache';

// Endpoints for searching
const TIDAL_SEARCH_ENDPOINTS = [
  'https://dev-paxsenix.koyeb.app',
  'https://search.orbitmusic.workers.dev',
];

// Endpoints for getting stream URLs
const TIDAL_STREAM_ENDPOINTS = [
  'https://dev-paxsenix.koyeb.app',
];

// Backup endpoint for getting the streaming URL
const TIDAL_STREAM_BACKUP_ENDPOINT = 'https://ancient-cloud-e525.imdbgdrive.workers.dev/dl/tidal';

let currentSearchEndpointIndex = 0;
let currentStreamEndpointIndex = 0;

function getCurrentTidalSearchEndpoint() {
  return TIDAL_SEARCH_ENDPOINTS[currentSearchEndpointIndex];
}

function rotateSearchEndpoint() {
  currentSearchEndpointIndex = (currentSearchEndpointIndex + 1) % TIDAL_SEARCH_ENDPOINTS.length;
  console.log(`Rotated to Tidal Search endpoint: ${getCurrentTidalSearchEndpoint()}`);
}

function getCurrentTidalStreamEndpoint() {
  return TIDAL_STREAM_ENDPOINTS[currentStreamEndpointIndex];
}

function rotateStreamEndpoint() {
  currentStreamEndpointIndex = (currentStreamEndpointIndex + 1) % TIDAL_STREAM_ENDPOINTS.length;
  console.log(`Rotated to Tidal Stream endpoint: ${getCurrentTidalStreamEndpoint()}`);
}


async function getTidalSearchSongData(searchText) {
  const cacheKey = `tidal_search_all_${searchText}`;

  const cachedResults = tidalResultCache.getCachedSearchResults(searchText);
  if (cachedResults) {
    console.log('Using cached Tidal search results');
    const filteredResults = cachedResults.filter(track => track.quality === 'LOSSLESS');
    return {
      success: true,
      data: {
        results: filteredResults,
        total: filteredResults.length,
        hasMore: false
      }
    };
  }

  const fetchFunction = async () => {
    let lastError;

    for (let attempt = 0; attempt < TIDAL_SEARCH_ENDPOINTS.length; attempt++) {
      try {
        const currentEndpoint = getCurrentTidalSearchEndpoint();
        const url = currentEndpoint.includes('orbitmusic')
          ? `${currentEndpoint}?q=${encodeURIComponent(searchText)}`
          : `${currentEndpoint}/tidal/search?q=${encodeURIComponent(searchText)}`;

        const config = {
          method: 'get',
          maxBodyLength: Infinity,
          url: url,
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Orbit-Music-App/1.0',
            'X-Forwarded-For': generateRandomIP(),
          },
          timeout: 20000
        };

        const response = await axios.request(config);

        if (response.data && response.data.items && Array.isArray(response.data.items)) {
          const losslessResults = response.data.items
            .filter(track => track.audioQuality === 'LOSSLESS' && track.title && track.url)
            .map(track => ({
              id: track.id,
              name: track.title,
              title: track.title,
              artist: track.artist?.name || (track.artists && track.artists[0]?.name) || 'Unknown Artist',
              artists: {
                primary: track.artists ? track.artists.map(artist => ({ name: artist.name })) : [{ name: 'Unknown Artist' }]
              },
              primary_artists_id: track.artist?.id || (track.artists && track.artists[0]?.id) || '',
              duration: track.duration || 0,
              image: track.album?.cover ? [
                { url: track.album.cover },
                { url: track.album.cover },
                { url: track.album.cover }
              ] : [],
              has_lyrics: track.lyrics,
              url: track.url,
              album: track.album?.title,
              album_id: track.album?.id,
              release_date: track.album?.releaseDate,
              song_count: track.album?.numberOfTracks,
              copyright: track.copyright,
              download_url: track.url,
              api: 'Tidal',
              quality: track.audioQuality,
              is_tidal: true,
            }));

          tidalResultCache.cacheSearchResults(searchText, losslessResults);

          return {
            success: true,
            data: {
              results: losslessResults,
              total: losslessResults.length,
              hasMore: false
            }
          };
        }
        return { success: true, data: { results: [], total: 0, hasMore: false } };

      } catch (error) {
        lastError = error;
        console.error(`Search attempt ${attempt + 1} failed for ${getCurrentTidalSearchEndpoint()}:`, error.message);
        rotateSearchEndpoint();
        await new Promise(resolve => setTimeout(resolve, 500));
        continue;
      }
    }

    console.error('All Tidal search endpoints failed.');
    throw lastError;
  };

  try {
    return await getCachedData(cacheKey, fetchFunction, 15, CACHE_GROUPS.SONGS);
  } catch (error) {
    console.error('Error fetching Tidal search data:', error);
    throw new Error(`Failed to fetch Tidal search results: ${error.message}`);
  }
}

async function getTidalTrackData(trackId) {
  const cacheKey = `tidal_track_${trackId}`;
  const fetchFunction = async () => {
    const url = `${getCurrentTidalStreamEndpoint()}/tidal/track/${trackId}`;
    const response = await axios.get(url);
    return response.data;
  };
  return getCachedData(cacheKey, fetchFunction, 60, CACHE_GROUPS.SONGS);
}

async function getTidalStreamingUrl(tidalUrl, quality = 'LOSSLESS') {
  const cacheKey = `tidal_stream_${tidalUrl}_${quality}`;

  const fetchFunction = async () => {
    let lastError;

    // 1. Try primary stream endpoints
    for (let attempt = 0; attempt < TIDAL_STREAM_ENDPOINTS.length; attempt++) {
      try {
        const streamEndpoint = getCurrentTidalStreamEndpoint();
        // Corrected path to /dl/tidal
        const url = `${streamEndpoint}/dl/tidal?url=${encodeURIComponent(tidalUrl)}&quality=${quality}`;
        const config = {
          method: 'get',
          url: url,
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'Orbit-Music-App/1.0',
            'X-Forwarded-For': generateRandomIP(),
          },
          timeout: 15000
        };
        const response = await axios.request(config);
        
        // The response from this endpoint might be different, let's check for url/directUrl first
        if (response.data && (response.data.url || response.data.directUrl)) {
          console.log(`Successfully fetched stream from ${streamEndpoint}`);
          return response.data.url || response.data.directUrl;
        }
        
        // Fallback for other possible structures
        if (response.data && response.data.sources && response.data.sources.length > 0) {
          console.log(`Successfully fetched stream from ${streamEndpoint}`);
          return response.data.sources[0].url;
        }

        throw new Error('No streaming URL found in response from primary endpoint.');
      } catch (error) {
        console.error(`Primary stream endpoint ${getCurrentTidalStreamEndpoint()} failed:`, error.message);
        lastError = error;
        rotateStreamEndpoint();
      }
    }

    // 2. If all primary endpoints fail, try the dedicated backup
    console.log('All primary stream endpoints failed. Trying dedicated backup...');
    try {
      const backupUrl = `${TIDAL_STREAM_BACKUP_ENDPOINT}?url=${encodeURIComponent(tidalUrl)}&quality=${quality}`;
      const response = await axios.get(backupUrl, {
        headers: { 'Accept': 'application/json', 'User-Agent': 'Orbit-Music-App/1.0' },
        timeout: 15000
      });
      // Correctly parse the backup endpoint's response
      if (response.data && (response.data.url || response.data.directUrl)) {
        console.log('Successfully fetched streaming URL from backup endpoint.');
        return response.data.url || response.data.directUrl;
      }
      throw new Error('No streaming URL found in response from backup endpoint.');
    } catch (backupError) {
      console.error('Backup streaming URL endpoint also failed:', backupError.message);
      lastError = backupError;
    }

    // 3. If all attempts fail, throw the last recorded error
    throw lastError;
  };

  return getCachedData(cacheKey, fetchFunction, 30, CACHE_GROUPS.STREAMING_URLS);
}

function generateRandomIP() {
  return `${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
}

async function getTidalAlbumData(albumId) {
  return {
    success: false,
    message: 'Albums are not supported with Tidal. Please use Saavn for albums.',
    unsupported: true
  };
}

async function getTidalPlaylistData(playlistId) {
  return {
    success: false,
    message: 'Playlists are not supported with Tidal. Please use Saavn for playlists.',
    unsupported: true
  };
}

export {
  getTidalSearchSongData,
  getTidalTrackData,
  getTidalStreamingUrl,
  getTidalAlbumData,
  getTidalPlaylistData,
};