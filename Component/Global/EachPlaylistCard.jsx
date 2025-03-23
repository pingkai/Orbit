import { Pressable, View } from "react-native";
import { PlainText } from "./PlainText";
import { SmallText } from "./SmallText";
import { SpaceBetween } from "../../Layout/SpaceBetween";
import FontAwesome5 from "react-native-vector-icons/FontAwesome5";
import FastImage from "react-native-fast-image";
import { memo } from "react";
import { useNavigation, useTheme } from "@react-navigation/native";

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
  
  const handleNavigation = () => {
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
  };
  
  return (
    <Pressable onPress={handleNavigation} style={{
      width:180,
      height:240,
      ...MainContainerStyle,
    }}>
      <FastImage source={{
        uri:image,
      }} style={{
        height:180,
        width:"100%",
        borderRadius:10,
        ...ImageStyle,
      }}/>
      <SpaceBetween style={{
        height:55,
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
