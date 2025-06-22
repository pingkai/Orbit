/**
 * Test utility for FullScreenMusic Three-Dot Menu functionality
 * Use this to verify all menu options work correctly
 */

import { ToastAndroid } from 'react-native';

// Mock song data for testing different scenarios
export const TEST_SONGS = {
  // Song with complete data
  COMPLETE_SONG: {
    id: "test-song-1",
    title: "Test Song Complete",
    artist: "Test Artist",
    albumId: "test-album-1",
    album: { id: "test-album-1", name: "Test Album" },
    artistID: "test-artist-1",
    primary_artists_id: "test-artist-1",
    artwork: "https://example.com/artwork.jpg",
    url: "https://example.com/song.mp3",
    duration: 180000
  },

  // Song with missing album ID (should trigger search)
  MISSING_ALBUM_ID: {
    id: "test-song-2",
    title: "Test Song No Album ID",
    artist: "Test Artist",
    album: "Test Album Name Only",
    artistID: "test-artist-1",
    artwork: "https://example.com/artwork.jpg",
    url: "https://example.com/song.mp3",
    duration: 200000
  },

  // Song with missing artist ID (should trigger search)
  MISSING_ARTIST_ID: {
    id: "test-song-3",
    title: "Test Song No Artist ID",
    artist: "Test Artist Name Only",
    albumId: "test-album-1",
    album: { id: "test-album-1", name: "Test Album" },
    artwork: "https://example.com/artwork.jpg",
    url: "https://example.com/song.mp3",
    duration: 220000
  },

  // Song with minimal data (should trigger multiple searches)
  MINIMAL_DATA: {
    id: "test-song-4",
    title: "Minimal Test Song",
    artist: "Minimal Artist",
    url: "https://example.com/song.mp3"
  },

  // Song with alternative field names
  ALTERNATIVE_FIELDS: {
    id: "test-song-5",
    title: "Alternative Fields Song",
    artist: "Alternative Artist",
    album_id: "alt-album-1",
    primary_artists_id: "alt-artist-1",
    more_info: {
      album_id: "alt-album-1",
      album: "Alternative Album",
      artistid: "alt-artist-1",
      primary_artists: "Alternative Artist"
    },
    artwork: "https://example.com/artwork.jpg",
    url: "https://example.com/song.mp3",
    duration: 240000
  },

  // Song with multiple artists (primary array)
  MULTIPLE_ARTISTS_PRIMARY: {
    id: "test-song-6",
    title: "Multiple Artists Song",
    artist: "Arijit Singh, Pritam, Shreya Ghoshal",
    albumId: "multi-album-1",
    album: { id: "multi-album-1", name: "Multi Artist Album" },
    artists: {
      primary: [
        { id: "arijit-singh-1", name: "Arijit Singh" },
        { id: "pritam-1", name: "Pritam" },
        { id: "shreya-ghoshal-1", name: "Shreya Ghoshal" },
        { id: "amitabh-bhattacharya-1", name: "Amitabh Bhattacharya" }
      ]
    },
    artwork: "https://example.com/artwork.jpg",
    url: "https://example.com/song.mp3",
    duration: 260000
  },

  // Song with multiple artists (string format)
  MULTIPLE_ARTISTS_STRING: {
    id: "test-song-7",
    title: "Collaboration Song",
    artist: "Arijit Singh feat. Shreya Ghoshal & Rahat Fateh Ali Khan",
    albumId: "collab-album-1",
    album: { id: "collab-album-1", name: "Collaboration Album" },
    artistID: "arijit-singh-1",
    primary_artists_id: "arijit-singh-1",
    artwork: "https://example.com/artwork.jpg",
    url: "https://example.com/song.mp3",
    duration: 280000
  }
};

/**
 * Test album navigation functionality
 * @param {Object} song - Song object to test with
 * @param {Function} navigateToAlbum - Album navigation function
 */
export const testAlbumNavigation = async (song, navigateToAlbum) => {
  console.log('🧪 Testing Album Navigation with song:', song.title);
  
  try {
    await navigateToAlbum();
    console.log('✅ Album navigation test completed');
    ToastAndroid.show('Album navigation test completed', ToastAndroid.SHORT);
  } catch (error) {
    console.error('❌ Album navigation test failed:', error);
    ToastAndroid.show('Album navigation test failed', ToastAndroid.SHORT);
  }
};

/**
 * Test artist navigation functionality
 * @param {Object} song - Song object to test with
 * @param {Function} navigateToArtist - Artist navigation function
 */
export const testArtistNavigation = async (song, navigateToArtist) => {
  console.log('🧪 Testing Artist Navigation with song:', song.title);
  
  try {
    await navigateToArtist();
    console.log('✅ Artist navigation test completed');
    ToastAndroid.show('Artist navigation test completed', ToastAndroid.SHORT);
  } catch (error) {
    console.error('❌ Artist navigation test failed:', error);
    ToastAndroid.show('Artist navigation test failed', ToastAndroid.SHORT);
  }
};

/**
 * Test more from artist functionality
 * @param {Object} song - Song object to test with
 * @param {Function} addMoreFromArtist - More from artist function
 */
export const testMoreFromArtist = async (song, addMoreFromArtist) => {
  console.log('🧪 Testing More from Artist with song:', song.title);
  
  try {
    await addMoreFromArtist();
    console.log('✅ More from artist test completed');
    ToastAndroid.show('More from artist test completed', ToastAndroid.SHORT);
  } catch (error) {
    console.error('❌ More from artist test failed:', error);
    ToastAndroid.show('More from artist test failed', ToastAndroid.SHORT);
  }
};

/**
 * Test playlist selector functionality
 * @param {Object} song - Song object to test with
 * @param {Function} addToPlaylist - Add to playlist function
 */
export const testPlaylistSelector = async (song, addToPlaylist) => {
  console.log('🧪 Testing Playlist Selector with song:', song.title);
  
  try {
    await addToPlaylist();
    console.log('✅ Playlist selector test completed');
    ToastAndroid.show('Playlist selector test completed', ToastAndroid.SHORT);
  } catch (error) {
    console.error('❌ Playlist selector test failed:', error);
    ToastAndroid.show('Playlist selector test failed', ToastAndroid.SHORT);
  }
};

/**
 * Run comprehensive test suite for all menu functions
 * @param {Object} menuFunctions - Object containing all menu functions
 * @param {Object} currentPlaying - Current playing song
 */
export const runComprehensiveTest = async (menuFunctions, currentPlaying) => {
  console.log('🚀 Starting Comprehensive Three-Dot Menu Test Suite');
  ToastAndroid.show('Starting menu test suite...', ToastAndroid.LONG);

  const { navigateToArtist, navigateToAlbum, addToPlaylist, addMoreFromArtist } = menuFunctions;
  
  // Test with current playing song
  if (currentPlaying) {
    console.log('📱 Testing with current playing song:', currentPlaying.title);
    
    // Test each function with a delay between tests
    setTimeout(() => testArtistNavigation(currentPlaying, navigateToArtist), 1000);
    setTimeout(() => testAlbumNavigation(currentPlaying, navigateToAlbum), 3000);
    setTimeout(() => testMoreFromArtist(currentPlaying, addMoreFromArtist), 5000);
    setTimeout(() => testPlaylistSelector(currentPlaying, addToPlaylist), 7000);
  }
  
  // Test with mock data for edge cases
  console.log('🧪 Testing edge cases with mock data...');
  
  // You can uncomment these to test with specific mock songs
  // setTimeout(() => testAlbumNavigation(TEST_SONGS.MISSING_ALBUM_ID, navigateToAlbum), 9000);
  // setTimeout(() => testArtistNavigation(TEST_SONGS.MISSING_ARTIST_ID, navigateToArtist), 11000);
  // setTimeout(() => testMoreFromArtist(TEST_SONGS.MINIMAL_DATA, addMoreFromArtist), 13000);
  
  console.log('✅ Test suite scheduled. Check console and toasts for results.');
};

/**
 * Validate song object for testing
 * @param {Object} song - Song object to validate
 * @returns {Object} Validation result
 */
export const validateSongForTesting = (song) => {
  const issues = [];
  const warnings = [];
  
  if (!song) {
    issues.push('Song object is null/undefined');
    return { valid: false, issues, warnings };
  }
  
  // Required fields
  if (!song.id) issues.push('Missing song ID');
  if (!song.title) issues.push('Missing song title');
  if (!song.artist) issues.push('Missing song artist');
  
  // Album-related fields
  const hasAlbumId = !!(song.albumId || song.album_id || song.album?.id || song.more_info?.album_id);
  if (!hasAlbumId) warnings.push('No album ID found - will trigger search');
  
  // Artist-related fields
  const hasArtistId = !!(song.artistID || song.primary_artists_id || song.artists?.primary?.[0]?.id || song.more_info?.artistid);
  if (!hasArtistId) warnings.push('No artist ID found - will trigger search');
  
  const valid = issues.length === 0;
  
  console.log(`🔍 Song validation: ${valid ? 'PASSED' : 'FAILED'}`);
  if (issues.length > 0) console.log('❌ Issues:', issues);
  if (warnings.length > 0) console.log('⚠️ Warnings:', warnings);
  
  return { valid, issues, warnings };
};

/**
 * Log detailed song information for debugging
 * @param {Object} song - Song object to analyze
 */
export const debugSongStructure = (song) => {
  if (!song) {
    console.log('🔍 DEBUG: No song provided');
    return;
  }
  
  console.log('🔍 DEBUG: Song Structure Analysis');
  console.log('📍 Basic Info:', {
    id: song.id,
    title: song.title,
    artist: song.artist,
    duration: song.duration
  });
  
  console.log('📍 Album Info:', {
    albumId: song.albumId,
    album_id: song.album_id,
    'album.id': song.album?.id,
    'album.name': song.album?.name,
    album: typeof song.album === 'string' ? song.album : 'object',
    'more_info.album_id': song.more_info?.album_id,
    'more_info.album': song.more_info?.album
  });
  
  console.log('📍 Artist Info:', {
    artistID: song.artistID,
    primary_artists_id: song.primary_artists_id,
    'artists.primary[0].id': song.artists?.primary?.[0]?.id,
    'artists.primary[0].name': song.artists?.primary?.[0]?.name,
    'more_info.artistid': song.more_info?.artistid,
    'more_info.primary_artists': song.more_info?.primary_artists
  });

  // Show multiple artists if available
  if (song.artists?.primary && Array.isArray(song.artists.primary)) {
    console.log('🎤 Multiple Artists Found:', song.artists.primary.map(artist => ({
      id: artist.id,
      name: artist.name
    })));
  }
  
  console.log('📍 All Keys:', Object.keys(song));
};

export default {
  TEST_SONGS,
  testAlbumNavigation,
  testArtistNavigation,
  testMoreFromArtist,
  testPlaylistSelector,
  runComprehensiveTest,
  validateSongForTesting,
  debugSongStructure
};
