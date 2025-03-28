import { Pressable, View, Dimensions, Text } from "react-native";
import FastImage from "react-native-fast-image";
import { PlainText } from "../Global/PlainText";
import { SmallText } from "../Global/SmallText";
import { memo } from "react";
import { useActiveTrack, usePlaybackState } from "react-native-track-player";
import FontAwesome6 from "react-native-vector-icons/FontAwesome6";

// Get screen dimensions for responsive layout
const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const EachSongQueue = memo(function EachSongQueue({ title, artist, index, artwork, id, drag, isActive, onPress }) {
  const playerState = usePlaybackState();
  const currentPlaying = useActiveTrack();
  
  // Check if this is the currently playing track
  const isCurrentTrack = id === currentPlaying?.id;
  
  // Determine the image source
  const getImageSource = () => {
    try {
      // Check if this is the current track and get appropriate animation
      if (isCurrentTrack) {
        return playerState.state === "playing" 
          ? require("../../Images/playing.gif") 
          : require("../../Images/songPaused.gif");
      }
      
      // For other tracks, handle different artwork formats
      if (!artwork) {
        // Use static image instead of animated GIF
        return getDefaultImage();
      }
      
      // Handle numeric artwork values (which come from local files)
      if (typeof artwork === 'number') {
        return artwork; // If it's a require() result, return it directly
      }
      
      // Handle artwork as object with URI
      if (typeof artwork === 'object' && artwork.uri) {
        // Ensure URI is not null or undefined
        if (!artwork.uri) {
          // Use static image instead of animated GIF
          return getDefaultImage();
        }
        return artwork;
      }
      
      // Handle local file paths for downloaded songs
      if (typeof artwork === 'string') {
        // Check if it's a local file path that needs file:// prefix
        if (artwork.startsWith('/') && !artwork.startsWith('file://')) {
          return { uri: `file://${artwork}` };
        }
        
        // Handle file:// paths
        if (artwork.startsWith('file://')) {
          return { uri: artwork };
        }
        
        // Handle remote URLs
        return { uri: artwork };
      }
      
      // Default fallback - use static image instead of animated GIF
      return getDefaultImage();
    } catch (error) {
      console.log('Error getting image source:', error);
      return getDefaultImage(); // Static image fallback
    }
  };
  
  // Function to get a default image for songs without artwork
  const getDefaultImage = () => {
    // Use static image instead of animated GIFs in queue view
    return require('../../Images/Music.jpeg');
  };
  
  // Handle special characters in text
  const formatText = (text) => {
    if (!text) return 'Unknown';
    return text.toString()
      .replaceAll("&quot;", "\"")
      .replaceAll("&amp;", "and")
      .replaceAll("&#039;", "'")
      .replaceAll("&trade;", "™");
  };
  
  // Truncate text to 20 characters
  const truncateText = (text, limit = 20) => {
    if (!text) return 'Unknown';
    return text.length > limit ? text.substring(0, limit) + '...' : text;
  };
  
  // Calculate max text width based on screen size (accounting for drag handle but no queue number)
  const maxTextWidth = SCREEN_WIDTH - 110; // 48px for image + 12px gap + drag icon + padding
  
  // Handle long press with immediate feedback
  const handleLongPress = () => {
    try {
      // Only call drag if it exists and is a function
      if (typeof drag === 'function') {
        // Provide haptic feedback if available
        if (global.HapticFeedback) {
          global.HapticFeedback.impactMedium();
        }
        console.log('Long press activated - starting drag');
        drag();
      }
    } catch (error) {
      console.error('Error in long press handler:', error);
    }
  };
  
  // Only add drag functionality if drag function is provided
  const dragHandlers = typeof drag === 'function' ? {
    onLongPress: handleLongPress,
    delayLongPress: 100
  } : {};
  
  // Handle track selection with safer approach
  const handlePress = () => {
    try {
      if (typeof onPress === 'function') {
        console.log(`Queue item pressed: ${title} (${id})`);
        onPress();
      } else {
        console.warn('Song press handler not available');
      }
    } catch (error) {
      console.error('Error in song press handler:', error);
    }
  };
  
  return (
    <Pressable 
      onPress={handlePress}
      {...dragHandlers}
      android_ripple={{ color: 'rgba(255, 255, 255, 0.05)' }} // Very subtle ripple effect for Android
      style={{
        flexDirection: 'row',
        alignItems: "center",
        paddingHorizontal: 12,
        paddingVertical: 8,
        marginVertical: 2,
        width: SCREEN_WIDTH,
        backgroundColor: isActive 
          ? 'rgba(40, 40, 40, 0.7)' // Dark background when dragging
          : isCurrentTrack 
            ? 'rgba(29, 185, 84, 0.08)' 
            : 'transparent',
        borderRadius: 6,
        // No border styling at all
        ...(isActive && {
          // Only keep the shadow effects
          elevation: 5,
          shadowColor: "#000",
          shadowOffset: {
            width: 0,
            height: 3,
          },
          shadowOpacity: 0.27,
          shadowRadius: 4.65,
        }),
      }}
    >
      {/* Song image - no border styling */}
      <FastImage 
        source={getImageSource()} 
        style={{
          height: 48,
          width: 48,
          borderRadius: 8,
          marginRight: 12,
          opacity: 1,
          // No border styling
        }}
      />
      
      {/* Song info */}
      <View style={{ 
        flex: 1,
        width: maxTextWidth,
        justifyContent: 'center',
      }}>
        <PlainText 
          text={truncateText(formatText(title), 20)} 
          style={{ 
            width: maxTextWidth,
            fontWeight: isCurrentTrack ? '700' : '600', // Bolder text for all song titles
            color: isCurrentTrack ? '#1DB954' : '#FFFFFF', // Only title is colored when active
            fontSize: 15,
            lineHeight: 20,
          }}
          numberOfLine={1}
        />
        <SmallText 
          text={truncateText(formatText(artist), 20)} 
          style={{ 
            width: maxTextWidth,
            opacity: 0.8,
            marginTop: 2,
            fontWeight: '500', // Semi-bold for artist names
            color: '#FFFFFF', // Always white for artist name
          }}
          maxLine={1}
        />
      </View>
      
      {/* Drag handle - only show if drag function is available */}
      {typeof drag === 'function' && (
        <Pressable
          onLongPress={handleLongPress}
          delayLongPress={80}
          style={{
            width: 44,
            height: 48,
            alignItems: 'center',
            justifyContent: 'center',
            padding: 10,
            backgroundColor: isActive 
              ? 'rgba(40, 40, 40, 0.5)' // Dark handle when active 
              : 'rgba(40, 40, 40, 0.3)',
            borderRadius: 4,
            marginLeft: 4,
          }}
        >
          <FontAwesome6 
            name="grip-lines" 
            size={18}
            color="#FFFFFF" // Always white for icon
          />
        </Pressable>
      )}
    </Pressable>
  );
});
