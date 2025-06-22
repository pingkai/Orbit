import Slider from "@react-native-community/slider";
import React, { useState, useEffect } from "react";
import { Dimensions, View } from "react-native";
import { useProgress, useActiveTrack } from "react-native-track-player";
import { SetProgressSong } from "../../MusicPlayerFunctions";
import { SmallText } from "../Global/SmallText";
import { useThemeContext } from "../../Context/ThemeContext"; // Changed to useThemeContext

export const ProgressBar = () => {
  const { theme, themeMode } = useThemeContext(); // Changed to useThemeContext, added themeMode
  const width = Dimensions.get("window").width;
  const { position, duration } = useProgress(); // Get current position and duration
  const currentTrack = useActiveTrack();
  const [isSliding, setIsSliding] = useState(false);
  const [sliderValue, setSliderValue] = useState(0);

  // Update slider value when not sliding
  useEffect(() => {
    if (!isSliding && position !== undefined) {
      setSliderValue(position);
    }
  }, [position, isSliding]);

  // Reset slider when track changes
  useEffect(() => {
    setSliderValue(0);
    setIsSliding(false);
  }, [currentTrack?.id]);

  const formatTime = (val) => {
    if (isNaN(val) || val < 0) return "0:00"; // Handle NaN and negative values
    // Round to nearest second for more accurate display
    const time = Math.round(parseFloat(val));
    const minutes = Math.floor(time / 60);
    const seconds = time % 60;
    return `${minutes}:${seconds < 10 ? "0" : ""}${seconds}`; // Format time as mm:ss
  };

  // Get accurate duration - prefer track metadata over useProgress
  const getAccurateDuration = () => {
    // Try to get duration from track metadata first
    if (currentTrack?.duration && currentTrack.duration > 0) {
      return currentTrack.duration;
    }
    // Fallback to useProgress duration
    return duration || 0;
  };

  const accurateDuration = getAccurateDuration();

  // Debug logging for duration inconsistencies (only in development)
  useEffect(() => {
    if (currentTrack && duration && currentTrack.duration) {
      const trackDuration = currentTrack.duration;
      const progressDuration = duration;
      const difference = Math.abs(trackDuration - progressDuration);

      // Log if there's a significant difference (more than 5 seconds)
      if (difference > 5) {
        console.log('Duration inconsistency detected:', {
          track: currentTrack.title,
          trackMetadataDuration: formatTime(trackDuration),
          useProgressDuration: formatTime(progressDuration),
          difference: formatTime(difference)
        });
      }
    }
  }, [currentTrack?.id, duration, currentTrack?.duration]);

  return (
    <>
      <Slider
        onSlidingStart={() => setIsSliding(true)}
        onValueChange={(value) => {
          if (isSliding) {
            setSliderValue(value);
          }
        }}
        onSlidingComplete={(progress) => {
          setIsSliding(false);
          SetProgressSong(progress); // Update track position on slide complete
        }}
        style={{ width: width * 0.95, height: 40 }}
        minimumValue={0}
        maximumValue={Math.max(accurateDuration, 1)} // Use accurate duration
        value={isSliding ? sliderValue : Math.min(Math.max(position || 0, 0), accurateDuration)} // Use slider value when sliding
        minimumTrackTintColor={theme.colors.primary}
        maximumTrackTintColor={themeMode === 'light' ? '#E0E0E0' : 'rgba(44,44,44,1)'}
        thumbTintColor={theme.colors.primary}
      />
      <View style={{ flexDirection: "row", justifyContent: "space-between", width: "90%" }}>
        <SmallText
          text={formatTime(isSliding ? sliderValue : Math.max(position || 0, 0))}
          style={{ fontSize: 15, color: theme.colors.text }}
        />
        <SmallText
          text={formatTime(accurateDuration)}
          style={{ fontSize: 15, color: theme.colors.text }}
        />
      </View>
    </>
  );
};
