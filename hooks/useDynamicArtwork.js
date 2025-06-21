import { useState, useEffect } from 'react';
import RNFS from 'react-native-fs';
import { safePath, safeExists } from '../Utils/FileUtils';

/**
 * Custom hook for managing dynamic artwork (GIF/image) for music player
 * @returns {object} - Artwork functions and state
 */
const useDynamicArtwork = () => {
  const [artworkCache, setArtworkCache] = useState({});

  /**
   * Get artwork source for a track, prioritizing local files and GIFs
   * @param {object} track - Track object
   * @returns {object} - Image source object for FastImage
   */
  const getArtworkSourceFromHook = (track) => {
    if (!track) {
      return { uri: 'https://htmlcolorcodes.com/assets/images/colors/gray-color-solid-background-1920x1080.png' };
    }

    try {
      // For local music files, check for local artwork first
      if (track.sourceType === 'mymusic' || track.isLocalMusic) {
        const trackId = track.id || track.songId;
        
        if (trackId) {
          // Check cache first
          if (artworkCache[trackId]) {
            return artworkCache[trackId];
          }

          // Check for local GIF first (animated artwork)
          const gifPath = safePath(`${RNFS.DocumentDirectoryPath}/orbit_music/artwork/${trackId}.gif`);
          if (safeExists(gifPath)) {
            const source = { uri: `file://${gifPath}` };
            setArtworkCache(prev => ({ ...prev, [trackId]: source }));
            return source;
          }

          // Check for local JPG/PNG
          const jpgPath = safePath(`${RNFS.DocumentDirectoryPath}/orbit_music/artwork/${trackId}.jpg`);
          if (safeExists(jpgPath)) {
            const source = { uri: `file://${jpgPath}` };
            setArtworkCache(prev => ({ ...prev, [trackId]: source }));
            return source;
          }

          const pngPath = safePath(`${RNFS.DocumentDirectoryPath}/orbit_music/artwork/${trackId}.png`);
          if (safeExists(pngPath)) {
            const source = { uri: `file://${pngPath}` };
            setArtworkCache(prev => ({ ...prev, [trackId]: source }));
            return source;
          }
        }

        // Fallback to track's artwork property for local files
        if (track.artwork) {
          if (track.artwork.startsWith('file://')) {
            return { uri: track.artwork };
          }
          return { uri: track.artwork };
        }
      }

      // For online tracks, use the provided artwork
      if (track.artwork) {
        // Enhance quality for JioSaavn CDN
        let artworkUrl = track.artwork;
        if (artworkUrl.includes('saavncdn.com')) {
          artworkUrl = artworkUrl.replace(/50x50|150x150|500x500/g, '500x500');
        }
        return { uri: artworkUrl };
      }

      // Final fallback
      return { uri: 'https://htmlcolorcodes.com/assets/images/colors/gray-color-solid-background-1920x1080.png' };
    } catch (error) {
      console.error('Error getting artwork source:', error);
      return { uri: 'https://htmlcolorcodes.com/assets/images/colors/gray-color-solid-background-1920x1080.png' };
    }
  };

  /**
   * Preload artwork for better performance
   * @param {object} track - Track object
   */
  const preloadArtwork = async (track) => {
    if (!track) return;

    try {
      const source = getArtworkSourceFromHook(track);
      // FastImage will handle preloading automatically when source is accessed
      return source;
    } catch (error) {
      console.error('Error preloading artwork:', error);
    }
  };

  /**
   * Clear artwork cache
   */
  const clearArtworkCache = () => {
    setArtworkCache({});
  };

  return {
    getArtworkSourceFromHook,
    preloadArtwork,
    clearArtworkCache,
    artworkCache
  };
};

export default useDynamicArtwork;
