import { Pressable, View, Dimensions } from "react-native";
import { PlainText } from "./PlainText";
import { SmallText } from "./SmallText";
import { SpaceBetween } from "../../Layout/SpaceBetween";
import FontAwesome5 from "react-native-vector-icons/FontAwesome5";
import FastImage from "react-native-fast-image";
import { memo, useMemo } from "react";
import { useNavigation, useTheme } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";

// AsyncStorage keys
const CURRENT_ALBUM_ID_KEY = "orbit_current_album_id";
const CURRENT_ALBUM_DATA_KEY = "orbit_current_album_data";
const CURRENT_PLAYLIST_ID_KEY = "orbit_current_playlist_id";
const CURRENT_PLAYLIST_DATA_KEY = "orbit_current_playlist_data";

// Add a utility function to truncate text
const truncateText = (text, limit = 30) => {
  if (!text) return '';
  return text.length > limit ? text.substring(0, limit) + '...' : text;
};

export const EachPlaylistCard = memo(function EachPlaylistCard ({
  image, 
  name, 
  follower, 
  id, 
  MainContainerStyle, 
  ImageStyle,
  source,
  searchText,
  language
}){
  const theme = useTheme()
  const navigation = useNavigation()
  const { width, height } = Dimensions.get('window');
  
  // Calculate responsive dimensions based on screen size
  const responsiveStyles = useMemo(() => {
    // Base width is ~30% of screen width with some minimum size
    const cardWidth = Math.max(150, width * 0.3);
    // Height maintains aspect ratio plus text area
    const cardHeight = cardWidth * 1.35;
    // Image height is square
    const imageHeight = cardWidth;
    
    return {
      container: {
        width: cardWidth,
        height: cardHeight,
      },
      image: {
        height: imageHeight,
        width: "100%",
      },
      textContainer: {
        height: cardHeight - imageHeight,
      }
    };
  }, [width]);
  
  const handleNavigation = async () => {
    try {
      // Clear any existing album and playlist data to prevent navigation conflicts
      // Await all operations to ensure they complete before navigation
      await Promise.all([
        AsyncStorage.removeItem(CURRENT_ALBUM_ID_KEY),
        AsyncStorage.removeItem(CURRENT_ALBUM_DATA_KEY),
        AsyncStorage.removeItem(CURRENT_PLAYLIST_ID_KEY),
        AsyncStorage.removeItem(CURRENT_PLAYLIST_DATA_KEY)
      ]);
      
      const params = {
        id,
        image,
        name,
        follower,
        timestamp: Date.now() // Add timestamp to ensure fresh navigation and prevent caching issues
      };
      
      if (source) {
        params.source = source;
        
        if (source === 'ShowPlaylistofType' && searchText) {
          params.searchText = searchText;
        } else if (source === 'LanguageDetail' && language) {
          params.language = language;
        }
      }
      
      console.log(`Navigating to Playlist with params:`, JSON.stringify(params));
      navigation.navigate("Playlist", params);
    } catch (error) {
      console.error('Error navigating to Playlist:', error);
      // Fallback navigation to prevent dead-end
      navigation.navigate("Home", { screen: "HomePage" });
    }
  };
  
  return (
    <Pressable onPress={handleNavigation} style={{
      ...responsiveStyles.container,
      ...MainContainerStyle,
    }}>
      <FastImage source={{
        uri:image,
      }} style={{
        ...responsiveStyles.image,
        borderRadius:10,
        ...ImageStyle,
      }}/>
      <SpaceBetween style={{
        ...responsiveStyles.textContainer,
      }}>
        <View style={{
          width:"85%",
        }}>
          <PlainText text={truncateText(name, 30)}/>
          <SmallText text={truncateText(follower, 30)}/>
        </View>
        <FontAwesome5 name={"play"} size={15} color={theme.colors.text}/>
      </SpaceBetween>
    </Pressable>
  );
})
