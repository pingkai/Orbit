import FontAwesome6 from "react-native-vector-icons/FontAwesome6";
import { useTheme } from "@react-navigation/native";
import { ActivityIndicator, Pressable } from "react-native";
import {  PauseSong, PlaySong } from "../../MusicPlayerFunctions";
import { usePlaybackState } from "react-native-track-player";
import { useRef, useCallback } from "react";

export const PlayPauseButton = ({isFullScreen, color}) => {
  const theme = useTheme()
  const playerState = usePlaybackState();
  const lastActionTimeRef = useRef(0);
  const isProcessingRef = useRef(false);

  // Debounced play/pause functions to prevent rapid state changes
  const debouncedPlay = useCallback(async () => {
    const now = Date.now();
    if (now - lastActionTimeRef.current < 500 || isProcessingRef.current) {
      return; // Prevent rapid successive calls
    }

    lastActionTimeRef.current = now;
    isProcessingRef.current = true;

    try {
      await PlaySong();
    } catch (error) {
      console.log("Error in play action:", error);
    } finally {
      // Reset processing flag after a delay
      setTimeout(() => {
        isProcessingRef.current = false;
      }, 300);
    }
  }, []);

  const debouncedPause = useCallback(async () => {
    const now = Date.now();
    if (now - lastActionTimeRef.current < 500 || isProcessingRef.current) {
      return; // Prevent rapid successive calls
    }

    lastActionTimeRef.current = now;
    isProcessingRef.current = true;

    try {
      await PauseSong();
    } catch (error) {
      console.log("Error in pause action:", error);
    } finally {
      // Reset processing flag after a delay
      setTimeout(() => {
        isProcessingRef.current = false;
      }, 300);
    }
  }, []);
  return (
    <>
      {!isFullScreen &&  <>
        {playerState.state !== "playing" && playerState.state !== "buffering" && <Pressable style={{
          padding:5,
        }}  onPress={debouncedPlay}><FontAwesome6 name={"play"} size={20} color={color || theme.colors.text}/></Pressable>}
        {playerState.state === "playing" && <Pressable style={{
          padding:5,
        }} onPress={debouncedPause}><FontAwesome6 name={"pause"} size={20} color={color || theme.colors.text}/></Pressable>}
        {playerState.state === "buffering" && <ActivityIndicator size={"small"} color={color || theme.colors.text}/>}
      </>}
      {isFullScreen && <>
        {playerState.state !== "playing" && playerState.state !== "buffering" && <Pressable onPress={debouncedPlay} style={{
          backgroundColor:theme.colors.buttonBackground,
          padding:15,
          height:60,
          width:60,
          borderRadius:1000,
          alignItems:"center",
          justifyContent:"center",
        }}>
          <FontAwesome6 name={"play"} size={32} color={theme.colors.buttonText}/>
        </Pressable>}
        {playerState.state === "playing" &&  <Pressable onPress={debouncedPause} style={{
          backgroundColor:theme.colors.buttonBackground,
          padding:15,
          height:60,
          width:60,
          borderRadius:1000,
          alignItems:"center",
          justifyContent:"center",
        }}><FontAwesome6 name={"pause"} size={32} color={theme.colors.buttonText}/></Pressable>}
        {playerState.state === "buffering" && <ActivityIndicator size={"large"} color={theme.colors.buttonText}/>}
      </>}
    </>
  );
};
