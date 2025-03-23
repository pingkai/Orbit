import Animated, { interpolate, useAnimatedStyle, useScrollViewOffset } from "react-native-reanimated";
import { Dimensions, View } from "react-native";
import FastImage from "react-native-fast-image";
import { useMemo } from "react";

// Helper to validate image URL or provide default
const getValidImageUrl = (url) => {
  if (!url || url === 'null' || url === 'undefined' || url.trim() === '') {
    // Return a default image if URL is null/undefined/empty
    return require('../../Images/default.jpg');
  }
  return { uri: url };
};

export const PlaylistTopHeader = ({AnimatedRef, url}) => {
  const { width, height } = Dimensions.get('window');
  
  // Calculate responsive dimensions based on screen size
  const responsiveStyles = useMemo(() => {
    // Adjust image size based on screen width
    const smallImageSize = Math.min(width * 0.5, 200);
    
    return {
      containerHeight: smallImageSize * 1.4,
      imageSize: smallImageSize,
      imageRadius: 12,
    };
  }, [width]);
  
  const ScrollOffset = useScrollViewOffset(AnimatedRef);
  
  // Animation style for the main image
  const AnimatedImageStyle = useAnimatedStyle(() => {
    const imageSize = responsiveStyles.imageSize;
    
    return { 
      transform: [
        {
          translateY: interpolate(
            ScrollOffset.value,
            [-imageSize, 0, imageSize],
            [-imageSize/2, 0, imageSize*1.2]
          ),
        },
        {
          scale: interpolate(
            ScrollOffset.value,
            [imageSize, 0, imageSize],
            [0, 1, 0]
          ),
        },
      ]
    };
  });
  
  // Animation style for the background image
  const AnimatedImageStyle2 = useAnimatedStyle(() => {
    const imageSize = responsiveStyles.imageSize;
    
    return { 
      transform: [
        {
          translateY: interpolate(
            ScrollOffset.value,
            [-imageSize, 0, imageSize],
            [-imageSize/2, 0, imageSize*1.2]
          ),
        },
      ]
    };
  });
  
  return (
    <View style={{
      alignItems: "center",
      justifyContent: "center",
      height: responsiveStyles.containerHeight,
      backgroundColor: "#101010",
    }}>
      <View style={{
        elevation: 10,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 5,
      }}>
        <Animated.View style={[{
          height: responsiveStyles.imageSize,
          width: responsiveStyles.imageSize,
          borderRadius: responsiveStyles.imageRadius,
          overflow: 'hidden',
        }, AnimatedImageStyle]}>
          <FastImage
            source={getValidImageUrl(url)}
            style={{
              height: '100%',
              width: '100%',
            }}
            resizeMode={FastImage.resizeMode.cover}
          />
        </Animated.View>
      </View>
      
      <Animated.View 
        style={[{
          height: responsiveStyles.imageSize * 2,
          width: "100%",
          position: "absolute",
          zIndex: -1,
          overflow: 'hidden',
        }, AnimatedImageStyle2]}
      >
        <FastImage
          source={getValidImageUrl(url)}
          style={{
            height: '100%',
            width: '100%',
          }}
          blurRadius={20}
          resizeMode={FastImage.resizeMode.cover}
        />
      </Animated.View>
      
      <View style={{
        height: responsiveStyles.imageSize * 2,
        width: "100%",
        position: "absolute",
        zIndex: -1,
        backgroundColor: "rgba(16,16,16,0.75)",
      }}/>
    </View>
  );
};
