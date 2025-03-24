import { Dimensions, View, StyleSheet } from "react-native";
import { Heading } from "../Global/Heading";
import Ionicons from "react-native-vector-icons/Ionicons";
import { SmallText } from "../Global/SmallText";
import { Spacer } from "../Global/Spacer";
import LinearGradient from "react-native-linear-gradient";
import { useTheme } from "@react-navigation/native";
import { AddPlaylist, getIndexQuality } from "../../MusicPlayerFunctions";
import { PlayButton } from "../Playlist/PlayButton";
import { useContext, useState } from "react";
import Context from "../../Context/Context";
import FormatArtist from "../../Utils/FormatArtists";
import FormatTitleAndArtist from "../../Utils/FormatTitleAndArtist";

// Reduce truncate limit further to avoid layout issues
const truncateText = (text, limit = 20) => {
  if (!text) return '';
  return text.length > limit ? text.substring(0, limit) + '...' : text;
};

export const AlbumDetails = ({name = "", releaseData = "", liked = false, Data = {}}) => {
  const {updateTrack} = useContext(Context);
  const [isPlaying, setIsPlaying] = useState(false);
  const theme = useTheme();
  const width = Dimensions.get('window').width;
  const displayName = truncateText(name, 18); // Reduce to 18 characters
  
  async function AddToPlayer(){
    try {
      setIsPlaying(true);
      const quality = await getIndexQuality();
      const ForMusicPlayer = Data?.data?.songs?.map((e,i)=>{
        return {
          url:e?.downloadUrl[quality].url,
          title:FormatTitleAndArtist(e?.name),
          artist:FormatTitleAndArtist(FormatArtist(e?.artists?.primary)),
          artwork:e?.image[2]?.url,
          image:e?.image[2]?.url,
          duration:e?.duration,
          id:e?.id,
          language:e?.language,
          artistID:e?.primary_artists_id,
        }
      });
      await AddPlaylist(ForMusicPlayer);
      updateTrack();
    } catch (error) {
      console.error("Error adding album to player:", error);
    } finally {
      setIsPlaying(false);
    }
  }

  return (
    <LinearGradient 
      start={{x: 0, y: 0}} 
      end={{x: 0, y: 1}} 
      colors={['rgba(44,44,44,0)', 'rgb(23,23,23)', theme.colors.background]} 
      style={styles.container}
    >
      <View style={styles.infoContainer}>
        <Heading text={displayName} style={styles.heading}/>
        <View style={styles.releaseContainer}>
          <Ionicons name={"musical-note"} size={16} color={theme.colors.text}/>
          <SmallText text={"Released in " + releaseData }/>
        </View>
      </View>
      
      <PlayButton 
        Loading={isPlaying} 
        size="large"
        onPress={AddToPlayer}
      />
    </LinearGradient>
  );
};

// Use StyleSheet for better performance
const styles = StyleSheet.create({
  container: {
    padding: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  infoContainer: {
    paddingLeft: 5,
    maxWidth: Dimensions.get('window').width * 0.65,
  },
  heading: {
    fontSize: 24,
    marginBottom: 5,
  },
  releaseContainer: {
    flexDirection: "row", 
    alignItems: "center", 
    gap: 5
  }
});
