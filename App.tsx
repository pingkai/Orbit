import { NavigationContainer, DefaultTheme, CommonActions, NavigationContainerRef } from "@react-navigation/native";
import {RootRoute} from "./Route/RootRoute";
import { createStackNavigator } from "@react-navigation/stack";
import { Dimensions, ToastAndroid, BackHandler } from "react-native";
import ContextState from "./Context/ContextState";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { BottomSheetModalProvider } from '@gorhom/bottom-sheet'
import { RouteOnboarding } from "./Route/OnboardingScreen/RouteOnboarding";
import { InitialScreen } from "./Route/InitialScreen";
import CodePush from "react-native-code-push";
import { useEffect, useRef} from "react";

const Stack = createStackNavigator()
let codePushOptions = { checkFrequency: CodePush.CheckFrequency.ON_APP_START };
function App(){
  const width = Dimensions.get("window").width
  const navigationRef = useRef<NavigationContainerRef<any>>(null);
  
  const MyTheme = {
    ...DefaultTheme,
    colors: {
      ...DefaultTheme.colors,
      primary: '#6CC04A',
      text: '#F4F5FC',
      textSecondary: '#CCCCCC',
      white : "white",
      spacing : 10,
      headingSize:width * 0.085,
      fontSize:width * 0.045,
      disabled:'rgb(131,131,131)',
      background:'#101010',
    },
  };
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
    <NavigationContainer 
      ref={navigationRef}
      theme={MyTheme}
      onStateChange={(state) => {
        const currentRouteName = navigationRef.current?.getCurrentRoute()?.name;
        if (currentRouteName) {
          console.log("Current screen:", currentRouteName);
        }
      }}
      fallback={<InitialScreen navigation={undefined as any} />}
    >
    <Stack.Navigator screenOptions={{headerShown:false}}>
      <Stack.Screen name="Initial" component={InitialScreen} />
      <Stack.Screen name="Onboarding" component={RouteOnboarding} />
      <Stack.Screen name="MainRoute" component={RootRoute} />
    </Stack.Navigator>
  </NavigationContainer>
  </BottomSheetModalProvider>
  </ContextState>
  </GestureHandlerRootView>
}
export default  CodePush(codePushOptions)(App)
