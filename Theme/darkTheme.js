import { DefaultTheme } from "@react-navigation/native";
import { Dimensions } from "react-native";

const width = Dimensions.get("window").width;

export const darkTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    primary: '#6CC04A',
    text: '#F4F5FC',
    textSecondary: '#CCCCCC',
    white: "white",
    spacing: 10,
    headingSize: width * 0.085,
    fontSize: width * 0.045,
    disabled: 'rgb(131,131,131)',
    background: '#101010',
    card: '#1E1E1E',
    border: '#333333',
    notification: '#6CC04A',
    cardSurface: '#222722',
    settingsButtonBg: 'rgb(34,39,34)',
    dropdownBg: '#2C2C2E', // Dark background for dropdown
    dropdownText: '#F4F5FC', // Light text for dropdown items
    icon: '#F4F5FC',
    subtitle: '#CCCCCC',
    buttonText: '#F4F5FC',
    placeholder: '#888888',
    searchBar: '#1E1E1E',
    modalBackground: '#1E1E1E',
    headerBackground: '#101010',
    tabBarBackground: '#1E1E1E',
    tabBarActive: '#6CC04A',
    tabBarInactive: '#888888',
    musicPlayerBg: '#1E1E1E',
    playerControlsBg: '#101010',
  },
};
