import React, { useContext, useEffect } from "react";
import { View, StyleSheet, Pressable } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import Animated, { withSpring, useAnimatedStyle, withTiming } from "react-native-reanimated";
import Context from "../../Context/Context";

const bottomColor = "#151515"

export default function CustomTabBar({ state, descriptors, navigation }) {
  const {setIndex, Index} = useContext(Context)
  
  useEffect(() => {
    setIndex(0)
  }, []);

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
      return <Ionicons name={isDiabled ? "library-outline" : "library"} color={color} size={size} />
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
    width: 80,  // Added width
    height: 40  // Added height to maintain square shape
  }
}); // Added closing parenthesis and brace
  