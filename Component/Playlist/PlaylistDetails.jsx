import { Dimensions, View } from "react-native";
import { Heading } from "../Global/Heading";
import { SmallText } from "../Global/SmallText";
import { Spacer } from "../Global/Spacer";
import { PlayButton } from "./PlayButton";
import LinearGradient from "react-native-linear-gradient";
import { useTheme } from "@react-navigation/native";
import { AddPlaylist, getIndexQuality } from "../../MusicPlayerFunctions";
import { useContext, useState, useEffect } from "react";
import Context from "../../Context/Context";
import { LikedPlaylist } from "./LikedPlaylist";
import Ionicons from "react-native-vector-icons/Ionicons";
import FormatArtist from "../../Utils/FormatArtists";
import FormatTitleAndArtist from "../../Utils/FormatTitleAndArtist";

// Reduce truncate limit to 22 characters to avoid breaking
const truncateText = (text, limit = 22) => {
  if (!text) return '';
  return text.length > limit ? text.substring(0, limit) + '...' : text;
};

// Helper to format artist data properly, avoiding [object Object] display
const formatArtistData = (artistData) => {
  // If it's already a string, return it
  if (typeof artistData === 'string') return artistData;
  
  // If it's an array, use the FormatArtist function
  if (Array.isArray(artistData)) return FormatArtist(artistData);
  
  // If it's an object with a primary property that's an array
  if (artistData && artistData.primary && Array.isArray(artistData.primary)) {
    return FormatArtist(artistData.primary);
  }
  
  // If it's an object with a name property
  if (artistData && artistData.name) return artistData.name;
  
  // Default fallback
  return "Unknown Artist";
};

export const PlaylistDetails = ({name = "", listener = "", notReleased = false, Data = {}, Loading = true, id = "", image = "", follower = ""}) => {
  const {updateTrack} = useContext(Context)
  const [isPlaying, setIsPlaying] = useState(false);
  
  // Reset isPlaying when Loading changes to false
  useEffect(() => {
    if (!Loading) {
      setIsPlaying(false);
    }
  }, [Loading]);
  
  async function AddToPlayer(){
    if (!Data?.data?.songs || Data.data.songs.length === 0) {
      console.log("No songs available to play");
      return;
    }
    
    try {
      setIsPlaying(true);
      const quality = await getIndexQuality()
      const ForMusicPlayer = Data?.data?.songs?.map((e,i)=>{
        if (!e) return null;
        
        // Process artist data to avoid [object Object] display
        const artistData = e?.artists || e?.primary_artists;
        const formattedArtist = formatArtistData(artistData);
        
        return {
          url: e?.downloadUrl?.[quality]?.url || e?.download_url?.[quality]?.url || "",
          title: FormatTitleAndArtist(e?.name || e?.song || ""),
          artist: FormatTitleAndArtist(formattedArtist),
          artwork: e?.image?.[2]?.url || e?.images?.[2]?.url || "",
          image: e?.image?.[2]?.url || e?.images?.[2]?.url || "",
          duration: e?.duration || 0,
          id: e?.id || `unknown-${i}`,
          language: e?.language || "",
          artistID: e?.primary_artists_id || e?.artist_id || "",
        }
      }).filter(item => item !== null && item.url);
      
      if (ForMusicPlayer.length === 0) {
        console.log("No valid tracks to play");
        setIsPlaying(false);
        return;
      }
      
      await AddPlaylist(ForMusicPlayer)
      updateTrack()
    } catch (error) {
      console.error("Error adding songs to player:", error);
    } finally {
      setIsPlaying(false);
    }
  }
  
  const theme = useTheme()
  const width = Dimensions.get('window').width
  
  const displayName = truncateText(name, 22);
  
  return (
    <LinearGradient start={{x: 0, y: 0}} end={{x: 0, y: 1}} colors={['rgba(44,44,44,0)', 'rgb(18,18,18)', theme.colors.background]} style={{
      padding: 10,
      alignItems: "center",
      justifyContent: "space-between",
      flexDirection: "row",
    }}>
      {!notReleased && <>
        <View style={{
          flex: 1,
          paddingLeft: 5,
          maxWidth: width * 0.65, // Reduce the width to ensure space for buttons
        }}>
          <Heading text={displayName}/>
          <View style={{flexDirection: "row", gap: 5}}>
            <Ionicons name={"musical-note"} size={16}/>
            <SmallText text={follower || listener || ""}/>
          </View>
          <Spacer/>
        </View>
        <View style={{
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "flex-end",
          minWidth: 90, // Ensure consistent width for the buttons area
        }}>
          <LikedPlaylist id={id} image={image} name={name || ""} follower={follower}/>
          <PlayButton 
            Loading={isPlaying} 
            onPress={() => {
              if (!Loading && !isPlaying) {
                AddToPlayer();
              }
            }}
          />
        </View>
      </>}
    </LinearGradient>
  );
};
