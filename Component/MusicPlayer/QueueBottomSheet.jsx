import React, { useRef, useState, useCallback, useEffect } from "react";
import BottomSheet from "@gorhom/bottom-sheet";
import QueueRenderSongs from "./QueueRenderSongs";
import { PlainText } from "../Global/PlainText";
import { SmallText } from "../Global/SmallText";
import { View, StyleSheet, Dimensions, Text, ActivityIndicator } from "react-native";
import Octicons from "react-native-vector-icons/Octicons";
import { DeviceEventEmitter } from "react-native";
import { FadeIn, FadeOut } from "react-native-reanimated";
import Svg, { Circle } from "react-native-svg";

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const QueueBottomSheet = () => {
  const backgroundColor = 'rgba(10,10,10,0.95)'; // Darker, more opaque background for better contrast
  const bottomSheetRef = useRef(null);
  const [index, setIndex] = useState(0);
  
  // Handle bottom sheet index change
  const handleSheetChange = useCallback((index) => {
    setIndex(index);
  }, []);
  
  return (
    <BottomSheet
      index={0}
      onChange={handleSheetChange}
      enablePanDownToClose={false}
      animateOnMount={false}
      snapPoints={[120, '50%']} // Increased height for better visibility
      ref={bottomSheetRef}
      style={{
        backgroundColor,
        shadowColor: "#000",
        shadowOffset: {
          width: 0,
          height: -3,
        },
        shadowOpacity: 0.27,
        shadowRadius: 4.65,
        elevation: 6,
      }}
      handleComponent={() => (
        <View style={styles.handleContainer}>
          <Octicons name={"dash"} size={40} color="#FFFFFF" />
          <PlainText 
            text={"Queue"} 
            style={styles.headerText}
          />
          <SmallText
            text={"Press and hold a song to reorder"}
            style={styles.subHeaderText}
          />
        </View>
      )}
      enableContentPanningGesture={false} // Disable to avoid conflict with drag gesture
      enableHandlePanningGesture={true}
      backgroundStyle={{
        backgroundColor: "transparent",
      }}
      handleStyle={{
        backgroundColor: backgroundColor,
        paddingVertical: 10,
        borderTopLeftRadius: 15,
        borderTopRightRadius: 15,
      }}
    >
      <QueueRenderSongs/>
    </BottomSheet>
  );
};

// Circular Progress Component
const CircularProgress = ({ progress = 0, size = 40, thickness = 4 }) => {
  const circumference = 2 * Math.PI * ((size - thickness) / 2);
  const strokeDashoffset = circumference * (1 - progress / 100);

  return (
    <View style={{
      width: size,
      height: size,
      position: 'relative',
      alignItems: 'center',
      justifyContent: 'center',
    }}>
      <View style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        borderWidth: thickness,
        borderColor: 'rgba(255, 255, 255, 0.2)',
        position: 'absolute',
      }} />
      <Svg
        width={size}
        height={size}
        style={{
          position: 'absolute',
          transform: [{ rotate: '-90deg' }],
        }}
      >
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={(size - thickness) / 2}
          strokeWidth={thickness}
          stroke="#1DB954" // Spotify green
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
        />
      </Svg>
      <Text style={{
        color: 'white',
        fontSize: size * 0.3,
        fontWeight: 'bold',
      }}>{Math.round(progress)}%</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  handleContainer: {
    alignItems: "center", 
    justifyContent: "center", 
    backgroundColor: "transparent", 
    height: 75,
    width: SCREEN_WIDTH,
    paddingVertical: 5,
  },
  headerText: {
    fontWeight: 'bold', 
    fontSize: 18,
    marginTop: -8,
    color: '#FFFFFF',
  },
  subHeaderText: {
    fontSize: 12,
    color: '#FFFFFF', // Green highlight for instructions
    marginTop: 4,
    fontWeight: '500',
  }
});

export default QueueBottomSheet;