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

// AsyncStorage keys
const CURRENT_ALBUM_ID_KEY = "orbit_current_album_id";
const CURRENT_ALBUM_DATA_KEY = "orbit_current_album_data";
const CURRENT_PLAYLIST_ID_KEY = "orbit_current_playlist_id";
const CURRENT_PLAYLIST_DATA_KEY = "orbit_current_playlist_data";

// Define tab names for reference
const Tabs = ['Home', 'Discover', 'Library'];

export const RootRoute = () => {
  const theme = useTheme();
  const { Index, setIndex, previousScreen, setPreviousScreen, musicPreviousScreen, setMusicPreviousScreen } = useContext(Context);
  const navigation = useNavigation();
  const isFullscreenActive = useRef(false);
  const previousTabName = useRef(null);
  
  // Track fullscreen state
  const [isFullscreen, setIsFullscreen] = useState(false);
  const prevFullscreenState = useRef(false);
  
  // Track screen before entering fullscreen
  const [previousFullscreenScreen, setPreviousFullscreenScreen] = useState(null);
  
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

  // Effect to track fullscreen state
  useEffect(() => {
    // Update fullscreen active ref for back handling
    isFullscreenActive.current = (Index === 1);
    
    // When entering fullscreen mode, save the current screen
    if (Index === 1 && !prevFullscreenState.current) {
      // Store current screen information before entering fullscreen
      const state = navigation.getState();
      const routes = state?.routes || [];
      const currentRoute = routes.find(r => r.name === 'MainRoute');
      
      // Capture screen details
      if (currentRoute && currentRoute.state) {
        const tabRoutes = currentRoute.state.routes;
        const currentTab = tabRoutes[currentRoute.state.index];
        
        if (currentTab) {
          const tabName = currentTab.name;
          let screenName = '';
          let screenParams = {};
          
          // Get current screen details
          if (currentTab.state && currentTab.state.routes && currentTab.state.routes.length > 0) {
            const currentScreen = currentTab.state.routes[currentTab.state.index];
            screenName = currentScreen.name;
            screenParams = currentScreen.params || {};
          }
          
          // Save screen info to restore later
          const screenInfo = {
            tab: tabName,
            screen: screenName,
            params: screenParams
          };
          
          console.log('Saving screen before fullscreen:', JSON.stringify(screenInfo));
          setPreviousFullscreenScreen(screenInfo);
        }
      }
    }
    
    // Track changes in fullscreen state
    if (Index === 0) {
      // Not in fullscreen
      if (prevFullscreenState.current && previousFullscreenScreen) {
        console.log('Exited fullscreen player, restoring previous screen:', JSON.stringify(previousFullscreenScreen));
        
        // Restore previous screen after short delay to ensure proper navigation
        setTimeout(() => {
          const { tab, screen, params } = previousFullscreenScreen;
          
          // Skip navigation if we're already on the correct screen
          const currentState = navigation.getState();
          const currentTabIndex = currentState?.index || 0;
          const currentTab = currentState?.routes?.[currentTabIndex];
          
          // Extract current screen info
          const currentTabName = currentTab?.name;
          const currentNestedState = currentTab?.state;
          const currentScreenName = currentNestedState?.routes?.[currentNestedState.index]?.name;
          const currentParams = currentNestedState?.routes?.[currentNestedState.index]?.params;
          
          // Log current location
          console.log(`Currently at: Tab=${currentTabName}, Screen=${currentScreenName}`);
          console.log(`Want to go to: Tab=${tab}, Screen=${screen}`);
          
          // Check if we're already on the target screen
          const alreadyOnTargetScreen = (
            currentTabName === tab && 
            currentScreenName === screen && 
            JSON.stringify(currentParams) === JSON.stringify(params)
          );
          
          if (alreadyOnTargetScreen) {
            console.log('Already on the target screen, skipping navigation');
            return;
          }
          
          // Handle different screen types
          if (screen === 'Album') {
            console.log(`Navigating to Album in ${tab} tab with params:`, params);
            if (tab === 'Home') {
              navigation.navigate('Home', {
                screen: 'Album',
                params: params
              });
            } else {
              // Ensure we're in the right tab first
              navigation.navigate(tab);
              // Then navigate to Album
              setTimeout(() => {
                navigation.navigate('Album', params);
              }, 50);
            }
          } else if (screen === 'Playlist') {
            console.log(`Navigating to Playlist in ${tab} tab with params:`, params);
            navigation.navigate(tab, {
              screen: 'Playlist',
              params: params
            });
          } else if (screen === 'ShowPlaylistofType') {
            console.log(`Navigating to ShowPlaylistofType in ${tab} tab with params:`, params);
            navigation.navigate(tab, {
              screen: 'ShowPlaylistofType',
              params: params
            });
          } else if (screen === 'LanguageDetailPage') {
            console.log(`Navigating to LanguageDetailPage in ${tab} tab with params:`, params);
            navigation.navigate(tab, {
              screen: 'LanguageDetailPage',
              params: params
            });
          } else if (tab && screen) {
            // Generic navigation to any tab/screen
            console.log(`Generic navigation to ${tab}/${screen} with params:`, params);
            navigation.navigate(tab, {
              screen: screen,
              params: params
            });
          }
        }, 150);
      }
      prevFullscreenState.current = false;
    } else {
      // In fullscreen
      prevFullscreenState.current = true;
    }
  }, [Index, navigation, previousFullscreenScreen]);

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

  // Track tab changes to clear navigation history
  useEffect(() => {
    const asyncFunction = async () => {
      if (previousTabName.current !== null && previousTabName.current !== Tabs[Index]) {
        try {
          console.log(`Tab changed from ${previousTabName.current} to ${Tabs[Index]}, clearing stored screen data`);
          
          // Clear all stored navigation data to prevent incorrect behavior
          await Promise.all([
            AsyncStorage.removeItem(CURRENT_ALBUM_ID_KEY),
            AsyncStorage.removeItem(CURRENT_ALBUM_DATA_KEY),
            AsyncStorage.removeItem(CURRENT_PLAYLIST_ID_KEY),
            AsyncStorage.removeItem(CURRENT_PLAYLIST_DATA_KEY)
          ]);
          
          console.log('Successfully cleared all stored navigation data');
        } catch (error) {
          console.error('Error clearing stored screen data:', error);
        }
      }
      previousTabName.current = Tabs[Index];
    };
    
    asyncFunction();
  }, [Index]);

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
