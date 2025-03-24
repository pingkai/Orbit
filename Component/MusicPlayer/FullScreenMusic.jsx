import { Dimensions, ImageBackground, View, Pressable, BackHandler, Text, FlatList, TouchableOpacity, Image } from "react-native";
import FastImage from "react-native-fast-image";
import React, { useState, useEffect, useCallback, useRef, useContext, memo } from "react";
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
import { GetLyricsButton } from "./GetLyricsButton";
import QueueBottomSheet from "./QueueBottomSheet";
import { getLyricsSongData } from "../../Api/Songs";
import { ShowLyrics } from "./ShowLyrics";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useActiveTrack, usePlaybackState, State, useProgress } from "react-native-track-player";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { PlayNextSong, PlayPreviousSong } from "../../MusicPlayerFunctions";
import ReactNativeBlobUtil from "react-native-blob-util";
import { PermissionsAndroid, Platform, ToastAndroid } from "react-native";
import DeviceInfo from "react-native-device-info";
import { GetDownloadPath } from "../../LocalStorage/AppSettings";
import TrackPlayer from 'react-native-track-player';
import VolumeControl, { VolumeControlEvents } from 'react-native-volume-control';
import NetInfo from "@react-native-community/netinfo";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useTrackPlayerEvents } from "react-native-track-player";
import { Event } from "react-native-track-player";
import Context from "../../Context/Context";
import { useNavigation, CommonActions } from "@react-navigation/native";
import { StorageManager } from '../../Utils/StorageManager';

// Import SleepTimerButton from its dedicated component file
import { SleepTimerButton } from './SleepTimer';

export const FullScreenMusic = ({ color, Index, setIndex }) => {
  const width = Dimensions.get("window").width;
  const height = Dimensions.get("window").height;
  const currentPlaying = useActiveTrack();
  const [ShowDailog, setShowDailog] = useState(false);
  const [Lyric, setLyric] = useState({});
  const [Loading, setLoading] = useState(false);
  const [currentVolume, setCurrentVolume] = useState(0.5);
  const [isOffline, setIsOffline] = useState(false);
  const [cachedTracks, setCachedTracks] = useState([]);
  const [localTracks, setLocalTracks] = useState([]);
  const [showLocalTracks, setShowLocalTracks] = useState(false);
  const { currentPlaylistData, musicPreviousScreen } = useContext(Context);
  const navigation = useNavigation();

  const volumeAdjustmentActive = useSharedValue(0);
  const startY = useSharedValue(0);
  const lastVolume = useSharedValue(0.5);
  const isDragging = useSharedValue(false);
  const currentY = useSharedValue(0); // Track current Y position during gesture
  const initialDistance = useSharedValue(0); // Track initial distance for reference
  const touchEndTime = useSharedValue(0); // Track when touch ended
  const isVolumeAdjustmentActive = useSharedValue(false); // Explicit flag for volume adjustment
  const volumeChangeRef = useRef(null); // Add missing ref for volume change timeout

  // Add state to track the current GIF
  const [currentGif, setCurrentGif] = useState('a');
  
  // Create an array of GIF letters (excluding 'm' which is causing issues)
  const availableGifs = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];
  
  // Track the current song ID to detect song changes
  const [currentSongId, setCurrentSongId] = useState(null);
  
  // Get a deterministic GIF letter based on song ID 
  const getGifForSong = useCallback((songId) => {
    if (!songId) return 'a';
    
    // Create a simple hash from the song ID to get a consistent GIF for the same song
    let numValue = 0;
    for (let i = 0; i < songId.length; i++) {
      numValue += songId.charCodeAt(i);
    }
    
    // Get a GIF letter based on the hash
    const index = numValue % availableGifs.length;
    return availableGifs[index];
  }, [availableGifs]);
  
  // Listen for track changes to assign a new GIF only when the song changes
  useTrackPlayerEvents([Event.PlaybackTrackChanged], async (event) => {
    try {
      if (event.type === Event.PlaybackTrackChanged) {
        const currentTrack = await TrackPlayer.getActiveTrack();
        if (currentTrack && currentTrack.id !== currentSongId) {
          // Only change GIF when the song changes (different ID)
          console.log(`New song detected: ${currentTrack.title}, assigning a GIF`);
          setCurrentSongId(currentTrack.id);
          
          // Assign a consistent GIF based on song ID
          const gifLetter = getGifForSong(currentTrack.id);
          setCurrentGif(gifLetter);
          console.log(`Assigned GIF ${gifLetter} for song: ${currentTrack.title}`);
        }
      }
    } catch (error) {
      console.error('Error in track change event handler:', error);
    }
  });
  
  // Initialize GIF when a local track starts playing for the first time
  useEffect(() => {
    if (currentPlaying && currentPlaying.isLocal && (!currentSongId || currentPlaying.id !== currentSongId)) {
      setCurrentSongId(currentPlaying.id);
      
      // Assign a consistent GIF based on song ID
      const gifLetter = getGifForSong(currentPlaying.id);
      setCurrentGif(gifLetter);
      console.log(`Assigned GIF ${gifLetter} for song: ${currentPlaying.title || 'Unknown'}`);
    }
  }, [currentPlaying?.isLocal, currentPlaying?.id, currentSongId, getGifForSong]);

  // Create a more efficient mapping function for GIFs
  const getGifModule = useCallback((letter) => {
    // Define a map of letter to require statement
    switch(letter) {
      case 'a': return require('../../Images/a.gif');
      case 'b': return require('../../Images/b.gif');
      case 'c': return require('../../Images/c.gif');
      case 'd': return require('../../Images/d.gif');
      case 'e': return require('../../Images/e.gif');
      case 'f': return require('../../Images/f.gif');
      case 'g': return require('../../Images/g.gif');
      case 'h': return require('../../Images/h.gif');
      case 'i': return require('../../Images/i.gif');
      case 'j': return require('../../Images/j.gif');
      case 'k': return require('../../Images/k.gif');
      case 'l': return require('../../Images/l.gif');
      case 'n': return require('../../Images/n.gif');
      case 'o': return require('../../Images/o.gif');
      case 'p': return require('../../Images/p.gif');
      case 'q': return require('../../Images/q.gif');
      case 'r': return require('../../Images/r.gif');
      case 's': return require('../../Images/s.gif');
      case 't': return require('../../Images/t.gif');
      case 'u': return require('../../Images/u.gif');
      case 'v': return require('../../Images/v.gif');
      case 'w': return require('../../Images/w.gif');
      case 'x': return require('../../Images/x.gif');
      case 'y': return require('../../Images/y.gif');
      case 'z': return require('../../Images/z.gif');
      default: return require('../../Images/a.gif'); // Default fallback
    }
  }, []);

  // Safe function to get the appropriate GIF based on current state
  const getGifSource = useCallback(() => {
    try {
      return getGifModule(currentGif);
    } catch (error) {
      console.error('Error loading GIF:', error);
      return getGifModule('a'); // Fallback to first GIF
    }
  }, [currentGif, getGifModule]);

  // Add error handling for track loading
  useEffect(() => {
    // Initial check of the network status
    const checkInitialConnection = async () => {
      try {
        const networkState = await NetInfo.fetch();
        setIsOffline(!networkState.isConnected);
        if (!networkState.isConnected) {
          await loadCachedData();
          await loadLocalTracks();
        }
      } catch (error) {
        console.error('Error checking network status:', error);
        // Assume offline if there's an error
        setIsOffline(true);
        await loadCachedData();
        await loadLocalTracks();
      }
    };
    
    checkInitialConnection();

    // Subscribe to network state updates with error handling
    const unsubscribe = NetInfo.addEventListener(state => {
      try {
        setIsOffline(!state.isConnected);
        if (!state.isConnected) {
          loadCachedData();
          loadLocalTracks();
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

    // Cleanup subscription
    return () => unsubscribe();
  }, [currentPlaying]);

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

  // Function to load local tracks with improved error handling
  const loadLocalTracks = async () => {
    try {
      // Get all downloaded songs metadata
      const allMetadata = await StorageManager.getAllDownloadedSongsMetadata();
      
      // Format tracks with metadata
      const formattedTracks = Object.values(allMetadata).map(metadata => {
        const artworkPath = StorageManager.getArtworkPath(metadata.id);
        const songPath = StorageManager.getSongPath(metadata.id);
        
        return {
          id: metadata.id,
          url: `file://${songPath}`,
          title: metadata.title,
          artist: metadata.artist,
          artwork: `file://${artworkPath}`,
          duration: metadata.duration,
          isLocal: true,
          language: metadata.language,
          artistID: metadata.artistID
        };
      });

      setLocalTracks(formattedTracks);
      console.log('Loaded local tracks with metadata:', formattedTracks.length);
      return formattedTracks;
    } catch (error) {
      console.error('Error loading local tracks:', error);
      return [];
    }
  };

  // Make sure queue is set up for auto-play
  useTrackPlayerEvents([Event.PlaybackQueueEnded, Event.PlaybackTrackChanged], async (event) => {
    try {
      if (event.type === Event.PlaybackQueueEnded && localTracks.length > 0) {
        // When queue ends, restart from beginning
        await TrackPlayer.skip(0);
        await TrackPlayer.play();
      }
    } catch (error) {
      console.error('Error in track player event handler:', error);
    }
  });

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
        const vol = await VolumeControl.getVolume();
        setCurrentVolume(vol);
        lastVolume.value = vol;
      } catch (error) {
        console.log("Error getting volume:", error);
      }
    };

    // Create a custom event emitter wrapper to fix the warning
    const volumeListener = VolumeControlEvents.addListener('volumeChange', (volume) => {
      setCurrentVolume(volume);
    });

    // Add removeListeners method to fix the warning
    if (!VolumeControlEvents.removeListeners) {
      VolumeControlEvents.removeListeners = function() {
      
      };
    }
    getInitialVolume();
    return () => {
      // Properly clean up the listener
      if (volumeListener && typeof volumeListener.remove === 'function') {
        volumeListener.remove();
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
        await VolumeControl.change(clampedVolume);
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
      console.log('Current navigation state:', JSON.stringify(navigationState, null, 2));

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

  async function GetLyrics() {
    setShowDailog(true);
    try {
      setLoading(true);
      if (!currentPlaying?.id) {
        setLyric({ lyrics: "No song playing. Please play a song first." });
        setLoading(false);
        return;
      }

      try {
        // Instead of using our own caching logic, use the cached version from API
        // This leverages the centralized cache mechanism
        const result = await getLyricsSongData(currentPlaying.id);
        
        if (result) {
          if (result.fromCache) {
            console.log('Lyrics loaded from cache');
          } else {
            console.log('Lyrics freshly fetched');
          }
          
          // If we got data, use it
          if (result.success) {
            setLyric(result.data);
          } else {
            setLyric({ lyrics: "No Lyrics Found\nSorry, we couldn't find lyrics for this song." });
          }
        } else {
          setLyric({ lyrics: isOffline ? "You are offline. Lyrics are not available." : "No Lyrics Found\nSorry, we couldn't find lyrics for this song." });
        }
      } catch (error) {
        // Handle specific HTTP errors
        let errorMessage = "No Lyrics Found\nSorry, we couldn't find lyrics for this song.";
        
        if (error.response) {
          // The request was made and the server responded with a status code
          // that falls out of the range of 2xx
          if (error.response.status === 404) {
            errorMessage = "No Lyrics Found\nLyrics are not available for this song.";
          } else {
            errorMessage = `Service Error (${error.response.status})\nPlease try again later.`;
          }
        } else if (error.request) {
          // The request was made but no response was received
          errorMessage = isOffline ? 
            "You are offline. Lyrics are not available." : 
            "Network Error\nCouldn't connect to the lyrics service.";
        }
        
        setLyric({ lyrics: errorMessage });
        console.log('Lyrics error handled:', error.message || error);
      }
    } catch (e) {
      console.error("Error in GetLyrics function:", e);
      setLyric({ lyrics: isOffline ? "You are offline. Lyrics are not available." : "No Lyrics Found\nSorry, we couldn't find lyrics for this song." });
    } finally {
      setLoading(false);
    }
  }

  const actualDownload = async () => {
    if (!currentPlaying?.url) {
      ToastAndroid.show('No song URL available', ToastAndroid.SHORT);
      return;
    }

    try {
      // Ensure directories exist
      await StorageManager.ensureDirectoriesExist();

      // Prepare metadata
      const metadata = {
        id: currentPlaying.id,
        title: currentPlaying.title,
        artist: currentPlaying.artist,
        duration: currentPlaying.duration,
        artwork: currentPlaying.artwork,
        originalUrl: currentPlaying.url,
        language: currentPlaying.language,
        artistID: currentPlaying.artistID,
        downloadTime: Date.now()
      };

      // Save metadata first
      await StorageManager.saveDownloadedSongMetadata(currentPlaying.id, metadata);

      // Download artwork if available
      if (currentPlaying.artwork && typeof currentPlaying.artwork === 'string') {
        await StorageManager.saveArtwork(currentPlaying.id, currentPlaying.artwork);
      }

      // Get the song path
      const songPath = StorageManager.getSongPath(currentPlaying.id);

      // Show download started toast
      ToastAndroid.showWithGravity(
        `Download Started`,
        ToastAndroid.SHORT,
        ToastAndroid.CENTER,
      );

      // Download the song
      await ReactNativeBlobUtil
        .config({
          fileCache: true,
          appendExt: 'mp3',
          path: songPath,
          addAndroidDownloads: {
            useDownloadManager: true,
            notification: true,
            title: currentPlaying.title,
            description: `Downloading ${currentPlaying.title}`,
            mime: 'audio/mpeg',
          },
        })
        .fetch('GET', currentPlaying.url, {})
        .then((res) => {
          console.log('Download completed:', res.path());
          ToastAndroid.showWithGravity(
            "Download successfully completed",
            ToastAndroid.SHORT,
            ToastAndroid.CENTER,
          );
        });

      // After successful download, update local tracks list
      await loadLocalTracks();
    } catch (error) {
      console.error('Download error:', error);
      ToastAndroid.showWithGravity(
        "Download failed",
        ToastAndroid.SHORT,
        ToastAndroid.CENTER,
      );

      // Clean up metadata if download fails
      await StorageManager.removeDownloadedSongMetadata(currentPlaying.id);
    }
  };

  const getPermission = async () => {
    if (Platform.OS === 'ios') {
      actualDownload();
    } else {
      try {
        let deviceVersion = DeviceInfo.getSystemVersion();
        let granted = PermissionsAndroid.RESULTS.DENIED;
        if (deviceVersion >= 13) {
          granted = PermissionsAndroid.RESULTS.GRANTED;
        } else {
          granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          );
        }
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          actualDownload();
        }
      } catch (err) {
        console.log("Permission error", err);
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
          left: 60, 
          right: 60, 
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

  // Function to play a specific local track
  const playLocalTrack = async (track) => {
    try {
      // Find the index of the track in the localTracks array
      const trackIndex = localTracks.findIndex(t => t.id === track.id);
      if (trackIndex === -1) return;

      // Reset player and add all tracks starting from the selected one
      await TrackPlayer.reset();
      await TrackPlayer.add([...localTracks.slice(trackIndex), ...localTracks.slice(0, trackIndex)]);
      await TrackPlayer.play();
      
      // Hide the local tracks list after selection
      setShowLocalTracks(false);
    } catch (error) {
      console.error('Error playing local track:', error);
    }
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
              <LocalMusicCard 
                song={item} 
                index={index} 
                allSongs={localTracks} 
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

  return (
    <Animated.View entering={FadeInDown.delay(200)} style={{ backgroundColor: "rgb(0,0,0)", flex: 1 }}>
      {/* Show GIF when offline or playing local music */}
      {(isOffline || (currentPlaying && currentPlaying.isLocal)) && (
        <FastImage
          source={getGifSource()}
          style={{ width: width, height: height, position: 'absolute', top: 0, left: 0 }}
          resizeMode={FastImage.resizeMode.cover}
          key={`background-gif-${currentGif}`}
        />
      )}
      <ShowLyrics Loading={Loading} Lyric={Lyric} setShowDailog={setShowDailog} ShowDailog={ShowDailog} />
      {renderLocalTracksList()}
      <ImageBackground 
        blurRadius={20} 
        source={{ 
          uri: currentPlaying?.artwork ?? 
               (isOffline && cachedTracks.length > 0 ? 
                 cachedTracks[0].artwork : 
                 "https://htmlcolorcodes.com/assets/images/colors/gray-color-solid-background-1920x1080.png") 
        }} 
        style={{ flex: 1 }}
      >
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.44)" }}>
        {renderOfflineBanner()}
          <LinearGradient start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} colors={['rgba(4,4,4,0.23)', 'rgba(9,9,9,0.47)', 'rgba(0,0,0,0.65)', 'rgba(0,0,0,0.89)', 'rgba(0,0,0,0.9)', "rgba(0,0,0,1)"]} style={{ flex: 1, alignItems: "center" }}>
            <Pressable
              onPress={() => {
                try {
                  console.log('Down arrow pressed in fullscreen player');
                  setIndex(0); // Just minimize the player
                } catch (error) {
                  console.error('Error in down arrow press handler:', error);
                }
              }}
              style={{ position: 'absolute', top: 20, left: 20, zIndex: 10 }}
            >
              <Ionicons name="chevron-down" size={30} color="white" />
            </Pressable>
            
            <View style={{ width: "90%", marginTop: 5, height: 60, alignItems: "center", justifyContent: "flex-end", flexDirection: "row" }}>
              <GetLyricsButton onPress={GetLyrics} />
            </View>
           <Spacer height={5} />
            <GestureDetector gesture={combinedGestures}>
              <View>
                {(isOffline || (currentPlaying && currentPlaying.isLocal)) ? (
                  <FastImage
                    source={getGifSource()}
                    style={{ height: width * 0.9, width: width * 0.9, borderRadius: 10 }}
                    resizeMode={FastImage.resizeMode.contain}
                    key={`gif-${currentGif}`}
                  />
                ) : (
                  <FastImage
                    source={{ 
                      uri: currentPlaying?.artwork ?? 
                        "https://htmlcolorcodes.com/assets/images/colors/gray-color-solid-background-1920x1080.png"
                    }}
                    style={{ height: width * 0.9, width: width * 0.9, borderRadius: 10 }}
                  />
                )}
                <Animated.View style={volumeOverlayStyle}>
                  <Ionicons name={getVolumeIconName()} size={24} color="white" style={{ marginBottom: 10 }} />
                  <View style={volumeBarContainerStyle}>
                    <Animated.View style={volumeBarFillStyle}>
                      <View style={{
                        position: 'absolute',
                        width: '80%',
                        height: 1,
                        backgroundColor: 'rgba(255,255,255,0.3)',
                        left: '10%',
                        top: '25%'
                      }} />
                      <View style={{
                        position: 'absolute',
                        width: '80%',
                        height: 1,
                        backgroundColor: 'rgba(255,255,255,0.3)',
                        left: '10%',
                        top: '50%'
                      }} />
                      <View style={{
                        position: 'absolute',
                        width: '80%',
                        height: 1,
                        backgroundColor: 'rgba(255,255,255,0.3)',
                        left: '10%',
                        top: '75%'
                      }} />
                    </Animated.View>
                  </View>
                </Animated.View>
              </View>
            </GestureDetector>
            <Spacer height={20} />
            
            <Heading
              text={currentPlaying?.title?.length > 18 ? currentPlaying.title.substring(0, 18) + "..." : currentPlaying?.title || (isOffline ? "Offline Mode" : "No music :(")}
              style={{ textAlign: "center", paddingHorizontal: 2, marginBottom: 5, marginTop: 3, fontSize: 30 }}
              nospace={true}
            />
            <SmallText
              text={currentPlaying?.artist?.length > 20 ? currentPlaying.artist.substring(0, 20) + "..." : currentPlaying?.artist || (isOffline ? "Local Music Available" : "Explore now!")}
              style={{ textAlign: "center", fontSize: 15 }}
            />
            <Spacer />
            <ProgressBar />
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-around", width: "100%" }}>
              <View>
                <LikeSongButton size={25} />
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 20 }}>
                <PreviousSongButton size={30} />
                <PlayPauseButton isFullScreen={true} />
                <NextSongButton size={30} />
              </View>
              <View>
                <RepeatSongButton size={25} />
              </View>
            </View>
            <Spacer height={10} />
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", width: "80%" }}>
              <SleepTimerButton size={25} />
              {!isOffline && (
                <Pressable onPress={getPermission}>
                  <Ionicons name="download-outline" size={25} color="white" />
                </Pressable>
              )}
              {isOffline && (
                <Pressable onPress={loadLocalTracks}>
                  <Ionicons name="refresh-outline" size={25} color="white" />
                </Pressable>
              )}
            </View>
            
            {isOffline && localTracks.length === 0 && (
              <View style={{ marginTop: 20, padding: 15, backgroundColor: 'rgba(0,0,0,0.6)', borderRadius: 10 }}>
                <Text style={{ color: 'white', textAlign: 'center' }}>
                  No local tracks found. Download music when online to listen offline.
                </Text>
              </View>
            )}
          </LinearGradient>
        </View>
      </ImageBackground>
      <QueueBottomSheet Index={1} />
    </Animated.View>
  );
};

