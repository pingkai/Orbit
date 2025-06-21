import { MainWrapper } from "../Layout/MainWrapper";
import Animated, { useAnimatedRef} from "react-native-reanimated";
import { PlaylistTopHeader } from "../Component/Playlist/PlaylistTopHeader";
import { View, BackHandler, Image } from "react-native";
import { EachSongCard } from "../Component/Global/EachSongCard";
import { useEffect, useState } from "react";
import { LoadingComponent } from "../Component/Global/Loading";
import { useTheme, useNavigation } from "@react-navigation/native";
import { PlainText } from "../Component/Global/PlainText";
import { SmallText } from "../Component/Global/SmallText";
import { getAlbumData } from "../Api/Album";

import FormatArtist from "../Utils/FormatArtists";
import AsyncStorage from "@react-native-async-storage/async-storage";
import LinearGradient from "react-native-linear-gradient";
import navigationHistoryManager from '../Utils/NavigationHistoryManager';

// AsyncStorage keys
const CURRENT_ALBUM_ID_KEY = "orbit_current_album_id";
const CURRENT_ALBUM_DATA_KEY = "orbit_current_album_data";
const CURRENT_PLAYLIST_ID_KEY = "orbit_current_playlist_id";
const CURRENT_PLAYLIST_DATA_KEY = "orbit_current_playlist_data";



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
    } else if (source === 'Artist') {
      // Navigate back to Artist page - use smart navigation to prevent loops
      console.log('Navigating back to Artist page from Album');

      try {
        // Check navigation state to detect potential loops
        const navigationState = navigation.getState();
        const routes = navigationState?.routes || [];

        // Count how many ArtistPage and Album instances are in the stack
        const artistPageCount = routes.filter(route => route.name === 'ArtistPage').length;
        const albumPageCount = routes.filter(route => route.name === 'Album').length;

        console.log('Navigation stack analysis:');
        console.log('- ArtistPage instances:', artistPageCount);
        console.log('- Album instances:', albumPageCount);
        console.log('- Total routes:', routes.length);
        console.log('- Route names:', routes.map(r => r.name));

        // Only detect loop if we have multiple instances of BOTH pages (indicating a true loop)
        if (artistPageCount >= 3 || (artistPageCount >= 2 && albumPageCount >= 2)) {
          console.log('Detected true navigation loop, resetting to Search');
          navigation.navigate('MainRoute', {
            screen: 'Home',
            params: {
              screen: 'Search'
            }
          });
          return true;
        }

        // Use navigation history manager for proper back navigation
        const backAction = navigationHistoryManager.getBackNavigationAction(navigation);
        backAction();
      } catch (error) {
        console.error('Error navigating back to Artist page:', error);
        // Error fallback - go to Search to break any potential loops
        navigationHistoryManager.clearHistory();
        navigation.navigate('MainRoute', {
          screen: 'Home',
          params: {
            screen: 'Search'
          }
        });
      }
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

      // Add this screen to navigation history
      navigationHistoryManager.addScreen({
        screenName: 'Album',
        params: {
          id,
          source,
          artistId: route?.params?.artistId,
          artistName: route?.params?.artistName,
          previousTab: route?.params?.previousTab
        }
      });
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
        <View style={{ flex: 1, position: 'relative', backgroundColor: theme.dark ? theme.colors.background : '#FFFFFF' }}>
          {/* Background blurred image */}
          {Data?.data?.image && Data?.data?.image[2]?.url && (
            <View style={{
              position: 'absolute',
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              zIndex: -1,
              overflow: 'hidden',
            }}>
              <Image 
                source={{ uri: getValidImageUrl(Data?.data?.image[2]?.url) }}
                style={{
                  width: '100%',
                  height: '100%',
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  bottom: 0,
                  opacity: theme.dark ? 0.2 : 0.15, // Slightly more visible in dark mode
                }}
                blurRadius={25} // Increased blur for smoother effect
                resizeMode="cover"
              />
              {/* Gradient overlay for better contrast */}
              <LinearGradient
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  right: 0,
                  height: 150, // Height of the top gradient overlay
                }}
                start={{x: 0, y: 1}}
                end={{x: 0, y: 0}}
                colors={theme.dark ? 
                  ['rgba(16,16,16,0)', 'rgba(16,16,16,0.8)'] : 
                  ['rgba(255,255,255,0)', 'rgba(255,255,255,0.9)']}
              />
              <View style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: theme.dark ? 'rgba(16,16,16,0.85)' : 'rgba(255,255,255,0.88)', // More transparent overlay
              }} />
            </View>
          )}
          <Animated.ScrollView 
            scrollEventThrottle={16} 
            ref={AnimatedRef} 
            contentContainerStyle={{
              paddingBottom: 120,
              backgroundColor: theme.dark ? theme.colors.background : "#FFFFFF",
            }}
            style={{
              backgroundColor: 'transparent', // Keep transparent to allow header background to show
            }}
          >
          <PlaylistTopHeader 
            AnimatedRef={AnimatedRef} 
            url={getValidImageUrl(Data?.data?.image[2]?.url ?? "")} 
            playlistId={"album_" + (Data?.data?.id || route?.params?.id)} 
            name={Data?.data?.name || "Album"}
            follower=""
            style={{
              position: 'relative',
              marginTop: 0,
              marginBottom: 0
            }}
            // New props for details display
            detailsName={Data?.data?.name || "Album"}
            releaseYear={Data?.data?.year || ""}
            songsData={Data?.data?.songs}
            contentIdForPlayer={Data?.data?.id || route?.params?.id}
            playerLoading={Loading} // Placeholder: Replace with actual player loading state
            isPlayingState={false} // Placeholder: Replace with actual isPlaying state
            onPlayPress={() => console.log('Play pressed on Album - Placeholder')} // Placeholder: Replace with actual play/pause handler
            isAlbumScreen={true}
          />

          {<View style={{
            paddingHorizontal: 0, // No horizontal padding
            paddingTop: 15, // Added top padding for space below header
            backgroundColor: theme.dark ? 'rgb(16,16,16)' : '#FFFFFF', // Solid background in dark mode
            gap: 0, // No gap between song cards
          }}>
            {Data?.data?.songs?.map((e,i)=>
              <EachSongCard 
                isFromPlaylist={true} 
                isFromAlbum={true}
                Data={Data} 
                index={i} 
                artist={FormatArtist(e?.artists?.primary)} 
                language={e?.language} 
                playlist={true} 
                artistID={e?.primary_artists_id} 
                key={i} 
                duration={e?.duration} 
                image={getValidImageUrl(e?.image?.[2]?.url || e?.images?.[2]?.url)}
                id={e?.id} 
                width={"100%"} 
                title={e?.name}  
                url={e?.downloadUrl} 
                style={{
                  marginBottom: 0, // Remove bottom margin
                  borderRadius: 0, // Remove border radius
                  marginRight: 0
                }}
                showNumber={true} // Explicitly show numbers in album view
              />
            )}
          </View>}
        </Animated.ScrollView>
        </View>
      }
    </MainWrapper>
  );
};
