import { useState, useEffect, useRef, useCallback } from 'react';
import TrackPlayer, { useActiveTrack, useTrackPlayerEvents, Event, State } from 'react-native-track-player';
import { ToastAndroid, Platform } from 'react-native';
import { StorageManager } from '../../../Utils/StorageManager';
import NetInfo from '@react-native-community/netinfo';

/**
 * useQueueManager - Custom hook for queue management
 * 
 * This hook provides queue management capabilities including:
 * - Queue state management
 * - Track filtering and reordering
 * - Offline queue handling
 * - Queue operations
 */

export const useQueueManager = (options = {}) => {
  const { 
    autoInitialize = true,
    onQueueChange = null,
    onTrackSelect = null 
  } = options;

  const [upcomingQueue, setUpcomingQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLocalSource, setIsLocalSource] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isOffline, setIsOffline] = useState(false);
  const [isPendingAction, setIsPendingAction] = useState(false);
  
  const operationInProgressRef = useRef(false);
  const currentPlaying = useActiveTrack();

  // Network monitoring
  useEffect(() => {
    const checkNetworkStatus = async () => {
      try {
        const networkState = await NetInfo.fetch();
        setIsOffline(!(networkState.isConnected && networkState.isInternetReachable));
      } catch (error) {
        console.error('Error checking network status:', error);
        setIsOffline(false);
      }
    };
    
    checkNetworkStatus();
    
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOffline(!(state.isConnected && state.isInternetReachable));
    });
    
    return () => unsubscribe();
  }, []);

  // Check if track is local
  const isLocalTrack = useCallback((track) => {
    if (!track) return false;
    return Boolean(
      track.isLocalMusic || 
      track.isLocal || 
      track.isDownloaded ||
      track.path || 
      (track.url && (
        track.url.startsWith('file://') || 
        track.url.includes('content://') ||
        track.url.includes('/storage/')
      ))
    );
  }, []);

  // Get downloaded tracks
  const getDownloadedTracks = useCallback(async () => {
    try {
      const allMetadata = await StorageManager.getAllDownloadedSongsMetadata();
      
      if (!allMetadata || Object.keys(allMetadata).length === 0) {
        return [];
      }
      
      return Object.values(allMetadata).map(metadata => {
        const artworkPath = StorageManager.getArtworkPath(metadata.id);
        const songPath = StorageManager.getSongPath(metadata.id);
        
        return {
          id: metadata.id,
          url: `file://${songPath}`,
          title: metadata.title || 'Unknown',
          artist: metadata.artist || 'Unknown',
          artwork: `file://${artworkPath}`,
          localArtworkPath: artworkPath,
          duration: metadata.duration || 0,
          isLocal: true,
          isDownloaded: true
        };
      });
    } catch (error) {
      console.error('Error getting downloaded tracks:', error);
      return [];
    }
  }, []);

  // Filter queue by source type
  const filterQueueBySource = useCallback(async (currentTrack) => {
    try {
      if (!currentTrack) return [];
      
      const downloadedTracks = await getDownloadedTracks();
      const sourceType = currentTrack.sourceType || (isLocalTrack(currentTrack) ? 'download' : 'online');
      
      console.log('useQueueManager: Filtering queue for source type:', sourceType);
      
      if (sourceType === 'mymusic') {
        const fullQueue = await TrackPlayer.getQueue();
        const myMusicTracks = fullQueue.filter(track => track.sourceType === 'mymusic');
        
        if (myMusicTracks.length === 0) {
          return [currentTrack];
        }
        
        const rearrangedTracks = [
          currentTrack,
          ...myMusicTracks.filter(track => track.id !== currentTrack.id)
        ];
        
        return rearrangedTracks;
      }
      
      if (sourceType === 'download' || (isLocalTrack(currentTrack) && !currentTrack.sourceType)) {
        const fullQueue = await TrackPlayer.getQueue();
        const downloadSourceTracks = fullQueue.filter(track => 
          track.sourceType === 'download' || 
          (isLocalTrack(track) && !track.sourceType)
        );
        
        let combinedTracks = downloadSourceTracks.length > 0 ? downloadSourceTracks : [];
        
        if (downloadedTracks.length > 0) {
          const existingIds = new Set(combinedTracks.map(t => t.id));
          const additionalDownloads = downloadedTracks.filter(t => !existingIds.has(t.id));
          combinedTracks = [...combinedTracks, ...additionalDownloads];
        }
        
        if (combinedTracks.length === 0) {
          combinedTracks = [currentTrack];
        } else {
          const currentTrackIndex = combinedTracks.findIndex(t => t.id === currentTrack.id);
          if (currentTrackIndex > 0) {
            const currentTrackItem = combinedTracks.splice(currentTrackIndex, 1)[0];
            combinedTracks = [currentTrackItem, ...combinedTracks];
          } else if (currentTrackIndex === -1) {
            combinedTracks = [currentTrack, ...combinedTracks];
          }
        }
        
        return combinedTracks;
      }
      
      // Online tracks
      if (!isOffline) {
        const fullQueue = await TrackPlayer.getQueue();
        
        if (fullQueue.length === 0) {
          return [currentTrack];
        }
        
        const onlineTracks = fullQueue.filter(track => 
          !track.sourceType && !isLocalTrack(track)
        );
        
        if (onlineTracks.length > 0) {
          const currentTrackIndex = onlineTracks.findIndex(t => t.id === currentTrack.id);
          if (currentTrackIndex > 0) {
            const currentTrackItem = onlineTracks.splice(currentTrackIndex, 1)[0];
            return [currentTrackItem, ...onlineTracks];
          } else if (currentTrackIndex === -1) {
            if (!isLocalTrack(currentTrack)) {
              return [currentTrack, ...onlineTracks];
            }
          }
          return onlineTracks;
        }
        
        return [currentTrack];
      } else {
        // Offline mode fallback
        if (downloadedTracks.length > 0) {
          return [currentTrack, ...downloadedTracks.filter(t => t.id !== currentTrack.id)];
        }
        
        return [currentTrack];
      }
    } catch (error) {
      console.error('Error filtering queue by source:', error);
      return currentTrack ? [currentTrack] : [];
    }
  }, [isLocalTrack, isOffline, getDownloadedTracks]);

  // Initialize queue
  const initializeQueue = useCallback(async () => {
    if (isDragging || operationInProgressRef.current) return;
    
    try {
      if (currentPlaying) {
        const sourceType = currentPlaying.sourceType || (isLocalTrack(currentPlaying) ? 'download' : 'online');
        setIsLocalSource(sourceType === 'mymusic' || sourceType === 'download' || isLocalTrack(currentPlaying));
        
        const filtered = await filterQueueBySource(currentPlaying);
        
        // Remove duplicates
        const uniqueIds = new Set();
        const uniqueFiltered = filtered.filter(track => {
          if (!track || !track.id || uniqueIds.has(track.id)) return false;
          uniqueIds.add(track.id);
          return true;
        });
        
        // Ensure current track is first
        if (currentPlaying.id && uniqueFiltered.length > 0) {
          const currentTrackIndex = uniqueFiltered.findIndex(t => t.id === currentPlaying.id);
          
          if (currentTrackIndex > 0) {
            const currentTrack = uniqueFiltered.splice(currentTrackIndex, 1)[0];
            uniqueFiltered.unshift(currentTrack);
          } else if (currentTrackIndex === -1) {
            uniqueFiltered.unshift(currentPlaying);
          }
        }
        
        setUpcomingQueue(uniqueFiltered);
        
        if (onQueueChange) {
          onQueueChange(uniqueFiltered);
        }
        
        const index = await TrackPlayer.getCurrentTrack();
        setCurrentIndex(index || 0);
      } else {
        setUpcomingQueue([]);
        if (onQueueChange) {
          onQueueChange([]);
        }
      }
    } catch (error) {
      console.error('Error initializing queue:', error);
      if (currentPlaying) {
        setUpcomingQueue([currentPlaying]);
        if (onQueueChange) {
          onQueueChange([currentPlaying]);
        }
      } else {
        setUpcomingQueue([]);
        if (onQueueChange) {
          onQueueChange([]);
        }
      }
    }
  }, [currentPlaying, isDragging, isLocalTrack, filterQueueBySource, onQueueChange]);

  // Auto-initialize on mount if enabled
  useEffect(() => {
    if (autoInitialize) {
      initializeQueue();
    }
  }, [autoInitialize, initializeQueue]);

  // Get queue status
  const getQueueStatus = () => ({
    length: upcomingQueue.length,
    currentIndex,
    isLocalSource,
    isDragging,
    isOffline,
    isPendingAction
  });

  // Clear queue
  const clearQueue = async () => {
    try {
      await TrackPlayer.reset();
      setUpcomingQueue([]);
      setCurrentIndex(0);
      if (onQueueChange) {
        onQueueChange([]);
      }
    } catch (error) {
      console.error('Error clearing queue:', error);
    }
  };

  // Add track to queue
  const addToQueue = async (track, position = 'end') => {
    try {
      if (position === 'next') {
        const currentIdx = await TrackPlayer.getCurrentTrack();
        await TrackPlayer.add([track], currentIdx + 1);
      } else {
        await TrackPlayer.add([track]);
      }
      
      // Refresh queue
      await initializeQueue();
    } catch (error) {
      console.error('Error adding track to queue:', error);
    }
  };

  // Remove track from queue
  const removeFromQueue = async (trackIndex) => {
    try {
      await TrackPlayer.remove(trackIndex);
      await initializeQueue();
    } catch (error) {
      console.error('Error removing track from queue:', error);
    }
  };

  return {
    // State
    upcomingQueue,
    currentIndex,
    isLocalSource,
    isDragging,
    isOffline,
    isPendingAction,
    
    // Functions
    setUpcomingQueue,
    setIsDragging,
    setIsPendingAction,
    initializeQueue,
    filterQueueBySource,
    isLocalTrack,
    getDownloadedTracks,
    getQueueStatus,
    clearQueue,
    addToQueue,
    removeFromQueue,
    
    // Refs
    operationInProgressRef
  };
};
