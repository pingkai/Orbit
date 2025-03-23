import { MainWrapper } from "../Layout/MainWrapper";
import Animated, { useAnimatedRef} from "react-native-reanimated";
import { PlaylistTopHeader } from "../Component/Playlist/PlaylistTopHeader";
import { PlaylistDetails } from "../Component/Playlist/PlaylistDetails";
import { View, BackHandler, Pressable } from "react-native";
import { EachSongCard } from "../Component/Global/EachSongCard";
import { useEffect, useState } from "react";
import { getPlaylistData } from "../Api/Playlist";
import { LoadingComponent } from "../Component/Global/Loading";
import { PlainText } from "../Component/Global/PlainText";
import { SmallText } from "../Component/Global/SmallText";
import FormatArtist from "../Utils/FormatArtists";
import { useNavigation } from "@react-navigation/native";
import { Spacer } from "../Component/Global/Spacer";
import AsyncStorage from "@react-native-async-storage/async-storage";

// AsyncStorage keys
const CURRENT_PLAYLIST_ID_KEY = "orbit_current_playlist_id";
const CURRENT_PLAYLIST_DATA_KEY = "orbit_current_playlist_data";
const CURRENT_ALBUM_ID_KEY = "orbit_current_album_id";
const CURRENT_ALBUM_DATA_KEY = "orbit_current_album_data";

// Add this truncate function
const truncateText = (text, limit = 30) => {
  if (!text) return '';
  return text.length > limit ? text.substring(0, limit) + '...' : text;
};

// Helper to ensure URL is a string
const ensureStringUrl = (url) => {
  if (!url) return '';
  return typeof url === 'string' ? url : '';
};

// Helper to validate download URL object with fallbacks
const getValidDownloadUrl = (downloadUrl, index = 2) => {
  try {
    // If downloadUrl is an array, get the specified index
    if (Array.isArray(downloadUrl) && downloadUrl.length > index) {
      const urlObj = downloadUrl[index];
      // Ensure we're getting a string URL from the object
      if (urlObj && typeof urlObj === 'object' && typeof urlObj.url === 'string') {
        return urlObj.url;
      }
    }
    
    // Return empty string if it doesn't match expected format
    return '';
  } catch (error) {
    console.log('Error parsing download URL:', error);
    return '';
  }
};

// Helper to validate and ensure valid image URL
const getValidImageUrl = (url) => {
  if (!url || url === 'null' || url === 'undefined') {
    // Return a default image if URL is null/undefined
    return 'https://example.com/default.jpg'; // Replace with a valid default image URL
  }
  return url;
};

export const Playlist = ({route}) => {
  const AnimatedRef = useAnimatedRef()
  const [Loading, setLoading] = useState(true)
  const [Data, setData] = useState({});
  const navigation = useNavigation();
  
  // Safely destructure route.params with default values
  const {id: routeId, image: routeImage, name: routeName, follower: routeFollower} = route?.params || {};
  
  // State to hold the actual ID we'll use (either from route or storage)
  const [id, setId] = useState(routeId);
  const [image, setImage] = useState(routeImage);
  const [name, setName] = useState(routeName);
  const [follower, setFollower] = useState(routeFollower);
  // Add source tracking
  const [source, setSource] = useState(route?.params?.source || null);
  
  // When component mounts, check if we have a route ID - if not, try to recover from AsyncStorage
  useEffect(() => {
    const recoverPlaylistData = async () => {
      try {
        if (routeId) {
          // If we have an ID from route params, clear previous data and use the new ones
          console.log(`New playlist selected: ${routeId}, clearing previous playlist data cache`);
          
          setId(routeId);
          setImage(routeImage || '');
          setName(routeName || 'Playlist');
          setFollower(routeFollower || '');
          setSource(route?.params?.source || null);
          
          // Store the new playlist data
          const playlistData = {
            id: routeId,
            image: routeImage || '',
            name: routeName || 'Playlist',
            follower: routeFollower || '',
            source: route?.params?.source || null,
            searchText: route?.params?.searchText || null,
            language: route?.params?.language || null
          };
          
          await AsyncStorage.setItem(CURRENT_PLAYLIST_ID_KEY, routeId);
          await AsyncStorage.setItem(CURRENT_PLAYLIST_DATA_KEY, JSON.stringify(playlistData));
          console.log(`Stored new playlist data for: ${routeId}`);
          
        } else {
          console.log('No playlist ID in route params, attempting to recover from storage');
          
          // Try to get stored playlist ID as fallback
          const storedId = await AsyncStorage.getItem(CURRENT_PLAYLIST_ID_KEY);
          
          if (storedId) {
            console.log(`Recovered playlist ID from storage: ${storedId}`);
            setId(storedId);
            
            // Try to get the full playlist data
            const storedDataStr = await AsyncStorage.getItem(CURRENT_PLAYLIST_DATA_KEY);
            if (storedDataStr) {
              try {
                const storedData = JSON.parse(storedDataStr);
                setImage(storedData.image || '');
                setName(storedData.name || 'Playlist');
                setFollower(storedData.follower || '');
                setSource(storedData.source || null);
                console.log('Successfully recovered playlist data from storage');
              } catch (parseError) {
                console.error('Error parsing stored playlist data:', parseError);
              }
            }
          } else {
            console.log('No stored playlist ID found, navigating back to safe screen');
            // Navigate to a safe screen if we can't recover data
            navigation.navigate('Home', { screen: 'HomePage' });
          }
        }
      } catch (error) {
        console.error('Error recovering playlist data:', error);
      }
    };
    
    recoverPlaylistData();
  }, [routeId, routeImage, routeName, routeFollower, route?.params?.source, route?.params?.searchText, route?.params?.language, navigation]);
  
  // Add logging to check route params
  useEffect(() => {
    console.log('Playlist component mounted with route params:', JSON.stringify({
      routeId, routeImage, routeName, routeFollower, source: route?.params?.source
    }));
    
    console.log('Using actual playlist data:', JSON.stringify({
      id, image, name, follower, source
    }));
  }, [routeId, routeImage, routeName, routeFollower, id, image, name, follower, source, route?.params?.source]);
  
  // Add a back handler to handle navigation
  useEffect(() => {
    const handleBackPress = async () => {
      console.log('Back pressed in Playlist, attempting to navigate back');
      
      // Clear album data from AsyncStorage to prevent it from being restored
      // when navigating back from playlist
      try {
        await Promise.all([
          AsyncStorage.removeItem(CURRENT_ALBUM_ID_KEY),
          AsyncStorage.removeItem(CURRENT_ALBUM_DATA_KEY),
          // Also clear playlist data to ensure it doesn't persist either
          AsyncStorage.removeItem(CURRENT_PLAYLIST_ID_KEY),
          AsyncStorage.removeItem(CURRENT_PLAYLIST_DATA_KEY)
        ]);
        console.log('Cleared navigation data from AsyncStorage when leaving playlist');
      } catch (error) {
        console.error('Error clearing navigation data:', error);
      }
      
      // Check if we know where we came from
      if (source) {
        console.log(`Navigating back to source: ${source}, params:`, JSON.stringify({
          searchText: route?.params?.searchText || '',
          language: route?.params?.language || ''
        }));
        
        // Handle different source screens
        if (source === 'ShowPlaylistofType') {
          // Get searchText from either route params or stored state
          const searchText = route?.params?.searchText || '';
          
          // Navigate to Discover tab first to ensure we're in the right tab
          navigation.navigate('Discover', { 
            screen: 'ShowPlaylistofType',
            params: { Searchtext: searchText || 'most searched' }
          });
          return true;
        } else if (source === 'LanguageDetail') {
          // Get language from either route params or stored state
          const language = route?.params?.language || '';
          
          // Navigate to Discover tab first to ensure we're in the right tab
          navigation.navigate('Discover', { 
            screen: 'LanguageDetail',
            params: { language: language || 'hindi' }
          });
          return true;
        } else if (source === 'Home') {
          // Navigate directly to HomePage
          navigation.navigate('Home', { 
            screen: 'HomePage' 
          });
          return true;
        }
      }
      
      // Find which tab we're in by checking the navigation state
      const state = navigation.getState();
      const routes = state?.routes || [];
      let currentTab = '';
      
      for (const route of routes) {
        if (route.state && route.state.routes) {
          for (const nestedRoute of route.state.routes) {
            if (nestedRoute.state && nestedRoute.state.routes) {
              for (const deepRoute of nestedRoute.state.routes) {
                if (deepRoute.name === 'Playlist') {
                  currentTab = nestedRoute.name;
                  console.log('Found Playlist in tab:', currentTab);
                  break;
                }
              }
            }
          }
        }
      }
      
      // If we detect we're in the Discover tab, go back to DiscoverPage
      if (currentTab === 'Discover') {
        navigation.navigate('Discover', { screen: 'DiscoverPage' });
        return true;
      }
      
      // Standard back navigation logic as fallback
      const canGoBack = navigation.canGoBack();
      
      if (canGoBack) {
        // Normal back navigation when possible
        navigation.goBack();
        return true;
      } else {
        // If we can't go back in the current stack, try to navigate to the appropriate tab
        console.log('Cannot go back in current stack, navigating to tab');
        
        // Get the current route name to determine where to navigate
        const routes = navigation.getState()?.routes || [];
        const currentRoute = routes[routes.length - 1];
        const parentRoute = currentRoute?.name?.split('/')[0];
        
        if (parentRoute === 'Discover') {
          // Navigate to the Discover tab
          navigation.navigate('Discover', { screen: 'DiscoverPage' });
        } else if (parentRoute === 'Library') {
          // Navigate to the Library tab
          navigation.navigate('Library', { screen: 'LibraryPage' });
        } else {
          // Default to Home tab
          navigation.navigate('Home', { screen: 'HomePage' });
        }
        return true;
      }
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    
    return () => {
      backHandler.remove();
    };
  }, [navigation, source, route?.params, id]);
  
  async function fetchPlaylistData(){
    try {
      // Only fetch if id is defined
      if (!id) {
        console.log("No playlist ID available in fetchPlaylistData");
        setLoading(false);
        return;
      }
      
      console.log(`Fetching playlist data for ID: ${id}`);
      setLoading(true);
      let data = {};
      data = await getPlaylistData(id);
      console.log(`Playlist data fetched successfully for ID ${id}:`, 
                 data?.data?.name || 'Unknown playlist', 
                 `songs count: ${data?.data?.songs?.length || 0}`);
      setData(data);
      
      // If we successfully got playlist data, update the stored information
      if (data?.data) {
        const updatedPlaylistData = {
          id: id,
          image: image || data?.data?.image?.[2]?.url || '',
          name: data?.data?.name || name || 'Playlist',
          follower: data?.data?.follower || follower || '',
          source: source || null,
          searchText: route?.params?.searchText || '',
          language: route?.params?.language || ''
        };
        
        await AsyncStorage.setItem(CURRENT_PLAYLIST_DATA_KEY, JSON.stringify(updatedPlaylistData));
        console.log('Updated stored playlist data with API response, source:', updatedPlaylistData.source);
      }
    } catch (e) {
      console.error(`Error fetching playlist with ID ${id}:`, e.message);
    } finally {
      setLoading(false);
    }
  }
  
  useEffect(() => {
    if (id) {
      fetchPlaylistData();
    }
  }, [id]);

  // If no ID is provided, show an error message
  if (!id) {
    console.log("No playlist ID available (not in route params or storage)");
    
    return (
      <MainWrapper>
        <View style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
        }}>
          <PlainText text={"Playlist not available"} />
          <SmallText text={"No playlist ID found"} />
          <Spacer height={20} />
          <Pressable 
            onPress={() => navigation.goBack()}
            style={{
              backgroundColor: 'rgba(255,255,255,0.1)',
              padding: 10,
              borderRadius: 5
            }}
          >
            <PlainText text="Go Back" />
          </Pressable>
        </View>
      </MainWrapper>
    );
  }

  return (
    <MainWrapper>
       <Animated.ScrollView scrollEventThrottle={16} ref={AnimatedRef} contentContainerStyle={{
        paddingBottom:80,
         backgroundColor:"#101010",
      }}>
        <PlaylistTopHeader AnimatedRef={AnimatedRef} url={getValidImageUrl(image)} />
        <PlaylistDetails id={id} image={getValidImageUrl(image)} name={truncateText(name || "")} follower={follower} listener={follower ?? ""} releasedDate={Data?.data?.releaseDate ?? ""} Data={Data}  Loading={Loading}/>
         {Loading &&
           <LoadingComponent loading={Loading} height={200}/>}
        {!Loading && <View style={{
          paddingHorizontal:10,
          backgroundColor:"#101010",
          gap:7,
        }}>
          {Data?.data?.songs?.map((e,i)=>{
            if (!e) return null;
            
            // Get valid download URL
            const downloadUrl = getValidDownloadUrl(e?.downloadUrl);
            
            return (
              <EachSongCard 
            Data={Data} 
            isFromPlaylist={true} 
            index={i}  
            artist={FormatArtist(e?.artists?.primary)} 
            language={e?.language} 
            playlist={true} 
            artistID={e?.primary_artists_id} 
            key={i} 
            duration={e?.duration} 
                image={ensureStringUrl(e?.image?.[2]?.url)} 
            id={e?.id} 
            width={"100%"} 
            title={truncateText(e?.name)}  
                url={downloadUrl} 
            style={{
              marginBottom:15,
            }}
              />
            );
          })}
        </View>}
      </Animated.ScrollView>
      {Data?.data?.songs?.length <= 0 && !Loading && <View style={{
        flex: 1,
        alignItems:"center",
        justifyContent:"center",
      }}>
        <PlainText text={"Playlist not available"}/>
        <SmallText text={"No songs found in this playlist"}/>
        </View>}
    </MainWrapper>
  );
};
