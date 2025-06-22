import { MainWrapper } from "../../Layout/MainWrapper";
import { Dimensions, Pressable, TextInput, ToastAndroid, View } from "react-native";
import Animated, { FadeInDown, useSharedValue, useAnimatedStyle, withRepeat, withTiming } from "react-native-reanimated";
import { Heading } from "../../Component/Global/Heading";
import { useState, useEffect } from "react";
import { SetUserNameValue } from "../../LocalStorage/StoreUserName";
import { useTheme } from "@react-navigation/native";
import { PlainText } from "../../Component/Global/PlainText";
import { Spacer } from "../../Component/Global/Spacer";
import Ionicons from "react-native-vector-icons/Ionicons";

export const ChangeName = ({navigation}) => {
  const width = Dimensions.get("window").width
  const theme  = useTheme()
  const [Name, setName] = useState("");

  // Animation values
  const scale = useSharedValue(1);
  const rotation = useSharedValue(0);

  useEffect(() => {
    // Breathing animation
    scale.value = withRepeat(
      withTiming(1.1, { duration: 2000 }),
      -1,
      true
    );

    // Gentle rotation
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
  async function OnConfirm(name){
    if (name === ""){
      // eslint-disable-next-line no-alert
      alert("Please Enter name!")
    } else {
      await SetUserNameValue(name.trim())
      navigation.pop()
      ToastAndroid.showWithGravity(
        `Please restart the app`,
        ToastAndroid.SHORT,
        ToastAndroid.CENTER,
      );
    }
  }
  return (
    <MainWrapper>
      <View style={{
        alignItems:"center",
        justifyContent:"center",
        flex:1,
      }}>
        <Animated.View entering={FadeInDown.duration(500)} style={{
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
        }}>
          {/* Animated gradient background */}
          <Animated.View style={[{
            position: 'absolute',
            width: 220,
            height: 220,
            borderRadius: 110,
            backgroundColor: theme.colors.primary + '20',
          }, animatedGradientStyle]} />

          {/* Main icon container */}
          <Animated.View style={[{
            width: 200,
            height: 200,
            borderRadius: 100,
            backgroundColor: theme.colors.primary,
            justifyContent: 'center',
            alignItems: 'center',
            shadowColor: theme.colors.primary,
            shadowOffset: { width: 0, height: 8 },
            shadowOpacity: 0.3,
            shadowRadius: 16,
            elevation: 8,
          }, animatedIconStyle]}>
            <Ionicons
              name="person-add"
              size={80}
              color="white"
            />
          </Animated.View>
        </Animated.View>
        <Animated.View  entering={FadeInDown.delay(500)}><Heading text={"What should I call you?"} nospace={true} style={{marginTop:10,marginBottom:10}}/></Animated.View>
        <TextInput placeholderTextColor={theme.colors.text} value={Name} onChangeText={(text)=>{
          setName(text)
        }} textAlign={'center'} placeholder={"Enter your name"} style={{
          borderWidth:2,
          backgroundColor:"rgb(53,58,70)",
          borderRadius:10,
          padding:10,
          width:width * 0.5,
          color:theme.colors.text,
        }}/>
        <Spacer/>
        <Pressable onPress={()=>{
          OnConfirm(Name)
        }} style={{
          padding:15,
          alignItems:"center",
          justifyContent:'center',
          backgroundColor:"#32CD32",
          borderRadius:10,
          marginTop:10,
        }}>
          <PlainText text={"Change Name"} style={{
            color:"black",
          }}/>
        </Pressable>
      </View>
    </MainWrapper>
  );
};
