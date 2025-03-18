import { Dimensions, ImageBackground, View, Pressable, BackHandler } from "react-native";
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

  const volumeAdjustmentActive = useSharedValue(0);
  const startY = useSharedValue(0);
  const lastVolume = useSharedValue(0.5);
  const isDragging = useSharedValue(false);
  const currentY = useSharedValue(0); // Track current Y position during gesture
  const initialDistance = useSharedValue(0); // Track initial distance for reference
  const touchEndTime = useSharedValue(0); // Track when touch ended
  const isVolumeAdjustmentActive = useSharedValue(false); // Explicit flag for volume adjustment state
  const volumeChangeRef = useRef(null); // Add missing ref for volume change timeout

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

      const Lyrics = await getLyricsSongData(currentPlaying.id);
      setLyric(Lyrics.success ? Lyrics.data : { lyrics: "No Lyrics Found \nOpps... O_o" });
    } catch (e) {
      setLyric({ lyrics: "No Lyrics Found \nOpps... O_o" });
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
          path: (path === "Downloads") ? dirs.LegacyDownloadDir + `/Orbit/${currentPlaying.title}.m4a` : dirs.LegacyMusicDir + `/Orbit/${currentVolume.title}.m4a`,
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

  return (
    <Animated.View entering={FadeInDown.delay(200)} style={{ backgroundColor: "rgb(0,0,0)", flex: 1 }}>
      <ShowLyrics Loading={Loading} Lyric={Lyric} setShowDailog={setShowDailog} ShowDailog={ShowDailog} />
      <ImageBackground blurRadius={20} source={{ uri: currentPlaying?.artwork ?? "https://htmlcolorcodes.com/assets/images/colors/gray-color-solid-background-1920x1080.png" }} style={{ flex: 1 }}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.44)" }}>
          <LinearGradient start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} colors={['rgba(4,4,4,0.23)', 'rgba(9,9,9,0.47)', 'rgba(0,0,0,0.65)', 'rgba(0,0,0,0.89)', 'rgba(0,0,0,0.9)', "rgba(0,0,0,1)"]} style={{ flex: 1, alignItems: "center" }}>
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
                <FastImage
                  source={{ uri: currentPlaying?.artwork ?? "https://htmlcolorcodes.com/assets/images/colors/gray-color-solid-background-1920x1080.png" }}
                  style={{ height: width * 0.9, width: width * 0.9, borderRadius: 10 }}
                />
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
              text={currentPlaying?.title?.length > 18 ? currentPlaying.title.substring(0, 18) + "..." : currentPlaying?.title || "No music :("}
              style={{ textAlign: "center", paddingHorizontal: 2, marginBottom: 5, marginTop: 3, fontSize: 30 }}
              nospace={true}
            />
            <SmallText
              text={currentPlaying?.artist?.length > 20 ? currentPlaying.artist.substring(0, 20) + "..." : currentPlaying?.artist || "Explore now!"}
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
              <Pressable onPress={getPermission}>
                <Ionicons name="download-outline" size={25} color="white" />
              </Pressable>
            </View>
          </LinearGradient>
        </View>
      </ImageBackground>
      <QueueBottomSheet Index={1} />
    </Animated.View>
  );
};
