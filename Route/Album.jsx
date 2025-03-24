import { MainWrapper } from "../Layout/MainWrapper";
import Animated, { useAnimatedRef} from "react-native-reanimated";
import { PlaylistTopHeader } from "../Component/Playlist/PlaylistTopHeader";
import { View, BackHandler } from "react-native";
import { EachSongCard } from "../Component/Global/EachSongCard";
import { useEffect, useState } from "react";
import { LoadingComponent } from "../Component/Global/Loading";
import { useTheme, useNavigation } from "@react-navigation/native";
import { PlainText } from "../Component/Global/PlainText";
import { SmallText } from "../Component/Global/SmallText";
import { getAlbumData } from "../Api/Album";
import { AlbumDetails } from "../Component/Album/AlbumDetails";
import FormatArtist from "../Utils/FormatArtists";
import AsyncStorage from "@react-native-async-storage/async-storage";

// AsyncStorage keys
const CURRENT_ALBUM_ID_KEY = "orbit_current_album_id";
const CURRENT_ALBUM_DATA_KEY = "orbit_current_album_data";
const CURRENT_PLAYLIST_ID_KEY = "orbit_current_playlist_id";
const CURRENT_PLAYLIST_DATA_KEY = "orbit_current_playlist_data";

// Utility function to truncate text
const truncateText = (text, limit = 30) => {
  if (!text) return '';
  return text.length > limit ? text.substring(0, limit) + '...' : text;
};

// Utility function to validate image URLs
const getValidImageUrl = (url) => {
  if (!url || url === 'null' || url === 'undefined') {
    // Return a default image if URL is null/undefined
    return 'https://example.com/default.jpg'; // Replace with a valid default image URL
  }
  return url;
};

export const Album = ({route}) => {
  const theme = useTheme();
  const AnimatedRef = useAnimatedRef();
  const [Loading, setLoading] = useState(true);
  const [Data, setData] = useState({});
  const navigation = useNavigation();
  
  // Safely destructure route.params with default values
  const routeId = route?.params?.id;
  
  // State to hold the actual ID we'll use (either from route or storage)
  const [id, setId] = useState(routeId);
  const [source, setSource] = useState(route?.params?.source || null);
  
  // When component mounts, check if we have a route ID - if not, try to recover from AsyncStorage
  useEffect(() => {
    const recoverAlbumData = async () => {
      try {
        if (routeId) {
          // Clear any previous album data if we have a new album ID
          console.log(`New album selected: ${routeId}, clearing previous album data cache`);
          setId(routeId);
          setSource(route?.params?.source || null);
          
          // Store the new album ID and data
          await AsyncStorage.setItem(CURRENT_ALBUM_ID_KEY, routeId);
          const albumData = {
            id: routeId,
            source: route?.params?.source || null,
            language: route?.params?.language || null,
            searchText: route?.params?.searchText || null
          };
          await AsyncStorage.setItem(CURRENT_ALBUM_DATA_KEY, JSON.stringify(albumData));
          console.log(`Stored new album ID and data for: ${routeId}`);
          
        } else {
          console.log('No album ID in route params, attempting to recover from storage');
          
          // Try to get stored album ID as fallback
          const storedId = await AsyncStorage.getItem(CURRENT_ALBUM_ID_KEY);
          
          if (storedId) {
            console.log(`Recovered album ID from storage: ${storedId}`);
            setId(storedId);
            
            // Try to get the full album data
            const storedDataStr = await AsyncStorage.getItem(CURRENT_ALBUM_DATA_KEY);
            if (storedDataStr) {
              try {
                const storedData = JSON.parse(storedDataStr);
                setSource(storedData.source || null);
                console.log('Successfully recovered album data from storage');
              } catch (parseError) {
                console.error('Error parsing stored album data:', parseError);
              }
            }
          } else {
            console.log('No stored album ID found, navigating back to safe screen');
            // Navigate to a safe screen if we can't recover data
            navigation.navigate('Home', { screen: 'HomePage' });
          }
        }
      } catch (error) {
        console.error('Error recovering album data:', error);
      }
    };
    
    recoverAlbumData();
  }, [routeId, route?.params?.source, route?.params?.language, route?.params?.searchText, navigation]);
  
  // Handle back button press
  useEffect(() => {
    const handleBackPress = () => {
      handleBackNavigation();
      return true;
    };

    BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    return () => {
      BackHandler.removeEventListener('hardwareBackPress', handleBackPress);
    };
  }, [source]);

  // Handle navigation based on source
  const handleBackNavigation = async () => {
    console.log('Handling back navigation from Album with source:', source);
    
    // Clear playlist data from AsyncStorage to prevent it from being restored
    // when navigating back from album
    try {
      await Promise.all([
        AsyncStorage.removeItem(CURRENT_PLAYLIST_ID_KEY),
        AsyncStorage.removeItem(CURRENT_PLAYLIST_DATA_KEY),
        // Also clear album data to ensure it doesn't persist either
        AsyncStorage.removeItem(CURRENT_ALBUM_ID_KEY),
        AsyncStorage.removeItem(CURRENT_ALBUM_DATA_KEY)
      ]);
      console.log('Cleared all navigation data from AsyncStorage when leaving album');
    } catch (error) {
      console.error('Error clearing navigation data:', error);
    }
    
    if (source === 'LanguageDetail' && route?.params?.language) {
      // Navigate back to LanguageDetailPage with the language parameter
      navigation.navigate('DiscoverPage', {
        screen: 'LanguageDetail',
        params: { language: route.params.language }
      });
      return true;
    } else if (source === 'ShowPlaylistofType' && route?.params?.searchText) {
      // Navigate back to ShowPlaylistofType with the search text
      navigation.navigate('DiscoverPage', {
        screen: 'ShowPlaylistofType',
        params: { text: route.params.searchText }
      });
      return true;
    } else if (source === 'Search') {
      // Navigate back to Search tab with the search text if available
      console.log('Navigating back to Search screen from Album with searchText:', route?.params?.searchText);
      // Try to go back without explicit navigation first
      if (navigation.canGoBack()) {
        navigation.goBack();
      } else {
        // If that fails, force navigation to the Search screen
        navigation.navigate('Home', {
          screen: 'Search',
          params: { 
            searchText: route?.params?.searchText || '',
            timestamp: Date.now() // Add timestamp to force refresh
          }
        });
      }
      return true;
    } else if (source === 'Home') {
      // Navigate back to Home tab's HomePage
      console.log('Navigating back to HomePage from Album');
      navigation.navigate('Home', { 
        screen: 'HomePage' 
      });
      return true;
    } else {
      // Check if we can go back in the navigation stack
      if (navigation.canGoBack()) {
        console.log('Using standard navigation.goBack()');
        navigation.goBack();
      } else {
        // Fallback to HomePage if we can't go back
        console.log('Cannot go back, navigating to HomePage as fallback');
        navigation.navigate('Home', { 
          screen: 'HomePage' 
        });
      }
      return true;
    }
  };

  const fetchAlbumData = async (albumId) => {
    if (!albumId) {
      console.error("Album ID is missing from route params");
      // Navigate back to prevent errors
      navigation.goBack();
        return;
    }
    
    try {
      setLoading(true);
      const response = await getAlbumData(albumId);
      setData(response);
      
      // Store the album data and ID for recovery
      try {
        const albumDataToStore = {
          id: albumId,
          source: route?.params?.source || null,
          language: route?.params?.language || null,
          searchText: route?.params?.searchText || null
        };
        await AsyncStorage.setItem(CURRENT_ALBUM_ID_KEY, albumId);
        await AsyncStorage.setItem(CURRENT_ALBUM_DATA_KEY, JSON.stringify(albumDataToStore));
        console.log("Album data saved to AsyncStorage");
      } catch (storageError) {
        console.error("Failed to save album data to storage:", storageError);
      }
      
    } catch (error) {
      console.error("Error fetching album data:", error);
    } finally {
      setLoading(false);
    }
  };

  // Effect to fetch data when the component mounts or id changes
  useEffect(() => {
    if (id) {
      fetchAlbumData(id);
    }
  }, [id]);
  
  return (
    <MainWrapper>
      {Loading &&
        <LoadingComponent loading={Loading}/>}
      {!Loading && !Data?.data?.songs?.length && (
        <View style={{
          flex: 1, 
          justifyContent: 'center', 
          alignItems: 'center',
          paddingHorizontal: 20
        }}>
          <PlainText text="Album not found or no songs available" style={{textAlign: 'center'}}/>
          <SmallText text="Please check your connection and try again" style={{textAlign: 'center'}}/>
        </View>
      )}
      {!Loading && Data?.data?.songs?.length > 0 && 
        <Animated.ScrollView 
          scrollEventThrottle={16} 
          ref={AnimatedRef} 
          contentContainerStyle={{
            paddingBottom: 120, // Extra padding to account for bottom player
            backgroundColor: "#101010",
          }}
        >
          <PlaylistTopHeader AnimatedRef={AnimatedRef} url={getValidImageUrl(Data?.data?.image[2]?.url ?? "")} />
          <AlbumDetails name={Data?.data?.name ?? ""} liked={false} releaseData={Data?.data?.year ?? ""}  Data={Data}/>
          {<View style={{
            paddingHorizontal: 15,
            backgroundColor: "#101010",
            gap: 7,
          }}>
            {Data?.data?.songs?.map((e,i)=>
              <EachSongCard 
                isFromPlaylist={true} 
                Data={Data} 
                index={i} 
                artist={FormatArtist(e?.artists?.primary)} 
                language={e?.language} 
                playlist={true} 
                artistID={e?.primary_artists_id} 
                key={i} 
                duration={e?.duration} 
                image={getValidImageUrl(e?.image[2]?.url)} 
                id={e?.id} 
                width={"100%"} 
                title={e?.name}  
                url={e?.downloadUrl} 
                style={{
                  marginBottom: 15,
                  borderRadius: 8,
                  elevation: 2,
                }}
              />
            )}
          </View>}
        </Animated.ScrollView>
      }
    </MainWrapper>
  );
};
