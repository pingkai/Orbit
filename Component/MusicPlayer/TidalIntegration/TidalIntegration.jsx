import React, { createContext, useContext, useState, useEffect } from 'react';
import { GetTidalEnabled, SetTidalEnabled } from '../../../LocalStorage/AppSettings';
import { showTidalUnsupportedMessage } from '../../../Utils/TidalMusicHandler';
import { ToastAndroid } from 'react-native';

/**
 * TidalIntegration - Manages Tidal music service integration
 * 
 * This component provides Tidal integration capabilities including:
 * - Tidal preference management
 * - Source switching between Tidal and Saavn
 * - Tidal-specific functionality handling
 * - Integration state management
 */

const TidalIntegrationContext = createContext();

export const TidalIntegration = ({ children }) => {
  const [tidalEnabled, setTidalEnabled] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentSource, setCurrentSource] = useState('saavn');

  // Load Tidal preference on mount
  useEffect(() => {
    const loadTidalPreference = async () => {
      try {
        setIsLoading(true);
        const enabled = await GetTidalEnabled();
        setTidalEnabled(enabled);
        console.log('TidalIntegration: Loaded Tidal preference:', enabled);
      } catch (error) {
        console.error('TidalIntegration: Error loading Tidal preference:', error);
        setTidalEnabled(false);
      } finally {
        setIsLoading(false);
      }
    };
    
    loadTidalPreference();
  }, []);

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
      
      console.log('TidalIntegration: Toggled to:', newState);
    } catch (error) {
      console.error('TidalIntegration: Error toggling Tidal preference:', error);
      ToastAndroid.show('Error updating Tidal preference', ToastAndroid.SHORT);
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
      return;
    }

    const currentSrc = getCurrentSource(currentTrack);
    const newSource = currentSrc === 'tidal' ? 'saavn' : 'tidal';
    
    // For now, show message about future implementation
    ToastAndroid.show(
      `Current: ${currentSrc.toUpperCase()}. Source switching to ${newSource.toUpperCase()} will be available in future updates.`,
      ToastAndroid.LONG
    );
    
    console.log('TidalIntegration: Source switch requested:', {
      from: currentSrc,
      to: newSource,
      track: currentTrack?.title
    });
  };

  // Get source display name
  const getSourceDisplayName = (track) => {
    const source = getCurrentSource(track);
    switch (source) {
      case 'tidal':
        return 'Tidal';
      case 'saavn':
        return 'Saavn';
      default:
        return 'Unknown';
    }
  };

  // Check if Tidal features should be shown
  const shouldShowTidalFeatures = (isOffline = false) => {
    return tidalEnabled && !isOffline;
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
    console.error(`TidalIntegration: Error in ${context}:`, error);
    
    if (error.message?.includes('network') || error.message?.includes('timeout')) {
      ToastAndroid.show('Tidal service temporarily unavailable', ToastAndroid.SHORT);
    } else {
      ToastAndroid.show('Tidal integration error', ToastAndroid.SHORT);
    }
  };

  const contextValue = {
    // State
    tidalEnabled,
    isLoading,
    currentSource,
    
    // Functions
    toggleTidalIntegration,
    getCurrentSource,
    isTidalTrack,
    switchSource,
    getSourceDisplayName,
    shouldShowTidalFeatures,
    getTidalStatus,
    handleTidalError
  };

  return (
    <TidalIntegrationContext.Provider value={contextValue}>
      {children}
    </TidalIntegrationContext.Provider>
  );
};

// Hook to use Tidal integration
export const useTidalIntegration = () => {
  const context = useContext(TidalIntegrationContext);
  if (!context) {
    throw new Error('useTidalIntegration must be used within a TidalIntegration');
  }
  return context;
};
