import { TouchableOpacity } from "react-native";
import AntDesign from "react-native-vector-icons/AntDesign";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useContext, useEffect, useState } from "react";
import Context from "../../Context/Context";
import { getPlaylistData } from "../../Api/Playlist";

export const LikedPlaylist = ({
  id = "",
  image = "",
  name = "",
  follower = "",
}) => {
  const [isLiked, setIsLiked] = useState(false);
  const { updateLikedPlaylist } = useContext(Context);

  useEffect(() => {
    const checkLiked = async () => {
      try {
        if (!id) {
          console.log("No valid playlist ID to check liked status");
          return;
        }
        
        const playlists = await AsyncStorage.getItem("LikedPlaylists");
        if (playlists) {
          const parsedPlaylists = JSON.parse(playlists);
          const isAlreadyLiked = parsedPlaylists.some((e) => e.id === id);
          setIsLiked(isAlreadyLiked);
        }
      } catch (error) {
        console.error("Error checking liked status:", error);
      }
    };
    checkLiked();
  }, [id]);

  async function HandleLike() {
    try {
      if (!id) {
        console.log("No valid playlist ID to like/unlike");
        return;
      }
      
      const playlists = await AsyncStorage.getItem("LikedPlaylists");
      let parsedPlaylists = [];
      
      if (playlists) {
        parsedPlaylists = JSON.parse(playlists);
      }
      
      if (isLiked) {
        // Remove from liked playlists
        const filtered = parsedPlaylists.filter((e) => e.id !== id);
        await AsyncStorage.setItem("LikedPlaylists", JSON.stringify(filtered));
        console.log(`Removed playlist ${id} from liked playlists`);
      } else {
        // Add to liked playlists
        const Data = await getPlaylistData(id);
        
        if (Data?.data) {
          parsedPlaylists.push({
            id,
            image,
            name: name || Data?.data?.name || "Playlist",
            follower: follower || Data?.data?.follower || "",
          });
          
          await AsyncStorage.setItem("LikedPlaylists", JSON.stringify(parsedPlaylists));
          console.log(`Added playlist ${id} to liked playlists`);
        } else {
          console.log(`Failed to get playlist data for ${id}`);
        }
      }
      
      setIsLiked(!isLiked);
      updateLikedPlaylist();
    } catch (error) {
      console.error("Error handling like/unlike:", error);
    }
  }

  return (
    <TouchableOpacity
      onPress={HandleLike}
      style={{
        padding: 8, 
        marginRight: 5,
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <AntDesign
        name={isLiked ? "heart" : "hearto"}
        color={isLiked ? "red" : "white"}
        size={24}
      />
    </TouchableOpacity>
  );
};
