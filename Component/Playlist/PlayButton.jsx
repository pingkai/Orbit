import { ActivityIndicator, Pressable, StyleSheet, View } from "react-native";
import Entypo from "react-native-vector-icons/Entypo";
import { useTheme } from "@react-navigation/native";

export const PlayButton = ({onPress, Loading, size = "normal"}) => {
  const theme = useTheme();
  
  // Determine size based on prop - reduce large size to be less dominant
  const buttonSize = size === "large" ? 56 : size === "small" ? 40 : 50;
  const iconSize = size === "large" ? 32 : size === "small" ? 20 : 25;
  const buttonPadding = size === "large" ? 12 : size === "small" ? 10 : 12;
  
  return (
    <View style={[
      styles.buttonWrapper, 
      { 
        width: buttonSize, 
        height: buttonSize,
        marginRight: 10,
        marginLeft: 5,
        // Enhanced glow effect when large
        elevation: size === "large" ? 10 : 8,
        shadowRadius: size === "large" ? 5 : 4,
      }
    ]}>
      <Pressable 
        onPress={onPress} 
        style={({pressed}) => [
          styles.button,
          {
            backgroundColor: "#4CAF50", // Bright green color like in the screenshot
            width: buttonSize,
            height: buttonSize,
            opacity: pressed ? 0.8 : 1, // Feedback when pressed
          }
        ]}
        android_ripple={{color: 'rgba(255,255,255,0.3)', borderless: true}}
      >
        {!Loading && (
          <Entypo 
            name="controller-play" 
            color="#000000" // Black icon for better contrast on green
            size={iconSize} 
            style={styles.icon}
          />
        )}
        {Loading && (
          <ActivityIndicator 
            color="#000000" 
            size={size === "large" ? "large" : "small"}
          />
        )}
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  buttonWrapper: {
    // Add a wrapper to handle shadows and effects
    borderRadius: 1000,
    elevation: 8,
    shadowColor: '#4CAF50', // Match button color for glow effect
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 4,
  },
  button: {
    borderRadius: 1000, // Very high value for perfect circle
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  icon: {
    marginLeft: 4, // Adjust position of play icon
  }
});
