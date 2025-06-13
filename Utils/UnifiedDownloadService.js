import { StorageManager } from './StorageManager';
import { downloadFileWithAnalytics } from './FileUtils';
import { ToastAndroid } from 'react-native';
import EventRegister from './EventRegister';
import { getIndexQuality } from '../MusicPlayerFunctions';

/**
 * Unified Download Service
 * This service provides a single, consistent way to download songs across the entire app
 */

export class UnifiedDownloadService {
  
  /**
   * Downloads a song with proper metadata saving and analytics tracking
   * @param {Object} song - Song object with id, title, artist, url, artwork, etc.
   * @param {Function} onProgress - Optional progress callback (percentage) => void
   * @returns {Promise<boolean>} - Success status
   */
  static async downloadSong(song, onProgress = null) {
    try {
      // Validate input
      if (!song || !song.id) {
        console.error('Invalid song object provided to downloadSong');
        ToastAndroid.show('Invalid song data', ToastAndroid.SHORT);
        return false;
      }

      // Check if already downloaded
      const isAlreadyDownloaded = await StorageManager.isSongDownloaded(song.id);
      if (isAlreadyDownloaded) {
        ToastAndroid.show('Song already downloaded', ToastAndroid.SHORT);
        return true;
      }

      console.log(`Starting unified download for: ${song.title} (ID: ${song.id})`);

      // Emit download started event
      EventRegister.emit('download-started', song.id);

      // Ensure directories exist
      await StorageManager.ensureDirectoriesExist();

      // Get download URL
      const downloadUrl = await this.getDownloadUrl(song);
      if (!downloadUrl) {
        throw new Error('No valid download URL found');
      }

      // Get file paths
      const songPath = await StorageManager.getSongPath(song.id, song.title);
      const artworkPath = await StorageManager.getArtworkPath(song.id);

      // Download song file
      console.log(`Downloading song to: ${songPath}`);
      const songDownloadSuccess = await downloadFileWithAnalytics(
        downloadUrl, 
        songPath, 
        { 
          id: song.id, 
          name: song.title || 'Unknown', 
          type: 'song' 
        }
      );

      if (!songDownloadSuccess) {
        throw new Error('Failed to download song file');
      }

      // Download artwork if available
      let artworkDownloadSuccess = false;
      const artworkUrl = this.getArtworkUrl(song);
      if (artworkUrl) {
        console.log(`Downloading artwork for: ${song.title}`);
        artworkDownloadSuccess = await downloadFileWithAnalytics(
          artworkUrl, 
          artworkPath, 
          { 
            id: song.id, 
            name: `${song.title} - Artwork`, 
            type: 'artwork' 
          }
        );
      }

      // Prepare metadata
      const metadata = {
        id: song.id,
        title: song.title || 'Unknown',
        artist: this.formatArtist(song.artist) || 'Unknown Artist',
        album: song.album || 'Unknown Album',
        url: downloadUrl,
        artwork: artworkUrl,
        localSongPath: songPath,
        localArtworkPath: artworkDownloadSuccess ? artworkPath : null,
        duration: song.duration || 0,
        language: song.language || '',
        artistID: song.artistID || '',
        isDownloaded: true,
        downloadedAt: new Date().toISOString()
      };

      // Save metadata
      await StorageManager.saveDownloadedSongMetadata(song.id, metadata);

      console.log(`Download completed successfully for: ${song.title} (ID: ${song.id})`);

      // Emit download completed event
      EventRegister.emit('download-complete', song.id);
      
      // Show success message
      ToastAndroid.show(`${song.title} Downloaded`, ToastAndroid.SHORT);

      return true;

    } catch (error) {
      console.error(`Download failed for ${song.title}:`, error);
      ToastAndroid.show(`Download failed: ${error.message}`, ToastAndroid.LONG);
      
      // Clean up any partial metadata
      try {
        await StorageManager.removeDownloadedSongMetadata(song.id);
      } catch (cleanupError) {
        console.error('Error cleaning up failed download metadata:', cleanupError);
      }
      
      return false;
    }
  }

  /**
   * Gets the best quality download URL from song data
   * @param {Object} song - Song object
   * @returns {Promise<string|null>} - Download URL or null
   */
  static async getDownloadUrl(song) {
    try {
      const quality = await getIndexQuality();

      // Method 1: downloadUrl array (most common)
      if (song.downloadUrl && Array.isArray(song.downloadUrl)) {
        if (song.downloadUrl[quality]?.url) {
          return song.downloadUrl[quality].url;
        }
        // Fallback to any available URL
        for (let i = song.downloadUrl.length - 1; i >= 0; i--) {
          if (song.downloadUrl[i]?.url) {
            return song.downloadUrl[i].url;
          }
        }
      }

      // Method 2: download_url array (alternative format)
      if (song.download_url && Array.isArray(song.download_url)) {
        if (song.download_url[quality]?.url) {
          return song.download_url[quality].url;
        }
        // Fallback to any available URL
        for (let i = song.download_url.length - 1; i >= 0; i--) {
          if (song.download_url[i]?.url) {
            return song.download_url[i].url;
          }
        }
      }

      // Method 3: url array (from EachSongCard format)
      if (song.url && Array.isArray(song.url)) {
        if (song.url[quality]?.url) {
          return song.url[quality].url;
        }
        // Fallback to any available URL
        for (let i = song.url.length - 1; i >= 0; i--) {
          if (song.url[i]?.url) {
            return song.url[i].url;
          }
        }
      }

      // Method 4: Direct URL string
      if (typeof song.url === 'string' && song.url.startsWith('http')) {
        return song.url;
      }

      console.error('No valid download URL found in song data:', song);
      return null;

    } catch (error) {
      console.error('Error getting download URL:', error);
      return null;
    }
  }

  /**
   * Gets the artwork URL from song data
   * @param {Object} song - Song object
   * @returns {string|null} - Artwork URL or null
   */
  static getArtworkUrl(song) {
    // Method 1: Direct artwork property
    if (song.artwork && typeof song.artwork === 'string') {
      return song.artwork;
    }

    // Method 2: image property (string)
    if (song.image && typeof song.image === 'string') {
      return song.image;
    }

    // Method 3: image array (get highest quality)
    if (song.image && Array.isArray(song.image) && song.image.length > 0) {
      // Try to get the highest quality image (usually the last one)
      for (let i = song.image.length - 1; i >= 0; i--) {
        if (song.image[i]?.url) {
          return song.image[i].url;
        }
      }
    }

    return null;
  }

  /**
   * Formats artist name(s) consistently
   * @param {string|Array|Object} artist - Artist data
   * @returns {string} - Formatted artist string
   */
  static formatArtist(artist) {
    if (!artist) return 'Unknown Artist';

    if (typeof artist === 'string') {
      return artist;
    }

    if (Array.isArray(artist)) {
      return artist.map(a => typeof a === 'object' ? a.name : a).join(', ');
    }

    if (typeof artist === 'object' && artist.name) {
      return artist.name;
    }

    return 'Unknown Artist';
  }

  /**
   * Checks if a song is downloaded
   * @param {string} songId - Song ID
   * @returns {Promise<boolean>} - Download status
   */
  static async isDownloaded(songId) {
    return await StorageManager.isSongDownloaded(songId);
  }

  /**
   * Removes a downloaded song
   * @param {string} songId - Song ID
   * @returns {Promise<boolean>} - Success status
   */
  static async removeSong(songId) {
    try {
      await StorageManager.removeDownloadedSongMetadata(songId);
      EventRegister.emit('download-removed', songId);
      return true;
    } catch (error) {
      console.error('Error removing downloaded song:', error);
      return false;
    }
  }
}
