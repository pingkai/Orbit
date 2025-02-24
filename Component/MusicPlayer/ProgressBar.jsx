import Slider from "@react-native-community/slider";
import React from "react";
import { Dimensions, View } from "react-native";
import { useProgress } from "react-native-track-player";
import { SetProgressSong } from "../../MusicPlayerFunctions";
import { SmallText } from "../Global/SmallText";

export const ProgressBar = () => {
  const width = Dimensions.get("window").width;
  const { position, duration } = useProgress(); // Get current position and duration

  const formatTime = (val) => {
    if (isNaN(val)) return "0:00"; // Handle NaN values
    const time = parseFloat(val);
    const minutes = Math.floor(time / 60);
    const seconds = Math.floor(time % 60);
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`; // Format time as mm:ss
  };

  return (
    <>
      <Slider
        onSlidingComplete={(progress) => {
          SetProgressSong(progress); // Update track position on slide complete
        }}
        style={{ width: width * 0.95, height: 40 }}
        minimumValue={0}
        maximumValue={duration || 1} // Avoid division by zero
        value={position >= duration ? 0 : position} // Reset position if it exceeds duration
        minimumTrackTintColor={"white"}
        maximumTrackTintColor="rgba(44,44,44,1)"
        thumbTintColor={"white"}
      />
      <View style={{ flexDirection: "row", justifyContent: "space-between", width: "90%" }}>
        <SmallText text={position >= duration ? "0:00" : formatTime(position)} style={{ fontSize: 15 }} />
        <SmallText text={formatTime(duration)} style={{ fontSize: 15 }} />
      </View>
    </>
  );
};
