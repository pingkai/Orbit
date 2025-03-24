import { ToastAndroid } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React from 'react';
import { PlaylistSelectorRef } from './PlaylistSelectorManager';

// Default empty playlists array
const DEFAULT_PLAYLISTS = [];

// Function to retrieve all user playlists
export const getUserPlaylists = async () => {
  try {
    console.log('Getting user playlists');
    const playlistsJson = await AsyncStorage.getItem('userPlaylists');
    if (playlistsJson) {
      try {
        const playlists = JSON.parse(playlistsJson);
        console.log(`Found ${playlists.length} user playlists`);
        return playlists;
      } catch (parseError) {
        console.error('Error parsing playlists JSON:', parseError);
        // If JSON is invalid, reset to empty array
        await AsyncStorage.setItem('userPlaylists', JSON.stringify(DEFAULT_PLAYLISTS));
        return DEFAULT_PLAYLISTS;
      }
    }
    console.log('No playlists found, returning empty array');
    return DEFAULT_PLAYLISTS;
  } catch (error) {
    console.error('Error retrieving playlists:', error);
    return DEFAULT_PLAYLISTS;
  }
};

// Function to save a song to a specific playlist
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
    
    // Get all playlists
    const playlists = await getUserPlaylists();
    
    // Find the target playlist
    const playlistIndex = playlists.findIndex(p => p.id === playlistId);
    
    if (playlistIndex === -1) {
      console.error(`Playlist with ID ${playlistId} not found`);
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
    
    // Update playlist cover image if it doesn't have one
    if (!playlists[playlistIndex].coverImage && (formattedSong.artwork)) {
      playlists[playlistIndex].coverImage = formattedSong.artwork;
      console.log('Updated playlist cover image');
    }
    
    // Update playlist lastModified time
    playlists[playlistIndex].lastModified = Date.now();
    
    // Save updated playlists
    await AsyncStorage.setItem('userPlaylists', JSON.stringify(playlists));
    console.log('Playlists saved to storage');
    
    ToastAndroid.show('Song added to playlist', ToastAndroid.SHORT);
    return true;
  } catch (error) {
    console.error('Error adding song to playlist:', error);
    ToastAndroid.show('Failed to add to playlist', ToastAndroid.SHORT);
    return false;
  }
};

// Function to create a new playlist
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