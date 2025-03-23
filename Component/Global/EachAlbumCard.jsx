import { ImageBackground, Pressable, View, Dimensions } from "react-native";
import { PlainText } from "./PlainText";
import { SmallText } from "./SmallText";
import { memo, useMemo } from "react";
import { useNavigation } from "@react-navigation/native";
import LinearGradient from "react-native-linear-gradient";
import AsyncStorage from "@react-native-async-storage/async-storage";


export const EachAlbumCard = memo(function EachAlbumCard({image, name, artists, id, mainContainerStyle, Search, source, searchText, language}) {
  const navigation = useNavigation()
  let artistsNames = ""
  const { width, height } = Dimensions.get('window');
  
  // Calculate responsive dimensions based on screen size
  const responsiveStyles = useMemo(() => {
    // Base width is ~40% of screen width with some minimum size
    const cardWidth = Math.max(170, width * 0.4);
    // Height maintains aspect ratio (roughly square)
    const cardHeight = cardWidth;
    
    return {
      container: {
        width: cardWidth,
        height: cardHeight,
        borderRadius: 10,
        marginRight: 10,
      },
      image: {
        height: "100%",
        width: "100%",
      }
    };
  }, [width]);
  
  // Improved truncation function that works for any text
  function truncateText(text, limit = 30) {
    if (!text) return "";
    return text.length > limit ? text.slice(0, limit) + "..." : text;
  }
  
  if (!Search){
    if (Array.isArray(artists) && artists.length > 0) {
      if (artists.length > 3){
        for (let i = 0; i < 3; i++){
          if ( i === 2){
            artistsNames += artists[i].name
          } else {
            const additionName = artists[i].name + ", "
            artistsNames += additionName
          }
        }
        artistsNames += " ..."
      } else {
        artists.map((e,i)=>{
          if (i === artists.length - 1){
            artistsNames += e.name
          } else {
            const additionName = e.name + ", "
            artistsNames += additionName
          }
        })
      }
    } else if (typeof artists === 'string') {
      // Handle when artists is a string instead of an array
      artistsNames = artists;
    }
    
    // Truncate the combined artists string if it's too long
    artistsNames = truncateText(artistsNames);
  }
  
  return (
    <Pressable onPress={async () => {
      try {
        // Create params object with source tracking
        const params = { 
          id,
          timestamp: Date.now() // Add timestamp to ensure fresh navigation and prevent caching issues
        };
        
        // Add source tracking if available
        if (source) {
          params.source = source;
          
          if (source === 'ShowPlaylistofType' && searchText) {
            params.searchText = searchText;
          } else if (source === 'LanguageDetail' && language) {
            params.language = language;
          }
          
          console.log(`Navigating to Album with params:`, JSON.stringify(params));
          
          // First, clear any existing album and playlist data to prevent navigation conflicts
          // Await all operations to ensure they complete before navigation
          await Promise.all([
            AsyncStorage.removeItem("orbit_current_album_id"),
            AsyncStorage.removeItem("orbit_current_album_data"),
            AsyncStorage.removeItem("orbit_current_playlist_id"),
            AsyncStorage.removeItem("orbit_current_playlist_data")
          ]);
          
          // Choose the appropriate navigation method based on source
          if (source === 'Home') {
            navigation.navigate("Home", {
              screen: "Album",
              params: params
            });
          } else {
            navigation.navigate("Album", params);
          }
        } else {
          // Default navigation if no source is provided
          console.log(`Navigating to Album with id:`, id);
          
          // First, clear any existing album and playlist data to prevent navigation conflicts
          // Await all operations to ensure they complete before navigation
          await Promise.all([
            AsyncStorage.removeItem("orbit_current_album_id"),
            AsyncStorage.removeItem("orbit_current_album_data"),
            AsyncStorage.removeItem("orbit_current_playlist_id"),
            AsyncStorage.removeItem("orbit_current_playlist_data")
          ]);
          
          navigation.navigate("Album", { id, timestamp: Date.now() });
        }
      } catch (error) {
        console.error('Error navigating to Album:', error);
        // Fallback navigation to prevent dead-end
        navigation.navigate("Home", { screen: "HomePage" });
      }
    }} style={{
      ...responsiveStyles.container,
      backgroundColor:"rgba(55,55,79,0)",
      flexDirection:"row",
      overflow:"hidden",
      ...mainContainerStyle,
    }}>
      <ImageBackground source={{
        uri:image,
      }} style={responsiveStyles.image}>
        <View style={{
          width:"100%",
          height:"100%",
          justifyContent:"flex-end",
          backgroundColor:"rgba(0,0,0,0.27)",
        }}>
          <LinearGradient start={{x: 0, y: 0}} end={{x: 0, y: 1}} colors={['rgba(0,0,0,0)', 'rgba(0,0,0,0.56)', 'rgb(0,0,0)']} style={{
            padding:10,
          }}>
            <PlainText text={truncateText(name, 30)}/>
            <SmallText text={!Search ? artistsNames : truncateText(artists, 30)}/>
          </LinearGradient>
        </View>
      </ImageBackground>
    </Pressable>
  );
})
