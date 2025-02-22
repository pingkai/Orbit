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
import { View } from 'react-native';
import { useContext } from 'react';
import Context from '../Context/Context';
import { FullScreenMusic } from '../Component/MusicPlayer/FullScreenMusic';

const Tab = createBottomTabNavigator();
export const RootRoute = () => {
  const theme = useTheme();
  const { Index, setIndex } = useContext(Context);

  return (
    <View style={{ flex: 1 }}>
      {Index === 1 ? (
        <FullScreenMusic setIndex={setIndex} Index={Index} color="#151515" />
      ) : (
        <>
          <Tab.Navigator 
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
