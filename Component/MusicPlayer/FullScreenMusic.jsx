import { Dimensions, ImageBackground, View, Pressable } from "react-native";
import FastImage from "react-native-fast-image";
import React, { useState } from "react";
import LinearGradient from "react-native-linear-gradient";
import { Heading } from "../Global/Heading";
import { SmallText } from "../Global/SmallText";
import Animated, { FadeInDown } from "react-native-reanimated";
import { PlayPauseButton } from "./PlayPauseButton";
import { Spacer } from "../Global/Spacer";
import { NextSongButton } from "./NextSongButton";
import { PreviousSongButton } from "./PreviousSongButton";
import { RepeatSongButton } from "./RepeatSongButton";
import { LikeSongButton } from "./LikeSongButton";
import { ProgressBar } from "./ProgressBar";
import { GetLyricsButton } from "./GetLyricsButton";
import QueueBottomSheet from "./QueueBottomSheet";
import { getLyricsSongData } from "../../Api/Songs";
import { ShowLyrics } from "./ShowLyrics";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useActiveTrack } from "react-native-track-player";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { PlayNextSong, PlayPreviousSong } from "../../MusicPlayerFunctions";
import SleepTimerButton from "./SleepTimer";
import ReactNativeBlobUtil from "react-native-blob-util";
import { PermissionsAndroid, Platform, ToastAndroid } from "react-native";
import DeviceInfo from "react-native-device-info";
import { GetDownloadPath } from "../../LocalStorage/AppSettings";

export const FullScreenMusic = ({ color, Index, setIndex }) => {
  const pan = Gesture.Pan();
  pan.onFinalize((e) => {
    if (e.translationX > 100) {
      PlayPreviousSong()
    } else if (e.translationX < -100) {
      PlayNextSong()
    } else {
      setIndex(0)
    }
  })
  const width = Dimensions.get("window").width
  const currentPlaying = useActiveTrack()
  const [ShowDailog, setShowDailog] = useState(false);
  const [Lyric, setLyric] = useState({});
  const [Loading, setLoading] = useState(false);

  async function GetLyrics() {
    setShowDailog(true)
    try {
      setLoading(true)
      const Lyrics = await getLyricsSongData(currentPlaying.id)
      if (Lyrics.success) {
        setLyric(Lyrics.data)
      } else {
        setLyric({
          lyrics: "No Lyrics Found \nOpps... O_o",
        })
      }
    } catch (e) {
      console.log(e);
      setLyric({
        lyrics: "No Lyrics Found \nOpps... O_o",
      })
    } finally {
      setLoading(false)
    }
  }
  const actualDownload = async () => {
    let dirs = ReactNativeBlobUtil.fs.dirs;
    const path = await GetDownloadPath();
    ToastAndroid.showWithGravity(
      `Download Started`,
      ToastAndroid.SHORT,
      ToastAndroid.CENTER,
    );
    ReactNativeBlobUtil
      .config({
        addAndroidDownloads: {
          useDownloadManager: true,
          path: (path === "Downloads") ? dirs.LegacyDownloadDir + `/Orbit/${currentPlaying.title}.m4a` : dirs.LegacyMusicDir + `/Orbit/${currentPlaying.title}.m4a`,
          notification: true,
          title: `${currentPlaying.title}`,
        },
        fileCache: true,
      })
      .fetch('GET', currentPlaying.url, {})
      .then((res) => {
        console.log('The file saved to ', res.path());
        ToastAndroid.showWithGravity(
          "Download successfully Completed",
          ToastAndroid.SHORT,
          ToastAndroid.CENTER,
        );
      })
      .catch((error) => {
        console.log("Download error", error);
        ToastAndroid.showWithGravity(
          "Download failed",
          ToastAndroid.SHORT,
          ToastAndroid.CENTER,
        );
      });
  };
  const getPermission = async () => {
    if (Platform.OS === 'ios') {
      actualDownload();
    } else {
      try {
        let deviceVersion = DeviceInfo.getSystemVersion();
        let granted = PermissionsAndroid.RESULTS.DENIED;
        if (deviceVersion >= 13) {
          granted = PermissionsAndroid.RESULTS.GRANTED;
        } else {
          granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          );
        }
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          actualDownload();
        } else {
          console.log("Please grant permission");
        }
      } catch (err) {
        console.log("Permission error", err);
      }
    }
  };
  return (
    <Animated.View entering={FadeInDown.delay(200)} style={{ backgroundColor: "rgb(0,0,0)", flex: 1 }}>
      <ShowLyrics Loading={Loading} Lyric={Lyric} setShowDailog={setShowDailog} ShowDailog={ShowDailog} />
      <ImageBackground blurRadius={20} source={{ uri: currentPlaying?.artwork ?? "https://htmlcolorcodes.com/assets/images/colors/gray-color-solid-background-1920x1080.png" }} style={{
        flex: 1,
      }}>
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.44)" }}>
          <LinearGradient start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }} colors={['rgba(4,4,4,0.23)', 'rgba(9,9,9,0.47)', 'rgba(0,0,0,0.65)', 'rgba(0,0,0,0.89)', 'rgba(0,0,0,0.9)', "rgba(0,0,0,1)"]} style={{ flex: 1, alignItems: "center" }}>
          <Pressable
              onPress={() => setIndex(0)}
              style={{
                position: 'absolute',
                top: 20,
                left: 20,
                zIndex: 10,
              }}>
              <Ionicons name="chevron-down" size={30} color="white" />
            </Pressable>
            <View style={{
              width: "90%",
              marginTop: 5,
              height: 60,
              alignItems: "center",
              justifyContent: "flex-end",
              flexDirection: "row",
            }}>
              <GetLyricsButton onPress={GetLyrics} />
            </View>
            <Spacer height={20} />
            <GestureDetector gesture={pan}>
              <FastImage
                source={{
                  uri: currentPlaying?.artwork ?? "https://htmlcolorcodes.com/assets/images/colors/gray-color-solid-background-1920x1080.png",
                }}
                style={{
                  height: width * 0.9,
                  width: width * 0.9,
                  borderRadius: 10,
                }}
              />
            </GestureDetector>
            <Spacer />
            <Heading 
              text={
                currentPlaying?.title 
                  ? currentPlaying.title.length > 20 
                    ? currentPlaying.title.substring(0, 20) + "..." 
                    : currentPlaying.title 
                  : "No music :("
              } 
              style={{ textAlign: "center", paddingHorizontal: 2, marginBottom: 10, marginTop: 5, fontSize: 30 }} 
              nospace={true} 
            />
            <SmallText
              text={currentPlaying?.artist
                ? currentPlaying.artist.length > 20
                  ? currentPlaying.artist.substring(0, 20) + "..."
                  : currentPlaying.artist
                : "Explore now!"
              }
              style={{ textAlign: "center", paddingHorizontal: 2, fontSize: 15 }}
            />
            <Spacer />
            <ProgressBar />
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-around", width: "100%" }}>
              <View >
                <LikeSongButton size={25} />
              </View>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 20 }}>
                <PreviousSongButton size={30} />
                <PlayPauseButton isFullScreen={true} />
                <NextSongButton size={30} />
              </View>
              <View >
                <RepeatSongButton size={25} />
              </View>
            </View>
            <Spacer height={10} />
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", width: "80%" }}>
              <SleepTimerButton 
                size={25} 
                onSleepComplete={() => {
                  PlayPauseButton.pause();
                }}
              />
              <Pressable onPress={getPermission}>
                <Ionicons name="download-outline" size={25} color="white" />
              </Pressable>
            </View>
          </LinearGradient>
        </View>
      </ImageBackground>
      <QueueBottomSheet Index={1} />
    </Animated.View>
  );
};
