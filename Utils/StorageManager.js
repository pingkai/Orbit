import AsyncStorage from '@react-native-async-storage/async-storage';
import * as RNFS from 'react-native-fs';
import { Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';

const STORAGE_KEYS = {
  LOCAL_MUSIC_CACHE: '@orbit_local_music_cache',
  LAST_SCAN_TIME: '@orbit_last_scan_time',
  DOWNLOADED_SONGS_METADATA: '@orbit_downloaded_songs_metadata',
};

// Helper function to ensure paths are always strings
const safePath = (path) => {
  if (path === null || path === undefined) {
    console.warn('NULL or undefined path provided to safePath');
    return '';
  }
  
  if (typeof path === 'string') {
    return path;
  }
  
  // Try to convert object to string
  try {
    if (path.toString && typeof path.toString === 'function') {
      return path.toString();
    }
    return '' + path; // Fallback string conversion
  } catch (e) {
    console.error('Failed to convert path to string:', e);
    return ''; // Return empty string as fallback
  }
};

// Safe wrapper for RNFS.exists that ensures path is a string
const safeExists = async (path) => {
  try {
    const stringPath = safePath(path);
    if (!stringPath) {
      console.warn('Empty path provided to safeExists');
      return false;
    }
    return await RNFS.exists(stringPath);
  } catch (error) {
    console.error('Error in safeExists:', error);
    return false;
  }
};

// Safe wrapper for RNFS.unlink that ensures path is a string
const safeUnlink = async (path) => {
  try {
    const stringPath = safePath(path);
    if (!stringPath) {
      console.warn('Empty path provided to safeUnlink');
      return false;
    }
    if (await safeExists(stringPath)) {
      await RNFS.unlink(stringPath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('Error in safeUnlink:', error);
    return false;
  }
};

// Safe wrapper for RNFS.mkdir that ensures path is a string
const safeMkdir = async (path) => {
  try {
    const stringPath = safePath(path);
    if (!stringPath) {
      console.warn('Empty path provided to safeMkdir');
      return false;
    }
    if (!(await safeExists(stringPath))) {
      await RNFS.mkdir(stringPath);
      return true;
    }
    return true; // Directory already exists
  } catch (error) {
    console.error('Error in safeMkdir:', error);
    return false;
  }
};

// Define the base directory for all Orbit music files
const getBaseDir = async () => {
  try {
    // On Android 13+ (API level 33+), use app-specific storage to avoid permission issues
    const apiLevel = await DeviceInfo.getApiLevel();
    
    if (Platform.OS === 'android') {
      if (apiLevel >= 33) {
        // Use app-specific directory for Android 13+ which doesn't require permissions
        const appDir = RNFS.DocumentDirectoryPath + '/orbit_music';
        console.log('Using app-specific directory for Android 13+:', appDir);
        return appDir;
      } else {
        // For older Android versions, use Download directory (requires permission)
        return RNFS.DownloadDirectoryPath + '/orbit';
      }
    }
    return RNFS.DocumentDirectoryPath + '/music/orbit';
  } catch (error) {
    console.error('Error determining base directory:', error);
    // Fallback to app-specific directory which is always accessible
    return RNFS.DocumentDirectoryPath + '/orbit_music';
  }
};

// Ensure all necessary directories exist
const ensureDirectoriesExist = async () => {
  try {
    const baseDir = await getBaseDir();
    const dirs = [
      baseDir,
      `${baseDir}/songs`,
      `${baseDir}/artwork`,
      `${baseDir}/metadata`,
    ];
    
    // Create each directory if it doesn't exist
    for (const dir of dirs) {
      const safeDir = safePath(dir);
      if (!safeDir) {
        console.warn(`Invalid directory path: ${dir}`);
        continue;
      }
      
      try {
        if (!(await safeExists(safeDir))) {
          await RNFS.mkdir(safeDir);
          console.log(`Created directory: ${safeDir}`);
        }
      } catch (dirError) {
        console.error(`Error creating directory ${safeDir}:`, dirError);
      }
    }
    return true;
  } catch (error) {
    console.error('Error ensuring directories exist:', error);
    return false;
  }
};

// Safe wrapper for file operations that handles permissions issues
const safeFileOperation = async (operation, fallback = null) => {
  try {
    return await operation();
  } catch (error) {
    // Check if it's a permissions error
    if (error.message && (error.message.includes('EPERM') || error.message.includes('permission'))) {
      console.log('Permission error in file operation, using fallback path');
      
      // Switch to fallback path for future operations
      const fallbackPath = safePath(RNFS.DocumentDirectoryPath + '/orbit_music');
      try {
        const fallbackExists = await safeExists(fallbackPath);
        if (!fallbackExists) {
          await safeMkdir(fallbackPath);
        }
        
        // If a fallback operation is provided, try it
        if (fallback) {
          return await fallback();
        }
      } catch (fallbackError) {
        console.error('Error in fallback operation:', fallbackError);
      }
    }
    
    // Handle error specifically if it's related to path.startsWith
    if (error.message && error.message.includes('path.startsWith is not a function')) {
      console.error('Path is not a string:', error);
      return null;
    }
    
    throw error;
  }
};

export const StorageManager = {
  // Get the base directory for music files
  getBaseDir: async () => {
    return await getBaseDir();
  },
  
  // Ensure all directories exist
  ensureDirectoriesExist: async () => {
    return await ensureDirectoriesExist();
  },
  
  // Get path for a song file
  getSongPath: async (songId, fileName = null) => {
    const baseDir = await getBaseDir();
    return `${baseDir}/songs/${songId}${fileName ? '.' + fileName.split('.').pop() : '.mp3'}`;
  },
  
  // Get path for artwork
  getArtworkPath: async (songId) => {
    const baseDir = await getBaseDir();
    return `${baseDir}/artwork/${songId}.jpg`;
  },

  // Format song title from filename (utility function)
  formatSongTitle: (filename) => {
    if (!filename) return "Unknown";
    
    // Remove file extension
    let name = filename.replace(/\.(mp3|m4a|wav|flac)$/i, '');
    
    // Remove any ID prefix (common pattern is ID_filename.mp3)
    name = name.replace(/^[a-zA-Z0-9]+[_-]/, '');
    
    // Replace underscores and dashes with spaces
    name = name.replace(/[_-]/g, ' ');
    
    // Trim and capitalize first letter
    name = name.trim();
    return name.charAt(0).toUpperCase() + name.slice(1);
  },

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
      
      // Check if music array exists to prevent TypeError
      if (!parsedData.music) {
        console.log('No music array found in cache data');
        return {
          timestamp: parsedData.timestamp || Date.now(),
          music: []
        };
      }
      
      // Verify if cached files still exist
      const validatedMusic = await Promise.all(
        parsedData.music.map(async (song) => {
          try {
            // Skip path check if it's null or undefined
            if (!song.path) return song;
            
            // Use our safe exists function
            try {
              const exists = await safeExists(song.path);
              return exists ? song : null;
            } catch (pathError) {
              console.log('Error checking path existence:', pathError);
              return song; // Return the song anyway rather than losing it
            }
          } catch (error) {
            console.log('Error validating song:', error);
            return song; // Return the song anyway rather than losing it
          }
        })
      );
      
      return {
        ...parsedData,
        music: validatedMusic.filter(Boolean),
      };
    } catch (error) {
      console.error('Error getting local music cache:', error);
      return { timestamp: Date.now(), music: [] };
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
      
      // Ensure paths are strings
      let artworkPath = metadata.localArtworkPath || StorageManager.getArtworkPath(songId);
      let songPath = metadata.localSongPath || StorageManager.getSongPath(songId, metadata.originalFilename);
      
      // Add new metadata with enhanced information
      metadataMap[songId] = {
        ...metadata,
        downloadTime: Date.now(),
        fileSize: metadata.fileSize || 0,
        originalFilename: metadata.originalFilename || `${songId}.mp3`,
        localArtworkPath: artworkPath,
        localSongPath: songPath,
      };
      
      // Save updated metadata
      await AsyncStorage.setItem(STORAGE_KEYS.DOWNLOADED_SONGS_METADATA, JSON.stringify(metadataMap));
      
      // Also save a separate metadata file for each song for redundancy
      try {
        await StorageManager.saveMetadataFile(songId, metadataMap[songId]);
      } catch (fileError) {
        console.error('Error saving metadata file:', fileError);
        // Continue even if this fails
      }
      
      return true;
    } catch (error) {
      console.error('Error saving song metadata:', error);
      return false;
    }
  },

  // Save metadata to a file for redundancy
  saveMetadataFile: async (songId, metadata) => {
    try {
      await StorageManager.ensureDirectoriesExist();
      const baseDir = await getBaseDir();
      const metadataPath = safePath(`${baseDir}/metadata/${songId}.json`);
      await RNFS.writeFile(metadataPath, JSON.stringify(metadata, null, 2), 'utf8');
      return true;
    } catch (error) {
      console.error('Error saving metadata file:', error);
      return false;
    }
  },

  // Get metadata for a downloaded song
  getDownloadedSongMetadata: async (songId) => {
    try {
      // First try AsyncStorage
      const allMetadata = await AsyncStorage.getItem(STORAGE_KEYS.DOWNLOADED_SONGS_METADATA);
      if (allMetadata) {
        const metadataMap = JSON.parse(allMetadata);
        if (metadataMap[songId]) return metadataMap[songId];
      }
      
      // If not found, try reading from file
      const baseDir = await getBaseDir();
      const metadataPath = safePath(`${baseDir}/metadata/${songId}.json`);
      if (await safeExists(metadataPath)) {
        try {
          const fileData = await RNFS.readFile(metadataPath, 'utf8');
          return JSON.parse(fileData);
        } catch (readError) {
          console.error('Error reading metadata file:', readError);
          return null;
        }
      }
      
      return null;
    } catch (error) {
      console.error('Error getting song metadata:', error);
      return null;
    }
  },

  // Get all downloaded songs metadata
  getAllDownloadedSongsMetadata: async () => {
    try {
      // First try AsyncStorage for faster access
      const allMetadata = await AsyncStorage.getItem(STORAGE_KEYS.DOWNLOADED_SONGS_METADATA);
      if (allMetadata) {
        return JSON.parse(allMetadata);
      }
      
      // If AsyncStorage fails, rebuild from individual files
      await StorageManager.ensureDirectoriesExist();
      const metadataFiles = await RNFS.readDir(`${await getBaseDir()}/metadata`);
      const metadataMap = {};
      
      for (const file of metadataFiles) {
        if (file.name.endsWith('.json')) {
          try {
            const songId = file.name.replace('.json', '');
            const fileData = await RNFS.readFile(file.path, 'utf8');
            metadataMap[songId] = JSON.parse(fileData);
          } catch (e) {
            console.error('Error reading metadata file:', e);
          }
        }
      }
      
      // Update AsyncStorage with rebuilt data
      await AsyncStorage.setItem(STORAGE_KEYS.DOWNLOADED_SONGS_METADATA, JSON.stringify(metadataMap));
      
      return metadataMap;
    } catch (error) {
      console.error('Error getting all songs metadata:', error);
      return {};
    }
  },

  // Remove metadata for a song and delete files
  removeDownloadedSongMetadata: async (songId) => {
    try {
      // Update AsyncStorage
      const allMetadata = await AsyncStorage.getItem(STORAGE_KEYS.DOWNLOADED_SONGS_METADATA);
      if (allMetadata) {
        const metadataMap = JSON.parse(allMetadata);
        const metadata = metadataMap[songId];
        
        if (metadata) {
          // Delete files
          try {
            // Delete song file
            const songPath = metadata.localSongPath || StorageManager.getSongPath(songId);
            await safeUnlink(songPath);
            
            // Delete artwork
            const artworkPath = metadata.localArtworkPath || StorageManager.getArtworkPath(songId);
            await safeUnlink(artworkPath);
            
            // Delete metadata file
            const baseDir = await getBaseDir();
            const metadataPath = safePath(`${baseDir}/metadata/${songId}.json`);
            await safeUnlink(metadataPath);
          } catch (e) {
            console.error('Error deleting song files:', e);
          }
        }
        
        // Remove from metadata map
        delete metadataMap[songId];
        
        // Update AsyncStorage
        await AsyncStorage.setItem(STORAGE_KEYS.DOWNLOADED_SONGS_METADATA, JSON.stringify(metadataMap));
      }
      
      return true;
    } catch (error) {
      console.error('Error removing song metadata:', error);
      return false;
    }
  },

  // Scan for downloaded songs in the storage directory
  scanDownloadedSongs: async () => {
    try {
      await StorageManager.ensureDirectoriesExist();
      
      try {
        // Read song files directory
        const baseDir = await getBaseDir();
        const songsDir = safePath(`${baseDir}/songs`);
        if (!songsDir) {
          console.error('Invalid songs directory path');
          return [];
        }
        
        // Check if the directory exists
        if (!(await safeExists(songsDir))) {
          console.warn(`Songs directory does not exist: ${songsDir}`);
          return [];
        }
        
        // Read directory contents
        const files = await RNFS.readDir(songsDir);
        
        // Get all existing metadata
        const metadata = await StorageManager.getAllDownloadedSongsMetadata();
        
        // Check for any files without metadata and build a list of valid songs
        const validSongs = [];
        for (const file of files) {
          if (file && file.name && file.name.endsWith('.mp3')) {
            // Extract the song ID from the filename
            try {
              const fileName = file.name;
              const songId = fileName.split('_')[0].replace('.mp3', '');
              
              if (metadata[songId]) {
                validSongs.push({
                  id: songId,
                  path: safePath(file.path),
                  size: file.size,
                  metadata: metadata[songId]
                });
              }
            } catch (parseError) {
              console.error('Error parsing filename:', file.name, parseError);
            }
          }
        }
        
        return validSongs;
      } catch (dirError) {
        console.error('Error reading songs directory:', dirError);
        return [];
      }
    } catch (error) {
      console.error('Error scanning downloaded songs:', error);
      return [];
    }
  },

  // Check if a song is already downloaded
  isSongDownloaded: async (songId) => {
    try {
      if (!songId) return false;
      
      // First check in metadata
      try {
        const allMetadata = await StorageManager.getAllDownloadedSongsMetadata();
        if (Object.keys(allMetadata).includes(songId)) {
          return true;
        }
      } catch (metadataError) {
        console.error('Error accessing metadata:', metadataError);
      }
      
      // Fallback: check if the song file exists
      try {
        const songPath = StorageManager.getSongPath(songId);
        return await safeExists(songPath);
      } catch (fileError) {
        console.error('Error checking song file:', fileError);
      }
      
      return false;
    } catch (error) {
      console.error('Error checking if song is downloaded:', error);
      return false;
    }
  },

  // Scan for downloaded songs in the storage directory
  scanDownloadDirectory: async () => {
    // implementation details
  },

  // Get path for a song file - with better string handling
  getSongPath: (songId, fileName = null) => {
    try {
      // If songId is not valid, return empty
      if (!songId) {
        console.warn('Invalid songId provided to getSongPath');
        return '';
      }
      
      // Use synchronous version for simplicity and to avoid path.startsWith issues
      const baseDir = RNFS.DocumentDirectoryPath + '/orbit_music';
      const extension = fileName ? '.' + String(fileName).split('.').pop() : '.mp3';
      
      // Explicitly build path as string
      return baseDir + '/songs/' + String(songId) + extension;
    } catch (error) {
      console.error('Error in getSongPath:', error);
      return RNFS.DocumentDirectoryPath + '/orbit_music/songs/error.mp3';
    }
  },
  
  // Get path for artwork - with better string handling
  getArtworkPath: (songId) => {
    try {
      // If songId is not valid, return empty
      if (!songId) {
        console.warn('Invalid songId provided to getArtworkPath');
        return '';
      }
      
      // Use synchronous version for simplicity and to avoid path.startsWith issues
      const baseDir = RNFS.DocumentDirectoryPath + '/orbit_music';
      
      // Explicitly build path as string
      return baseDir + '/artwork/' + String(songId) + '.jpg';
    } catch (error) {
      console.error('Error in getArtworkPath:', error);
      return RNFS.DocumentDirectoryPath + '/orbit_music/artwork/error.jpg';
    }
  },
  
  // Download and save artwork from URL
  saveArtwork: async (songId, artworkUrl) => {
    try {
      await StorageManager.ensureDirectoriesExist();
      const artworkPath = safePath(StorageManager.getArtworkPath(songId));
      
      // Validate URL and path
      if (!artworkUrl || typeof artworkUrl !== 'string') {
        console.error('Invalid artwork URL:', artworkUrl);
        return null;
      }
      
      if (!artworkPath) {
        console.error('Invalid artwork path');
        return null;
      }
      
      // Download the artwork
      try {
        await RNFS.downloadFile({
          fromUrl: artworkUrl,
          toFile: artworkPath,
        }).promise;
        
        // Verify the file was downloaded
        if (await safeExists(artworkPath)) {
          return artworkPath;
        } else {
          console.error('Artwork file not found after download');
          return null;
        }
      } catch (downloadError) {
        console.error('Error downloading artwork:', downloadError);
        return null;
      }
    } catch (error) {
      console.error('Error saving artwork:', error);
      return null;
    }
  },
};