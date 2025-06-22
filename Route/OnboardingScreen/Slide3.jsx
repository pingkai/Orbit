import { MainWrapper } from "../../Layout/MainWrapper";
import { Dimensions, TextInput, View, StyleSheet } from "react-native";
import Animated, { FadeInDown, FadeInUp, useSharedValue, useAnimatedStyle, withRepeat, withTiming } from "react-native-reanimated";
import { Heading } from "../../Component/Global/Heading";
import { BottomNextAndPrevious } from "../../Component/RouteOnboarding/BottomNextAndPrevious";
import { useState, useEffect } from "react";
import { useTheme } from "@react-navigation/native";
import { SetUserNameValue } from "../../LocalStorage/StoreUserName";
import Ionicons from "react-native-vector-icons/Ionicons";

// Get screen dimensions
const { width, height } = Dimensions.get('window');
const isSmallDevice = height < 700;

export const Slide3 = ({navigation}) => {
  const theme = useTheme();
  const [name, setName] = useState("");

  // Animation values
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);

  useEffect(() => {
    // Breathing animation for the icon
    scale.value = withRepeat(
      withTiming(1.1, { duration: 2000 }),
      -1,
      true
    );

    // Gentle rotation animation
    rotation.value = withRepeat(
      withTiming(360, { duration: 8000 }),
      -1,
      false
    );
  }, []);

  const animatedIconStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotate: `${rotation.value}deg` }
    ],
  }));

  const animatedGradientStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value * 0.8 }],
    opacity: 0.3,
  }));

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 20,
    },
    iconContainer: {
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: isSmallDevice ? -10 : 0,
      position: 'relative',
    },
    gradientBackground: {
      position: 'absolute',
      width: isSmallDevice ? 160 : 200,
      height: isSmallDevice ? 160 : 200,
      borderRadius: isSmallDevice ? 80 : 100,
    },
    iconWrapper: {
      width: isSmallDevice ? 140 : 180,
      height: isSmallDevice ? 140 : 180,
      borderRadius: isSmallDevice ? 70 : 90,
      justifyContent: 'center',
      alignItems: 'center',
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.3,
      shadowRadius: 16,
      elevation: 8,
    },
    headingContainer: {
      marginVertical: isSmallDevice ? 16 : 24,
    },
    heading: {
      fontSize: isSmallDevice ? 22 : 26,
    },
    input: {
      borderWidth: 1.5,
      backgroundColor: '#333333',
      borderRadius: 16,
      padding: isSmallDevice ? 12 : 15,
      width: width * 0.7,
      color: '#FFFFFF',
      fontSize: isSmallDevice ? 18 : 20,
      shadowOffset: { width: 0, height: 2 },
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    }
  });
  
  async function handleNextPress(name) {
    if (!name.trim()) {
      alert("Please enter your name!");
      return;
    }
    await SetUserNameValue(name.trim());
    navigation.replace("MainRoute");
  }
  
  return (
    <MainWrapper>
      <View style={styles.container}>
        <Animated.View
          entering={FadeInUp.duration(800)}
          style={styles.iconContainer}
        >
          {/* Animated gradient background */}
          <Animated.View style={[
            styles.gradientBackground,
            {
              backgroundColor: theme.colors.primary + '20',
            },
            animatedGradientStyle
          ]} />

          {/* Main icon container */}
          <Animated.View style={[
            styles.iconWrapper,
            {
              backgroundColor: theme.colors.primary,
              shadowColor: theme.colors.primary,
            },
            animatedIconStyle
          ]}>
            <Ionicons
              name="person-add"
              size={isSmallDevice ? 60 : 80}
              color="white"
            />
          </Animated.View>
        </Animated.View>
        
        <Animated.View 
          entering={FadeInDown.delay(500)}
          style={styles.headingContainer}
        >
          <Heading 
            text={"Enter Your Name"} 
            nospace={true}
            style={styles.heading}
          />
        </Animated.View>

        <TextInput
          value={name}
          onChangeText={setName}
          textAlign={'center'}
          placeholder={"Enter your name"}
          placeholderTextColor={'#FFFFFF'}
          style={[
            styles.input,
            {
              borderColor: theme.colors.border,
              shadowColor: theme.colors.text,
            }
          ]}
        />
      </View>

      <BottomNextAndPrevious 
        delay={300}
        nextText={"Let's Go"}
        showPrevious={true}
        onPreviousPress={() => {
          navigation.replace("Slide2", {
            animation: 'fade',
            duration: 500
          });
        }}
        onNextPress={() => {
          handleNextPress(name);
        }}
        transitionDuration={500}
        fadeEffect={true}
      />
    </MainWrapper>
  );
};
