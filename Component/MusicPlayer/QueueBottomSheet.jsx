import React, { useRef, useState, useCallback } from "react";
import BottomSheet from "@gorhom/bottom-sheet";
import QueueRenderSongs from "./QueueRenderSongs";
import { PlainText } from "../Global/PlainText";
import { SmallText } from "../Global/SmallText";
import { View, StyleSheet, Dimensions } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import Octicons from "react-native-vector-icons/Octicons";

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
      snapPoints={[100, '50%']} // Increased height for better visibility
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