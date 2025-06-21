import { Dimensions, ImageBackground, View, Pressable, ToastAndroid } from "react-native";
import FastImage from "react-native-fast-image";
import React, { useState, useEffect, useContext, useCallback } from "react";
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
import QueueBottomSheet from "./QueueBottomSheet";
import Ionicons from "react-native-vector-icons/Ionicons";
import { useActiveTrack } from "react-native-track-player";
import TrackPlayer from 'react-native-track-player';
import Context from "../../Context/Context";
import useDynamicArtwork from '../../hooks/useDynamicArtwork.js';
import { StorageManager } from '../../Utils/StorageManager';

// Import new modular components
import { GestureManager } from './GestureControls';
import { useDownload, DownloadControl } from '../Download';
import { SleepTimerButton } from './SleepTimer';
import { LyricsHandler } from './LyricsHandler';
import { OfflineBanner, LocalTracksList, useOffline } from '../Offline';

// Import new extracted feature components
import { useThemeManager } from './ThemeManager';
import { TidalSourceSwitcher, useTidalIntegration } from './TidalIntegration';
import { useNavigationHandler, BackButtonHandler } from './NavigationHandler';


export const FullScreenMusic = ({ Index, setIndex }) => {
  const width = Dimensions.get("window").width;
  const height = Dimensions.get("window").height;
  const currentPlaying = useActiveTrack();
  const [showLocalTracks, setShowLocalTracks] = useState(false);
  const { musicPreviousScreen } = useContext(Context);
  const { getArtworkSourceFromHook } = useDynamicArtwork();
  const [isLyricsActive, setIsLyricsActive] = useState(false);

  // Use new extracted components
  const { getTextColor, getBackgroundOverlay, getGradientColors } = useThemeManager();
  const { isOffline } = useOffline();
  const { shouldShowTidalFeatures } = useTidalIntegration();
  const { handlePlayerClose } = useNavigationHandler({ musicPreviousScreen });

  // Use the new download hook
  const {
    isDownloaded,
    isDownloading,
    downloadProgress,
    startDownload,
    canDownload
  } = useDownload(currentPlaying, isOffline);

  // Debug: Log currentPlaying object structure
  useEffect(() => {
    if (currentPlaying) {
      console.log("FullScreenMusic: currentPlaying object:", JSON.stringify(currentPlaying, null, 2));
    }
  }, [currentPlaying]);

  // State for local tracks from the manager
  const [localTracks, setLocalTracks] = useState([]);

  const handleLyricsVisibilityChange = (visible) => {
    setIsLyricsActive(visible);
  };



  // Play local track function for the LocalTracksList component
  const playLocalTrack = useCallback(async (track) => {
    try {
      console.log('Playing local track from FullScreenMusic:', track.title);

      // Direct TrackPlayer usage
      await TrackPlayer.reset();
      await TrackPlayer.add([track]);
      await TrackPlayer.play();

      setShowLocalTracks(false); // Close the local tracks list
    } catch (error) {
      console.error('Error playing local track:', error);
      ToastAndroid.show('Error playing track', ToastAndroid.SHORT);
    }
  }, []);

  // Download status is now managed by useDownload hook






  // Handle player close with new navigation handler
  const handlePlayerCloseAction = () => {
    try {
      console.log('Closing fullscreen player');
      // Always minimize the player first
      setIndex(0);
      // Use the extracted navigation handler
      handlePlayerClose();
    } catch (error) {
      console.error('Error in handlePlayerCloseAction:', error);
    }
  };

  // Back button handling is now managed by BackButtonHandler component



  // Download state is now managed by useDownload hook
  // Network monitoring is now managed by NetworkMonitor components
  // Error handling is now managed by the extracted components

  // Render download control using the new modular component
  const renderDownloadControl = () => {
    return (
      <DownloadControl
        isDownloaded={isDownloaded}
        isDownloading={isDownloading}
        downloadProgress={downloadProgress}
        onDownloadPress={startDownload}
        isOffline={isOffline}
        disabled={!canDownload}
        size={28}
      />
    );
  };

  // Download functionality is now handled by the useDownload hook and DownloadManager

  // Permission handling is now managed by the PermissionHandler in the useDownload hook





  // Download status tracking is now handled by the useDownload hook


  // Load local tracks when going offline
  useEffect(() => {
    const loadLocalTracksData = async () => {
      if (isOffline) {
        try {
          const allMetadata = await StorageManager.getAllDownloadedSongsMetadata();

          if (allMetadata && Object.keys(allMetadata).length > 0) {
            const tracks = [];

            for (const [songId, metadata] of Object.entries(allMetadata)) {
              try {
                const songPath = await StorageManager.getSongPath(songId);
                const artworkPath = await StorageManager.getArtworkPath(songId);
                const songExists = await StorageManager.isSongDownloaded(songId);

                if (songExists && songPath) {
                  const track = {
                    id: songId,
                    title: metadata.title || 'Unknown Title',
                    artist: metadata.artist || 'Unknown Artist',
                    album: metadata.album || 'Unknown Album',
                    duration: metadata.duration || 0,
                    url: `file://${songPath}`,
                    artwork: artworkPath ? `file://${artworkPath}` : null,
                    isLocal: true,
                    sourceType: 'downloaded',
                    downloadTime: metadata.downloadTime,
                    ...metadata
                  };

                  tracks.push(track);
                }
              } catch (trackError) {
                console.error(`Error processing track ${songId}:`, trackError);
              }
            }

            setLocalTracks(tracks);
            console.log(`Loaded ${tracks.length} local tracks for offline mode`);
          }
        } catch (error) {
          console.error('Error loading local tracks:', error);
        }
      }
    };

    loadLocalTracksData();
  }, [isOffline]);

  return (
    <BackButtonHandler
      Index={Index}
      setIndex={setIndex}
      musicPreviousScreen={musicPreviousScreen}
    >
      <Animated.View entering={FadeInDown.delay(200)} style={{ backgroundColor: "rgb(0,0,0)", flex: 1 }}>
        {/* Show dynamic artwork (GIF or image) when playing MyMusic tracks or in offline mode */}
        {((currentPlaying && currentPlaying.sourceType === 'mymusic') || isOffline) && (
          <FastImage
            source={getArtworkSourceFromHook(currentPlaying)} // Use the hook
            style={{ width: width, height: height, position: 'absolute', top: 0, left: 0 }}
            resizeMode={FastImage.resizeMode.cover}
            key={`dynamic-bg-${JSON.stringify(getArtworkSourceFromHook(currentPlaying))}`} // Key off the source from hook
          />
        )}

        {/* Local tracks list using new component */}
        <LocalTracksList
          localTracks={localTracks}
          onTrackPress={playLocalTrack}
          onClose={() => setShowLocalTracks(false)}
          visible={showLocalTracks}
          style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 200,
            paddingTop: 60,
            paddingHorizontal: 20
          }}
        />

        <ImageBackground
          source={getArtworkSourceFromHook(currentPlaying)}
          style={{ flex: 1 }}
          resizeMode="cover"
          blurRadius={isLyricsActive ? 25 : 10} // Keep existing blur logic
          onError={() => console.log('Background image failed to load')}
          key={`bg-${JSON.stringify(getArtworkSourceFromHook(currentPlaying))}`}
        >
          <View style={{ flex: 1, backgroundColor: getBackgroundOverlay() }}>
            {/* Offline banner using new component */}
            <OfflineBanner />
          <LinearGradient
            start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
            colors={getGradientColors()}
            style={{ flex: 1, alignItems: "center" }}
          >
            <Pressable
              onPress={() => {
                try {
                  console.log('Down arrow pressed in fullscreen player');
                  setIndex(0); // Just minimize the player
                } catch (error) {
                  console.error('Error in down arrow press handler:', error);
                }
              }}
              style={({ pressed }) => [
                {
                  position: 'absolute',
                  top: 12,
                  left: 20,
                  zIndex: 10,
                  padding: 8,
                  borderRadius: 20,
                  backgroundColor: pressed ? getTextColor('secondary') : 'transparent',
                }
              ]}
            >
              <Ionicons name="chevron-down" size={30} color={getTextColor('primary')} />
            </Pressable>

            {/* Container for LyricsHandler, placed where GetLyricsButton was originally */}
            <View style={{ width: "90%", marginTop: 5, height: 60, alignItems: "center", justifyContent: "flex-end", flexDirection: "row" }}>
              <LyricsHandler currentPlayingTrack={currentPlaying} isOffline={isOffline} Index={Index} onLyricsVisibilityChange={handleLyricsVisibilityChange} currentArtworkSource={getArtworkSourceFromHook(currentPlaying)} />
            </View>

            <Spacer height={5} />
            <GestureManager
              onClose={handlePlayerCloseAction}
              style={{ alignItems: 'center' }}
            >
              <FastImage
                source={getArtworkSourceFromHook(currentPlaying)}
                style={{ height: width * 0.9, width: width * 0.9, borderRadius: 10 }}
                resizeMode={FastImage.resizeMode.contain}
                onError={() => console.log('Artwork FastImage failed to load')}
                key={`artwork-${JSON.stringify(getArtworkSourceFromHook(currentPlaying))}`}
              />
            </GestureManager>
            <Spacer height={20} />

            <Heading
              text={currentPlaying?.title?.length > 18 ? currentPlaying.title.substring(0, 18) + "..." : currentPlaying?.title || (isOffline ? "Offline Mode" : "No music :(")}
              style={{ textAlign: "center", paddingHorizontal: 2, marginBottom: 5, marginTop: 3, fontSize: 30, color: getTextColor('primary') }}
              nospace={true}
            />
            <SmallText
              text={currentPlaying?.artist?.length > 20 ? currentPlaying.artist.substring(0, 20) + "..." : currentPlaying?.artist || (isOffline ? "Local Music Available" : "Explore now!")}
              style={{ textAlign: "center", fontSize: 15, color: getTextColor('secondary') }}
            />
            <Spacer />
            <ProgressBar />
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-around", width: "100%" }}>
              <View><LikeSongButton size={25} /></View>
              <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 20 }}>
                <PreviousSongButton size={30} />
                <PlayPauseButton isFullScreen={true} />
                <NextSongButton size={30} />
              </View>
              <View><RepeatSongButton size={25} /></View>
            </View>
            <Spacer height={10} />
            <View style={{ flexDirection: "row", alignItems: "center", justifyContent: "space-between", width: "80%" }}>
              <SleepTimerButton size={25} />

              {/* Source Switcher using new TidalSourceSwitcher component */}
              {shouldShowTidalFeatures(isOffline) && (
                <TidalSourceSwitcher
                  currentTrack={currentPlaying}
                  variant="chip"
                  size="small"
                />
              )}

              {renderDownloadControl()}
            </View>
          </LinearGradient>
        </View>
      </ImageBackground>
      <QueueBottomSheet Index={1} />
    </Animated.View>
    </BackButtonHandler>
  );
};
