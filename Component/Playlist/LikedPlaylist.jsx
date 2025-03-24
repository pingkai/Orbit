import { TouchableOpacity, StyleSheet, ToastAndroid } from "react-native";
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
  size = "normal"
}) => {
  const [isLiked, setIsLiked] = useState(false);
  const { updateLikedPlaylist } = useContext(Context);
  
  // Increase icon size for better visibility
  const iconSize = size === "large" ? 36 : size === "small" ? 34 : 30;

  useEffect(() => {
    const checkLiked = async () => {
      try {
        if (!id) {
          console.log("No valid playlist ID to check liked status");
          return;
        }
        
        const playlists = await AsyncStorage.getItem("LikedPlaylists");
        if (playlists) {
          try {
            const parsedPlaylists = JSON.parse(playlists);
            if (Array.isArray(parsedPlaylists)) {
              const isAlreadyLiked = parsedPlaylists.some((e) => e.id === id);
              setIsLiked(isAlreadyLiked);
            } else {
              // If not an array, reset the storage to an empty array
              await AsyncStorage.setItem("LikedPlaylists", JSON.stringify([]));
              setIsLiked(false);
            }
          } catch (parseError) {
            console.error("Error parsing liked playlists:", parseError);
            // If there's a parse error, reset the storage
            await AsyncStorage.setItem("LikedPlaylists", JSON.stringify([]));
            setIsLiked(false);
          }
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
      
      // Get existing liked playlists with proper validation
      let parsedPlaylists = [];
      try {
        const playlists = await AsyncStorage.getItem("LikedPlaylists");
        if (playlists) {
          const parsed = JSON.parse(playlists);
          // Ensure it's an array
          if (Array.isArray(parsed)) {
            parsedPlaylists = parsed;
          } else {
            console.log("Stored playlists is not an array, resetting to empty array");
          }
        }
      } catch (parseError) {
        console.log("Error parsing playlists, resetting to empty array:", parseError);
      }
      
      if (isLiked) {
        // Remove from liked playlists
        const filtered = parsedPlaylists.filter((e) => e.id !== id);
        await AsyncStorage.setItem("LikedPlaylists", JSON.stringify(filtered));
        console.log(`Removed playlist ${id} from liked playlists`);
        ToastAndroid.show("Removed from Likes", ToastAndroid.SHORT);
      } else {
        // Add to liked playlists
        try {
          const Data = await getPlaylistData(id);
          
          if (Data?.data) {
            // Create new playlist object
            const newPlaylist = {
              id,
              image,
              name: name || Data?.data?.name || "Playlist",
              follower: follower || Data?.data?.follower || "",
            };
            
            // Add to array and save
            parsedPlaylists.push(newPlaylist);
            await AsyncStorage.setItem("LikedPlaylists", JSON.stringify(parsedPlaylists));
            console.log(`Added playlist ${id} to liked playlists`);
            ToastAndroid.show("Added to Likes", ToastAndroid.SHORT);
          } else {
            console.log(`Failed to get playlist data for ${id}`);
            ToastAndroid.show("Failed to add to Likes", ToastAndroid.SHORT);
          }
        } catch (error) {
          console.error("Error liking playlist:", error);
          ToastAndroid.show("Failed to add to Likes", ToastAndroid.SHORT);
        }
      }
      
      setIsLiked(!isLiked);
      updateLikedPlaylist();
    } catch (error) {
      console.error("Error handling like/unlike:", error);
      ToastAndroid.show("Error updating likes", ToastAndroid.SHORT);
    }
  }

  return (
    <TouchableOpacity
      onPress={HandleLike}
      style={[
        styles.container, 
        size === "small" ? styles.smallContainer : null
      ]}
      activeOpacity={0.7}
    >
      <AntDesign
        name={isLiked ? "heart" : "hearto"}
        color={isLiked ? 'rgb(227,97,97)' : 'white'}
        size={iconSize}
      />
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 8,
    alignItems: "center",
    justifyContent: "center",
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  smallContainer: {
    padding: 0,
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: 'transparent',
    marginLeft: 15,
    marginRight: 5,
  }
});
