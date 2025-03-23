import { Dimensions, View } from "react-native";
import { Heading } from "../Global/Heading";
import { SmallText } from "../Global/SmallText";
import { Spacer } from "../Global/Spacer";
import { PlayButton } from "./PlayButton";
import LinearGradient from "react-native-linear-gradient";
import { useTheme } from "@react-navigation/native";
import { AddPlaylist, getIndexQuality } from "../../MusicPlayerFunctions";
import { useContext } from "react";
import Context from "../../Context/Context";
import { LikedPlaylist } from "./LikedPlaylist";
import Ionicons from "react-native-vector-icons/Ionicons";
import FormatArtist from "../../Utils/FormatArtists";
import FormatTitleAndArtist from "../../Utils/FormatTitleAndArtist";

// Add a utility function to truncate text
const truncateText = (text, limit = 30) => {
  if (!text) return '';
  return text.length > limit ? text.substring(0, limit) + '...' : text;
};

export const PlaylistDetails = ({name = "", listener = "", notReleased = false, Data = {}, Loading = true, id = "", image = "", follower = ""}) => {
  const {updateTrack} = useContext(Context)
  async function AddToPlayer(){
    if (!Data?.data?.songs || Data.data.songs.length === 0) {
      console.log("No songs available to play");
      return;
    }
    
    const quality = await getIndexQuality()
    const ForMusicPlayer = Data?.data?.songs?.map((e,i)=>{
      if (!e) return null;
      
      return {
        url: e?.downloadUrl?.[quality]?.url || "",
        title: FormatTitleAndArtist(e?.name || ""),
        artist: FormatTitleAndArtist(FormatArtist(e?.artists?.primary || [])),
        artwork: e?.image?.[2]?.url || "",
        image: e?.image?.[2]?.url || "",
        duration: e?.duration || 0,
        id: e?.id || `unknown-${i}`,
        language: e?.language || "",
        artistID: e?.primary_artists_id || "",
      }
    }).filter(item => item !== null);
    
    if (ForMusicPlayer.length === 0) {
      console.log("No valid tracks to play");
      return;
    }
    
    await AddPlaylist(ForMusicPlayer)
    updateTrack()
  }
  
  const theme = useTheme()
  const width = Dimensions.get('window').width
  
  const displayName = truncateText(name, 30);
  
  return (
    <LinearGradient start={{x: 0, y: 0}} end={{x: 0, y: 1}} colors={['rgba(44,44,44,0)', 'rgb(18,18,18)', theme.colors.background]} style={{
      padding:10,
      alignItems:"center",
      justifyContent:"space-between",
      flexDirection:"row",
    }}>
      {!notReleased && <>
        <View style={{
          paddingLeft:5,
          maxWidth:width * 0.8,
        }}>
          <Heading text={displayName}/>
          <View style={{flexDirection:"row",gap:5}}>
            <Ionicons name={"musical-note"} size={16}/>
            <SmallText text={listener || ""}/>
          </View>
          <Spacer/>
          {/* <LikedPlaylist id={id} image={image} name={name} follower={follower}/> */}
        </View>
        <LikedPlaylist id={id} image={image} name={name || ""} follower={follower}/>
        <PlayButton Loading={Loading} onPress={()=>{
          if (!Loading){
            AddToPlayer()
          }
        }}/>
      </>}
    </LinearGradient>
  );
};
