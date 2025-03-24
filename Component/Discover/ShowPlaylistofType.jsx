/* eslint-disable keyword-spacing */
import React, { useEffect, useState } from "react";
import { Dimensions, FlatList, View, BackHandler, ActivityIndicator, Pressable } from "react-native";
import { LoadingComponent } from "../Global/Loading";
import { EachPlaylistCard } from "../Global/EachPlaylistCard";
import { PlainText } from "../Global/PlainText";
import { SmallText } from "../Global/SmallText";
import { getSearchPlaylistData } from "../../Api/Playlist";
import { Heading } from "../Global/Heading";
import { PaddingConatiner } from "../../Layout/PaddingConatiner";
import { useNavigation, useFocusEffect, useRoute } from "@react-navigation/native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { PlaylistItemWrapper } from "./PlaylistItemWrapper";
import { CommonActions } from "@react-navigation/native";

// Add a utility function to truncate text
const truncateText = (text, limit = 22) => {
  if (!text) return '';
  return text.length > limit ? text.substring(0, limit) + '...' : text;
};

// AsyncStorage key for navigation source
const NAVIGATION_SOURCE_KEY = "orbit_navigation_source";

export default function ShowPlaylistofType({route}) {
  const {Searchtext = 'most searched', navigationSource } = route?.params || {}; // Get nav source if available
  const navigation = useNavigation();
  const currentRoute = useRoute();
  const limit = 30;
  const [Data, setData] = useState({});
  const [Loading, setLoading] = useState(true);
  const [isRendered, setIsRendered] = useState(false);
  const [fetchError, setFetchError] = useState(null);
  const [source, setSource] = useState(null);
  const { width } = Dimensions.get("window");
  
  // Store the navigation source when component mounts
  useEffect(() => {
    const getNavigationSource = async () => {
      try {
        // First check route params
        if (navigationSource) {
          console.log(`Setting navigation source from route params: ${navigationSource}`);
          setSource(navigationSource);
          await AsyncStorage.setItem(NAVIGATION_SOURCE_KEY, navigationSource);
          return;
        }
        
        // Then check for current route state
        const routeName = currentRoute?.name;
        const parentRoute = navigation.getState()?.routes?.[0]?.name;
        
        if (parentRoute && parentRoute !== 'Discover') {
          console.log(`Setting navigation source from parent route: ${parentRoute}`);
          setSource(parentRoute);
          await AsyncStorage.setItem(NAVIGATION_SOURCE_KEY, parentRoute);
          return;
        }
        
        // Fallback to AsyncStorage
        const storedSource = await AsyncStorage.getItem(NAVIGATION_SOURCE_KEY);
        if (storedSource) {
          console.log(`Retrieved navigation source from storage: ${storedSource}`);
          setSource(storedSource);
        } else {
          // Default to Discover if no source found
          console.log('No navigation source found, defaulting to Discover');
          setSource('Discover');
          await AsyncStorage.setItem(NAVIGATION_SOURCE_KEY, 'Discover');
        }
      } catch (error) {
        console.error('Error managing navigation source:', error);
        setSource('Discover'); // Default fallback
      }
    };
    
    getNavigationSource();
  }, [navigation, navigationSource, currentRoute]);
  
  // Force refresh when screen is focused (coming back from playlist)
  useFocusEffect(
    React.useCallback(() => {
      console.log('ShowPlaylistofType focused with search term:', Searchtext);
      // Reset error state when focused
      setFetchError(null);
      
      // Always force a refresh when the screen is focused
      setLoading(true);
      setIsRendered(true);
      addSearchData();
      
      return () => {
        // Clean up here if needed
      };
    }, [Searchtext]) // Depend on Searchtext to refresh when it changes
  );
  
  // Add back handler for hardware back button
  useEffect(() => {
    const handleBackPress = () => {
      console.log(`Back pressed in ShowPlaylistofType, source is ${source}`);
      
      // Navigate based on the source instead of always going to Discover
      if (source === 'HomePage') {
        console.log('Navigating back to Home');
        navigation.navigate('Home', { screen: 'HomePage' });
      } else if (source === 'LibraryPage') {
        console.log('Navigating back to Library');
        navigation.navigate('Library', { screen: 'LibraryPage' });
      } else {
        // Default to Discover (backward compatibility)
        console.log('Navigating back to Discover');
        try {
          // Use CommonActions.reset to ensure clean navigation state
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [
                {
                  name: 'MainRoute',
                  state: {
                    routes: [
                      {
                        name: 'Discover',
                        state: {
                          routes: [{ name: 'DiscoverPage' }],
                          index: 0
                        }
                      }
                    ],
                    index: 0
                  }
                }
              ]
            })
          );
        } catch (error) {
          console.error('Navigation reset failed:', error);
          // Fallback to simple navigation
          navigation.navigate('Discover', { screen: 'DiscoverPage' });
        }
      }
      
      return true;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    
    return () => {
      backHandler.remove();
    };
  }, [navigation, source]);
  
  async function addSearchData(){
    // Always try to fetch data, even with empty search text
    try {
      setLoading(true);
      console.log(`Fetching playlist data for search: ${Searchtext}`);
      const fetchdata = await getSearchPlaylistData(Searchtext || 'most searched', 1, limit);
      if (fetchdata?.data?.results) {
        setData(fetchdata);
        setFetchError(null);
      } else {
        console.log("No results or invalid data structure:", fetchdata);
        setFetchError("Failed to load playlist data");
      }
    } catch (e) {
      console.log("Error fetching search data:", e);
      setFetchError(e.message || "An error occurred while loading data");
    } finally {
      setLoading(false);
    }
  }

  // Initial load
  useEffect(() => {
    if (!isRendered) {
      addSearchData();
    }
  }, []);

  // Calculate optimal card sizing based on screen width
  const getCardWidth = () => {
    // Allow for 2 columns with proper spacing
    const cardWidth = (width - 40) / 2; // Reduced from 60 to make cards larger and more compact
    return cardWidth;
  };

  const cardWidth = getCardWidth();

  return (
    <View style={{ flex: 1 }}>
      <PaddingConatiner>
        <Heading text={(Searchtext || 'Popular Playlists').toUpperCase()}/>
      </PaddingConatiner>
      
      {/* Improved loading state */}
      {Loading && (
        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          height: 300
        }}>
          <ActivityIndicator size="large" color="#1DB954" />
          <PlainText text={`Loading ${Searchtext || 'playlist'} data...`} style={{marginTop: 10}} />
        </View>
      )}
      
      {/* Error state */}
      {fetchError && !Loading && (
        <View style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
          height: 300,
          paddingHorizontal: 20
        }}>
          <PlainText text={fetchError} style={{marginBottom: 10, textAlign: 'center'}} />
          <Pressable 
            onPress={addSearchData}
            style={{
              padding: 10, 
              backgroundColor: '#1DB954', 
              borderRadius: 5,
              marginTop: 10
            }}
          >
            <PlainText text="Retry" style={{color: 'white'}} />
          </Pressable>
        </View>
      )}
      
      {!Loading && !fetchError && (
        <>
          {Data?.data?.results?.length > 0 ? (
            <FlatList 
              showsVerticalScrollIndicator={false}
              numColumns={2}
              keyExtractor={(item, index) => String(index)}
              contentContainerStyle={{
                paddingHorizontal: 12,
                paddingBottom: 100,
                paddingTop: 4,
              }}
              columnWrapperStyle={{
                justifyContent: 'space-between',
                marginBottom: 12, // Reduced from 24 for less vertical space
                width: '100%',
              }}
              data={Data?.data?.results}
              renderItem={(item) => (
                <PlaylistItemWrapper 
                  item={item.item}
                  cardWidth={cardWidth}
                  source="ShowPlaylistofType"
                  searchText={Searchtext}
                  navigationSource={source}
                />
              )}
              ListEmptyComponent={
                <View style={{
                  flex: 1,
                  height: 400,
                  alignItems: "center",
                  justifyContent: "center",
                  paddingHorizontal: 20,
                }}>
                  <PlainText text={"No Playlists Found"} style={{textAlign: 'center'}}/>
                  <SmallText text={"Try searching for something else"} style={{textAlign: 'center'}}/>
                </View>
              }
            />
          ) : (
            <View style={{
              flex: 1,
              height: 400,
              alignItems: "center",
              justifyContent: "center",
              paddingHorizontal: 20,
            }}>
              <PlainText text={"No Playlists Found"} style={{textAlign: 'center'}}/>
              <SmallText text={"Try searching for something else"} style={{textAlign: 'center'}}/>
            </View>
          )}
        </>
      )}
    </View>
  );
}
