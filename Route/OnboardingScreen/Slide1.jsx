import React from "react";
import { View, StyleSheet, TouchableOpacity, Text, Image, Dimensions } from "react-native";
import { Heading } from "../../Component/Global/Heading";
import { PlainText } from "../../Component/Global/PlainText";
import Animated, { FadeInDown, FadeIn } from "react-native-reanimated";
import { MainWrapper } from "../../Layout/MainWrapper";
import Ionicons from "react-native-vector-icons/Ionicons";

// Get screen dimensions
const { width, height } = Dimensions.get('window');
const isSmallDevice = height < 700;

export const Slide1 = ({ navigation }) => {
  return (
    <View style={styles.background}>
      <MainWrapper>
        {/* Animated Image Logo */}
        <Animated.View entering={FadeIn.duration(600)} style={styles.imageContainer}>
          <Image
            source={require("../../Images/wav.png")}
            style={styles.logo}
          />
        </Animated.View>

        <View style={styles.centeredContent}>
          {/* Welcome Heading */}
          <Animated.View entering={FadeInDown.delay(300)}>
            <Heading text="Feel the Beat, Stay in Orbit!" nospace style={styles.heading} />
          </Animated.View>

          {/* Features */}
          <View style={styles.featuresContainer}>
            {/* Feature 1 - Discover Music */}
            <Animated.View entering={FadeInDown.delay(500)} style={styles.featureContainer}>
              <View style={styles.iconWrapper}>
                <Ionicons name="infinite" size={isSmallDevice ? 22 : 26} color="#32CD32" />
              </View>
              <View style={styles.textWrapper}>
                <PlainText text="Discover Limitless Music" style={styles.featureHeading} />
                <PlainText text="Dive into a vast collection of songs across genres, artists, and eras." style={styles.featureText} />
              </View>
            </Animated.View>

            {/* Feature 2 - Personalized Experience */}
            <Animated.View entering={FadeInDown.delay(700)} style={styles.featureContainer}>
              <View style={styles.iconWrapper}>
                <Ionicons name="person" size={isSmallDevice ? 22 : 26} color="#32CD32" />
              </View>
              <View style={styles.textWrapper}>
                <PlainText text="Personalized Music Experience" style={styles.featureHeading} />
                <PlainText text="Our music app puts you at the center of your musical journey." style={styles.featureText} />
              </View>
            </Animated.View>

            {/* Feature 3 - Ads Free Music */}
            <Animated.View entering={FadeInDown.delay(900)} style={styles.featureContainer}>
              <View style={styles.iconWrapper}>
                <Ionicons name="shield-checkmark" size={isSmallDevice ? 22 : 26} color="#32CD32" />
              </View>
              <View style={styles.textWrapper}>
                <PlainText text="Ads Free Music" style={styles.featureHeading} />
                <PlainText text="Enjoy uninterrupted music without ads." style={styles.featureText} />
              </View>
            </Animated.View>

            {/* Feature 4 - High Quality Audio */}
            <Animated.View entering={FadeInDown.delay(1100)} style={styles.featureContainer}>
              <View style={styles.iconWrapper}>
                <Ionicons name="headset" size={isSmallDevice ? 22 : 26} color="#32CD32" />
              </View>
              <View style={styles.textWrapper}>
                <PlainText text="High Quality Audio" style={styles.featureHeading} />
                <PlainText text="Experience crystal clear sound with high fidelity streaming." style={styles.featureText} />
              </View>
            </Animated.View>
          </View>
        </View>

        {/* Next Step Button */}
        <Animated.View entering={FadeInDown.delay(1300)}>
          <TouchableOpacity
            style={styles.nextButton}
            onPress={() => navigation.replace("Slide2")}
          >
            <Text style={styles.nextButtonText}>Next Step</Text>
          </TouchableOpacity>
        </Animated.View>
      </MainWrapper>
    </View>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    width: "100%",
    height: "100%",
    backgroundColor: "#000",
  },
  imageContainer: {
    alignItems: "center",
    marginTop: isSmallDevice ? 10 : 20,
  },
  logo: {
    width: width * 0.7,
    height: isSmallDevice ? 150 : 200,
    resizeMode: "contain",
  },
  centeredContent: {
    flex: 1,
    alignItems: "center",
    justifyContent: "flex-start",
    paddingHorizontal: 20,
  },
  featuresContainer: {
    width: '100%',
    marginTop: isSmallDevice ? 10 : 20,
  },
  heading: {
    color: "#FFF",
    fontSize: isSmallDevice ? 18 : 20,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: isSmallDevice ? 10 : 20,
    letterSpacing: 1,
  },
  featureContainer: {
    flexDirection: "row",
    alignItems: "center",
    width: "100%",
    backgroundColor: "rgba(50, 205, 50, 0.1)",
    borderRadius: 12,
    padding: isSmallDevice ? 8 : 12,
    marginBottom: isSmallDevice ? 8 : 15,
  },
  iconWrapper: {
    width: isSmallDevice ? 36 : 40,
    height: isSmallDevice ? 36 : 40,
    borderRadius: isSmallDevice ? 18 : 20,
    backgroundColor: "rgba(50, 205, 50, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  textWrapper: {
    flex: 1,
    marginLeft: 12,
  },
  featureHeading: {
    color: "#FFF",
    fontSize: isSmallDevice ? 15 : 17,
    fontWeight: "bold",
  },
  featureText: {
    color: "#AAA",
    fontSize: isSmallDevice ? 12 : 14,
    marginTop: 4,
    lineHeight: isSmallDevice ? 16 : 18,
  },
  nextButton: {
    backgroundColor: "#32CD32",
    paddingVertical: isSmallDevice ? 12 : 14,
    paddingHorizontal: 30,
    borderRadius: 30,
    alignSelf: "center",
    width: "90%",
    shadowColor: "#32CD32",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 6,
    marginBottom: 30,
  },
  nextButtonText: {
    color: "#000",
    fontSize: isSmallDevice ? 16 : 18,
    fontWeight: "bold",
    textAlign: "center",
    letterSpacing: 0.8,
  },
});

export default Slide1;
