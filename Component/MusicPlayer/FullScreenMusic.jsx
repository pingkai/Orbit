import { Dimensions, ImageBackground, View, Pressable, BackHandler, Text, FlatList, TouchableOpacity, Image, ActivityIndicator, Alert } from "react-native";
import FastImage from "react-native-fast-image";
import React, { useState, useEffect, useCallback, useRef, useContext, memo } from "react";
import { useThemeContext } from '../../Context/ThemeContext'; // Changed to useThemeContext
import LinearGradient from "react-native-linear-gradient";
import { Heading } from "../Global/Heading";
import { SmallText } from "../Global/SmallText";
import Animated, { FadeInDown, runOnJS, useSharedValue, useAnimatedStyle, withSpring, withTiming } from "react-native-reanimated";
import { PlayPauseButton } from "./PlayPauseButton";
import { Spacer } from "../Global/Spacer";
import { NextSongButton } from "./NextSongButton";
import { PreviousSongButton } from "./PreviousSongButton";
import { RepeatSongButton } from "./RepeatSongButton";
import { LikeSongButton } from "./LikeSongButton";
import { ProgressBar } from "./ProgressBar";
import QueueBottomSheet from "./QueueBottomSheet";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useActiveTrack, usePlaybackState, State, useProgress } from "react-native-track-player";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { PlayNextSong, PlayPreviousSong } from "../../MusicPlayerFunctions";
import ReactNativeBlobUtil from "react-native-blob-util";
import { PermissionsAndroid, Platform, ToastAndroid, DeviceEventEmitter } from "react-native";
import DeviceInfo from "react-native-device-info";
import TrackPlayer from 'react-native-track-player';
import VolumeManager from 'react-native-volume-manager';
import NetInfo from "@react-native-community/netinfo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Context from "../../Context/Context";
import { useNavigation, CommonActions } from "@react-navigation/native";
import { StorageManager } from '../../Utils/StorageManager';
import RNFS from "react-native-fs";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import { safePath, safeExists, safeDownloadFile, ensureDirectoryExists, safeUnlink } from '../../Utils/FileUtils';
import EventRegister from '../../Utils/EventRegister';
import { isOfflineMode, setOfflineMode } from '../../Api/CacheManager';
import CircularProgress from './CircularProgress';
import FullScreenLocalTrackItem from './FullScreenLocalTrackItem'; // Import the new local track item component

import { SleepTimerButton } from './SleepTimer';
import { LyricsHandler } from './LyricsHandler';
import useDynamicArtwork from '../../hooks/useDynamicArtwork.js';
import { GetTidalEnabled } from '../../LocalStorage/AppSettings';
import { showTidalUnsupportedMessage } from '../../Utils/TidalMusicHandler';


export const FullScreenMusic = ({ Index, setIndex }) => { // Removed 'color' prop as theme will be used
  const width = Dimensions.get("window").width;
  const height = Dimensions.get("window").height;
  const currentPlaying = useActiveTrack();
  const [currentVolume, setCurrentVolume] = useState(0.5);
  const [isOffline, setIsOffline] = useState(false);
  const [cachedTracks, setCachedTracks] = useState([]);
  const [localTracks, setLocalTracks] = useState([]);
  const [showLocalTracks, setShowLocalTracks] = useState(false);
  const [blur, setBlur] = useState(10); // Add blur state for the background image
  const [isDownloadedState, setIsDownloaded] = useState(false); // Track if current song is downloaded
  const { currentPlaylistData, musicPreviousScreen } = useContext(Context);
  const { getArtworkSourceFromHook } = useDynamicArtwork();
  const navigation = useNavigation();
  const { theme, themeMode } = useThemeContext(); // Changed to useThemeContext, added themeMode
  const [isLyricsActive, setIsLyricsActive] = useState(false);
  const [tidalEnabled, setTidalEnabled] = useState(false);
  const [showSourceSwitcher, setShowSourceSwitcher] = useState(false);

  const volumeAdjustmentActive = useSharedValue(0);
  const startY = useSharedValue(0);
  const lastVolume = useSharedValue(0.5);
  const isDragging = useSharedValue(false);
  const currentY = useSharedValue(0); // Track current Y position during gesture
  const initialDistance = useSharedValue(0); // Track initial distance for reference
  const touchEndTime = useSharedValue(0); // Track when touch ended
  const isVolumeAdjustmentActive = useSharedValue(false); // Explicit flag for volume adjustment
  const volumeChangeRef = useRef(null); // Add missing ref for volume change timeout
  const isFullScreenRef = useRef(false); // Reference to track fullscreen mode
  const prevSongIdRef = useRef(null); // Reference to track previous song ID for local tracks

  const handleLyricsVisibilityChange = (visible) => {
    setIsLyricsActive(visible);
  };

  // Load Tidal preference on mount
  useEffect(() => {
    const loadTidalPreference = async () => {
      try {
        const enabled = await GetTidalEnabled();
        setTidalEnabled(enabled);
      } catch (error) {
        console.error('Error loading Tidal preference:', error);
      }
    };
    loadTidalPreference();
  }, []);

  useEffect(() => {
    const checkInitialConnection = async () => {
      try {
        const networkState = await NetInfo.fetch();
        const isConnected = networkState.isConnected && networkState.isInternetReachable;
        
        // Use our improved offline detection by updating the global flag
        setOfflineMode(!isConnected);
        setIsOffline(!isConnected);
        
        if (!isConnected) {
          console.log('Device is offline - loading local tracks');
          await loadCachedData();
          
          try {
            const localTracksLoaded = await loadLocalTracks();
            
            if (localTracksLoaded && localTracksLoaded.length > 0) {
              const state = await TrackPlayer.getState();
              const currentTrack = await TrackPlayer.getActiveTrack();
              
              if (!currentTrack || state === State.None || state === State.Ready) {
                console.log(`Adding ${localTracksLoaded.length} downloaded tracks to queue in offline mode`);
                
                try {
                  await TrackPlayer.reset();
                  await TrackPlayer.add(localTracksLoaded);
                  console.log('Offline queue initialized with downloaded tracks');
                } catch (queueError) {
                  console.error('Error setting up offline queue:', queueError);
                }
              }
            }
          } catch (error) {
            console.error('Error loading local tracks into queue:', error);
          }
        }
      } catch (error) {
        console.error('Error checking network status:', error);
        // Assume offline if there's an error
        setOfflineMode(true);
        setIsOffline(true);
        await loadCachedData();
        await loadLocalTracks();
      }
    };
    
    // Global error handler for network errors
    const originalConsoleError = console.error;
    console.error = (...args) => {
      // Filter out common network errors and playlist errors
      if (args.some(arg => 
        typeof arg === 'string' && (
          arg.includes('Network Error') || 
          arg.includes('Network request failed') ||
          arg.includes('Unable to resolve host') ||
          arg.includes('Error getting playlist') ||
          arg.includes('ENOTFOUND') ||
          arg.includes('ETIMEDOUT')
        )
      )) {
        // Just log a simple message instead
        console.log('Suppressed network/playlist error in offline mode');
        return;
      }
      
      // Pass through all other errors
      originalConsoleError.apply(console, args);
    };
    
    checkInitialConnection();

    // Subscribe to network state updates with error handling
    const unsubscribe = NetInfo.addEventListener(state => {
      try {
        const isConnected = state.isConnected && state.isInternetReachable;
        const previousOfflineState = isOffline;
        
        // Update both our local and global offline state
        setOfflineMode(!isConnected);
        setIsOffline(!isConnected);
        
        console.log(`Network state changed. Connected: ${isConnected}, Internet reachable: ${state.isInternetReachable}`);
        
        // When going from offline to online
        if (isConnected && previousOfflineState) {
          console.log('Switched from offline to online mode');
          
          // Keep playing the current track, but update UI
          const updateActiveTrack = async () => {
            try {
              const currentTrack = await TrackPlayer.getActiveTrack();
              if (currentTrack && currentTrack.isLocal) {
                // Mark downloaded regardless of network state when playing local track
                setIsDownloaded(true);
                
                // If we're playing a local track, rebuild queue with all downloaded tracks
                const localTracks = await loadLocalTracks();
                if (localTracks.length > 0) {
                  // Find the current playing track in downloaded tracks
                  const currentTrackIndex = localTracks.findIndex(t => t.id === currentTrack.id);
                  if (currentTrackIndex !== -1) {
                    // Keep playing, but rebuild queue if needed
                    const queue = await TrackPlayer.getQueue();
                    if (queue.length <= 1) {
                      const wasPlaying = await TrackPlayer.getState() === State.Playing;
                      const position = await TrackPlayer.getPosition();
                      
                      console.log('Rebuilding queue with downloaded tracks in online mode');
                      await TrackPlayer.reset();
                      
                      // Reorder tracks with current track first
                      const orderedTracks = [
                        localTracks[currentTrackIndex],
                        ...localTracks.filter((_, i) => i !== currentTrackIndex)
                      ];
                      
                      await TrackPlayer.add(orderedTracks);
                      
                      // Restore position and playback state
                      if (position > 0) {
                        try {
                          await TrackPlayer.seekTo(position);
                        } catch (seekError) {
                          console.error('Error seeking to position:', seekError);
                        }
                      }
                      
                      if (wasPlaying) {
                        try {
                          await TrackPlayer.play();
                        } catch (playError) {
                          console.error('Error resuming playback:', playError);
                        }
                      }
                    }
                  }
                }
              }
            } catch (error) {
              console.error('Error updating active track for online mode:', error);
            }
          };
          
          updateActiveTrack();
        }
        
        // When going from online to offline
        if (!isConnected && !previousOfflineState) {
          console.log('Switched to offline mode - loading local data');
          loadCachedData();
          loadLocalTracks().then(async (tracks) => {
            // Auto-build queue when going offline
            if (tracks && tracks.length > 0) {
              try {
                // Check if something is already playing locally
                const currentTrack = await TrackPlayer.getActiveTrack();
                
                // If current track isn't local, replace queue with downloaded songs
                if (!currentTrack || !(currentTrack.isLocal || currentTrack.isDownloaded)) {
                  await TrackPlayer.reset();
                  await TrackPlayer.add(tracks);
                  console.log('Offline queue built with downloaded tracks');
                } else {
                  // Already playing a local track, just make sure the queue is complete
                  const wasPlaying = await TrackPlayer.getState() === State.Playing;
                  const position = await TrackPlayer.getPosition();
                  
                  // Find current track in downloaded tracks
                  const currentIndex = tracks.findIndex(t => t.id === currentTrack.id);
                  if (currentIndex !== -1) {
                    // Rebuild queue with current track first
                    const orderedTracks = [
                      tracks[currentIndex],
                      ...tracks.filter((_, i) => i !== currentIndex)
                    ];
                    
                    await TrackPlayer.reset();
                    await TrackPlayer.add(orderedTracks);
                    
                    // Restore position and playback
                    if (position > 0) await TrackPlayer.seekTo(position);
                    if (wasPlaying) await TrackPlayer.play();
                    
                    console.log('Rebuilt queue with current track first in offline mode');
                  }
                }
              } catch (error) {
                console.error('Error setting up queue for offline mode:', error);
              }
            }
          });
        }
      } catch (error) {
        console.error('Error handling network change:', error);
      }
    });

    // Cache current track if it exists
    if (currentPlaying) {
      try {
        cacheCurrentTrack(currentPlaying);
      } catch (error) {
        console.error('Error caching current track:', error);
      }
    }

    // Register a global event to notify other components about network state changes
    const publishOfflineStateChange = (isOffline) => {
      try {
        DeviceEventEmitter.emit('offlineStateChanged', { isOffline });
      } catch (error) {
        console.error('Error publishing offline state change:', error);
      }
    };

    // Update when our local offline state changes
    const offlineStateEffect = () => {
      publishOfflineStateChange(isOffline);
    };
    
    offlineStateEffect();

    // Cleanup subscription and error handler
    return () => {
      unsubscribe();
      console.error = originalConsoleError;
    };
  }, [isOffline]);

  // Function to cache the current track
  const cacheCurrentTrack = async (track) => {
    try {
      // Get existing cached tracks
      const existingCache = await AsyncStorage.getItem('cachedTracks');
      let tracksArray = existingCache ? JSON.parse(existingCache) : [];
      
      // Check if track already exists in cache
      const trackExists = tracksArray.some(cachedTrack => cachedTrack.id === track.id);
      
      if (!trackExists) {
        // Add current track to cache if not already present
        tracksArray.push(track);
        await AsyncStorage.setItem('cachedTracks', JSON.stringify(tracksArray));
      }
    } catch (error) {
      console.error('Error caching track:', error);
    }
  };

  // Function to load cached tracks
  const loadCachedData = async () => {
    try {
      const cachedData = await AsyncStorage.getItem('cachedTracks');
      if (cachedData) {
        setCachedTracks(JSON.parse(cachedData));
      }
    } catch (error) {
      console.error('Error loading cached tracks:', error);
    }
  };

  // Add this function near the top of the component
  const buildOfflineQueue = async (currentTrack) => {
    try {
      // Get all downloaded songs metadata
      const allMetadata = await StorageManager.getAllDownloadedSongsMetadata();
      
      if (!allMetadata || Object.keys(allMetadata).length === 0) {
        console.log('No downloaded songs found for offline queue');
        return [currentTrack];
      }
      
      // Format tracks with metadata
      const formattedTracks = Object.values(allMetadata).map(metadata => {
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

      // Put current track first, then add other tracks
      const queue = [
        currentTrack,
        ...formattedTracks.filter(track => track.id !== currentTrack.id)
      ];

      console.log(`Built offline queue with ${queue.length} tracks`);
      return queue;
    } catch (error) {
      console.error('Error building offline queue:', error);
      return [currentTrack];
    }
  };

  // Function to load local tracks with better error handling for artwork
  const loadLocalTracks = async () => {
    try {
          // Get all downloaded songs metadata
      const allMetadata = await StorageManager.getAllDownloadedSongsMetadata();
          
      if (!allMetadata || Object.keys(allMetadata).length === 0) {
            console.log('No downloaded songs metadata found');
        setLocalTracks([]);
        return [];
      }
      
      // Format tracks with metadata
      const formattedTracks = Object.values(allMetadata).map(metadata => {
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

      setLocalTracks(formattedTracks);
      console.log('Loaded local tracks with metadata:', formattedTracks.length);
      
      // Force update of download status for current song
      if (currentPlaying?.id) {
        setIsDownloaded(true);
      }
      
      return formattedTracks;
    } catch (error) {
      console.error('Error loading local tracks:', error);
      return [];
      }
    };

  // Create animated style for the volume overlay with immediate response
  const volumeOverlayStyle = useAnimatedStyle(() => ({
    position: 'absolute',
    width: '100%',
    height: '100%',
    backgroundColor: 'rgba(0,0,0,0.7)',
    opacity: volumeAdjustmentActive.value,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1,
    overflow: 'hidden', // Ensure overlay doesn't extend beyond image boundaries
    pointerEvents: volumeAdjustmentActive.value === 0 ? 'none' : 'auto',
    transform: [
      { scale: 1 } // Remove animation to make it instant
    ],
  }));

  const volumeBarContainerStyle = {
    width: 12,
    height: 200,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 10,
    position: 'relative',
    overflow: 'hidden',
    marginBottom: 10,
    borderWidth: 0.5,
    borderColor: 'rgba(255,255,255,0.3)',
    elevation: 3,
  };

  
  const volumeBarFillStyle = useAnimatedStyle(() => {
    return {
      position: 'absolute',
      bottom: 0,
      width: '100%',
      height: `${currentVolume * 100}%`,
      backgroundColor: currentVolume > 0.7 ? '#4169E1' : currentVolume > 0.3 ? '#5D8AFF' : '#7BA2FF',
      borderTopLeftRadius: 8,
      borderTopRightRadius: 8,
      // No transition animation to ensure immediate visual feedback
      transform: [
        { scaleY: 1 } // No animation for immediate response
      ],
      style: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
      }
    };
  });

  const getVolumeIconName = () => {
    if (currentVolume === 0) return 'volume-mute';
    if (currentVolume < 0.3) return 'volume-low';
    if (currentVolume < 0.7) return 'volume-medium';
    return 'volume-high';
  };

  useEffect(() => {
    const getInitialVolume = async () => {
      try {
        const vol = await VolumeManager.getVolume();
        setCurrentVolume(vol);
        lastVolume.value = vol;
      } catch (error) {
        console.log("Error getting initial volume:", error);
      }
    };

    // Listen for volume changes with VolumeManager
    const volumeChangeListener = DeviceEventEmitter.addListener('VolumeChanged', (data) => {
      setCurrentVolume(data.volume);
    });

    getInitialVolume();
    return () => {
      // Properly clean up the listener
      if (volumeChangeListener) {
        volumeChangeListener.remove();
      }
    };
  }, []);

  const lastVolumeUpdateRef = useRef(Date.now());
  
  const adjustVolume = useCallback(async (newVolume) => {
    try {
      // Check if enough time has passed since touch ended to prevent unwanted updates
      const now = Date.now();
      if (touchEndTime.value > 0 && now - touchEndTime.value > 50) {
        return; // Skip volume updates after touch has ended
      }
      
      if (now - lastVolumeUpdateRef.current < 33) {
        return;
      }
      lastVolumeUpdateRef.current = now;
      
      const clampedVolume = Math.max(0, Math.min(1, parseFloat(newVolume.toFixed(4))));
      
      setCurrentVolume(clampedVolume);
      
      if (volumeChangeRef.current) {
        clearTimeout(volumeChangeRef.current);
      }
      
      try {
        // Update TrackPlayer volume first for immediate audio feedback
        await TrackPlayer.setVolume(clampedVolume);
        // Then update system volume
        await VolumeManager.setVolume(clampedVolume);
      } catch (error) {
        console.log("Error adjusting volume:", error);
      }
    } catch (error) {
      console.log("Error adjusting volume:", error);
    }
  }, []);

  const pan = Gesture.Pan()
    .onBegin((e) => {
      'worklet';
      startY.value = e.absoluteY;
      currentY.value = e.absoluteY; // Initialize current position
      initialDistance.value = 0; // Reset initial distance
      // Make overlay appear instantly without animation
      volumeAdjustmentActive.value = 1;
      lastVolume.value = currentVolume;
      isDragging.value = true;
      isVolumeAdjustmentActive.value = true; // Set explicit flag for volume adjustment
      touchEndTime.value = 0; // Reset touch end time
    })
    .onUpdate((e) => {
      'worklet';
      if (isDragging.value && isVolumeAdjustmentActive.value) {
        // Calculate delta based on current finger position with improved precision
        const deltaY = startY.value - e.absoluteY;
        
        // Fine-tuned sensitivity for perfect sync with gesture
        const sensitivityMultiplier = 1.0; // Reduced for more precise control
        const totalHeight = 180; // Adjusted for better mapping to screen height
        
        // Calculate volume change with higher precision
        const movementPercentage = deltaY / totalHeight;
        const volumeChange = movementPercentage * sensitivityMultiplier;
        
        // Apply volume change with immediate response
        const newVolume = Math.max(0, Math.min(1, parseFloat((lastVolume.value + volumeChange).toFixed(4))));
        
        // Only update if there's an actual change to prevent unnecessary updates
        if (Math.abs(newVolume - currentVolume) >= 0.001) {
          runOnJS(adjustVolume)(newVolume);
        }
      }
    })
    .onFinalize((e) => {
      'worklet';
      // Only process gestures if we were actually dragging
      if (isDragging.value) {
        // Immediately stop volume adjustment
        isDragging.value = false;
        isVolumeAdjustmentActive.value = false; // Explicitly mark volume adjustment as inactive
        touchEndTime.value = Date.now(); // Record when touch ended
        
        // Make overlay disappear with minimal animation for better responsiveness
        volumeAdjustmentActive.value = withTiming(0, { duration: 50 }); // Faster fade out
        
        // Enhanced horizontal swipe detection for next/previous song
        // More responsive criteria with better velocity and translation thresholds
        const horizontalDominance = Math.abs(e.velocityX) > Math.abs(e.velocityY) * 1.2; // Slightly increased ratio
        const significantHorizontalMovement = Math.abs(e.translationX) > 25; // Further reduced threshold for better responsiveness
        
        if (horizontalDominance || significantHorizontalMovement) {
          // Use both velocity and translation with weighted importance for better detection
          if ((e.velocityX > 120 && e.translationX > 20) || e.velocityX > 200 || e.translationX > 35) {
            runOnJS(PlayPreviousSong)();
          } else if ((e.velocityX < -120 && e.translationX < -20) || e.velocityX < -200 || e.translationX < -35) {
            runOnJS(PlayNextSong)();
          }
        }
      }
    });
    
  // Add a tap gesture to close the player when tapping outside the volume control
  const tap = Gesture.Tap().onEnd(() => {
    'worklet';
    // Only process if we're not in the middle of a volume adjustment
    if (!isDragging.value && volumeAdjustmentActive.value === 0) {
      // Can't directly navigate from a worklet, so we need to use runOnJS
      runOnJS(handlePlayerClose)();
    }
  });
  
  // Function to handle the player close button - memoize with useCallback
  const handlePlayerClose = useCallback(() => {
    try {
      console.log('Closing fullscreen player, previous screen:', musicPreviousScreen);
      
      // Always minimize the player first
      setIndex(0);

      // Get the navigation state to make informed decisions
      const navigationState = navigation.getState();
      console.log('Current navigation state:', JSON.stringify(navigationState));

      // The issue is that we need to ensure the Library screen is in the navigation stack
      // when returning from the song download screen 
      if (musicPreviousScreen) {
        // Clean up the path
        let cleanPath = musicPreviousScreen;
        if (cleanPath.startsWith('MainRoute/')) {
          cleanPath = cleanPath.replace('MainRoute/', '');
        }
        
        // Split into parts
        const parts = cleanPath.split('/');
        console.log('Navigation path parts:', parts);
        
        // Special handling for Search
        if (parts.length >= 1 && parts[0] === 'Search') {
          console.log('Returning to Search screen after fullscreen player');
          navigation.navigate('Home', {
            screen: 'Search',
            params: {
              timestamp: Date.now() // Force refresh
            }
          });
          return;
        }

        // Special handling for download songs screen within Library tab
        // This fixes the navigation issue where library gets skipped
        if (parts.length >= 2 && parts[0] === 'Library' && parts[1] === 'MyMusicPage') {
          console.log('Returning to Library with MyMusicPage in history stack');
          // First navigate to the Library tab to ensure it's in the stack
          navigation.navigate('MainRoute', {
            screen: 'Library'
          });
          return;
        }
        
        if (parts.length >= 2) {
          const tabName = parts[0];
          const screenName = parts[1];
          
          // Special handling for CustomPlaylistView to ensure params are preserved
          if (screenName === 'CustomPlaylistView') {
            // Check if we have playlist data in AsyncStorage as fallback
            AsyncStorage.getItem('last_viewed_custom_playlist')
              .then(storedPlaylist => {
                if (storedPlaylist) {
                  // Parse the stored playlist data
                  const playlistData = JSON.parse(storedPlaylist);
                  
                  // Navigate with the recovered params
                  navigation.navigate('MainRoute', {
                    screen: tabName,
                    params: {
                      screen: screenName,
                      params: playlistData
                    }
                  });
                  
                  console.log('Restored CustomPlaylistView with recovered data');
                } else {
                  // No stored data, just navigate to the screen
                  navigation.navigate('MainRoute', {
                    screen: tabName,
                    params: {
                      screen: screenName
                    }
                  });
                }
              })
              .catch(error => {
                console.error('Error retrieving playlist data:', error);
                // Still navigate even on error
                navigation.navigate('MainRoute', { screen: tabName });
              });
          } 
          // For all other screens
          else {
            // Find existing route params if available to preserve them
            let existingParams = null;
            
            // Check if we have the route params in the navigation state
            if (navigationState && navigationState.routes) {
              // Loop through routes to find matching tab
              for (const route of navigationState.routes) {
                if (route.name === 'MainRoute' && route.state) {
                  // Find the target tab in the tab navigator
                  const targetTab = route.state.routes.find(r => r.name === tabName);
                  if (targetTab && targetTab.state && targetTab.state.routes) {
                    // Find the target screen in the tab stack
                    const targetScreen = targetTab.state.routes.find(r => r.name === screenName);
                    if (targetScreen && targetScreen.params) {
                      console.log(`Found existing params for ${screenName}:`, targetScreen.params);
                      existingParams = targetScreen.params;
                    }
                  }
                }
              }
            }
            
            // Navigate to the main route with the parent navigator
            navigation.navigate('MainRoute', {
              screen: tabName,
              params: screenName !== tabName ? {
                screen: screenName,
                params: existingParams // Pass the preserved params
              } : undefined
            });
          }
        } else if (parts.length === 1) {
          // Just a tab name
          console.log(`Navigation to main tab: ${parts[0]}`);
          navigation.navigate('MainRoute', {
            screen: parts[0]
          });
        }
      } else {
        // Default fallback
        console.log('No previous screen info, defaulting to Library tab');
        navigation.navigate('MainRoute', {
          screen: 'Library'
        });
      }
    } catch (error) {
      console.error('Error in handlePlayerClose:', error);
      // Fallback - try the most basic navigation to avoid being stuck
      try {
        navigation.navigate('MainRoute');
      } catch (e) {
        console.error('Even basic navigation failed:', e);
      }
    }
  }, [navigation, musicPreviousScreen, setIndex]);

  // Add back handler to minimize player instead of navigating away
  useEffect(() => {
    const backAction = () => {
      if (Index === 1) {
        console.log('Back pressed in fullscreen mode, minimizing player');
        
        // Only minimize the player when in fullscreen mode
        setIndex(0);
        
        // Get previously stored screen data
        const storedNavData = async () => {
          try {
            // First check if we have exact navigation data for the playlist
            if (musicPreviousScreen) {
              // Clean up the path
              let cleanPath = musicPreviousScreen;
              if (cleanPath.startsWith('MainRoute/')) {
                cleanPath = cleanPath.replace('MainRoute/', '');
              }
              
              // Split into parts
              const parts = cleanPath.split('/');
              console.log('Navigation path for return:', parts);
              
              // Special handling for Search
              if (parts.length >= 1 && parts[0] === 'Search') {
                console.log('Returning to Search screen after back press in fullscreen');
                setTimeout(() => {
                  navigation.navigate('Home', {
                    screen: 'Search',
                    params: {
                      timestamp: Date.now() // Force refresh
                    }
                  });
                }, 100);
                return;
              }
              
              // Special handling for download screen (DownloadScreen)
              if (parts.length >= 2 && parts[0] === 'Library' && 
                 (parts[1] === 'DownloadScreen' || parts[1] === 'DownloadSongsPage')) {
                console.log('Ensuring proper back navigation from DownloadScreen');
                
                // Use a more reliable method to ensure the navigation state is correct
                setTimeout(() => {
                  // First navigate to Library/DownloadScreen
                  navigation.navigate('Library', { 
                    screen: 'DownloadScreen',
                    params: { 
                      previousScreen: 'Library',
                      // Add a timestamp to force refresh if needed
                      timestamp: Date.now()
                    }
                  });
                  
                  // Store a flag in AsyncStorage to track this special navigation case
                  AsyncStorage.setItem('came_from_fullscreen_player', 'true');
                  console.log('Set flag to track special navigation from fullscreen');
                }, 100);
                return;
              }
              
              // Special handling for MyMusicPage
              if (parts.length >= 2 && parts[0] === 'Library' && parts[1] === 'MyMusicPage') {
                console.log('Ensuring Library is in stack when returning from MyMusicPage');
                setTimeout(() => {
                  navigation.navigate('Library', { 
                    screen: 'MyMusicPage',
                    params: { previousScreen: 'Library' }
                  });
                  console.log('Navigated to Library/MyMusicPage after closing fullscreen player');
                }, 100);
                return;
              }
              
              // For CustomPlaylistView, make sure we have the right params
              if (parts.length >= 2 && parts[1] === 'CustomPlaylistView') {
                const playlistData = await AsyncStorage.getItem('last_viewed_custom_playlist');
                if (playlistData) {
                  const parsedData = JSON.parse(playlistData);
                  console.log('Found stored playlist data:', parsedData.playlistName);
                  
                  // Use setTimeout to allow the minimize animation to complete
                  setTimeout(() => {
                    navigation.navigate(parts[0], {
                      screen: parts[1],
                      params: parsedData
                    });
                  }, 100);
                }
              }
            }
          } catch (error) {
            console.error('Error in back handler navigation:', error);
          }
        };
        
        storedNavData();
        return true; // Prevent default back action
      }
      return false; // Let default back action happen otherwise
    };

    const backHandler = BackHandler.addEventListener(
      'hardwareBackPress',
      backAction
    );

    return () => backHandler.remove();
  }, [Index, setIndex, navigation, musicPreviousScreen]);

  // Combine gestures with the pan taking priority
  const combinedGestures = Gesture.Exclusive(pan, tap);

  // Remove the duplicate state declaration
  // const [isDownloaded, setIsDownloaded] = useState(false);
  const [downloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloadComplete, setIsDownloadComplete] = useState(false);

  // Add error handler for offline network errors at the component level
  useEffect(() => {
    // Simple error handler for offline mode
    const handleNetworkErrors = () => {
      if (isOffline) {
        console.log('Network errors suppressed in offline mode');
      }
    };
    
    // Add listener to suppress network errors in offline mode
    if (isOffline) {
      console.log('Setting up offline error suppression');
      // We don't need complex error handling, just acknowledge offline mode
    }
    
    return () => {
      // Clean up if needed
    };
  }, [isOffline]);

  // Make the renderDownloadControl function more robust against null values
  const renderDownloadControl = () => {
    const iconColor = themeMode === 'light' ? theme.colors.text : '#ffffff';
    const pressedBackgroundColor = themeMode === 'light' ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)';
    const downloadIconColor = themeMode === 'light' ? (isOffline ? "#888888" : theme.colors.text) : (isOffline ? "#888888" : "#ffffff");

    // Always show checkmark in offline mode
    if (isOffline) {
      return (
        <TouchableOpacity 
          style={[styles.controlIcon, { overflow: 'hidden' }]} 
          disabled={true}
        >
          <MaterialIcons name="check-circle" size={28} color="#4CAF50" />
        </TouchableOpacity>
      );
    }
    
    // For online mode, check download status safely
    const isDownloaded = !!(currentPlaying?.isLocal || isDownloadedState);
    
    // Check if we're currently downloading safely
    const showProgress = downloading && downloadProgress > 0;
    
    if (isDownloaded) {
      // Show checkmark for downloaded songs
      return (
        <TouchableOpacity 
          style={[styles.controlIcon, { overflow: 'hidden' }]} 
          disabled={true}
        >
          <MaterialIcons name="check-circle" size={28} color="#4CAF50" />
        </TouchableOpacity>
      );
    } else if (showProgress) {
      // Show only circular progress indicator with percentage - no song name
      return (
        <View style={styles.controlIcon}>
          <CircularProgress progress={downloadProgress} size={32} thickness={3} />
        </View>
      );
    } else {
      // Regular download button - disabled in offline mode
      return (
        <Pressable 
          style={({ pressed }) => [
            styles.controlIcon,
            {
              backgroundColor: pressed ? pressedBackgroundColor : 'transparent',
              borderRadius: 20,
              padding: 8,
              overflow: 'hidden'
            }
          ]}
          onPress={getPermission}
          disabled={isOffline}
        >
          <MaterialIcons 
            name="file-download" 
            size={28} 
            color={downloadIconColor} 
          />
        </Pressable>
      );
    }
  };

  const actualDownload = async () => {
    try {
      // Prevent multiple simultaneous downloads
    if (downloading) {
        console.log("Already downloading, please wait...");
      return;
    }
    
      const songId = currentPlaying?.id;
      const songUrl = currentPlaying?.url;

      if (!songUrl || typeof songUrl !== 'string') {
        console.error("Invalid song URL:", songUrl);
        Alert.alert("Download Failed", "Invalid song URL");
      return;
    }
    
      // Check if song is already downloaded
      try {
        const isDownloaded = await checkIfDownloaded(songId);
        if (isDownloaded) {
          console.log("Song already downloaded:", songId);
          Alert.alert("Already Downloaded", "This song is already in your library");
      return;
        }
      } catch (error) {
        console.error("Error checking if song is downloaded:", error);
        // Continue with download attempt
    }
    
      // Initialize download progress and notification
      setIsDownloading(true);
      setDownloadProgress(0);
      console.log("Starting download process for:", currentPlaying?.title);
      
      // Ensure directories exist using our new utility
      try {
        const baseDir = RNFS.DocumentDirectoryPath + '/orbit_music';
        await ensureDirectoryExists(baseDir);
        await ensureDirectoryExists(baseDir + '/songs');
        await ensureDirectoryExists(baseDir + '/artwork');
        await ensureDirectoryExists(baseDir + '/metadata');
      } catch (dirError) {
        console.error("Error creating directories:", dirError);
        // Continue with download attempt - ReactNativeBlobUtil might handle this
      }

      // Prepare download path with safe path handling - ensure it's a string
      const songFileName = `${songId}.mp3`;
      // Make absolutely sure the path is a string
      let basePath = typeof RNFS.DocumentDirectoryPath === 'string' ? 
                    RNFS.DocumentDirectoryPath : 
                    String(RNFS.DocumentDirectoryPath || '');
      
      if (!basePath) {
        console.error("Invalid DocumentDirectoryPath");
        throw new Error("Invalid path");
      }
      
      // Construct full path with explicit string concatenation
      const fullPath = basePath + '/orbit_music/songs/' + songFileName;
      const downloadPath = safePath(fullPath);
      console.log("Download path:", downloadPath);

      // Prepare download config with improved error handling
      const downloadConfig = {
        fileCache: false, // Don't use file cache
        path: downloadPath,
        overwrite: true,
        indicator: false, // Disable built-in indicator
        timeout: 60000
      };

      // Start download with a simplified approach
      try {
        console.log("Starting download using simplified config");
        const res = await ReactNativeBlobUtil.config(downloadConfig)
          .fetch('GET', songUrl, {
            // Add some basic headers
            'Accept': 'audio/mpeg, application/octet-stream',
            'Cache-Control': 'no-store'
          })
          .progress((received, total) => {
            if (total <= 0) return; // Avoid division by zero
            const percentage = Math.floor((received / total) * 100);
            setDownloadProgress(percentage);
            console.log(`Download progress event received: ${percentage}% for ${currentPlaying?.title}`);
          })
          .catch(err => {
            console.error('ReactNativeBlobUtil.fetch failed directly:', err);
            // Re-throw to be caught by the outer try/catch for consistent error handling
            throw err;
          });

        console.log("Download completed with status:", res.info().status);
        
        if (res.info().status !== 200) {
          throw new Error(`Download failed with status: ${res.info().status}`);
        }

        // Save metadata after successful download
        try {
          if (currentPlaying) {
            await StorageManager.saveDownloadedSongMetadata(songId, {
              id: songId,
              title: currentPlaying.title || 'Unknown',
              artist: currentPlaying.artist || 'Unknown',
              album: currentPlaying.album || 'Unknown',
              url: songUrl,
              artwork: currentPlaying.artwork || null,
              duration: currentPlaying.duration || 0,
              downloadedAt: new Date().toISOString()
            });
            console.log("Metadata saved successfully for:", songId);
          }
        } catch (metadataError) {
          console.error("Error saving metadata:", metadataError);
          // Continue - song is still downloaded even if metadata fails
        }

        // Download artwork if available
        if (currentPlaying?.artwork && typeof currentPlaying.artwork === 'string') {
          try {
            // Ensure we're using the highest quality artwork for download
            let highQualityArtwork = currentPlaying.artwork;
            // Convert to 500x500 version if it's a JioSaavn URL
            if (highQualityArtwork.includes('saavncdn.com')) {
              highQualityArtwork = highQualityArtwork.replace(/50x50|150x150|500x500/g, '500x500');
            }
            
            // First try using StorageManager
            await StorageManager.saveArtwork(songId, highQualityArtwork);
            console.log("Artwork saved successfully via StorageManager");
        } catch (artworkError) {
            console.error("Error saving artwork via StorageManager:", artworkError);
            
            // Fallback to direct download
            try {
              const artworkPath = safePath(`${RNFS.DocumentDirectoryPath}/orbit_music/artwork/${songId}.jpg`);
              // Ensure we're using high quality artwork here too
              let highQualityArtwork = currentPlaying.artwork;
              if (highQualityArtwork.includes('saavncdn.com')) {
                highQualityArtwork = highQualityArtwork.replace(/50x50|150x150|500x500/g, '500x500');
              }
              await safeDownloadFile(highQualityArtwork, artworkPath);
              console.log("Artwork saved successfully via direct download");
            } catch (directArtworkError) {
              console.error("Error saving artwork via direct download:", directArtworkError);
              // Continue - song is still downloaded even if artwork fails
            }
          }
        }
        
        // Emit events for download completion - no alert needed
        EventRegister.emit('download-complete', songId);
        setIsDownloadComplete(true);
        setIsDownloaded(true);
        setIsDownloading(false);
        setDownloadProgress(100);
        
      } catch (downloadError) {
        console.error("Download failed:", downloadError);
        setIsDownloading(false);
        setDownloadProgress(0);
        Alert.alert("Download Failed", "There was an error downloading the song. Please try again.");
        
        // Clean up partial downloads
        try {
          await safeUnlink(downloadPath);
        } catch (unlinkError) {
          console.error("Error cleaning up partial download:", unlinkError);
        }
      }
      
    } catch (mainError) {
      console.error("Unexpected error in download process:", mainError);
      setIsDownloading(false);
        setDownloadProgress(0);
      Alert.alert("Download Failed", "An unexpected error occurred. Please try again.");
    }
  };

  const getPermission = async () => {
    try {
      // Prevent multiple downloads
      if (downloading) {
        console.log("Already downloading, please wait");
        return;
      }
      
      // First check if we have a valid song
      if (!currentPlaying?.url || !currentPlaying?.id) {
        console.log("No valid song to download");
        Alert.alert("Download Failed", "No valid song to download");
        return;
      }
      
      console.log("Starting download process for song:", currentPlaying?.title);
      
      // Different handling based on platform
    if (Platform.OS === 'ios') {
        // iOS doesn't need explicit permissions for app-specific storage
        console.log("iOS platform detected, proceeding with download");
      actualDownload();
      return;
    }
    
      // For Android, check version
    try {
      const deviceVersion = DeviceInfo.getSystemVersion();
        console.log(`Android version detected: ${deviceVersion}`);
      
      if (parseInt(deviceVersion) >= 13) {
          // Android 13+ uses scoped storage, no need for permissions
          console.log("Using app-specific directory for Android 13+:", `${RNFS.DocumentDirectoryPath}/orbit_music`);
        actualDownload();
        } else {
          // For older Android, request storage permission
          console.log("Requesting storage permission for older Android");
        const granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          {
            title: "Storage Permission",
            message: "Orbit needs storage access to save music for offline playback",
            buttonPositive: "Allow",
            buttonNegative: "Cancel"
          }
        );
        
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
            console.log("Storage permission granted");
          actualDownload();
        } else {
            console.log("Storage permission denied");
            Alert.alert(
              "Permission Denied",
              "Storage permission is required to download songs. Please enable it in app settings."
            );
          }
        }
      } catch (versionError) {
        console.error("Error detecting device version:", versionError);
        // Fallback - try download anyway, it might work with app-specific storage
        console.log("Falling back to default download path");
        actualDownload();
      }
    } catch (mainError) {
      console.error("Permission handling error:", mainError);
      // Try download anyway as last resort
      try {
        actualDownload();
      } catch (downloadError) {
        console.error("Final download attempt failed:", downloadError);
        Alert.alert("Download Failed", "Unable to start download process");
      }
    }
  };

  // Offline mode UI - Compact version between down arrow and lyrics button
  const renderOfflineBanner = () => {
    if (isOffline) {
      return (
        <View style={{ 
          backgroundColor: 'rgba(255, 82, 82, 0.85)', 
          padding: 4, 
          position: 'absolute', 
          top: 20, 
          left: 100, 
          right: 100, 
          zIndex: 10,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row',
          borderRadius: 12,
          height: 24
        }}>
          <Ionicons name="cloud-offline-outline" size={12} color="white" />
          <Text style={{ color: 'white', marginLeft: 3, fontWeight: 'bold', fontSize: 10 }}>
            OFFLINE MODE
          </Text>
        </View>
      );
    }
    return null;
  };

  // Component to render local tracks list
  const renderLocalTracksList = () => {
    if (!isOffline || !showLocalTracks) return null;

    return (
      <View style={{
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.9)',
        zIndex: 200,
        paddingTop: 60,
        paddingHorizontal: 20
      }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <Heading 
            text="Local Music" 
            style={{ fontSize: 24 }} 
            nospace={true} 
          />
          <Pressable onPress={() => setShowLocalTracks(false)}>
            <Ionicons name="close" size={28} color="white" />
          </Pressable>
        </View>

        {localTracks.length > 0 ? (
          <FlatList
            data={localTracks}
            keyExtractor={(item) => item.id}
            renderItem={({ item, index }) => (
              <FullScreenLocalTrackItem 
                song={item} 
                onPress={playLocalTrack}
              />
            )}
          />
        ) : (
          <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
            <Ionicons name="musical-notes-outline" size={50} color="rgba(255,255,255,0.5)" />
            <Text style={{ color: 'white', marginTop: 20, textAlign: 'center' }}>
              No local music found. Download songs when you're online to listen offline.
            </Text>
          </View>
        )}
      </View>
    );
  };

  // Function to check if a song is already downloaded
  const checkIfDownloaded = async (songId) => {
    try {
      if (!songId) {
        console.log('No songId provided to checkIfDownloaded');
        setIsDownloaded(false);
        return false;
      }
      
      // If offline and the current song is playing, it must be downloaded
      if (isOffline && currentPlaying?.id === songId && currentPlaying?.isLocal) {
        console.log('Song is playing in offline mode, marking as downloaded');
        setIsDownloaded(true);
        return true;
      }
      
      // First try using the StorageManager method
      try {
        const isDownloaded = await StorageManager.isSongDownloaded(songId);
        setIsDownloaded(isDownloaded);
        return isDownloaded;
      } catch (metadataError) {
        console.error('Error checking metadata:', metadataError);
        
        // Fallback - try to check if the song file exists directly using safe functions
        try {
          // Get the path safely with explicit string handling
          const songPath = StorageManager.getSongPath(songId);
          if (!songPath) {
            console.error('Invalid song path returned from StorageManager');
            setIsDownloaded(false);
            return false;
          }
          
          // Use the safe file existence check from FileUtils
          console.log('Checking if song exists at path:', songPath);
          const exists = await safeExists(songPath);
          console.log('Song exists check result:', exists);
          
          setIsDownloaded(exists);
          return exists;
        } catch (fileError) {
          console.error('Error checking song file:', fileError);
          setIsDownloaded(false);
          return false;
        }
      }
    } catch (error) {
      console.error('Error checking download status:', error);
      setIsDownloaded(false);
      return false;
    }
  };

  // Check if current song is downloaded when song changes
  useEffect(() => {
    try {
      if (currentPlaying?.id) {
        // In offline mode, all playing tracks must be downloaded
        if (isOffline) {
          console.log('In offline mode with a playing track - marking as downloaded');
          setIsDownloaded(true);
        } else {
          checkIfDownloaded(currentPlaying.id);
        }
      }
    } catch (error) {
      console.error('Error in download check effect:', error);
    }
  }, [currentPlaying?.id, isOffline]);

  // Add an effect to handle offline mode changes
  useEffect(() => {
    // When entering offline mode, force update download status for current song
    if (isOffline && currentPlaying) {
      console.log('Entered offline mode with playing song - marking as downloaded');
      setIsDownloaded(true);
    }
  }, [isOffline, currentPlaying]);

  // Define styles object to fix remaining style references
  const styles = {
    controlIcon: {
      padding: 8,
      borderRadius: 20,
      justifyContent: 'center',
      alignItems: 'center'
    }
  };


  return (
    <Animated.View entering={FadeInDown.delay(200)} style={{ backgroundColor: "rgb(0,0,0)", flex: 1 }}>
      {/* Show dynamic artwork (GIF or image) when playing MyMusic tracks or in offline mode */}
      {((currentPlaying && currentPlaying.sourceType === 'mymusic') || isOffline) && (
        <FastImage
          source={getArtworkSourceFromHook(currentPlaying)} // Use the hook
          style={{ width: width, height: height, position: 'absolute', top: 0, left: 0 }}
          resizeMode={FastImage.resizeMode.cover}
          key={`dynamic-bg-${JSON.stringify(getArtworkSourceFromHook(currentPlaying))}`} // Key off the source from hook
        />
      )}
      {/* The LyricsHandler which includes the ShowLyrics modal is now placed with other controls below */}
      {renderLocalTracksList()}
      <ImageBackground
        source={getArtworkSourceFromHook(currentPlaying)}
        style={{ flex: 1 }}
        resizeMode="cover"
        blurRadius={isLyricsActive ? 25 : 10} // Keep existing blur logic
        onError={() => console.log('Background image failed to load')}
        key={`bg-${JSON.stringify(getArtworkSourceFromHook(currentPlaying))}`}
      >
        <View style={{ flex: 1, backgroundColor: themeMode === 'light' ? 'rgba(255,255,255,0.1)' : "rgba(0,0,0,0.44)" }}>
          {renderOfflineBanner()}
          <LinearGradient
            start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
            colors={themeMode === 'light' ? ['rgba(255,255,255,0.80)', 'rgba(255,255,255,0.9)', 'rgba(255,255,255,1)'] : ['rgba(4,4,4,0.23)', 'rgba(9,9,9,0.47)', 'rgba(0,0,0,0.65)', 'rgba(0,0,0,0.89)', 'rgba(0,0,0,0.9)', "rgba(0,0,0,1)"]}
            style={{ flex: 1, alignItems: "center" }}
          >
            <Pressable
              onPress={() => {
                try {
                  console.log('Down arrow pressed in fullscreen player');
                  setIndex(0); // Just minimize the player
                } catch (error) {
                  console.error('Error in down arrow press handler:', error);
                }
              }}
              style={({ pressed }) => [
                {
                  position: 'absolute',
                  top: 12,
                  left: 20,
                  zIndex: 10,
                  padding: 8,
                  borderRadius: 20,
                  backgroundColor: pressed ? (themeMode === 'light' ? 'rgba(0, 0, 0, 0.1)' : 'rgba(255, 255, 255, 0.1)') : 'transparent',
                }
              ]}
            >
              <Ionicons name="chevron-down" size={30} color={themeMode === 'light' ? theme.colors.text : 'white'} />
            </Pressable>

            {/* Container for LyricsHandler, placed where GetLyricsButton was originally */}
            <View style={{ width: "90%", marginTop: 5, height: 60, alignItems: "center", justifyContent: "flex-end", flexDirection: "row" }}>
              <LyricsHandler currentPlayingTrack={currentPlaying} isOffline={isOffline} Index={Index} onLyricsVisibilityChange={handleLyricsVisibilityChange} currentArtworkSource={getArtworkSourceFromHook(currentPlaying)} />
            </View>

            <Spacer height={5} />
            <GestureDetector gesture={combinedGestures}>
              <View>
                <FastImage
                  source={getArtworkSourceFromHook(currentPlaying)}
                  style={{ height: width * 0.9, width: width * 0.9, borderRadius: 10 }}
                  resizeMode={FastImage.resizeMode.contain}
                  onError={() => console.log('Artwork FastImage failed to load')}
                  key={`artwork-${JSON.stringify(getArtworkSourceFromHook(currentPlaying))}`}
                />
                <Animated.View style={volumeOverlayStyle}>
                  <Ionicons name={getVolumeIconName()} size={24} color={themeMode === 'light' ? theme.colors.text : 'white'} style={{ marginBottom: 10 }} />
                  <View style={volumeBarContainerStyle}>
                    <Animated.View style={volumeBarFillStyle}>
                      <View style={{ position: 'absolute', width: '80%', height: 1, backgroundColor: themeMode === 'light' ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.3)', left: '10%', top: '25%' }} />
                      <View style={{ position: 'absolute', width: '80%', height: 1, backgroundColor: themeMode === 'light' ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.3)', left: '10%', top: '50%' }} />
                      <View style={{ position: 'absolute', width: '80%', height: 1, backgroundColor: themeMode === 'light' ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.3)', left: '10%', top: '75%' }} />
                    </Animated.View>
                  </View>
                </Animated.View>
              </View>
            </GestureDetector>
            <Spacer height={20} />

            <Heading
              text={currentPlaying?.title?.length > 18 ? currentPlaying.title.substring(0, 18) + "..." : currentPlaying?.title || (isOffline ? "Offline Mode" : "No music :(")}
              style={{ textAlign: "center", paddingHorizontal: 2, marginBottom: 5, marginTop: 3, fontSize: 30, color: theme.colors.text }}
              nospace={true}
            />
            <SmallText
              text={currentPlaying?.artist?.length > 20 ? currentPlaying.artist.substring(0, 20) + "..." : currentPlaying?.artist || (isOffline ? "Local Music Available" : "Explore now!")}
              style={{ textAlign: "center", fontSize: 15, color: themeMode === 'light' ? '#555555' : theme.colors.secondaryText }} // Adjusted light theme artist color as per memory
            />
            <Spacer />
            <ProgressBar />
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-around", width: "100%" }}>
              <View><LikeSongButton size={25} /></View>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 20 }}>
                <PreviousSongButton size={30} />
                <PlayPauseButton isFullScreen={true} />
                <NextSongButton size={30} />
              </View>
              <View><RepeatSongButton size={25} /></View>
            </View>
            <Spacer height={10} />
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", width: "80%" }}>
              <SleepTimerButton size={25} />

              {/* Source Switcher - Only show when Tidal is enabled and not offline */}
              {tidalEnabled && !isOffline && (
                <TouchableOpacity
                  onPress={() => {
                    // For now, show message about future implementation
                    const currentSource = currentPlaying?.source || currentPlaying?.sourceType || 'saavn';
                    const newSource = currentSource === 'tidal' ? 'saavn' : 'tidal';
                    ToastAndroid.show(
                      `Current: ${currentSource.toUpperCase()}. Source switching to ${newSource.toUpperCase()} will be available in future updates.`,
                      ToastAndroid.LONG
                    );
                  }}
                  style={{
                    paddingHorizontal: 12,
                    paddingVertical: 6,
                    borderRadius: 15,
                    backgroundColor: 'rgba(255,255,255,0.1)',
                    borderWidth: 1,
                    borderColor: 'rgba(255,255,255,0.2)',
                  }}
                >
                  <Text style={{
                    color: themeMode === 'light' ? theme.colors.text : 'white',
                    fontSize: 12,
                    fontWeight: '500'
                  }}>
                    {currentPlaying?.source === 'tidal' || currentPlaying?.sourceType === 'tidal' ? 'Tidal' : 'Saavn'}
                  </Text>
                </TouchableOpacity>
              )}

              {isOffline ? (
                <TouchableOpacity style={styles.controlIcon} disabled={true}>
                  <MaterialIcons name="check-circle" size={28} color="#4CAF50" />
                </TouchableOpacity>
              ) : (
                <Pressable onPress={getPermission}>
                  {renderDownloadControl()}
                </Pressable>
              )}
            </View>
          </LinearGradient>
        </View>
      </ImageBackground>
      <QueueBottomSheet Index={1} />
    </Animated.View>
  );
};
