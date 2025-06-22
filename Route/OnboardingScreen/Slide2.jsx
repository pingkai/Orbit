import { MainWrapper } from "../../Layout/MainWrapper";
import { View, StyleSheet, Dimensions, ScrollView } from "react-native";
import Animated, { FadeInDown, FadeInUp, useSharedValue, useAnimatedStyle, withRepeat, withTiming } from "react-native-reanimated";
import { Heading } from "../../Component/Global/Heading";
import { PlainText } from "../../Component/Global/PlainText";
import { BottomNextAndPrevious } from "../../Component/RouteOnboarding/BottomNextAndPrevious";
import { EachCheckBox } from "../../Component/RouteOnboarding/EachCheckBox";
import { useState, useEffect } from "react";
import { SetLanguageValue } from "../../LocalStorage/Languages";
import { useTheme } from "@react-navigation/native";
import Ionicons from "react-native-vector-icons/Ionicons";

// Get screen dimensions
const { width, height } = Dimensions.get('window');
const isSmallDevice = height < 700;

export const Slide2 = ({navigation}) => {
  const [Languages, setLanguages] = useState([]);
  const theme = useTheme();

  // Animation values
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);

  useEffect(() => {
    // Pulsing animation for the music icon
    scale.value = withRepeat(
      withTiming(1.15, { duration: 1500 }),
      -1,
      true
    );

    // Slow rotation for visual appeal
    rotation.value = withRepeat(
      withTiming(360, { duration: 10000 }),
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
    transform: [{ scale: scale.value * 0.9 }],
    opacity: 0.4,
  }));
  
  async function onNextPress(language){
    if (language.length < 1){
      alert("Please select atleast 1 language")
    } else {
      const Lang = language.join(",")
      await SetLanguageValue(Lang);
      navigation.replace("Slide3")
    }
  }
  return (
    <MainWrapper>
      <View style={styles.headerContainer}>
        <Animated.View entering={FadeInUp.duration(800)} style={styles.iconContainer}>
          {/* Animated gradient background */}
          <Animated.View style={[
            styles.gradientBackground,
            {
              backgroundColor: theme.colors.primary + '20',
            },
            animatedGradientStyle
          ]} />

          {/* Main music icon */}
          <Animated.View style={[
            styles.iconWrapper,
            {
              backgroundColor: theme.colors.primary,
              shadowColor: theme.colors.primary,
            },
            animatedIconStyle
          ]}>
            <Ionicons
              name="musical-notes"
              size={isSmallDevice ? 50 : 70}
              color="white"
            />
          </Animated.View>
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(500)} style={styles.headingContainer}>
          <Heading 
            text={"What's Your Music Taste?"} 
            nospace={true} 
            style={styles.heading}
          />
        </Animated.View>
        <Animated.View entering={FadeInDown.delay(750)}>
          <PlainText 
            text={"Select atleast 1 language"} 
            style={styles.subHeading}
          />
        </Animated.View>
      </View>
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollViewContent}
        showsVerticalScrollIndicator={false}
      >
        <EachCheckBox data={Languages} onCheck1={(data)=>{
          setLanguages(()=>data)
        }} checkbox1={"English"} checkbox2={"Hindi"} onCheck2={(data)=>{
          setLanguages(()=>data)
        }}/>
        <EachCheckBox data={Languages} onCheck1={(data)=>{
          setLanguages(data)
        }} checkbox1={"Punjabi"} checkbox2={"Tamil"} onCheck2={(data)=>{
          setLanguages(data)
        }}/>
        <EachCheckBox data={Languages} onCheck1={(data)=>{
          setLanguages(data)
        }} checkbox1={"Telugu"} checkbox2={"Marathi"} onCheck2={(data)=>{
          setLanguages(data)
        }}/>
        <EachCheckBox data={Languages} onCheck1={(data)=>{
          setLanguages(data)
        }} checkbox1={"Bhojpuri"} checkbox2={"Bengali"} onCheck2={(data)=>{
          setLanguages(data)
        }}/>
        <EachCheckBox data={Languages} onCheck1={(data)=>{
          setLanguages(data)
        }} checkbox1={"Kannada"} checkbox2={"Gujarati"} onCheck2={(data)=>{
          setLanguages(data)
        }}/>
        <EachCheckBox data={Languages} onCheck1={(data)=>{
          setLanguages(data)
        }} checkbox1={"Malayalam"} checkbox2={"Urdu"} onCheck2={(data)=>{
          setLanguages(data)
        }}/>
        <EachCheckBox data={Languages} onCheck1={(data)=>{
          setLanguages(data)
        }} checkbox1={"Kannada"} checkbox2={"Rajasthani"} onCheck2={(data)=>{
          setLanguages(data)
        }}/>
        <EachCheckBox data={Languages} onCheck1={(data)=>{
          setLanguages(data)
        }} checkbox1={"Odia"} checkbox2={"Assamese"} onCheck2={(data)=>{
          setLanguages(data)
        }}/>
      </ScrollView>

      <BottomNextAndPrevious 
        delay={100} 
        showPrevious={true} 
        onNextPress={() => onNextPress(Languages)} 
        onPreviousPress={() => navigation.replace("Slide1")}
      />
    </MainWrapper>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    alignItems: "center",
    paddingTop: isSmallDevice ? 10 : 20,
  },
  iconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  gradientBackground: {
    position: 'absolute',
    width: isSmallDevice ? 140 : 220,
    height: isSmallDevice ? 140 : 220,
    borderRadius: isSmallDevice ? 70 : 110,
  },
  iconWrapper: {
    width: isSmallDevice ? 120 : 200,
    height: isSmallDevice ? 120 : 200,
    borderRadius: isSmallDevice ? 60 : 100,
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  headingContainer: {
    marginBottom: isSmallDevice ? 5 : 10,
  },
  heading: {
    marginTop: isSmallDevice ? 10 : 20,
    fontSize: isSmallDevice ? 20 : 24,
  },
  subHeading: {
    fontSize: isSmallDevice ? 14 : 16,
  },
  scrollView: {
    flex: 1,
    width: '100%',
  },
  scrollViewContent: {
    alignItems: "center",
    paddingTop: isSmallDevice ? 10 : 20,
    paddingBottom: 20,
  }
});
