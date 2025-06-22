import React from "react";
import { View } from "react-native";
import { PlayPauseButton } from "./PlayPauseButton";
import { NextSongButton } from "./NextSongButton";
import { PreviousSongButton } from "./PreviousSongButton";
import { RepeatSongButton } from "./RepeatSongButton";
import { LikeSongButton } from "./LikeSongButton";
import { Spacer } from "../Global/Spacer";

export const PlaybackControls = ({ 
  style,
  likeButtonSize = 25,
  navigationButtonSize = 30,
  showLikeButton = true,
  showRepeatButton = true
}) => {
  return (
    <>
      <View style={{ 
        flexDirection: "row", 
        alignItems: "center", 
        justifyContent: "space-around", 
        width: "100%",
        ...style?.container
      }}>
        {showLikeButton && (
          <View>
            <LikeSongButton size={likeButtonSize} />
          </View>
        )}
        
        <View style={{ 
          flexDirection: "row", 
          alignItems: "center", 
          justifyContent: "center", 
          gap: 20,
          ...style?.navigationControls
        }}>
          <PreviousSongButton size={navigationButtonSize} />
          <PlayPauseButton isFullScreen={true} />
          <NextSongButton size={navigationButtonSize} />
        </View>
        
        {showRepeatButton && (
          <View>
            <RepeatSongButton size={likeButtonSize} />
          </View>
        )}
      </View>
      <Spacer height={10} />
    </>
  );
};
