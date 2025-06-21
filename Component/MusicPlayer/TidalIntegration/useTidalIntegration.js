import { useState, useEffect } from 'react';
import { GetTidalEnabled, SetTidalEnabled } from '../../../LocalStorage/AppSettings';
import { showTidalUnsupportedMessage } from '../../../Utils/TidalMusicHandler';
import { ToastAndroid } from 'react-native';

/**
 * useTidalIntegration - Custom hook for Tidal music service integration
 * 
 * This hook provides Tidal integration capabilities including:
 * - Tidal preference management
 * - Source detection and switching
 * - Tidal-specific functionality
 * - Integration state management
 */

export const useTidalIntegration = (options = {}) => {
  const { 
    autoLoad = true,
    onTidalToggle = null,
    onSourceSwitch = null 
  } = options;

  const [tidalEnabled, setTidalEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(autoLoad);
  const [currentSource, setCurrentSource] = useState('saavn');

  // Load Tidal preference
  const loadTidalPreference = async () => {
    try {
      setIsLoading(true);
      const enabled = await GetTidalEnabled();
      setTidalEnabled(enabled);
      console.log('useTidalIntegration: Loaded Tidal preference:', enabled);
      return enabled;
    } catch (error) {
      console.error('useTidalIntegration: Error loading Tidal preference:', error);
      setTidalEnabled(false);
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Auto-load on mount if enabled
  useEffect(() => {
    if (autoLoad) {
      loadTidalPreference();
    }
  }, [autoLoad]);

  // Toggle Tidal integration
  const toggleTidalIntegration = async () => {
    try {
      const newState = !tidalEnabled;
      await SetTidalEnabled(newState);
      setTidalEnabled(newState);
      
      const message = newState 
        ? 'Tidal integration enabled' 
        : 'Tidal integration disabled';
      ToastAndroid.show(message, ToastAndroid.SHORT);
      
      console.log('useTidalIntegration: Toggled to:', newState);
      
      if (onTidalToggle) {
        onTidalToggle(newState);
      }
      
      return newState;
    } catch (error) {
      console.error('useTidalIntegration: Error toggling Tidal preference:', error);
      ToastAndroid.show('Error updating Tidal preference', ToastAndroid.SHORT);
      return tidalEnabled; // Return current state on error
    }
  };

  // Get current source from track
  const getCurrentSource = (track) => {
    if (!track) return 'saavn';
    return track.source || track.sourceType || 'saavn';
  };

  // Check if track is from Tidal
  const isTidalTrack = (track) => {
    if (!track) return false;
    const source = getCurrentSource(track);
    return source === 'tidal';
  };

  // Switch source (placeholder for future implementation)
  const switchSource = (currentTrack) => {
    if (!tidalEnabled) {
      showTidalUnsupportedMessage();
      return null;
    }

    const currentSrc = getCurrentSource(currentTrack);
    const newSource = currentSrc === 'tidal' ? 'saavn' : 'tidal';
    
    // For now, show message about future implementation
    ToastAndroid.show(
      `Current: ${currentSrc.toUpperCase()}. Source switching to ${newSource.toUpperCase()} will be available in future updates.`,
      ToastAndroid.LONG
    );
    
    console.log('useTidalIntegration: Source switch requested:', {
      from: currentSrc,
      to: newSource,
      track: currentTrack?.title
    });

    if (onSourceSwitch) {
      onSourceSwitch({
        from: currentSrc,
        to: newSource,
        track: currentTrack
      });
    }
    
    return newSource;
  };

  // Get source display name
  const getSourceDisplayName = (track) => {
    const source = getCurrentSource(track);
    switch (source) {
      case 'tidal':
        return 'Tidal';
      case 'saavn':
        return 'Saavn';
      case 'mymusic':
        return 'My Music';
      case 'local':
        return 'Local';
      default:
        return 'Unknown';
    }
  };

  // Check if Tidal features should be shown
  const shouldShowTidalFeatures = (isOffline = false) => {
    return tidalEnabled && !isOffline && !isLoading;
  };

  // Get Tidal integration status
  const getTidalStatus = () => ({
    enabled: tidalEnabled,
    loading: isLoading,
    currentSource,
    available: !isLoading
  });

  // Handle Tidal-specific errors
  const handleTidalError = (error, context = 'general') => {
    console.error(`useTidalIntegration: Error in ${context}:`, error);
    
    if (error.message?.includes('network') || error.message?.includes('timeout')) {
      ToastAndroid.show('Tidal service temporarily unavailable', ToastAndroid.SHORT);
    } else if (error.message?.includes('unauthorized')) {
      ToastAndroid.show('Tidal authentication required', ToastAndroid.SHORT);
    } else {
      ToastAndroid.show('Tidal integration error', ToastAndroid.SHORT);
    }
  };

  // Get available sources
  const getAvailableSources = () => {
    const sources = ['saavn'];
    if (tidalEnabled) {
      sources.push('tidal');
    }
    return sources;
  };

  // Check if source switching is available
  const canSwitchSource = (isOffline = false) => {
    return tidalEnabled && !isOffline && !isLoading;
  };

  return {
    // State
    tidalEnabled,
    isLoading,
    currentSource,
    
    // Functions
    loadTidalPreference,
    toggleTidalIntegration,
    getCurrentSource,
    isTidalTrack,
    switchSource,
    getSourceDisplayName,
    shouldShowTidalFeatures,
    getTidalStatus,
    handleTidalError,
    getAvailableSources,
    canSwitchSource
  };
};
