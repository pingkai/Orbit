import { MainWrapper } from "../../Layout/MainWrapper";
import { View, Image, StyleSheet, Dimensions, ScrollView } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Heading } from "../../Component/Global/Heading";
import { PlainText } from "../../Component/Global/PlainText";
import { BottomNextAndPrevious } from "../../Component/RouteOnboarding/BottomNextAndPrevious";
import { EachCheckBox } from "../../Component/RouteOnboarding/EachCheckBox";
import { useState } from "react";
import { SetLanguageValue } from "../../LocalStorage/Languages";

// Get screen dimensions
const { width, height } = Dimensions.get('window');
const isSmallDevice = height < 700;

export const Slide2 = ({navigation}) => {
  const [Languages, setLanguages] = useState([]);
  
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
        <Animated.View entering={FadeInDown.duration(500)}>
          <Image 
            source={require("../../Images/selectLanguage.gif")} 
            style={styles.headerImage}
          />
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
  headerImage: {
    height: isSmallDevice ? 120 : 200,
    width: isSmallDevice ? 120 : 200,
    borderRadius: 100,
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
