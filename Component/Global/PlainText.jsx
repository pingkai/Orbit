import { Dimensions, Text } from "react-native";
import { useTheme } from "@react-navigation/native";
import { useEffect, useState, useContext } from "react";
import { GetFontSizeValue } from "../../LocalStorage/AppSettings";
import { useActiveTrack, usePlaybackState } from "react-native-track-player";

export const PlainText = ({text, style, numberOfLine, songId, isSongTitle}) => {
  const theme = useTheme();
  const width = Dimensions.get('window').width;
  const [Size, setSize] = useState(width * 0.035);
  // Get current playing track info
  const currentPlaying = useActiveTrack();
  const playerState = usePlaybackState();
  
  // Check if this text is for a song title that is currently playing
  const isCurrentSong = isSongTitle && songId && currentPlaying?.id === songId;
  const isPlaying = playerState.state === "playing";
  
  async function getFont(){
    const data = await GetFontSizeValue();
    if (data === "Medium"){
      setSize(width * 0.035);
    } else if (data === "Small"){
      setSize(width * 0.030);
    } else {
      setSize(width * 0.040);
    }
  }

  useEffect(() => {
    getFont();
  }, []);
  
  // Determine text color - green for playing song, default theme color otherwise
  const textColor = (isCurrentSong && isPlaying) ? '#1DB954' : theme.colors.text;
  
  return (
    <Text numberOfLines={numberOfLine ? numberOfLine : 2} style={{
      color: textColor,
      fontSize: Size,
      fontWeight: isCurrentSong ? '700' : 500, // Make current song title bolder
      paddingRight: 10,
      fontFamily: 'roboto',
      ...style,
    }}>{text}</Text>
  );
};
