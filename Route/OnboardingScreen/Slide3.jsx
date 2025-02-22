import { MainWrapper } from "../../Layout/MainWrapper";
import { Dimensions, TextInput, View, StyleSheet,Image } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Heading } from "../../Component/Global/Heading";
import { BottomNextAndPrevious } from "../../Component/RouteOnboarding/BottomNextAndPrevious";
import { useState } from "react";
import { useTheme } from "@react-navigation/native";
import { SetUserNameValue } from "../../LocalStorage/StoreUserName";

export const Slide3 = ({navigation}) => {
  const width = Dimensions.get("window").width;
  const theme = useTheme();
  const [name, setName] = useState("");

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: 20,
    },
    imageContainer: {
      shadowColor: theme.colors.text,
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.1,
      shadowRadius: 8,
      elevation: 5,
    },
    profileImage: {
      height: 180,
      width: 180,
      borderRadius: 90,
    },
    headingContainer: {
      marginVertical: 24,
    },
    input: {
      borderWidth: 1.5,
      borderColor: theme.colors.border,
      backgroundColor: theme.dark ? 'rgba(53,58,70,0.8)' : 'rgba(255,255,255,0.8)',
      borderRadius: 16,
      padding: 15,
      width: width * 0.7,
      color: theme.colors.text,
      fontSize: 16,
      shadowColor: theme.colors.text,
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
          entering={FadeInDown.duration(500)}
          style={styles.imageContainer}
        >
          <Image 
            source={require("../../Images/GiveName.gif")} 
            style={styles.profileImage}
          />
        </Animated.View>
        
        <Animated.View 
          entering={FadeInDown.delay(500)}
          style={styles.headingContainer}
        >
          <Heading 
            text={"Enter Your Name"} 
            nospace={true}
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
              backgroundColor: '#333333',
              color: '#FFFFFF',
              fontSize: 20,  // Increased from 16 to 20
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
