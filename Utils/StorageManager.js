import AsyncStorage from '@react-native-async-storage/async-storage';
import * as RNFS from 'react-native-fs';

const STORAGE_KEYS = {
  LOCAL_MUSIC_CACHE: '@melody_local_music_cache',
  LAST_SCAN_TIME: '@melody_last_scan_time',
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
};