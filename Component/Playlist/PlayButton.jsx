import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import Entypo from "react-native-vector-icons/Entypo";
import { useTheme } from "@react-navigation/native";
import { useContext, useEffect, useState } from "react";
import TrackPlayer, { State } from "react-native-track-player";
import Context from "../../Context/Context";

export const PlayButton = ({onPress, Loading, size = "normal", isPlaying: externalIsPlaying = null, albumId = null}) => {
  const theme = useTheme();
  const [isPlaying, setIsPlaying] = useState(false);
  const { currentPlaying } = useContext(Context);
  
  // Effect to check if currently playing
  useEffect(() => {
    // If external isPlaying prop is provided, use that
    if (externalIsPlaying !== null) {
      setIsPlaying(externalIsPlaying);
      return;
    }
    
    // Check if this album's songs are playing
    const checkPlaybackState = async () => {
      try {
        // First check if anything is playing
        const state = await TrackPlayer.getState();
        
        // If we have an albumId, check if the currently playing song is from this album
        if (albumId && currentPlaying) {
          // Album-specific logic: only show pause if the current track is from this album
          const isFromThisAlbum = currentPlaying.albumId === albumId;
          setIsPlaying(state === State.Playing && isFromThisAlbum);
        } else {
          // Legacy behavior for non-album contexts
          setIsPlaying(state === State.Playing);
        }
      } catch (err) {
        console.error('Error checking playback state:', err);
        setIsPlaying(false);
      }
    };
    
    checkPlaybackState();
    
    // Set up event listener for track player
    const playerStateListener = TrackPlayer.addEventListener(
      'playback-state',
      (event) => {
        // When state changes, recheck if the current song is from this album
        checkPlaybackState();
      }
    );
    
    return () => playerStateListener.remove();
  }, [externalIsPlaying, currentPlaying, albumId]);
  
  // Determine size based on prop - reduce large size to be less dominant
  const buttonSize = size === "large" ? 56 : size === "small" ? 40 : 50;
  const iconSize = size === "large" ? 32 : size === "small" ? 20 : 25;
  const buttonPadding = size === "large" ? 12 : size === "small" ? 10 : 12;
  
  return (
    <View style={[
      styles.buttonWrapper, 
      { 
        width: buttonSize, 
        height: buttonSize,
        marginRight: 10,
        marginLeft: 5,
        // Enhanced glow effect when large
        elevation: size === "large" ? 10 : 8,
        shadowRadius: size === "large" ? 5 : 4,
      }
    ]}>
      <Pressable 
        onPress={onPress} 
        style={({pressed}) => [
          styles.button,
          {
            backgroundColor: "#4CAF50", // Bright green color like in the screenshot
            width: buttonSize,
            height: buttonSize,
            opacity: pressed ? 0.8 : 1, // Feedback when pressed
          }
        ]}
        android_ripple={{color: 'rgba(255,255,255,0.3)', borderless: true}}
      >
        {!Loading && (
          <Entypo 
            name={isPlaying ? "controller-paus" : "controller-play"} 
            color="#000000" // Black icon for better contrast on green
            size={iconSize} 
            style={[
              styles.icon,
              isPlaying ? {} : { marginLeft: 4 } // Only adjust position for play icon
            ]}
          />
        )}
        {Loading && (
          <ActivityIndicator 
            color="#000000" 
            size={size === "large" ? "large" : "small"}
          />
        )}
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  buttonWrapper: {
    // Add a wrapper to handle shadows and effects
    borderRadius: 1000,
    elevation: 8,
    shadowColor: '#4CAF50', // Match button color for glow effect
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  button: {
    borderRadius: 1000, // Very high value for perfect circle
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  icon: {
    // Removed default marginLeft - we'll handle it conditionally
  }
});
