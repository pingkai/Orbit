import { MainWrapper } from "../../Layout/MainWrapper";
import { Dimensions, TextInput, View, StyleSheet, Image } from "react-native";
import Animated, { FadeInDown } from "react-native-reanimated";
import { Heading } from "../../Component/Global/Heading";
import { BottomNextAndPrevious } from "../../Component/RouteOnboarding/BottomNextAndPrevious";
import { useState } from "react";
import { useTheme } from "@react-navigation/native";
import { SetUserNameValue } from "../../LocalStorage/StoreUserName";

// Get screen dimensions
const { width, height } = Dimensions.get('window');
const isSmallDevice = height < 700;

export const Slide3 = ({navigation}) => {
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
      marginTop: isSmallDevice ? -10 : 0,
    },
    profileImage: {
      height: isSmallDevice ? 140 : 180,
      width: isSmallDevice ? 140 : 180,
      borderRadius: isSmallDevice ? 70 : 90,
    },
    headingContainer: {
      marginVertical: isSmallDevice ? 16 : 24,
    },
    heading: {
      fontSize: isSmallDevice ? 22 : 26,
    },
    input: {
      borderWidth: 1.5,
      borderColor: theme.colors.border,
      backgroundColor: '#333333',
      borderRadius: 16,
      padding: isSmallDevice ? 12 : 15,
      width: width * 0.7,
      color: '#FFFFFF',
      fontSize: isSmallDevice ? 18 : 20,
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
            style={styles.heading}
          />
        </Animated.View>

        <TextInput
          value={name}
          onChangeText={setName}
          textAlign={'center'}
          placeholder={"Enter your name"}
          placeholderTextColor={'#FFFFFF'}
          style={styles.input}
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
