import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import React from "react";
import { useTheme } from "@react-navigation/native";
import { Pressable } from "react-native";

export const GetLyricsButton = ({ onPress }) => {
  const theme = useTheme()
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        paddingVertical: 8,
        paddingLeft: 8,
        paddingRight: 4,
        borderRadius: 20,
        backgroundColor: pressed ? 'rgba(255, 255, 255, 0.1)' : 'transparent',
      })}
    >
      <MaterialIcons name={"lyrics"} size={25} color={theme.colors.text}/>
    </Pressable>
  );
};
