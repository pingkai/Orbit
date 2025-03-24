// service.js
import TrackPlayer, { Capability } from "react-native-track-player";
import { Event } from 'react-native-track-player';

// Keep track of whether the player has been initialized
let isPlayerInitialized = false;

export const PlaybackService = async function() {
  try {
    // Only initialize player if not already initialized
    if (!isPlayerInitialized) {
      await TrackPlayer.setupPlayer();
      isPlayerInitialized = true;
      console.log('Player initialized successfully in service.js');
    } else {
      console.log('Player already initialized, skipping setup');
    }
    
    TrackPlayer.addEventListener(Event.RemotePlay, () => TrackPlayer.play());
    TrackPlayer.addEventListener(Event.RemotePause, () => TrackPlayer.pause());
    TrackPlayer.addEventListener(Event.RemoteNext, () => TrackPlayer.skipToNext());
    TrackPlayer.addEventListener(Event.RemotePrevious, () => TrackPlayer.skipToPrevious());
    TrackPlayer.addEventListener(Event.RemoteSeek, (e) => TrackPlayer.seekTo(e.position));
    
    await TrackPlayer.updateOptions({
      // Media controls capabilities
      capabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.SkipToNext,
        Capability.SkipToPrevious,
        Capability.SeekTo,
      ],
      notificationCapabilities: [
        Capability.Play,
        Capability.Pause,
        Capability.SkipToNext,
        Capability.SkipToPrevious,
        Capability.SeekTo,
      ],
      // Capabilities that will show up when the notification is in the compact form on Android
      compactCapabilities: [Capability.Play, Capability.Pause, Capability.SkipToNext,
        Capability.SkipToPrevious],
    });
  } catch (error) {
    // Check if the error is about the player already being initialized
    if (error.message && error.message.includes('player has already been initialized')) {
      console.log('Player already initialized in service.js');
      isPlayerInitialized = true;
    } else {
      console.error('Error initializing player in service.js:', error);
    }
  }
};

