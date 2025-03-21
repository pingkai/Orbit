import { useEffect, useState } from "react";
import { DeleteALikedPlaylist, GetLikedPlaylist, SetLikedPlaylist } from "../../LocalStorage/StoreLikedPlaylists";
import { Pressable } from "react-native";
import AntDesign from "react-native-vector-icons/AntDesign";
import { useTheme } from "@react-navigation/native";

export const LikedPlaylist = ({id = "", image = "", name = "", follower = ""}) => {
  const theme = useTheme()
  const [Liked, setLiked] = useState(false);
  
  async function setIsLiked(){
    // Skip if id is not valid
    if (!id) {
      console.log("No valid playlist ID to check liked status");
      return;
    }
    
    try {
      const likedPlaylists = await GetLikedPlaylist()
      if (likedPlaylists?.playlist?.[id]){
        setLiked(true)
      } else {
        setLiked(false)
      }
    } catch (error) {
      console.log("Error checking liked status:", error);
      setLiked(false);
    }
  }
  
  async function storeLikedSongs(){
    // Skip if id is not valid
    if (!id) {
      console.log("No valid playlist ID to like/unlike");
      return;
    }
    
    try {
      const likedPlaylists = await GetLikedPlaylist()
      if (!likedPlaylists?.playlist?.[id]){
        await SetLikedPlaylist(image, name, follower, id)
        setLiked(true)
      } else {
        await DeleteALikedPlaylist(id)
        setLiked(false)
      }
    } catch (error) {
      console.log("Error storing liked status:", error);
    }
  }
  
  useEffect(() => {
    setIsLiked()
  }, [id]); // Include id in the dependency array
  
  return (
    <Pressable onPress={()=>{
      storeLikedSongs()
    }}>
      <AntDesign size={30} name={Liked ? "heart" : "hearto"} color={Liked ? 'rgb(236, 21, 21)' : theme.colors.text}/>
    </Pressable>
  );
};
