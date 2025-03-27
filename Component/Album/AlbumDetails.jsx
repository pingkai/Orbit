import { Dimensions, View, TouchableOpacity, Alert, ToastAndroid } from "react-native";
import { Heading } from "../Global/Heading";
import Ionicons from "react-native-vector-icons/Ionicons";
import { SmallText } from "../Global/SmallText";
import { Spacer } from "../Global/Spacer";
import LinearGradient from "react-native-linear-gradient";
import { useTheme } from "@react-navigation/native";
import { AddPlaylist, PlaySong, PauseSong, getIndexQuality } from "../../MusicPlayerFunctions";
import { PlayButton } from "../Playlist/PlayButton";
import { useContext, useState, useEffect } from "react";
import Context from "../../Context/Context";
import FormatArtist from "../../Utils/FormatArtists";
import FormatTitleAndArtist from "../../Utils/FormatTitleAndArtist";
import TrackPlayer, { State } from "react-native-track-player";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import AntDesign from "react-native-vector-icons/AntDesign";
import { StorageManager } from '../../Utils/StorageManager';
import ReactNativeBlobUtil from "react-native-blob-util";
import { PermissionsAndroid, Platform } from "react-native";
import DeviceInfo from "react-native-device-info";
import RNFS from "react-native-fs";
import { safeExists, safeDownloadFile, ensureDirectoryExists } from '../../Utils/FileUtils';
import EventRegister from '../../Utils/EventRegister';

// Circular progress component for download indicator
const CircularProgress = ({ progress, size = 20, thickness = 2, color = '#1DB954' }) => {
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      {/* Background circle */}
      <View style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.2)'
      }}>
        {/* Filled portion based on progress */}
        <View style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: `${progress}%`,
          backgroundColor: color,
        }} />
        
        {/* Percentage text */}
        <SmallText
          text={`${Math.round(progress)}%`}
          style={{
            fontSize: size <= 30 ? 8 : 12,
            color: 'white',
            fontWeight: 'bold',
            textShadowColor: 'rgba(0,0,0,0.75)',
            textShadowOffset: {width: 0, height: 1},
            textShadowRadius: 2
          }}
        />
      </View>
    </View>
  );
};

// Function to truncate text
const truncateText = (text, limit = 20) => {
  if (!text) return '';
  return text.length > limit ? text.substring(0, limit) + '...' : text;
};

export const AlbumDetails = ({name,releaseData,liked,Data}) => {
  const {updateTrack, currentPlaying} = useContext(Context);
  const [isCurrentlyPlaying, setIsCurrentlyPlaying] = useState(false);
  const [downloadStatus, setDownloadStatus] = useState({});
  const [isDownloading, setIsDownloading] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);
  
  // Check if songs from this album are currently playing
  useEffect(() => {
    const checkPlaybackState = async () => {
      try {
        if (currentPlaying && currentPlaying.albumId === Data?.data?.id) {
          const state = await TrackPlayer.getState();
          setIsCurrentlyPlaying(state === State.Playing);
        } else {
          setIsCurrentlyPlaying(false);
        }
      } catch (err) {
        console.error('Error checking album playback state:', err);
        setIsCurrentlyPlaying(false);
      }
    };
    
    checkPlaybackState();
    
    // Set up event listener for track player state changes
    const playerStateListener = TrackPlayer.addEventListener(
      'playback-state',
      () => {
        checkPlaybackState();
      }
    );
    
    return () => playerStateListener.remove();
  }, [currentPlaying, Data?.data?.id]);

  // Check download status of songs in the album
  useEffect(() => {
    const checkDownloadedSongs = async () => {
      if (!Data?.data?.songs) return;
      
      const songStatuses = {};
      let downloadedCount = 0;
      
      // Check each song's download status
      for (const song of Data.data.songs) {
        const isDownloaded = await StorageManager.isSongDownloaded(song.id);
        songStatuses[song.id] = {
          isDownloaded,
          progress: isDownloaded ? 100 : 0,
          isDownloading: false
        };
        
        if (isDownloaded) {
          downloadedCount++;
        }
      }
      
      setDownloadStatus(songStatuses);
      
      // If all songs are downloaded, set overall progress to 100%
      if (downloadedCount === Data.data.songs.length) {
        setOverallProgress(100);
      } else {
        setOverallProgress(Math.floor((downloadedCount / Data.data.songs.length) * 100));
      }
    };
    
    checkDownloadedSongs();
  }, [Data?.data?.songs]);
  
  // Handle play/pause action
  const handlePlayPause = async () => {
    try {
      // If songs from this album are already playing, just toggle pause/play
      if (currentPlaying && currentPlaying.albumId === Data?.data?.id) {
        const state = await TrackPlayer.getState();
        if (state === State.Playing) {
          // Already playing, so pause
          await PauseSong();
        } else {
          // Already loaded but paused, so play
          await PlaySong();
        }
        updateTrack();
      } else {
        // Not playing this album yet, so start fresh
        await AddToPlayer();
      }
    } catch (error) {
      console.error('Error handling play/pause:', error);
    }
  };
  
  // Add songs to player queue and start playback
  async function AddToPlayer(){
    try {
      const quality = await getIndexQuality();
    const ForMusicPlayer = Data?.data?.songs?.map((e,i)=>{
      return {
        url:e?.downloadUrl[quality].url,
        title:FormatTitleAndArtist(e?.name),
        artist:FormatTitleAndArtist(FormatArtist(e?.artists?.primary)),
        artwork:e?.image[2]?.url,
        image:e?.image[2]?.url,
        duration:e?.duration,
        id:e?.id,
          albumId: Data?.data?.id,
        language:e?.language,
        artistID:e?.primary_artists_id,
      }
      });
      
      await AddPlaylist(ForMusicPlayer);
      updateTrack();
    } catch (error) {
      console.error('Error adding album to player:', error);
    }
  }

  // Get storage permissions (for Android)
  const getPermission = async () => {
    try {
      if (Platform.OS === 'ios') {
        downloadAllSongs();
        return;
      }
      
      const deviceVersion = DeviceInfo.getSystemVersion();
      
      if (parseInt(deviceVersion) >= 13) {
        downloadAllSongs();
      } else {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          {
            title: "Storage Permission",
            message: "Orbit needs storage access to save music for offline playback",
            buttonPositive: "Allow",
            buttonNegative: "Cancel"
          }
        );
        
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          downloadAllSongs();
        } else {
          Alert.alert(
            "Permission Denied",
            "Storage permission is required to download songs. Please enable it in app settings."
          );
        }
      }
    } catch (error) {
      console.error('Error requesting permissions:', error);
      Alert.alert('Error', 'Could not request storage permissions');
    }
  };
  
  // Download all songs in the album
  const downloadAllSongs = async () => {
    if (isDownloading) {
      ToastAndroid.show('Download already in progress', ToastAndroid.SHORT);
      return;
    }
    
    try {
      // Check if all songs are already downloaded
      const allDownloaded = Object.values(downloadStatus).every(status => status.isDownloaded);
      if (allDownloaded) {
        ToastAndroid.show('All songs already downloaded', ToastAndroid.SHORT);
        return;
      }
      
      setIsDownloading(true);
      ToastAndroid.show(`Downloading ${Data.data.songs.length} songs from album`, ToastAndroid.SHORT);
      
      // Ensure directories exist
      const baseDir = RNFS.DocumentDirectoryPath + '/orbit_music';
      await ensureDirectoryExists(baseDir);
      await ensureDirectoryExists(baseDir + '/songs');
      await ensureDirectoryExists(baseDir + '/artwork');
      await ensureDirectoryExists(baseDir + '/metadata');
      
      // Get quality setting
      const quality = await getIndexQuality();
      let completedDownloads = 0;
      
      // Download songs in parallel (max 3 at a time)
      const chunks = [];
      const songs = [...Data.data.songs];
      const chunkSize = 3;
      
      while (songs.length > 0) {
        chunks.push(songs.splice(0, chunkSize));
      }
      
      for (const chunk of chunks) {
        await Promise.all(chunk.map(async (song) => {
          // Skip already downloaded songs
          if (downloadStatus[song.id]?.isDownloaded) {
            completedDownloads++;
            setOverallProgress(Math.floor((completedDownloads / Data.data.songs.length) * 100));
            return;
          }
          
          // Mark song as downloading
          setDownloadStatus(prev => ({
            ...prev,
            [song.id]: {
              ...prev[song.id],
              isDownloading: true
            }
          }));
          
          try {
            // Download song
            const songUrl = song.downloadUrl[quality]?.url;
            if (!songUrl) {
              console.error('No URL available for song:', song.name);
              throw new Error('No download URL available');
            }
            
            const songPath = `${baseDir}/songs/${song.id}.mp3`;
            
            // Download with progress tracking
            const res = await ReactNativeBlobUtil.config({
              fileCache: false,
              path: songPath,
              overwrite: true,
              indicator: true
            })
            .fetch('GET', songUrl)
            .progress((received, total) => {
              if (total <= 0) return;
              const percentage = Math.floor((received / total) * 100);
              
              // Update progress for this specific song
              setDownloadStatus(prev => ({
                ...prev,
                [song.id]: {
                  ...prev[song.id],
                  progress: percentage
                }
              }));
            });
            
            if (res.info().status !== 200) {
              throw new Error(`Download failed with status: ${res.info().status}`);
            }
            
            // Download artwork
            if (song.image && song.image[2]?.url) {
              const artworkPath = `${baseDir}/artwork/${song.id}.jpg`;
              await safeDownloadFile(song.image[2].url, artworkPath);
            }
            
            // Save metadata
            await StorageManager.saveDownloadedSongMetadata(song.id, {
              id: song.id,
              title: song.name || 'Unknown',
              artist: FormatArtist(song.artists?.primary) || 'Unknown',
              album: name || 'Unknown',
              url: songUrl,
              artwork: song.image[2]?.url || null,
              duration: song.duration || 0,
              downloadedAt: new Date().toISOString()
            });
            
            // Mark as downloaded
            setDownloadStatus(prev => ({
              ...prev,
              [song.id]: {
                isDownloaded: true,
                progress: 100,
                isDownloading: false
              }
            }));
            
            // Update overall progress
            completedDownloads++;
            setOverallProgress(Math.floor((completedDownloads / Data.data.songs.length) * 100));
            
            // Emit event for download completion
            EventRegister.emit('download-complete', song.id);
            
          } catch (error) {
            console.error(`Error downloading song ${song.name}:`, error);
            
            // Mark as failed
            setDownloadStatus(prev => ({
              ...prev,
              [song.id]: {
                ...prev[song.id],
                isDownloading: false
              }
            }));
          }
        }));
      }
      
      ToastAndroid.show('Album download complete', ToastAndroid.SHORT);
    } catch (error) {
      console.error('Error downloading album:', error);
      Alert.alert('Download Error', 'There was an error downloading the album');
    } finally {
      setIsDownloading(false);
    }
  };
  
  const theme = useTheme();
  const width = Dimensions.get('window').width;
  
  // Render download button or progress indicator
  const renderDownloadButton = () => {
    if (isDownloading) {
      return (
        <View style={{ 
          width: 40, 
          height: 40, 
          justifyContent: 'center', 
          alignItems: 'center' 
        }}>
          <CircularProgress progress={overallProgress} size={32} thickness={2} />
        </View>
      );
    }
    
    // If all songs are downloaded, show checkmark
    const allDownloaded = Object.values(downloadStatus).every(status => status.isDownloaded);
    
    if (allDownloaded) {
      return (
        <AntDesign name="checkcircle" size={26} color="#4CAF50" />
      );
    }
    
    // Show download button
    return (
      <AntDesign name="download" size={26} color="#FFFFFF" />
    );
  };
  
  return (
    <LinearGradient start={{x: 0, y: 0}} end={{x: 0, y: 1}} colors={['rgba(44,44,44,0)', 'rgb(23,23,23)', theme.colors.background]} style={{
      padding: 14,
      paddingVertical: 16,
      alignItems: "center",
      justifyContent: "space-between",
      flexDirection: "row",
    }}>
        {/* Album info on the left */}
        <View style={{
          flex: 1,
          paddingLeft: 4,
          paddingRight: 8,
        }}>
          <Heading text={truncateText(name, 20)}/>
          <View style={{flexDirection: "row", gap: 5, marginTop: 3}}>
            <Ionicons name={"musical-note"} size={16}/>
            <SmallText text={"Released in " + releaseData }/>
          </View>
        </View>

        {/* Controls on the right - Download icon and Play button */}
        <View style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: 14,
          marginRight: 0,
        }}>
          {/* Download button in middle */}
          <TouchableOpacity 
            style={{
              backgroundColor: 'rgba(0,0,0,0.4)',
              borderRadius: 50,
              padding: 0,
              width: 40,
              height: 40,
              alignItems: 'center',
              justifyContent: 'center',
            }}
            onPress={!isDownloading ? getPermission : undefined}
            disabled={isDownloading}
          >
            {renderDownloadButton()}
          </TouchableOpacity>
          
          {/* Play button on right */}
          <PlayButton 
            onPress={handlePlayPause}
            albumId={Data?.data?.id}
            isPlaying={isCurrentlyPlaying}
          />
        </View>
    </LinearGradient>
  );
};