import 'react-native-get-random-values'; // Must be imported before any crypto operations
import { NavigationContainer, CommonActions, NavigationContainerRef } from "@react-navigation/native";
import { RootRoute } from "./Route/RootRoute.jsx";
import { createStackNavigator } from "@react-navigation/stack";
import { Dimensions, ToastAndroid, BackHandler } from "react-native";
import ContextState from "./Context/ContextState";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet'
import { RouteOnboarding } from "./Route/OnboardingScreen/RouteOnboarding";
import { InitialScreen } from "./Route/InitialScreen";
import { Album } from './Route/Album';
import ArtistPage from './Route/ArtistPage';
import CodePush from "react-native-code-push";
import { useEffect, useRef } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
// Firebase Analytics is initialized within AnalyticsUtils using the modular API
// Import analytics service
import { analyticsService, AnalyticsEvents } from './Utils/AnalyticsUtils';
// Import ThemeProvider from ThemeContext
import { ThemeProvider, useThemeContext } from './Context/ThemeContext';
// Import theme types
import { darkTheme } from './Theme/darkTheme';

type ThemeContextType = {
  theme: typeof darkTheme;
  themeMode: string;
  colorSchemeName: string;
  colorScheme: any;
  toggleTheme: () => Promise<void>;
  changeColorScheme: (scheme: string) => Promise<void>;
  isThemeLoaded: boolean;
};

const Stack = createStackNavigator()
let codePushOptions = { checkFrequency: CodePush.CheckFrequency.ON_APP_START };

function App(){
  const width = Dimensions.get("window").width
  const navigationRef = useRef<NavigationContainerRef<any>>(null);
  
  useEffect(() => {
    // Initialize playlists structure if needed
    const initializeUserPlaylists = async () => {
      try {
        const userPlaylistsJson = await AsyncStorage.getItem('userPlaylists');
        if (!userPlaylistsJson) {
          console.log('Initializing user playlists structure');
          await AsyncStorage.setItem('userPlaylists', JSON.stringify([]));
        } else {
          console.log('User playlists structure already exists');
        }
      } catch (error) {
        console.error('Error initializing user playlists:', error);
      }
    };
    
    initializeUserPlaylists();
  }, []);
  
  // Initialize Firebase Analytics
  useEffect(() => {
    // Set analytics collection enabled (can be toggled for GDPR compliance)
    analyticsService.setAnalyticsCollectionEnabled(true);
    
    // Enable debug mode in development
    if (__DEV__) {
      console.log('Firebase Analytics debug mode enabled');
    }
    
    // Log app open event
    analyticsService.logEvent(AnalyticsEvents.APP_OPEN);
    console.log('Firebase Analytics initialized');
  }, []);
  
  useEffect(()=>{
    // @ts-ignore
    CodePush.notifyAppReady()
    CodePush.checkForUpdate().then(update => {
      if (update) {
        ToastAndroid.showWithGravity(
          `App Update Available and will be updated automatically`,
          ToastAndroid.LONG,
          ToastAndroid.CENTER,
        );
        CodePush.sync(
          { installMode: CodePush.InstallMode.IMMEDIATE },
        );
      }
    });
  },[])
  
  useEffect(() => {
    const handleBackPress = () => {
      if (navigationRef.current) {
        try {
          const currentRouteName = navigationRef.current.getCurrentRoute()?.name;
          console.log("Back pressed on screen:", currentRouteName);
          
          if (!navigationRef.current.canGoBack()) {
            console.log("Cannot go back, resetting to home");
            
            navigationRef.current.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [{ name: 'MainRoute' }],
              })
            );
            return true;
          }
          
          return false;
        } catch (error) {
          console.log("Error handling back:", error);
          return false;
        }
      }
      return false;
    };
    
    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    return () => backHandler.remove();
  }, []);
  
  return <GestureHandlerRootView style={{flex:1}}>
    <ContextState>
      <BottomSheetModalProvider>
        <ThemeProvider>
          {({ theme, isThemeLoaded }: ThemeContextType) => {
            // Only render when theme is loaded to prevent flash of wrong theme
            if (!isThemeLoaded) {
              return null; // Or a loading indicator if preferred
            }
            
            return (
              <>
                <NavigationContainer
                  ref={navigationRef}
                  theme={theme}
                  onStateChange={(state) => {
                    const currentRouteName = navigationRef.current?.getCurrentRoute()?.name;
                    if (currentRouteName) {
                      console.log("Current screen:", currentRouteName);
                      // Log screen view to Firebase Analytics
                      analyticsService.logScreenView(currentRouteName);
                    }
                  }}
                  fallback={<InitialScreen navigation={undefined as any} />}
                >
                  <Stack.Navigator screenOptions={{
                    headerShown: false,
                    cardStyle: { backgroundColor: theme.colors.background }
                  }}>
              <Stack.Screen name="Initial" component={InitialScreen} />
              <Stack.Screen name="Onboarding" component={RouteOnboarding} />
                          <Stack.Screen name="MainRoute" component={RootRoute} />
              <Stack.Screen name="Album" component={Album} />
              <Stack.Screen name="ArtistPage" component={ArtistPage} />
                  </Stack.Navigator>
                </NavigationContainer>
              </>
            );
          }}
        </ThemeProvider>
      </BottomSheetModalProvider>
    </ContextState>
  </GestureHandlerRootView>
}
export default  CodePush(codePushOptions)(App)
