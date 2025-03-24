import AsyncStorage from '@react-native-async-storage/async-storage';
import * as RNFS from 'react-native-fs';
import { Platform } from 'react-native';

const STORAGE_KEYS = {
  LOCAL_MUSIC_CACHE: '@melody_local_music_cache',
  LAST_SCAN_TIME: '@melody_last_scan_time',
  DOWNLOADED_SONGS_METADATA: '@orbit_downloaded_songs_metadata',
};

export const StorageManager = {
  // Save local music metadata to cache
  saveLocalMusicCache: async (musicList) => {
    try {
      const cacheData = {
        timestamp: Date.now(),
        music: musicList,
      };
      await AsyncStorage.setItem(STORAGE_KEYS.LOCAL_MUSIC_CACHE, JSON.stringify(cacheData));
      return true;
    } catch (error) {
      console.error('Error saving local music cache:', error);
      return false;
    }
  },

  // Get cached local music metadata
  getLocalMusicCache: async () => {
    try {
      const cacheData = await AsyncStorage.getItem(STORAGE_KEYS.LOCAL_MUSIC_CACHE);
      if (!cacheData) return null;
      
      const parsedData = JSON.parse(cacheData);
      // Verify if cached files still exist
      const validatedMusic = await Promise.all(
        parsedData.music.map(async (song) => {
          try {
            const exists = await RNFS.exists(song.path);
            return exists ? song : null;
          } catch {
            return null;
          }
        })
      );
      
      return {
        ...parsedData,
        music: validatedMusic.filter(Boolean),
      };
    } catch (error) {
      console.error('Error getting local music cache:', error);
      return null;
    }
  },

  // Save last scan timestamp
  saveLastScanTime: async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEYS.LAST_SCAN_TIME, Date.now().toString());
      return true;
    } catch (error) {
      console.error('Error saving last scan time:', error);
      return false;
    }
  },

  // Get last scan timestamp
  getLastScanTime: async () => {
    try {
      const timestamp = await AsyncStorage.getItem(STORAGE_KEYS.LAST_SCAN_TIME);
      return timestamp ? parseInt(timestamp) : null;
    } catch (error) {
      console.error('Error getting last scan time:', error);
      return null;
    }
  },

  // Clear all cached data
  clearCache: async () => {
    try {
      await AsyncStorage.multiRemove([
        STORAGE_KEYS.LOCAL_MUSIC_CACHE,
        STORAGE_KEYS.LAST_SCAN_TIME,
      ]);
      return true;
    } catch (error) {
      console.error('Error clearing cache:', error);
      return false;
    }
  },

  // Save metadata for downloaded song
  saveDownloadedSongMetadata: async (songId, metadata) => {
    try {
      // Get existing metadata
      const existingData = await AsyncStorage.getItem(STORAGE_KEYS.DOWNLOADED_SONGS_METADATA);
      const metadataMap = existingData ? JSON.parse(existingData) : {};
      
      // Add new metadata
      metadataMap[songId] = {
        ...metadata,
        downloadTime: Date.now(),
      };
      
      // Save updated metadata
      await AsyncStorage.setItem(STORAGE_KEYS.DOWNLOADED_SONGS_METADATA, JSON.stringify(metadataMap));
      return true;
    } catch (error) {
      console.error('Error saving song metadata:', error);
      return false;
    }
  },

  // Get metadata for a downloaded song
  getDownloadedSongMetadata: async (songId) => {
    try {
      const allMetadata = await AsyncStorage.getItem(STORAGE_KEYS.DOWNLOADED_SONGS_METADATA);
      if (!allMetadata) return null;
      
      const metadataMap = JSON.parse(allMetadata);
      return metadataMap[songId] || null;
    } catch (error) {
      console.error('Error getting song metadata:', error);
      return null;
    }
  },

  // Get all downloaded songs metadata
  getAllDownloadedSongsMetadata: async () => {
    try {
      const allMetadata = await AsyncStorage.getItem(STORAGE_KEYS.DOWNLOADED_SONGS_METADATA);
      return allMetadata ? JSON.parse(allMetadata) : {};
    } catch (error) {
      console.error('Error getting all songs metadata:', error);
      return {};
    }
  },

  // Remove metadata for a song
  removeDownloadedSongMetadata: async (songId) => {
    try {
      const allMetadata = await AsyncStorage.getItem(STORAGE_KEYS.DOWNLOADED_SONGS_METADATA);
      if (!allMetadata) return true;
      
      const metadataMap = JSON.parse(allMetadata);
      delete metadataMap[songId];
      
      await AsyncStorage.setItem(STORAGE_KEYS.DOWNLOADED_SONGS_METADATA, JSON.stringify(metadataMap));
      return true;
    } catch (error) {
      console.error('Error removing song metadata:', error);
      return false;
    }
  },

  // Create necessary directories for song storage
  ensureDirectoriesExist: async () => {
    try {
      const basePath = Platform.OS === 'android' 
        ? RNFS.DocumentDirectoryPath + '/Orbit'
        : RNFS.DocumentDirectoryPath + '/Orbit';
      
      const paths = [
        basePath,
        basePath + '/songs',
        basePath + '/artwork',
        basePath + '/metadata'
      ];
      
      for (const path of paths) {
        const exists = await RNFS.exists(path);
        if (!exists) {
          await RNFS.mkdir(path);
          // Create .nomedia file on Android to hide media from gallery
          if (Platform.OS === 'android') {
            await RNFS.writeFile(path + '/.nomedia', '');
          }
        }
      }
      return true;
    } catch (error) {
      console.error('Error creating directories:', error);
      return false;
    }
  },

  // Save artwork for a song
  saveArtwork: async (songId, artworkUrl) => {
    try {
      await StorageManager.ensureDirectoriesExist();
      const artworkPath = Platform.OS === 'android'
        ? `${RNFS.DocumentDirectoryPath}/Orbit/artwork/${songId}.jpg`
        : `${RNFS.DocumentDirectoryPath}/Orbit/artwork/${songId}.jpg`;
      
      // Download and save artwork
      await RNFS.downloadFile({
        fromUrl: artworkUrl,
        toFile: artworkPath,
      }).promise;
      
      return artworkPath;
    } catch (error) {
      console.error('Error saving artwork:', error);
      return null;
    }
  },

  // Get artwork path for a song
  getArtworkPath: (songId) => {
    return Platform.OS === 'android'
      ? `${RNFS.DocumentDirectoryPath}/Orbit/artwork/${songId}.jpg`
      : `${RNFS.DocumentDirectoryPath}/Orbit/artwork/${songId}.jpg`;
  },

  // Get song file path
  getSongPath: (songId) => {
    return Platform.OS === 'android'
      ? `${RNFS.DocumentDirectoryPath}/Orbit/songs/${songId}.mp3`
      : `${RNFS.DocumentDirectoryPath}/Orbit/songs/${songId}.mp3`;
  },
};