import AsyncStorage from '@react-native-async-storage/async-storage';
import * as RNFS from 'react-native-fs';
import { Platform } from 'react-native';
import { GetDownloadPath } from '../LocalStorage/AppSettings';

// Ensures paths are always non-null strings
const safePath = (path) => {
  if (path === null || path === undefined) return '';
  return String(path);
};

// Safe wrapper for RNFS.exists
const safeExists = async (path) => {
  try {
    const stringPath = safePath(path);
    if (!stringPath) return false;
    return await RNFS.exists(stringPath);
  } catch (error) {
    console.error('Error in safeExists:', error);
    return false;
  }
};

// Determines the base directory based on user settings and platform
const getBaseDir = async () => {
  try {
    const downloadPref = await GetDownloadPath(); // 'Music' or 'Download'
    let publicDir;

    if (Platform.OS === 'android') {
      const musicDir = RNFS.MusicDirectoryPath;
      const downloadDir = RNFS.DownloadDirectoryPath;

      if (downloadPref === 'Music' && musicDir) {
        publicDir = musicDir;
      } else if (downloadDir) {
        publicDir = downloadDir;
      } else {
        console.warn(`Preferred directory '${downloadPref}' not available. Falling back.`);
        publicDir = RNFS.ExternalDirectoryPath || RNFS.DocumentDirectoryPath;
      }
    } else {
      publicDir = RNFS.DocumentDirectoryPath;
    }

    if (!publicDir) {
      console.error('Could not determine any valid storage directory. Falling back to app-specific documents directory.');
      publicDir = RNFS.DocumentDirectoryPath;
    }

    return `${publicDir}/orbit`;
  } catch (error) {
    console.error('Error determining base directory:', error);
    return `${RNFS.DocumentDirectoryPath}/orbit_music`;
  }
};

// Ensures all necessary subdirectories exist
const ensureDirectoriesExist = async () => {
  try {
    const baseDir = await getBaseDir();
    const dirs = [
      baseDir,
      `${baseDir}/songs`,
      `${baseDir}/artwork`,
      `${baseDir}/metadata`,
    ];

    for (const dir of dirs) {
      if (!(await safeExists(dir))) {
        await RNFS.mkdir(dir);
      }
    }
  } catch (error) {
    console.error('Error ensuring directories exist:', error);
  }
};

// Gets the full path for a song file
const getSongPath = async (songId, fileName = null) => {
  if (!songId) {
    console.warn('Invalid songId provided to getSongPath');
    return '';
  }
  const baseDir = await getBaseDir();
  const extension = fileName ? `.${String(fileName).split('.').pop()}` : '.mp3';
  return `${baseDir}/songs/${String(songId)}${extension}`;
};

// Gets the full path for an artwork file
const getArtworkPath = async (songId) => {
  if (!songId) {
    console.warn('Invalid songId provided to getArtworkPath');
    return '';
  }
  const baseDir = await getBaseDir();
  return `${baseDir}/artwork/${String(songId)}.jpg`;
};

const STORAGE_KEYS = {
  DOWNLOADED_SONGS_METADATA: '@orbit_downloaded_songs_metadata',
};

// Saves metadata for a downloaded song to AsyncStorage
const saveDownloadedSongMetadata = async (songId, metadata) => {
  try {
    const allMetadata = await getAllDownloadedSongsMetadata();
    allMetadata[songId] = {
      ...metadata,
      downloadTime: Date.now(),
    };
    await AsyncStorage.setItem(
      STORAGE_KEYS.DOWNLOADED_SONGS_METADATA,
      JSON.stringify(allMetadata),
    );
  } catch (error) {
    console.error('Error saving downloaded song metadata:', error);
  }
};

// Retrieves all downloaded songs' metadata from AsyncStorage
const getAllDownloadedSongsMetadata = async () => {
  try {
    const metadataJson = await AsyncStorage.getItem(
      STORAGE_KEYS.DOWNLOADED_SONGS_METADATA,
    );
    return metadataJson ? JSON.parse(metadataJson) : {};
  } catch (error) {
    console.error('Error getting all downloaded songs metadata:', error);
    return {};
  }
};

// Removes a song's metadata and its associated files
const removeDownloadedSongMetadata = async (songId) => {
  try {
    // Remove from AsyncStorage
    const allMetadata = await getAllDownloadedSongsMetadata();
    if (allMetadata[songId]) {
      delete allMetadata[songId];
      await AsyncStorage.setItem(
        STORAGE_KEYS.DOWNLOADED_SONGS_METADATA,
        JSON.stringify(allMetadata),
      );
    }

    // Delete song and artwork files
    const songPath = await getSongPath(songId);
    const artworkPath = await getArtworkPath(songId);

    if (await safeExists(songPath)) {
      await RNFS.unlink(songPath);
    }
    if (await safeExists(artworkPath)) {
      await RNFS.unlink(artworkPath);
    }
  } catch (error) {
    console.error(`Error removing downloaded song ${songId}:`, error);
  }
};

// Checks if a song is downloaded by checking its metadata
const isSongDownloaded = async (songId) => {
  if (!songId) return false;
  try {
    const allMetadata = await getAllDownloadedSongsMetadata();
    return Object.keys(allMetadata).includes(String(songId));
  } catch (error) {
    console.error('Error checking if song is downloaded:', error);
    return false;
  }
};

// Downloads and saves artwork from a URL
const saveArtwork = async (songId, artworkUrl) => {
  try {
    await ensureDirectoriesExist();
    const artworkPath = await getArtworkPath(songId);

    if (!artworkUrl || typeof artworkUrl !== 'string' || !artworkPath) {
      console.error('Invalid artwork URL or path:', { artworkUrl, artworkPath });
      return null;
    }

    await RNFS.downloadFile({
      fromUrl: artworkUrl,
      toFile: artworkPath,
    }).promise;

    return (await safeExists(artworkPath)) ? artworkPath : null;
  } catch (error) {
    console.error('Error saving artwork:', error);
    return null;
  }
};

export const StorageManager = {
  ensureDirectoriesExist,
  getSongPath,
  getArtworkPath,
  saveDownloadedSongMetadata,
  getAllDownloadedSongsMetadata,
  removeDownloadedSongMetadata,
  isSongDownloaded,
  saveArtwork,
};