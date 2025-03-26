import { ToastAndroid } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React from 'react';
import { PlaylistSelectorRef } from './PlaylistSelectorManager';

// Default empty playlists array
const DEFAULT_PLAYLISTS = [];

// Add caching mechanism to prevent multiple AsyncStorage reads
let cachedPlaylists = null;
let lastCacheTime = 0;
const CACHE_EXPIRY = 30000; // 30 seconds

// Add memory management constants
const PLAYLIST_MAX_MEMORY_AGE = 300000; // 5 minutes
let lastMemoryCheck = 0;

// Function to retrieve all user playlists with performance optimizations
export const getUserPlaylists = async (options = {}) => {
  const { bypassCache = false, lightFormat = false } = options;
  
  try {
    const now = Date.now();
    
    // Check if we should clean up memory periodically
    if (now - lastMemoryCheck > PLAYLIST_MAX_MEMORY_AGE) {
      clearPlaylistCache();
      lastMemoryCheck = now;
    }
    
    // Return cached playlists if available, not expired, and not bypassed
    if (!bypassCache && cachedPlaylists && (now - lastCacheTime < CACHE_EXPIRY)) {
      console.log('Returning cached playlists');
      
      // If light format is requested, strip song details to reduce memory usage
      if (lightFormat && Array.isArray(cachedPlaylists)) {
        return cachedPlaylists.map(playlist => ({
          id: playlist.id,
          name: playlist.name,
          coverImage: playlist.coverImage,
          createdAt: playlist.createdAt,
          lastModified: playlist.lastModified,
          customPlaylist: playlist.customPlaylist,
          songCount: playlist.songs ? playlist.songs.length : 0
          // Don't include the songs array to save memory
        }));
      }
      
      return cachedPlaylists;
    }
    
    console.log('Getting user playlists from storage');
    const playlistsJson = await AsyncStorage.getItem('userPlaylists');
    
    if (!playlistsJson) {
      console.log('No playlists found, returning empty array');
      cachedPlaylists = DEFAULT_PLAYLISTS;
      lastCacheTime = now;
      return DEFAULT_PLAYLISTS;
    }
    
      try {
        const playlists = JSON.parse(playlistsJson);
        console.log(`Found ${playlists.length} user playlists`);
      
      // Update cache with full data
      cachedPlaylists = playlists;
      lastCacheTime = now;
      
      // If light format is requested, strip song details to reduce memory usage
      if (lightFormat && Array.isArray(playlists)) {
        return playlists.map(playlist => ({
          id: playlist.id,
          name: playlist.name,
          coverImage: playlist.coverImage,
          createdAt: playlist.createdAt,
          lastModified: playlist.lastModified,
          customPlaylist: playlist.customPlaylist,
          songCount: playlist.songs ? playlist.songs.length : 0
          // Don't include the songs array
        }));
      }
      
        return playlists;
      } catch (parseError) {
        console.error('Error parsing playlists JSON:', parseError);
        // If JSON is invalid, reset to empty array
        await AsyncStorage.setItem('userPlaylists', JSON.stringify(DEFAULT_PLAYLISTS));
      
      // Update cache
      cachedPlaylists = DEFAULT_PLAYLISTS;
      lastCacheTime = now;
      
        return DEFAULT_PLAYLISTS;
    }
  } catch (error) {
    console.error('Error retrieving playlists:', error);
    
    // Only show error message if not a network error
    if (!error.message?.includes('Network') && !error.message?.includes('network')) {
      ToastAndroid.show('Error loading playlists', ToastAndroid.SHORT);
    }
    
    // Return cached playlists if available, otherwise empty array
    return cachedPlaylists || DEFAULT_PLAYLISTS;
  }
};

// Function to get a single playlist by ID with optimized loading
export const getUserPlaylistById = async (playlistId) => {
  if (!playlistId) {
    console.error('No playlistId provided to getUserPlaylistById');
    return null;
  }
  
  try {
    // First check if we have this playlist in cache
    const now = Date.now();
    if (cachedPlaylists && (now - lastCacheTime < CACHE_EXPIRY)) {
      const playlist = cachedPlaylists.find(p => p.id === playlistId);
      if (playlist) {
        console.log(`Found playlist ${playlistId} in cache`);
        return playlist;
      }
    }
    
    // Get playlists from storage
    const playlistsJson = await AsyncStorage.getItem('userPlaylists');
    if (!playlistsJson) {
      console.log('No playlists found in storage');
      return null;
    }
    
    // Parse playlists JSON
    const playlists = JSON.parse(playlistsJson);
    
    // Find playlist by ID
    const playlist = playlists.find(p => p.id === playlistId);
    if (!playlist) {
      console.log(`Playlist with ID ${playlistId} not found`);
      return null;
    }
    
    // Update cache with full playlists data
    cachedPlaylists = playlists;
    lastCacheTime = now;
    
    return playlist;
  } catch (error) {
    console.error('Error getting playlist by ID:', error);
    return null;
  }
};

// Function to save a song to a specific playlist with performance optimizations
export const addSongToPlaylist = async (playlistId, song) => {
  try {
    if (!playlistId) {
      console.error('No playlistId provided');
      ToastAndroid.show('Invalid playlist', ToastAndroid.SHORT);
      return false;
    }
    
    if (!song || !song.id) {
      console.error('Invalid song object:', song);
      ToastAndroid.show('Invalid song data', ToastAndroid.SHORT);
      return false;
    }
    
    console.log(`Adding song ${song.title} to playlist ${playlistId}`);
    
    // Get the specific playlist instead of all playlists for better performance
    const playlist = await getUserPlaylistById(playlistId);
    
    if (!playlist) {
      console.error(`Playlist with ID ${playlistId} not found`);
      ToastAndroid.show('Playlist not found', ToastAndroid.SHORT);
      return false;
    }
    
    // Get full playlists list for updating
    const playlists = await getUserPlaylists({ bypassCache: true });
    const playlistIndex = playlists.findIndex(p => p.id === playlistId);
    
    if (playlistIndex === -1) {
      console.error(`Playlist with ID ${playlistId} not found in full list`);
      ToastAndroid.show('Playlist not found', ToastAndroid.SHORT);
      return false;
    }
    
    // Ensure playlist object has the right structure
    if (!playlists[playlistIndex].songs) {
      console.log('Initializing songs array for playlist');
      playlists[playlistIndex].songs = [];
    }
    
    // Ensure the song has all required properties
    const formattedSong = {
      id: song.id,
      title: song.title || 'Unknown Title',
      artist: song.artist || 'Unknown Artist',
      artwork: song.artwork || song.image || null,
      url: song.url || '',
      duration: song.duration || 0,
      language: song.language || '',
      artistID: song.artistID || song.primary_artists_id || '',
      addedAt: Date.now()
    };
    
    // Check if song already exists in playlist to avoid duplicates
    const songExists = playlists[playlistIndex].songs.some(s => s.id === formattedSong.id);
    
    if (songExists) {
      console.log('Song already exists in playlist');
      ToastAndroid.show('Song already exists in playlist', ToastAndroid.SHORT);
      return false;
    }
    
    // Add song to playlist
    playlists[playlistIndex].songs.push(formattedSong);
    console.log('Song added to playlist in memory');
    
    // Update playlist cover image with the new song's artwork
    if (formattedSong.artwork) {
      playlists[playlistIndex].coverImage = formattedSong.artwork;
      console.log('Updated playlist cover image to new song artwork');
    }
    
    // Update playlist lastModified time
    playlists[playlistIndex].lastModified = Date.now();
    
    // Save updated playlists
    await AsyncStorage.setItem('userPlaylists', JSON.stringify(playlists));
    console.log('Playlists saved to storage');
    
    // Update cache
    cachedPlaylists = playlists;
    lastCacheTime = Date.now();
    
    ToastAndroid.show('Song added to playlist', ToastAndroid.SHORT);
    return true;
  } catch (error) {
    console.error('Error adding song to playlist:', error);
    ToastAndroid.show('Failed to add to playlist', ToastAndroid.SHORT);
    return false;
  }
};

// Function to create a new playlist with performance optimizations
export const createPlaylist = async (name, initialSong = null) => {
  try {
    if (!name || !name.trim()) {
      ToastAndroid.show('Please enter a playlist name', ToastAndroid.SHORT);
      return false;
    }
    
    console.log('Creating new playlist:', name);
    
    // Get existing playlists
    const playlists = await getUserPlaylists();
    
    // Generate unique ID
    const newPlaylistId = 'playlist_' + Date.now();
    
    // Format initial song if provided
    let formattedInitialSong = null;
    if (initialSong && initialSong.id) {
      formattedInitialSong = {
        id: initialSong.id,
        title: initialSong.title || 'Unknown Title',
        artist: initialSong.artist || 'Unknown Artist',
        artwork: initialSong.artwork || initialSong.image || null,
        url: initialSong.url || '',
        duration: initialSong.duration || 0,
        language: initialSong.language || '',
        artistID: initialSong.artistID || initialSong.primary_artists_id || '',
        addedAt: Date.now()
      };
    }
    
    // Create new playlist object
    const newPlaylist = {
      id: newPlaylistId,
      name: name.trim(),
      coverImage: formattedInitialSong?.artwork || null,
      songs: formattedInitialSong ? [formattedInitialSong] : [],
      createdAt: Date.now(),
      lastModified: Date.now(),
      customPlaylist: true
    };
    
    console.log('New playlist object created:', newPlaylist);
    
    // Add to playlists and save
    const updatedPlaylists = Array.isArray(playlists) ? [...playlists, newPlaylist] : [newPlaylist];
    
    // Log the playlist structure before saving
    console.log(`Saving ${updatedPlaylists.length} playlists to storage`);
    
    await AsyncStorage.setItem('userPlaylists', JSON.stringify(updatedPlaylists));
    console.log('Playlist saved successfully');
    
    // Update cache
    cachedPlaylists = updatedPlaylists;
    lastCacheTime = Date.now();
    
    ToastAndroid.show('Playlist created', ToastAndroid.SHORT);
    return true;
  } catch (error) {
    console.error('Error creating playlist:', error);
    ToastAndroid.show('Failed to create playlist', ToastAndroid.SHORT);
    return false;
  }
};

// Function to show playlist selector
export const showPlaylistSelector = (song) => {
  try {
    if (!song) {
      console.error('No song provided to showPlaylistSelector');
      ToastAndroid.show('Invalid song data', ToastAndroid.SHORT);
      return false;
    }
    
    // Import required (safe from circular dependency due to dynamic import)
    const { showPlaylistSelectorWithFallback } = require('./PlaylistSelectorManager');
    
    // Format song to ensure all required fields
    const formattedSong = {
      id: song.id,
      title: song.title || 'Unknown Title',
      artist: song.artist || 'Unknown Artist',
      artwork: song.artwork || song.image,
      url: song.url || '',
      duration: song.duration || 0,
      language: song.language || '',
      artistID: song.artistID || song.primary_artists_id || '',
    };
    
    // Use the fallback function with better error handling
    return showPlaylistSelectorWithFallback(formattedSong);
  } catch (error) {
    console.error('Error showing playlist selector:', error);
    ToastAndroid.show('Error opening playlist selector', ToastAndroid.SHORT);
    return false;
  }
};

// Function to remove a song from a playlist with optimized processing
export const removeSongFromPlaylist = async (playlistId, songId) => {
  try {
    if (!playlistId || !songId) {
      console.error('Invalid parameters for song removal', { playlistId, songId });
      return false;
    }
    
    // Get the specific playlist first for better performance
    const playlist = await getUserPlaylistById(playlistId);
    
    if (!playlist) {
      console.error(`Playlist with ID ${playlistId} not found`);
      ToastAndroid.show('Playlist not found', ToastAndroid.SHORT);
      return false;
    }
    
    // Check if playlist has songs
    if (!playlist.songs || !Array.isArray(playlist.songs)) {
      console.error('Playlist songs array is invalid', playlist.songs);
      return false;
    }
    
    // Get full playlists list for updating
    const playlists = await getUserPlaylists({ bypassCache: true });
    const playlistIndex = playlists.findIndex(p => p.id === playlistId);
    
    if (playlistIndex === -1) {
      console.error(`Playlist with ID ${playlistId} not found in full list`);
      ToastAndroid.show('Playlist not found', ToastAndroid.SHORT);
      return false;
    }
    
    // Filter out the song to remove
    const originalLength = playlists[playlistIndex].songs.length;
    playlists[playlistIndex].songs = playlists[playlistIndex].songs.filter(song => song.id !== songId);
    
    // Check if song was actually removed
    if (playlists[playlistIndex].songs.length === originalLength) {
      console.log(`Song ${songId} not found in playlist ${playlistId}`);
      return false;
    }
    
    // Update timestamp
    playlists[playlistIndex].lastModified = Date.now();
    
    // Update cover image if needed (e.g., if we removed the song that was the cover)
    if (playlists[playlistIndex].songs.length > 0 && 
        (!playlists[playlistIndex].coverImage || 
         playlists[playlistIndex].coverImage.includes(songId))) {
      // Use the first song as cover
      const firstSong = playlists[playlistIndex].songs[0];
      if (firstSong && (firstSong.artwork || firstSong.image)) {
        playlists[playlistIndex].coverImage = firstSong.artwork || firstSong.image;
      }
    } else if (playlists[playlistIndex].songs.length === 0) {
      // Reset cover if no songs left
      playlists[playlistIndex].coverImage = null;
    }
    
    // Save updated playlists
    await AsyncStorage.setItem('userPlaylists', JSON.stringify(playlists));
    
    // Update cache
    cachedPlaylists = playlists;
    lastCacheTime = Date.now();
    
    console.log(`Song ${songId} removed from playlist ${playlistId}`);
    return true;
  } catch (error) {
    console.error('Error removing song from playlist:', error);
    return false;
  }
};

// Add function to clear the cache (useful when you want to force a refresh)
export const clearPlaylistCache = () => {
  cachedPlaylists = null;
  lastCacheTime = 0;
  console.log('Playlist cache cleared');
};

// Helper function to batch update playlists for better performance
export const batchProcessPlaylists = async (processFn) => {
  try {
    // Get all playlists
    const playlists = await getUserPlaylists({ bypassCache: true });
    
    // Apply the process function
    const updatedPlaylists = await processFn(playlists);
    
    // Save the updated playlists
    if (updatedPlaylists) {
      await AsyncStorage.setItem('userPlaylists', JSON.stringify(updatedPlaylists));
      
      // Update cache
      cachedPlaylists = updatedPlaylists;
      lastCacheTime = Date.now();
      
      return true;
    }
    
    return false;
  } catch (error) {
    console.error('Error in batch processing playlists:', error);
    return false;
  }
}; 