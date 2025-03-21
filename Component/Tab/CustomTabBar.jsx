import React, { useContext, useEffect, useRef } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons"
import Animated, { withSpring, useAnimatedStyle, withTiming } from "react-native-reanimated";
import Context from "../../Context/Context";

const bottomColor = "#151515"

export default function CustomTabBar({ state, descriptors, navigation }) {
  const {setIndex, Index, musicPreviousScreen} = useContext(Context);
  const previousFullscreenState = useRef(false);
  const previousTabIndex = useRef(state.index);
  
  // Track tab changes for better back navigation
  useEffect(() => {
    // Remember previous tab for back navigation
    if (state.index !== previousTabIndex.current) {
      console.log(`Tab changed from ${previousTabIndex.current} to ${state.index}`);
      previousTabIndex.current = state.index;
    }
  }, [state.index]);

  // No longer force navigation to Library when exiting fullscreen
  useEffect(() => {
    // Special handling for transitions from fullscreen to normal view
    if (previousFullscreenState.current && Index === 0) {
      console.log('DETECTED FULLSCREEN EXIT in CustomTabBar');
      
      // If we've just exited fullscreen, ensure tab navigation is properly updated
      // This helps with the first-time navigation issue
      setTimeout(() => {
        if (musicPreviousScreen) {
          const parts = musicPreviousScreen.split('/');
          const tabName = parts[0];
          
          // Verify we're in the correct tab after closing fullscreen
          const currentState = navigation.getState();
          const isInCorrectTab = currentState?.routes?.[currentState.index]?.state?.index !== undefined &&
                                currentState.routes[currentState.index].state.routes.some(
                                  route => route.name === tabName && route.state
                                );
          
          if (!isInCorrectTab && tabName === 'Library') {
            console.log('TAB SYNC: Ensuring we are in Library tab after fullscreen exit');
            // Only update if we're not already in the correct nested state
            navigation.navigate('Library');
          }
        }
      }, 200); // Delay to ensure other navigation has completed
    }
    
    // Update our tracking ref
    previousFullscreenState.current = (Index === 1);
  }, [Index, navigation, musicPreviousScreen]);

  // Move animation styles outside the map
  const getAnimatedStyle = (isFocused) => {
    return useAnimatedStyle(() => {
      return {
        transform: [{ scale: withSpring(isFocused ? 1.1 : 1) }],
        opacity: withTiming(isFocused ? 1 : 0.6, { duration: 150 }),
        backgroundColor: withTiming(isFocused ? 'rgba(255,255,255,0.1)' : 'transparent', { duration: 150 })
      };
    });
  };
  function GetIcon(label, isDiabled = false) {
    const color = isDiabled ? "rgb(153,151,151)" : "white";
    const size = 24;
    
    if (label === "Home") {
      return <Ionicons name={isDiabled ? "headset-outline" : "headset"} color={color} size={size} />
    } else if (label === "Discover") {
      return <Ionicons name={isDiabled ? "compass-outline" : "compass"} color={color} size={size} />
    } else if (label === "Library") {
      return <MaterialCommunityIcons  name={isDiabled ? "folder-music-outline" : "folder-music"} color={color} size={size} />
    }
  }
  if (Index === 1) return null;
  return (
    <View style={styles.mainContainer}>
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = options.tabBarLabel ?? options.title ?? route.name;
        const isFocused = state.index === index;
        const animatedStyle = getAnimatedStyle(isFocused);

        const onPress = () => {
          const event = navigation.emit({
            type: 'tabPress',
            target: route.key,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        return (
          <View key={index} style={styles.mainItemContainer}>
            <Pressable
              onPress={onPress}
              style={styles.pressable}>
              <Animated.View style={[styles.iconContainer, animatedStyle]}>
                {GetIcon(label, !isFocused)}
              </Animated.View>
            </Pressable>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  mainContainer: {
    flexDirection: 'row',
    height: 65,
    alignItems: "center",
    backgroundColor: bottomColor,
    paddingBottom: 10,
  },
  mainItemContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  pressable: {
    backgroundColor: "rgba(0,0,0,0)",
    borderRadius: 12,
    padding: 8,
  },
  iconContainer: {
    justifyContent: "center",
    alignItems: "center",
    padding: 8,
    borderRadius: 12,
    width: 80,
    height: 40
  }
}); 
  