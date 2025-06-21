import { useState, useEffect, useCallback } from 'react';
import { PermissionHandler } from './PermissionHandler';
import { DownloadManager } from './DownloadManager';
import EventRegister from '../../Utils/EventRegister';

/**
 * useDownload - Custom hook for managing download state and functionality
 * Provides a clean interface for components to handle downloads
 */
export const useDownload = (songData = null, isOffline = false) => {
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [downloadError, setDownloadError] = useState(null);

  const songId = songData?.id;

  // Check if song is downloaded when songId changes
  const checkDownloadStatus = useCallback(async (id) => {
    if (!id) {
      console.log('useDownload: No songId provided to checkDownloadStatus');
      setIsDownloaded(false);
      return false;
    }

    try {
      console.log('useDownload: Checking download status for songId:', id);

      // In offline mode, if a song is playing, it must be downloaded
      if (isOffline && songData?.isLocal) {
        console.log('useDownload: Offline mode with local song, marking as downloaded');
        setIsDownloaded(true);
        return true;
      }

      const downloaded = await DownloadManager.isDownloaded(id);
      console.log('useDownload: Download status result:', downloaded);
      setIsDownloaded(downloaded);
      return downloaded;
    } catch (error) {
      console.error('useDownload: Error checking download status:', error);
      setIsDownloaded(false);
      return false;
    }
  }, [isOffline, songData?.isLocal]);

  // Effect to check download status when songId changes
  useEffect(() => {
    if (songId) {
      checkDownloadStatus(songId);
    } else {
      setIsDownloaded(false);
    }
  }, [songId, checkDownloadStatus]);

  // Effect to handle offline mode changes
  useEffect(() => {
    if (isOffline && songData) {
      setIsDownloaded(true);
    }
  }, [isOffline, songData]);

  // Listen for download completion events
  useEffect(() => {
    const handleDownloadComplete = (completedSongId) => {
      if (completedSongId === songId) {
        setIsDownloaded(true);
        setIsDownloading(false);
        setDownloadProgress(100);
        setDownloadError(null);
      }
    };

    const handleDownloadRemoved = (removedSongId) => {
      if (removedSongId === songId) {
        setIsDownloaded(false);
        setIsDownloading(false);
        setDownloadProgress(0);
      }
    };

    EventRegister.addEventListener('download-complete', handleDownloadComplete);
    EventRegister.addEventListener('download-removed', handleDownloadRemoved);

    return () => {
      EventRegister.removeEventListener('download-complete', handleDownloadComplete);
      EventRegister.removeEventListener('download-removed', handleDownloadRemoved);
    };
  }, [songId]);

  // Download function with permission handling
  const startDownload = useCallback(async () => {
    if (!songData || !songId) {
      console.log("useDownload: No valid song to download");
      setDownloadError(new Error("No valid song to download"));
      return false;
    }

    if (isDownloading) {
      console.log("useDownload: Already downloading, please wait");
      return false;
    }

    if (isDownloaded) {
      console.log("useDownload: Song already downloaded");
      return true;
    }

    try {
      console.log("useDownload: Starting download process for song:", songData.title);
      console.log("useDownload: Song data:", JSON.stringify(songData, null, 2));

      // Reset states
      setDownloadError(null);
      setDownloadProgress(0);

      // Request permissions first
      const hasPermission = await PermissionHandler.requestStoragePermission();
      if (!hasPermission) {
        setDownloadError(new Error("Storage permission denied"));
        return false;
      }

      // Start download
      setIsDownloading(true);

      const success = await DownloadManager.downloadSong(
        songData,
        // Progress callback
        (progress) => {
          console.log("useDownload: Progress update:", progress);
          setDownloadProgress(progress);
        },
        // Complete callback
        (success, completedSongId) => {
          console.log("useDownload: Download complete callback:", success, completedSongId);
          if (success && completedSongId === songId) {
            setIsDownloaded(true);
            setIsDownloading(false);
            setDownloadProgress(100);
          }
        },
        // Error callback
        (error, errorSongId) => {
          console.log("useDownload: Download error callback:", error, errorSongId);
          if (errorSongId === songId) {
            setDownloadError(error);
            setIsDownloading(false);
            setDownloadProgress(0);
          }
        }
      );

      return success;

    } catch (error) {
      console.error("useDownload: Download process error:", error);
      setDownloadError(error);
      setIsDownloading(false);
      setDownloadProgress(0);
      return false;
    }
  }, [songData, songId, isDownloading, isDownloaded]);

  // Remove download function
  const removeDownload = useCallback(async () => {
    if (!songId) {
      return false;
    }

    try {
      const success = await DownloadManager.removeSong(songId);
      if (success) {
        setIsDownloaded(false);
        setDownloadProgress(0);
        setDownloadError(null);
      }
      return success;
    } catch (error) {
      console.error("useDownload: Error removing download:", error);
      setDownloadError(error);
      return false;
    }
  }, [songId]);

  // Refresh download status
  const refreshStatus = useCallback(() => {
    if (songId) {
      checkDownloadStatus(songId);
    }
  }, [songId, checkDownloadStatus]);

  return {
    // State
    isDownloaded,
    isDownloading,
    downloadProgress,
    downloadError,
    
    // Actions
    startDownload,
    removeDownload,
    refreshStatus,
    
    // Computed values
    canDownload: !isOffline && !isDownloading && !isDownloaded && !!songData,
    showProgress: isDownloading && downloadProgress > 0
  };
};
