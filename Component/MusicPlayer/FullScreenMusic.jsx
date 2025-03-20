import { Dimensions, ImageBackground, View, Pressable, BackHandler, Text, FlatList, TouchableOpacity, Image } from "react-native";
import FastImage from "react-native-fast-image";
import React, { useState, useEffect, useCallback, useRef } from "react";
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
import { useActiveTrack } from "react-native-track-player";
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

  const volumeAdjustmentActive = useSharedValue(0);
  const startY = useSharedValue(0);
  const lastVolume = useSharedValue(0.5);
  const isDragging = useSharedValue(false);
  const currentY = useSharedValue(0); // Track current Y position during gesture
  const initialDistance = useSharedValue(0); // Track initial distance for reference
  const touchEndTime = useSharedValue(0); // Track when touch ended
  const isVolumeAdjustmentActive = useSharedValue(false); // Explicit flag for volume adjustment state
  const volumeChangeRef = useRef(null); // Add missing ref for volume change timeout

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
      const path = await GetDownloadPath();
      const dirs = ReactNativeBlobUtil.fs.dirs;
      const downloadDir = (path === "Downloads") 
        ? dirs.LegacyDownloadDir + `/Orbit` 
        : dirs.LegacyMusicDir + `/Orbit`;
      
      // Check if directory exists
      const exists = await ReactNativeBlobUtil.fs.exists(downloadDir);
      if (!exists) {
        console.log('Download directory does not exist');
        setLocalTracks([]);
        return;
      }
      
      // List files in the directory
      const files = await ReactNativeBlobUtil.fs.ls(downloadDir);
      
      // Filter music files
      const musicFiles = files.filter(file => 
        file.endsWith('.mp3') || 
        file.endsWith('.m4a') || 
        file.endsWith('.wav') || 
        file.endsWith('.flac')
      );
      
      if (musicFiles.length === 0) {
        console.log('No music files found');
        setLocalTracks([]);
        return;
      }
      
      // Extract artist from title
      const extractArtistFromTitle = (title) => {
        const regex = /- (.+)$/;
        const match = title.match(regex);
        return match ? match[1].trim() : "Unknown Artist";
      };

      // Format tracks for TrackPlayer
      const formattedTracks = musicFiles.map(file => {
        const title = file.replace(/\.(mp3|m4a|wav|flac)$/, '');
        const artist = extractArtistFromTitle(title);

        return {
          id: `local_${file}`,
          url: `file://${downloadDir}/${file}`,
          title: title,
          artist: artist,
          artwork: 'https://htmlcolorcodes.com/assets/images/colors/gray-color-solid-background-1920x1080.png',
          isLocal: true
        };
      });
      
      setLocalTracks(formattedTracks);
      
      // Don't automatically reset and add tracks here
      // This allows the MyMusicPage component to handle track playback
      console.log('Found local tracks:', formattedTracks.length);
      
      return formattedTracks;
    } catch (error) {
      console.error('Error loading local tracks:', error);
      setLocalTracks([]);
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

  const volumeLevelTextStyle = {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 5,
    textAlign: 'center',
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
      runOnJS(setIndex)(0);
    }
  });
  
  // Combine gestures with the pan taking priority
  const combinedGestures = Gesture.Exclusive(pan, tap);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      setIndex(0);
      return true;
    });

    return () => backHandler.remove();
  }, [setIndex]);

  async function GetLyrics() {
    setShowDailog(true);
    try {
      setLoading(true);
      if (!currentPlaying?.id) return;

      if (isOffline) {
        // Try to load cached lyrics if offline
        const cachedLyrics = await AsyncStorage.getItem(`lyrics_${currentPlaying.id}`);
        if (cachedLyrics) {
          setLyric(JSON.parse(cachedLyrics));
        } else {
          setLyric({ lyrics: "No cached lyrics found. Please connect to the internet to download lyrics." });
        }
      } else {
        // If online, fetch lyrics and cache them
        const Lyrics = await getLyricsSongData(currentPlaying.id);
        if (Lyrics.success) {
          setLyric(Lyrics.data);
          // Cache lyrics for offline use
          await AsyncStorage.setItem(`lyrics_${currentPlaying.id}`, JSON.stringify(Lyrics.data));
        } else {
          setLyric({ lyrics: "No Lyrics Found \nOpps... O_o" });
        }
      }
    } catch (e) {
      setLyric({ lyrics: isOffline ? "You are offline. Lyrics are not available." : "No Lyrics Found \nOpps... O_o" });
    } finally {
      setLoading(false);
    }
  }

  const actualDownload = async () => {
    let dirs = ReactNativeBlobUtil.fs.dirs;
    const path = await GetDownloadPath();
    ToastAndroid.showWithGravity(
      `Download Started`,
      ToastAndroid.SHORT,
      ToastAndroid.CENTER,
    );
    if (!currentPlaying?.url) return;

    ReactNativeBlobUtil
      .config({
        addAndroidDownloads: {
          useDownloadManager: true,
          path: (path === "Downloads") ? dirs.LegacyDownloadDir + `/Orbit/${currentPlaying.title}.m4a` : dirs.LegacyMusicDir + `/Orbit/${currentPlaying.title}.m4a`,
          notification: true,
          title: `${currentPlaying.title}`,
        },
        fileCache: true,
      })
      .fetch('GET', currentPlaying.url, {})
      .then((res) => {
        ToastAndroid.showWithGravity(
          "Download successfully Completed",
          ToastAndroid.SHORT,
          ToastAndroid.CENTER,
        );
        // After successful download, add to local tracks list
        loadLocalTracks();
      })
      .catch((error) => {
        ToastAndroid.showWithGravity(
          "Download failed",
          ToastAndroid.SHORT,
          ToastAndroid.CENTER,
        );
      });
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

  // Offline mode UI
  const renderOfflineBanner = () => {
    if (isOffline) {
      return (
        <View style={{ 
          backgroundColor: 'rgba(0,0,0,0.7)', 
          padding: 10, 
          position: 'absolute', 
          top: 60, 
          left: 0, 
          right: 0, 
          zIndex: 100,
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'row'
        }}>
          <Ionicons name="cloud-offline-outline" size={18} color="#FF5252" />
          <Text style={{ color: 'white', marginLeft: 5, fontWeight: 'bold' }}>
            You're offline - Playing local music
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
        <Image
          source={require('../../Images/b.gif')} // Ensure the path is correct
          style={{ width: width, height: height, position: 'absolute', top: 0, left: 0 }}
          resizeMode="cover"
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
          <LinearGradient start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} colors={['rgba(4,4,4,0.23)', 'rgba(9,9,9,0.47)', 'rgba(0,0,0,0.65)', 'rgba(0,0,0,0.89)', 'rgba(0,0,0,0.9)', "rgba(0,0,0,1)"]} style={{ flex: 1, alignItems: "center" }}>
            {renderOfflineBanner()}
            <Pressable
              onPress={() => setIndex(0)}
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
                  <Image
                    source={require('../../Images/i.gif')}
                    style={{ height: width * 0.9, width: width * 0.9, borderRadius: 10 }}
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
            <Spacer />
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

