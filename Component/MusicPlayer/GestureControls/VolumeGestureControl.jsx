import React, { useState, useEffect, useCallback, useRef } from 'react';
import { DeviceEventEmitter } from 'react-native';
import { Gesture } from 'react-native-gesture-handler';
import { useSharedValue, useAnimatedStyle, withTiming, runOnJS } from 'react-native-reanimated';
import VolumeManager from 'react-native-volume-manager';
import TrackPlayer from 'react-native-track-player';

/**
 * Custom hook for volume gesture control
 * Handles vertical pan gestures for volume adjustment
 */
export const useVolumeGestureControl = () => {
  const [currentVolume, setCurrentVolume] = useState(0.5);
  
  // Shared values for gesture handling
  const volumeAdjustmentActive = useSharedValue(0);
  const startY = useSharedValue(0);
  const lastVolume = useSharedValue(0.5);
  const isDragging = useSharedValue(false);
  const currentY = useSharedValue(0);
  const initialDistance = useSharedValue(0);
  const touchEndTime = useSharedValue(0);
  const isVolumeAdjustmentActive = useSharedValue(false);
  
  // Refs for managing volume updates
  const volumeChangeRef = useRef(null);
  const lastVolumeUpdateRef = useRef(Date.now());

  // Initialize volume and set up volume change listener
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

  // Volume adjustment function
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

  // Create the pan gesture for volume control
  const createVolumeGesture = useCallback(() => {
    return Gesture.Pan()
      .onBegin((e) => {
        'worklet';
        startY.value = e.absoluteY;
        currentY.value = e.absoluteY;
        initialDistance.value = 0;
        // Make overlay appear instantly without animation
        volumeAdjustmentActive.value = 1;
        lastVolume.value = currentVolume;
        isDragging.value = true;
        isVolumeAdjustmentActive.value = true;
        touchEndTime.value = 0;
      })
      .onUpdate((e) => {
        'worklet';
        if (isDragging.value && isVolumeAdjustmentActive.value) {
          // Calculate delta based on current finger position with improved precision
          const deltaY = startY.value - e.absoluteY;
          
          // Fine-tuned sensitivity for perfect sync with gesture
          const sensitivityMultiplier = 1.0;
          const totalHeight = 180;
          
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
          isVolumeAdjustmentActive.value = false;
          touchEndTime.value = Date.now();
          
          // Make overlay disappear with minimal animation for better responsiveness
          volumeAdjustmentActive.value = withTiming(0, { duration: 50 });
        }
      });
  }, [currentVolume, adjustVolume]);

  // Get volume icon name based on current volume
  const getVolumeIconName = useCallback(() => {
    if (currentVolume === 0) return 'volume-mute';
    if (currentVolume < 0.3) return 'volume-low';
    if (currentVolume < 0.7) return 'volume-medium';
    return 'volume-high';
  }, [currentVolume]);

  // Animated styles for volume overlay
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
    overflow: 'hidden',
    pointerEvents: volumeAdjustmentActive.value === 0 ? 'none' : 'auto',
    transform: [{ scale: 1 }],
  }));

  // Animated styles for volume bar fill
  const volumeBarFillStyle = useAnimatedStyle(() => {
    return {
      position: 'absolute',
      bottom: 0,
      width: '100%',
      height: `${currentVolume * 100}%`,
      backgroundColor: currentVolume > 0.7 ? '#4169E1' : currentVolume > 0.3 ? '#5D8AFF' : '#7BA2FF',
      borderTopLeftRadius: 8,
      borderTopRightRadius: 8,
      transform: [{ scaleY: 1 }],
      style: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -2 },
        shadowOpacity: 0.2,
        shadowRadius: 3,
      }
    };
  });

  return {
    currentVolume,
    createVolumeGesture,
    getVolumeIconName,
    volumeOverlayStyle,
    volumeBarFillStyle,
    isDragging: isDragging.value,
    volumeAdjustmentActive: volumeAdjustmentActive.value
  };
};

/**
 * Volume bar container styles
 */
export const volumeBarContainerStyle = {
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
