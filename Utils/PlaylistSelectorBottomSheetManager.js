import React from 'react';
import { ToastAndroid } from 'react-native';

// Reference to the PlaylistSelectorBottomSheet component
export let PlaylistSelectorBottomSheetRef = { current: null };

// Function to set the reference
export const setPlaylistSelectorBottomSheetRef = (ref) => {
  PlaylistSelectorBottomSheetRef.current = ref;
  console.log('PlaylistSelectorBottomSheetRef initialized:', !!ref);
};

// Function to show the playlist selector bottom sheet with error handling
export const showPlaylistSelectorBottomSheetWithFallback = (song) => {
  try {
    if (!PlaylistSelectorBottomSheetRef.current) {
      console.warn('PlaylistSelectorBottomSheetRef is not initialized yet');
      ToastAndroid.show('Playlist selector is not ready yet, please try again in a moment', ToastAndroid.SHORT);
      return false;
    }
    
    // Call the show method on the ref
    return PlaylistSelectorBottomSheetRef.current.show(song);
  } catch (error) {
    console.error('Error showing playlist selector bottom sheet:', error);
    ToastAndroid.show('Error showing playlist selector', ToastAndroid.SHORT);
    return false;
  }
};

// Methods for controlling the PlaylistSelectorBottomSheet
export const PlaylistSelectorBottomSheetManager = {
  show: (song) => {
    try {
      console.log('🔍 PlaylistSelectorBottomSheetManager.show called');

      if (!song) {
        console.error('❌ Cannot show playlist selector bottom sheet: No song provided');
        return false;
      }

      if (!song.id || !song.title) {
        console.error('❌ Invalid song object for playlist selector bottom sheet:', song);
        return false;
      }

      console.log('🔍 Checking PlaylistSelectorBottomSheetRef.current:', !!PlaylistSelectorBottomSheetRef.current);

      if (PlaylistSelectorBottomSheetRef.current) {
        console.log('✅ Showing PlaylistSelectorBottomSheet for song:', song.title);
        const result = PlaylistSelectorBottomSheetRef.current.show(song);
        console.log('📱 Bottom sheet show result:', result);
        return result;
      } else {
        console.error('❌ PlaylistSelectorBottomSheet reference is not initialized');
        console.log('🔍 Current ref state:', PlaylistSelectorBottomSheetRef);
        ToastAndroid.show('Cannot open playlist selector now', ToastAndroid.SHORT);
        return false;
      }
    } catch (error) {
      console.error('❌ Error showing playlist selector bottom sheet:', error);
      return false;
    }
  },

  hide: () => {
    try {
      if (PlaylistSelectorBottomSheetRef.current) {
        console.log('Hiding PlaylistSelectorBottomSheet');
        return PlaylistSelectorBottomSheetRef.current.hide();
      } else {
        console.warn('PlaylistSelectorBottomSheet reference is not initialized');
        return false;
      }
    } catch (error) {
      console.error('Error hiding playlist selector bottom sheet:', error);
      return false;
    }
  },

  isVisible: () => {
    try {
      if (PlaylistSelectorBottomSheetRef.current) {
        return PlaylistSelectorBottomSheetRef.current.isVisible();
      }
      return false;
    } catch (error) {
      console.error('Error checking playlist selector bottom sheet visibility:', error);
      return false;
    }
  },

  isInitialized: () => {
    return !!PlaylistSelectorBottomSheetRef.current;
  }
};

// Default export for convenience
export default PlaylistSelectorBottomSheetManager;
