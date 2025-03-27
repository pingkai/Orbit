import Animated, { interpolate, useAnimatedStyle, useScrollViewOffset } from "react-native-reanimated";
import { Dimensions, View, Pressable, TouchableOpacity, ToastAndroid } from "react-native";
import FastImage from "react-native-fast-image";
import { useMemo, useState, useEffect, useContext } from "react";
import AntDesign from "react-native-vector-icons/AntDesign";
import { useNavigation } from "@react-navigation/native";
import Ionicons from "react-native-vector-icons/Ionicons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getPlaylistData } from "../../Api/Playlist";
import { SetLikedPlaylist, DeleteALikedPlaylist } from "../../LocalStorage/StoreLikedPlaylists";
import Context from "../../Context/Context";

// Helper to validate image URL or provide default
const getValidImageUrl = (url) => {
  if (!url || url === 'null' || url === 'undefined' || url.trim() === '') {
    // Return a default image if URL is null/undefined/empty
    return require('../../Images/default.jpg');
  }
  return { uri: url };
};

export const PlaylistTopHeader = ({AnimatedRef, url, playlistId, name, follower}) => {
  const { width, height } = Dimensions.get('window');
  const [liked, setLiked] = useState(false);
  const navigation = useNavigation();
  const { updateLikedPlaylist } = useContext(Context);
  
  // Calculate responsive dimensions based on screen size
  const responsiveStyles = useMemo(() => {
    // Adjust image size based on screen width
    const smallImageSize = Math.min(width * 0.5, 200);
    
    return {
      containerHeight: smallImageSize * 1.4,
      imageSize: smallImageSize,
      imageRadius: 12,
    };
  }, [width]);
  
  // Check if playlist is already liked
  useEffect(() => {
    const checkLiked = async () => {
      try {
        if (!playlistId) {
          console.log("No valid playlist ID to check liked status");
          return;
        }
        
        const playlists = await AsyncStorage.getItem("LikedPlaylists");
        if (playlists) {
          try {
            const parsedPlaylists = JSON.parse(playlists);
            if (parsedPlaylists && parsedPlaylists.playlist) {
              const isAlreadyLiked = parsedPlaylists.playlist[playlistId] !== undefined;
              setLiked(isAlreadyLiked);
            } else {
              // If wrong format, initialize correctly
              const initialData = {
                playlist: {},
                count: 0
              };
              await AsyncStorage.setItem("LikedPlaylists", JSON.stringify(initialData));
              setLiked(false);
            }
          } catch (parseError) {
            console.error("Error parsing liked playlists:", parseError);
            // If there's a parse error, reset the storage with proper structure
            const initialData = {
              playlist: {},
              count: 0
            };
            await AsyncStorage.setItem("LikedPlaylists", JSON.stringify(initialData));
            setLiked(false);
          }
        }
      } catch (error) {
        console.error("Error checking liked status:", error);
      }
    };
    checkLiked();
  }, [playlistId]);
  
  const ScrollOffset = useScrollViewOffset(AnimatedRef);
  
  // Animation style for the main image
  const AnimatedImageStyle = useAnimatedStyle(() => {
    const imageSize = responsiveStyles.imageSize;
    
    return { 
      transform: [
        {
          translateY: interpolate(
            ScrollOffset.value,
            [-imageSize, 0, imageSize],
            [-imageSize/2, 0, imageSize*1.2]
          ),
        },
        {
          scale: interpolate(
            ScrollOffset.value,
            [imageSize, 0, imageSize],
            [0, 1, 0]
          ),
        },
      ]
    };
  });
  
  // Animation style for the background image
  const AnimatedImageStyle2 = useAnimatedStyle(() => {
    const imageSize = responsiveStyles.imageSize;
    
    return { 
      transform: [
        {
          translateY: interpolate(
            ScrollOffset.value,
            [-imageSize, 0, imageSize],
            [-imageSize/2, 0, imageSize*1.2]
          ),
        },
      ]
    };
  });

  const toggleLike = async () => {
    try {
      if (!playlistId) {
        console.log("No valid playlist ID to like/unlike");
        return;
      }
      
      if (liked) {
        // Remove from liked playlists
        await DeleteALikedPlaylist(playlistId);
        console.log(`Removed playlist ${playlistId} from liked playlists`);
        ToastAndroid.show("Removed from Favorites", ToastAndroid.SHORT);
        // Update state first to give immediate feedback
        setLiked(false);
        // Then trigger the playlist refresh
        if (updateLikedPlaylist) {
          setTimeout(() => {
            updateLikedPlaylist();
          }, 100);
        }
      } else {
        // Add to liked playlists
        try {
          // If we don't have complete data, fetch it
          let playlistData = null;
          if (!name || !url) {
            playlistData = await getPlaylistData(playlistId);
          }
          
          const displayImage = url || (playlistData?.data?.image || "");
          const displayName = name || (playlistData?.data?.name || "Playlist");
          const displayFollower = follower || (playlistData?.data?.follower || "");
          
          // Add to liked playlists
          await SetLikedPlaylist(
            displayImage,
            displayName,
            displayFollower,
            playlistId
          );
          
          console.log(`Added playlist ${playlistId} to liked playlists`);
          ToastAndroid.show("Added to Favorites", ToastAndroid.SHORT);
          // Update state first to give immediate feedback
          setLiked(true);
          // Then trigger the playlist refresh
          if (updateLikedPlaylist) {
            setTimeout(() => {
              updateLikedPlaylist();
            }, 100);
          }
        } catch (error) {
          console.error("Error liking playlist:", error);
          ToastAndroid.show("Failed to add to Favorites", ToastAndroid.SHORT);
        }
      }
    } catch (error) {
      console.error("Error handling like/unlike:", error);
      ToastAndroid.show("Error updating favorites", ToastAndroid.SHORT);
    }
  };

  const handleBack = () => {
    navigation.goBack();
  };
  
  // Check if this is a playlist (not an album)
  const isPlaylist = playlistId && !playlistId.startsWith('album_');
  
  return (
    <View style={{
      alignItems: "center",
      justifyContent: "center",
      height: responsiveStyles.containerHeight,
      backgroundColor: "#101010",
      position: "relative",
    }}>
      {/* Back Button - positioned at the top left of the component */}
      <TouchableOpacity 
        onPress={handleBack}
        style={{
          position: "absolute",
          top: 16,
          left: 16,
          zIndex: 10,
          backgroundColor: "rgba(0,0,0,0.5)",
          borderRadius: 24,
          padding: 8,
        }}
      >
        <Ionicons 
          name="arrow-back" 
          size={28} 
          color="#ffffff"
        />
      </TouchableOpacity>

      {/* Like Button - positioned at the top right of the component - only shown for playlists */}
      {isPlaylist && (
        <TouchableOpacity 
          onPress={toggleLike}
          style={{
            position: "absolute",
            top: 16,
            right: 16,
            zIndex: 10,
            backgroundColor: "rgba(0,0,0,0.5)",
            borderRadius: 24,
            padding: 8,
          }}
        >
          <AntDesign 
            name={liked ? "heart" : "hearto"} 
            size={30} 
            color={liked ? 'rgb(230, 28, 28)' : "#ffffff"}
          />
        </TouchableOpacity>
      )}
      
      <View style={{
        elevation: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
        position: "relative",
      }}>
        <Animated.View style={[{
          height: responsiveStyles.imageSize,
          width: responsiveStyles.imageSize,
          borderRadius: responsiveStyles.imageRadius,
          overflow: 'hidden',
        }, AnimatedImageStyle]}>
          <FastImage
            source={getValidImageUrl(url)}
            style={{
              height: '100%',
              width: '100%',
            }}
            resizeMode={FastImage.resizeMode.cover}
          />
        </Animated.View>
      </View>
      
      <Animated.View 
        style={[{
          height: responsiveStyles.imageSize * 2,
          width: "100%",
          position: "absolute",
          zIndex: -1,
          overflow: 'hidden',
        }, AnimatedImageStyle2]}
      >
        <FastImage
          source={getValidImageUrl(url)}
          style={{
            height: '100%',
            width: '100%',
          }}
          blurRadius={20}
          resizeMode={FastImage.resizeMode.cover}
        />
      </Animated.View>
      
      <View style={{
        height: responsiveStyles.imageSize * 2,
        width: "100%",
        position: "absolute",
        zIndex: -1,
        backgroundColor: "rgba(16,16,16,0.75)",
      }}/>
    </View>
  );
};
