import React, { useState, useRef, useEffect, useContext } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { HomeRoute } from "./Home/HomeRoute";
import { DiscoverRoute } from "./Discover/DiscoverRoute";
import { LibraryRoute } from "./Library/LibraryRoute";
import Entypo from "react-native-vector-icons/Entypo";
import Octicons from "react-native-vector-icons/Octicons";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import { useTheme } from "@react-navigation/native";
import CustomTabBar from '../Component/Tab/CustomTabBar';
import BottomSheetMusic from '../Component/MusicPlayer/BottomSheetMusic';
import { View, TouchableOpacity } from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { BackHandler } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer, CommonActions } from '@react-navigation/native';
import Icons from 'react-native-vector-icons/Ionicons';
import Context from '../Context/Context';
import { FullScreenMusic } from '../Component/MusicPlayer/FullScreenMusic';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MusicMain } from './MusicIndex';
import { MainRoute } from './MainRoute';
import { LogBox } from 'react-native';
import { useIsFocused } from '@react-navigation/native';

const Tab = createBottomTabNavigator();
export const RootRoute = () => {
  const theme = useTheme();
  const { Index, setIndex, previousScreen, setPreviousScreen, musicPreviousScreen, setMusicPreviousScreen } = useContext(Context);
  const navigation = useNavigation();
  const isFullscreenActive = useRef(false);
  const previousTabName = useRef(null);
  
  // Track fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);
  const prevFullscreenState = useRef(false);
  
  // Global back button handler to ensure proper navigation hierarchy
  useEffect(() => {
    const handleBackPress = () => {
      // Don't handle if fullscreen player is active (let BottomSheetMusic handle it)
      if (isFullscreenActive.current) {
        return false;
      }
      
      // Get current navigation state
      const currentState = navigation.getState();
      if (!currentState) return false;
      
      // Get the current active tab
      const currentActiveTab = currentState.routes[currentState.index];
      if (!currentActiveTab) return false;
      
      // Handle back navigation only for LibraryRoute
      if (currentActiveTab.name === 'Library') {
        const libraryState = currentActiveTab.state;
        
        // If we're on a nested screen in Library
        if (libraryState && libraryState.index > 0) {
          // Let the system handle regular back within the stack
          return false;
        }
        
        // If we're at the main Library screen (index 0)
        if (libraryState && libraryState.index === 0) {
          // If the first screen is not LibraryPage, navigate to LibraryPage
          if (libraryState.routes[0].name !== 'LibraryPage') {
            navigation.dispatch(
              CommonActions.navigate({
                name: 'Library',
                params: { screen: 'LibraryPage' }
              })
            );
            return true;
          }
          
          // If we're at LibraryPage and there's a previous tab, go back to that tab
          if (previousTabName.current && previousTabName.current !== 'Library') {
            console.log('At LibraryPage, returning to previous tab:', previousTabName.current);
            navigation.navigate(previousTabName.current);
            return true;
          }
        }
      }
      
      // Remember current tab before changing
      previousTabName.current = currentActiveTab.name;
      
      return false;
    };
    
    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    
    return () => backHandler.remove();
  }, [navigation]);

  // Effect to track fullscreen state only (no navigation)
  useEffect(() => {
    // Track changes in fullscreen state
    if (Index === 0) {
      // Not in fullscreen
      if (prevFullscreenState.current) {
        console.log('Exited fullscreen player');
        
        // Check for screens that need to be refreshed when returning from fullscreen player
        const state = navigation.getState();
        const routes = state?.routes || [];
        const currentRoute = routes.find(r => r.name === 'MainRoute');
        
        if (currentRoute && currentRoute.state) {
          const tabRoutes = currentRoute.state.routes;
          const currentTab = tabRoutes[currentRoute.state.index];
          
          if (currentTab && currentTab.name === 'Discover') {
            console.log('Current tab is Discover');
            
            // Get the current screen in Discover tab
            const currentScreen = currentTab.state?.routes[currentTab.state.index]?.name;
            console.log('Current screen in Discover tab:', currentScreen);
            
            // Force refresh problematic screens
            if (currentScreen === 'ShowPlaylistofType' || currentScreen === 'LanguageDetail') {
              console.log('Force refreshing Discover screen:', currentScreen);
              // Small timeout to ensure navigation is complete
              setTimeout(() => {
                const params = navigation.getState().routes.find(r => 
                  r.name === 'MainRoute')?.state?.routes?.find(r => 
                  r.name === 'Discover')?.state?.routes?.find(r => 
                  r.name === currentScreen)?.params;
                  
                // Navigate to the same screen to force refresh
                navigation.navigate('Discover', {
                  screen: currentScreen,
                  params
                });
              }, 100);
            }
          } else if (currentTab && currentTab.state?.routes?.some(r => r.name === 'Album')) {
            console.log('Current screen is Album, checking for refresh need');
            
            // Small timeout to ensure navigation is complete
            setTimeout(() => {
              // Get the album ID from AsyncStorage and refresh if needed
              const refreshAlbum = async () => {
                try {
                  const albumId = await AsyncStorage.getItem('orbit_current_album_id');
                  const albumDataStr = await AsyncStorage.getItem('orbit_current_album_data');
                  
                  if (albumId && albumDataStr) {
                    const albumData = JSON.parse(albumDataStr);
                    console.log('Refreshing Album with ID:', albumId);
                    
                    // Navigate to Album with recovered params
                    if (currentTab.name === 'Home') {
                      // If we're in the Home tab, navigate to Album through Home
                      navigation.navigate('Home', {
                        screen: 'Album',
                        params: {
                          id: albumId,
                          source: albumData.source || 'Home',
                          language: albumData.language,
                          searchText: albumData.searchText
                        }
                      });
                    } else {
                      // Otherwise use the standard navigation
                      navigation.navigate('Album', {
                        id: albumId,
                        source: albumData.source,
                        language: albumData.language,
                        searchText: albumData.searchText
                      });
                    }
                  } else {
                    // If no album data is found, navigate back to Home
                    navigation.navigate('Home', {
                      screen: 'HomePage'
                    });
                  }
                } catch (error) {
                  console.error('Error refreshing album:', error);
                  // On error, navigate to Home
                  navigation.navigate('Home', {
                    screen: 'HomePage'
                  });
                }
              };
              
              refreshAlbum();
            }, 100);
          }
        }
      }
      prevFullscreenState.current = false;
    } else {
      // In fullscreen
      prevFullscreenState.current = true;
    }
  }, [Index, navigation]);

  // Track screen changes continuously to better remember which screen the user was on
  // This helps with navigation after closing the fullscreen player
  useEffect(() => {
    // Function to record the current screen path
    const recordScreenPath = () => {
      // STRONG PROTECTION: Don't update navigation state vars if fullscreen is active
      if (isFullscreenActive.current) {
        console.log('PROTECTED: Fullscreen active - prevented updating navigation state');
        return;
      }

      const currentState = navigation.getState();
      
      if (currentState && currentState.routes && currentState.routes.length > 0) {
        // Get the active route information
        const currentTabRoute = currentState.routes[currentState.index];
        
        // Store both the main tab and the nested screen state
        const nestedState = currentTabRoute.state;
        let fullNavPath = currentTabRoute.name; // Start with the tab name
        let screenName = ''; // To capture nested screen name
        
        // If there's a nested navigation state, get the current active route
        if (nestedState && nestedState.routes && nestedState.routes.length > 0) {
          const activeNestedRoute = nestedState.routes[nestedState.index];
          
          // Save the screen name
          screenName = activeNestedRoute.name;
          
          // Check if this is a navigation to MyMusicPage through params
          if (activeNestedRoute.params && activeNestedRoute.params.screen === 'MyMusicPage') {
            console.log('Detected MyMusicPage navigation through params');
            fullNavPath = `${currentTabRoute.name}/MyMusicPage`;
          }
          // Check for deeper nesting (for screens like MyMusicPage in Library)
          else if (activeNestedRoute.state && activeNestedRoute.state.routes && activeNestedRoute.state.routes.length > 0) {
            const deepNestedRoute = activeNestedRoute.state.routes[activeNestedRoute.state.index];
            // Store the full navigation path with tab, screen and nested screen
            fullNavPath = `${currentTabRoute.name}/${activeNestedRoute.name}/${deepNestedRoute.name}`;
            console.log('Deep nested navigation detected:', fullNavPath);
          } else {
          // Store the full navigation path (tab/screen)
          fullNavPath = `${currentTabRoute.name}/${activeNestedRoute.name}`;
          }
        }
        
        // Clean fullNavPath if it has MainRoute prefix for consistency
        if (fullNavPath.startsWith('MainRoute/')) {
          fullNavPath = fullNavPath.replace('MainRoute/', '');
          console.log('Cleaned MainRoute prefix from path:', fullNavPath);
        }
        
        // CRITICAL FIX: Special handling for Library tab
        // If we're in Library tab but a specific screen name wasn't captured properly,
        // check the params to see if there's a target screen
        if (fullNavPath === 'Library' && currentTabRoute.params && currentTabRoute.params.screen) {
          // Don't set Library/Library - check for more specific screens first
          const screenFromParams = currentTabRoute.params.screen;
          
          // Check if we're trying to navigate to MyMusicPage specifically
          if (screenFromParams === 'MyMusicPage') {
            fullNavPath = `Library/MyMusicPage`;
            console.log('Fixed Library path for MyMusicPage:', fullNavPath);
          } else if (screenFromParams !== 'Library') {
            // Only use params if the screen is not 'Library' to avoid Library/Library
            fullNavPath = `Library/${screenFromParams}`;
            console.log('Fixed Library path using params:', fullNavPath);
          }
        }
        
        // Don't update if Index is 1 (fullscreen player active) - extra safety check
        if (!isFullscreenActive.current) {
          console.log('Setting previous screen to:', fullNavPath);
        setPreviousScreen(fullNavPath);
          
          // Only update musicPreviousScreen if we're in a music-related screen
          // This preserves the music context even when navigating to non-music screens
          if (fullNavPath.includes('Library') || fullNavPath.includes('MyMusic')) {
            console.log('Setting music previous screen to:', fullNavPath);
            setMusicPreviousScreen(fullNavPath);
          }
        } else {
          console.log('PROTECTED: Fullscreen active - not updating navigation state');
        }
      }
    };

    // Set up a listener for state changes with delayed execution
    // This ensures we don't update during the transition to fullscreen
    const unsubscribe = navigation.addListener('state', () => {
      // Add a slight delay to ensure Index has been updated first
      setTimeout(recordScreenPath, 100);
    });
    
    // Record the initial screen - but only if not in fullscreen player
    if (!isFullscreenActive.current) {
      recordScreenPath();
    }
    
    // Clean up the listener when the component unmounts
    return unsubscribe;
  }, [navigation, setPreviousScreen, setMusicPreviousScreen]);

  return (
    <View style={{ flex: 1 }}>
      {Index === 1 ? (
        <FullScreenMusic setIndex={setIndex} Index={Index} color="#151515" />
      ) : (
        <>
          <Tab.Navigator 
            initialRouteName="Home"
            tabBar={(props) => (
              <>
                <BottomSheetMusic color="#151515"/>
                <CustomTabBar {...props}/>
              </>
            )} 
            screenOptions={{
              tabBarShowLabel: false,
              tabBarLabelStyle: {
                fontWeight: "bold",
              },
              tabBarInactiveTintColor: theme.colors.textSecondary,
              tabBarActiveTintColor: theme.colors.primary,
              headerShown: false,
              tabBarStyle: {
                backgroundColor: theme.colors.background,
                borderColor: "rgba(28,27,27,0)"
              }
            }}>
            <Tab.Screen  
              options={{
                tabBarIcon: ({ color, size }) => (
                  <Octicons name="home" color={color} size={size - 4} />
                ),
              }} 
              name="Home" 
              component={HomeRoute} 
            />
            <Tab.Screen 
              options={{
                tabBarIcon: ({ color, size }) => (
                  <Entypo name="compass" color={color} size={size - 4} />
                ),
              }} 
              name="Discover" 
              component={DiscoverRoute} 
              listeners={{
                tabPress: () => {
                  // Handle Discover tab reset without event parameters
                  // Get current tab state from navigation
                  const state = navigation.getState();
                  const currentTabIndex = state.index;
                  
                  // Only reset if coming from a different tab (not within Discover)
                  if (currentTabIndex !== 1) { // 1 is the index of Discover tab
                    console.log("Switching to Discover tab - resetting to DiscoverPage");
                    
                    // Navigate to DiscoverPage
                    setTimeout(() => {
                      navigation.navigate('Discover', {
                        screen: 'DiscoverPage'
                      });
                    }, 50);
                  }
                }
              }}
            />
            <Tab.Screen 
              options={{
                tabBarIcon: ({ color, size }) => (
                  <MaterialCommunityIcons name="music-box-multiple-outline" color={color} size={size - 4} />
                ),
              }}  
              name="Library" 
              component={LibraryRoute} 
            />
          </Tab.Navigator>
        </>
      )}
    </View>
  );
};
