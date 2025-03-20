import { Dimensions, View } from "react-native";
import React, { memo, useContext, useCallback, useState, useEffect } from "react";
import { PlainText } from "../Global/PlainText";
import { SmallText } from "../Global/SmallText";
import Animated, { FadeIn } from "react-native-reanimated";
import { GestureDetector, Gesture, GestureHandlerRootView } from "react-native-gesture-handler";
import { PlayPauseButton } from "./PlayPauseButton";
import { NextSongButton } from "./NextSongButton";
import { PreviousSongButton } from "./PreviousSongButton";
import FastImage from "react-native-fast-image";
import { useActiveTrack, useProgress } from "react-native-track-player";
import { PlayNextSong, PlayPreviousSong } from "../../MusicPlayerFunctions";
import Context from "../../Context/Context";
import TrackPlayer from "react-native-track-player";
import { Pressable } from "react-native";
import NetInfo from "@react-native-community/netinfo";

export const MinimizedMusic = memo(({setIndex, color}) => {
  const { position, duration } = useProgress()
  const { setPreviousScreen } = useContext(Context);
  const [isOffline, setIsOffline] = useState(false);
  const [localTracks, setLocalTracks] = useState([]);
  
  // Check network status
  useEffect(() => {
    const checkConnection = async () => {
      const state = await NetInfo.fetch();
      setIsOffline(!state.isConnected);
    };
    
    checkConnection();
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOffline(!state.isConnected);
    });
    
    return () => unsubscribe();
  }, []);
  
  // Function to play next offline song
  const playNextOfflineSong = useCallback(async () => {
    if (isOffline && localTracks.length > 0) {
      try {
        const queue = await TrackPlayer.getQueue();
        const currentTrack = await TrackPlayer.getActiveTrack();
        if (!currentTrack || queue.length === 0) return;
        
        // Find current track index
        const currentIndex = queue.findIndex(track => track.id === currentTrack.id);
        if (currentIndex === -1) return;
        
        // Calculate next track index (with wrap-around)
        const nextIndex = (currentIndex + 1) % queue.length;
        
        // Skip to the next track
        await TrackPlayer.skip(nextIndex);
        await TrackPlayer.play();
      } catch (error) {
        console.error('Error playing next offline song:', error);
      }
    } else {
      // If online, use the regular function
      PlayNextSong();
    }
  }, [isOffline, localTracks]);

  // Function to play previous offline song
  const playPreviousOfflineSong = useCallback(async () => {
    if (isOffline && localTracks.length > 0) {
      try {
        const queue = await TrackPlayer.getQueue();
        const currentTrack = await TrackPlayer.getActiveTrack();
        if (!currentTrack || queue.length === 0) return;
        
        // Find current track index
        const currentIndex = queue.findIndex(track => track.id === currentTrack.id);
        if (currentIndex === -1) return;
        
        // Calculate previous track index (with wrap-around)
        const prevIndex = (currentIndex - 1 + queue.length) % queue.length;
        
        // Skip to the previous track
        await TrackPlayer.skip(prevIndex);
        await TrackPlayer.play();
      } catch (error) {
        console.error('Error playing previous offline song:', error);
      }
    } else {
      // If online, use the regular function
      PlayPreviousSong();
    }
  }, [isOffline, localTracks]);
  
  const pan = Gesture.Pan();
  pan.onFinalize((e)=>{
    if (e.translationX > 100){
      isOffline ? playPreviousOfflineSong() : PlayPreviousSong();
    } else if(e.translationX < -100){
      isOffline ? playNextOfflineSong() : PlayNextSong();
    } else {
      // Save the current screen before opening fullscreen player
      setIndex(1)
    }
  })
  
  function TotalCompletedInpercent(){
    return (position / duration) * 100
  }
  
  const size = Dimensions.get("window").height
  const currentPlaying = useActiveTrack()
  
  return (
    <GestureHandlerRootView style={{flex:1}}>
      <Animated.View
        entering={FadeIn}
        style={{
          flexDirection: 'row',
          justifyContent:"space-between",
          height:80,
          paddingHorizontal:15,
          paddingVertical:15,
          alignItems:"center",
          gap:10,
          backgroundColor:color,
        }}>
        <GestureDetector gesture={pan}>
          <View  style={{
            flexDirection:"row",
            flex:1,
          }}>
            <FastImage
              source={{
                uri: currentPlaying?.artwork ?? "https://htmlcolorcodes.com/assets/images/colors/gray-color-solid-background-1920x1080.png",
              }}
              style={{
                height: (size *  0.1) - 30,
                width: (size *  0.1) - 30,
                borderRadius: 10,
              }}
            />
            <View style={{
              flex:1,
              height:(size *  0.1) - 30,
              alignItems:"flex-start",
              justifyContent:"center",
              paddingHorizontal:10,
            }}>
              <PlainText 
                text={currentPlaying?.title?.length > 20 ? currentPlaying.title.substring(0, 20) + '...' : currentPlaying?.title ?? "No music :("}
              />
              <SmallText 
                text={currentPlaying?.artist?.length > 20 ? currentPlaying.artist.substring(0, 20) + '...' : currentPlaying?.artist ?? "Explore now!"} 
                maxLine={1}
              />
            </View>
          </View>
        </GestureDetector>
        <View style={{gap:20,flexDirection:"row", alignItems:"center"}}>
          <Pressable onPress={isOffline ? playPreviousOfflineSong : PlayPreviousSong}>
            <PreviousSongButton/>
          </Pressable>
          <PlayPauseButton isplaying={false}/>
          <Pressable onPress={isOffline ? playNextOfflineSong : PlayNextSong}>
            <NextSongButton/>
          </Pressable>
        </View>
      </Animated.View>
      <View style={{height:2, width:`${TotalCompletedInpercent()}%`, backgroundColor:"white"}}/>
    </GestureHandlerRootView>
  );
});
