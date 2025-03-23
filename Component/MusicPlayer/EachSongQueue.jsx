import { Pressable, View } from "react-native";
import FastImage from "react-native-fast-image";
import { PlainText } from "../Global/PlainText";
import { SmallText } from "../Global/SmallText";
import { memo } from "react";
import { SkipToTrack } from "../../MusicPlayerFunctions";
import { useActiveTrack, usePlaybackState } from "react-native-track-player";

export const EachSongQueue = memo(function EachSongQueue({ title, artist, index, artwork, id }) {
  const playerState = usePlaybackState();
  const currentPlaying = useActiveTrack();
  
  // Determine the image source
  const getImageSource = () => {
    // Check if this is the current track and get appropriate animation
    if (id === currentPlaying?.id) {
      return playerState.state === "playing" 
        ? require("../../Images/playing.gif") 
        : require("../../Images/songPaused.gif");
    }
    
    // For other tracks, handle different artwork formats
    if (!artwork) {
      return require("../../Images/default.jpg");
    }
    
    // Handle numeric artwork values (which come from local files)
    if (typeof artwork === 'number') {
      return require("../../Images/default.jpg");
    }
    
    // Handle artwork as object with URI
    if (typeof artwork === 'object' && artwork.uri) {
      return artwork;
    }
    
    // Handle artwork as string
    if (typeof artwork === 'string') {
      return { uri: artwork };
    }
    
    // Default fallback
    return require("../../Images/default.jpg");
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
  
  return (
    <Pressable 
      onPress={() => SkipToTrack(index)} 
      style={{
        flexDirection: 'row',
        gap: 10,
        alignItems: "center",
        maxHeight: 60,
        elevation: 10,
        marginVertical: 5,
        marginBottom: 6,
      }}
    >
      <FastImage 
        source={getImageSource()} 
        style={{
          height: 50,
          width: 50,
          borderRadius: 10,
        }}
      />
      <View>
        <PlainText 
          text={formatText(title)} 
          style={{paddingRight: 15}}
        />
        <SmallText 
          text={formatText(artist)} 
          style={{paddingRight: 15}}
        />
      </View>
    </Pressable>
  );
});
