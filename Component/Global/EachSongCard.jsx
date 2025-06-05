import { Dimensions, Pressable, View, Image } from "react-native";
import { PlainText } from "./PlainText";
import { SmallText } from "./SmallText";
import { AddPlaylist, getIndexQuality, PlayOneSong } from "../../MusicPlayerFunctions";
import { useTheme } from "@react-navigation/native";
import { memo, useContext, useState, useEffect } from "react";
import Context from "../../Context/Context";
import { useActiveTrack, usePlaybackState } from "react-native-track-player";
import FormatTitleAndArtist from "../../Utils/FormatTitleAndArtist";
import FormatArtist from "../../Utils/FormatArtists";
import { EachSongMenuButton } from "../MusicPlayer/EachSongMenuButton";
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { StorageManager } from '../../Utils/StorageManager';
import EventRegister from '../../Utils/EventRegister';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Octicons from 'react-native-vector-icons/Octicons';
import ReactNativeBlobUtil from "react-native-blob-util";
import RNFS from "react-native-fs";
import { PermissionsAndroid, Platform, ToastAndroid, Alert } from "react-native";
import DeviceInfo from "react-native-device-info";
import { safePath, safeExists, safeDownloadFile, ensureDirectoryExists, safeUnlink } from '../../Utils/FileUtils';

export const EachSongCard = memo(function EachSongCard({title, artist, image, id, url, duration, language, artistID, isLibraryLiked, width, titleandartistwidth, isFromPlaylist, isFromAlbum = false, Data, index, showNumber = false}) {
  const theme = useTheme();
  const { colors } = theme;
  const width1 = Dimensions.get("window").width;
  const {updateTrack, setVisible} = useContext(Context)
  const currentPlaying = useActiveTrack()
  const playerState = usePlaybackState()
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [downloadInProgress, setDownloadInProgress] = useState(false);
  
  // Simple string image URI handling
  let imageSource = null;
  let safeImageUri = '';
  
  try {
    // First, determine if we're showing playing/paused indicator
    if (id === (currentPlaying?.id ?? "") && playerState.state === "playing") {
      imageSource = require("../../Images/playing.gif");
      safeImageUri = '';
    } else if (id === (currentPlaying?.id ?? "") && playerState.state !== "playing") {
      imageSource = require("../../Images/songPaused.gif");
      safeImageUri = '';
    } else {
      // For normal state, extract a safe string URI
      if (typeof image === 'string') {
        safeImageUri = image;
      } else if (image && typeof image === 'object') {
        // For object types, try to safely extract a string
        try {
          if (typeof image.uri === 'string') {
            safeImageUri = image.uri;
          } else if (typeof image.url === 'string') {
            safeImageUri = image.url;
          } else if (Array.isArray(image) && image.length > 0 && typeof image[0] === 'string') {
            safeImageUri = image[0];
          } else {
            // Default empty URI
            safeImageUri = '';
          }
        } catch (e) {
          safeImageUri = '';
        }
      } else {
        safeImageUri = '';
      }
      
      imageSource = safeImageUri ? { uri: safeImageUri } : null;
    }
  } catch (error) {
    console.error('Error preparing image source:', error);
    imageSource = null;
    safeImageUri = '';
  }
  
  // Check if song is downloaded
  useEffect(() => {
    const checkDownloadStatus = async () => {
      if (id) {
        try {
          const isDownloaded = await StorageManager.isSongDownloaded(id);
          setIsDownloaded(isDownloaded);
        } catch (error) {
          console.error('Error checking download status:', error);
          setIsDownloaded(false);
        }
      }
    };
    
    checkDownloadStatus();
    
    // Listen for download completion events
    const downloadListener = EventRegister.addEventListener('download-complete', (songId) => {
      if (songId === id) {
        setIsDownloaded(true);
        setDownloadInProgress(false);
      }
    });
    
    const downloadStartedListener = EventRegister.addEventListener('download-started', (songId) => {
      if (songId === id) {
        setDownloadInProgress(true);
      }
    });
    
    return () => {
      EventRegister.removeEventListener(downloadListener);
      EventRegister.removeEventListener(downloadStartedListener);
    };
  }, [id]);

  const formatText = (text) => {
    const formattedText = FormatTitleAndArtist(text)
    return formattedText?.length > 15 ? formattedText.substring(0, 15) + "..." : formattedText
  }

  async function AddSongToPlayer(){
    if (isFromPlaylist){
      const ForMusicPlayer = []
      const quality = await getIndexQuality()
      
      // Create a reference to the ordered songs
      const songs = Data?.data?.songs || []
      
      // Add songs to playlist starting from the clicked index
      for (let i = index; i < songs.length; i++) {
        const e = songs[i]
        if (!e) continue;

        // Get the correct URL using safer checks
        let songUrl = "";
        
        // Check if downloadUrl exists in proper format
        if (e.downloadUrl && Array.isArray(e.downloadUrl) && e.downloadUrl.length > quality && e.downloadUrl[quality]?.url) {
          songUrl = e.downloadUrl[quality].url;
        } 
        // Check if download_url exists (alternate format)
        else if (e.download_url && Array.isArray(e.download_url) && e.download_url.length > quality && e.download_url[quality]?.url) {
          songUrl = e.download_url[quality].url;
        }
        // Fallback to any available URL in the array
        else if (e.downloadUrl && Array.isArray(e.downloadUrl) && e.downloadUrl.length > 0 && e.downloadUrl[0]?.url) {
          songUrl = e.downloadUrl[0].url;
        }
        // Final fallback
        else if (e.download_url && Array.isArray(e.download_url) && e.download_url.length > 0 && e.download_url[0]?.url) {
          songUrl = e.download_url[0].url;
        }

        if (!songUrl) {
          console.log(`EachSongCard: No valid URL found for song at index ${i}, song ID: ${e?.id || 'unknown'}`);
          continue;
        }

        // Extract a safe artwork URI string
        let artworkUri = '';
        try {
          if (typeof e?.image === 'string') {
            artworkUri = e.image;
          } else if (e?.image && typeof e.image === 'object') {
            // Try to get a string URI from the image object
            if (typeof e.image.uri === 'string') {
              artworkUri = e.image.uri;
            } else if (typeof e.image.url === 'string') {
              artworkUri = e.image.url;
            } else if (Array.isArray(e.image) && e.image.length > 0) {
              if (typeof e.image[0] === 'string') {
                artworkUri = e.image[0];
              } else if (e.image[0] && typeof e.image[0].url === 'string') {
                artworkUri = e.image[0].url;
              }
            }
          }
        } catch (error) {
          console.error('Error extracting artwork URI:', error);
        }

        ForMusicPlayer.push({
          url: songUrl,
          title: formatText(e?.name),
          artist: formatText(FormatArtist(e?.artists?.primary)),
          artwork: artworkUri,
          image: artworkUri,
          duration: e?.duration,
          id: e?.id,
          language: e?.language,
          downloadUrl: e?.downloadUrl || e?.download_url || [],
        })
      }
      
      if (ForMusicPlayer.length > 0) {
        console.log(`EachSongCard: Playing ${ForMusicPlayer.length} songs starting from index ${index}`);
        await AddPlaylist(ForMusicPlayer)
        updateTrack()
      } else {
        console.log("EachSongCard: No valid songs to play");
      }
    } else if (isLibraryLiked){
      const Final = []
      
      // Use a for loop for consistent approach
      for (let i = index; i < Data.length; i++) {
        const e = Data[i]
        
        // Extract a safe artwork URI string
        let artworkUri = '';
        try {
          if (typeof e?.artwork === 'string') {
            artworkUri = e.artwork;
          } else if (e?.artwork && typeof e.artwork === 'object') {
            // Try to get a string URI from the artwork object
            if (typeof e.artwork.uri === 'string') {
              artworkUri = e.artwork.uri;
            } else if (typeof e.artwork.url === 'string') {
              artworkUri = e.artwork.url;
            } else if (Array.isArray(e.artwork) && e.artwork.length > 0) {
              if (typeof e.artwork[0] === 'string') {
                artworkUri = e.artwork[0];
              } else if (e.artwork[0] && typeof e.artwork[0].url === 'string') {
                artworkUri = e.artwork[0].url;
              }
            }
          }
        } catch (error) {
          console.error('Error extracting artwork URI:', error);
        }
        
        // Get URL with proper error handling
        let songUrl;
        if (e?.url) {
          if (typeof e.url === 'string') {
            songUrl = e.url;
          } else if (Array.isArray(e.url) && e.url.length > 0) {
            const quality = await getIndexQuality();
            songUrl = e.url[quality]?.url || e.url[0]?.url || '';
          } else {
            // Handle potential ReadableNativeArray
            try {
              // Try to get the first item
              const firstUrl = e.url[0];
              if (firstUrl && typeof firstUrl === 'object' && firstUrl.url) {
                songUrl = firstUrl.url;
              }
            } catch (error) {
              console.error('Error processing URL:', error);
            }
          }
        }
        
        if (!songUrl) {
          console.log(`EachSongCard: Skipping song with invalid URL at index ${i}`);
          continue;
        }
        
        Final.push({
          url: songUrl,
          title: formatText(e?.title),
          artist: formatText(e?.artist),
          artwork: artworkUri,
          duration: e?.duration,
          id: e?.id,
          language: e?.language,
          artistID: e?.primary_artists_id,
          downloadUrl: e?.downloadUrl,
        })
      }
      
      await AddPlaylist(Final)
    } else {
      const quality = await getIndexQuality()
      
      // Get URL with proper error handling
      let songUrl;
      if (url) {
        if (Array.isArray(url) && url.length > quality && url[quality]?.url) {
          songUrl = url[quality].url;
        } else if (Array.isArray(url) && url.length > 0 && url[0]?.url) {
          songUrl = url[0].url;
        } else if (typeof url === 'string') {
          songUrl = url;
        }
      }
      
      if (!songUrl) {
        console.error("Invalid song URL");
        return;
      }
      
      const song  = {
        url: songUrl,
        title: formatText(title),
        artist: formatText(artist),
        artwork: safeImageUri,  // Using our pre-processed safe URI
        duration,
        id,
        language,
        artistID:artistID,
        image: safeImageUri,    // Using our pre-processed safe URI
        downloadUrl:url,
      }
      PlayOneSong(song)
    }
    updateTrack()
  }

  const handleDownload = async () => {
    if (isDownloaded) {
      // If already downloaded, show message
      ToastAndroid.show('Song already downloaded', ToastAndroid.SHORT);
      return;
    }
    
    if (downloadInProgress) {
      // Do nothing if download is already in progress
      ToastAndroid.show('Download already in progress', ToastAndroid.SHORT);
      return;
    }
    
    // Get permission first
    try {
    setDownloadInProgress(true);
      // Notify other components
      EventRegister.emit('download-started', id);
      
      // Different handling based on platform
      if (Platform.OS === 'ios') {
        // iOS doesn't need explicit permissions for app-specific storage
        actualDownload();
        return;
      }
      
      // For Android, check version
      try {
        const deviceVersion = await DeviceInfo.getSystemVersion();
        
        if (parseInt(deviceVersion) >= 13) {
          // Android 13+ uses scoped storage, no need for permissions
          actualDownload();
        } else {
          // For older Android, request storage permission
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
            actualDownload();
          } else {
            ToastAndroid.show("Storage permission denied", ToastAndroid.SHORT);
            setDownloadInProgress(false);
          }
        }
      } catch (versionError) {
        console.error("Error detecting device version:", versionError);
        // Fallback - try download anyway
        actualDownload();
      }
    } catch (error) {
      console.error("Error in download process:", error);
      setDownloadInProgress(false);
      ToastAndroid.show("Download failed", ToastAndroid.SHORT);
    }
  };
  
  const actualDownload = async () => {
    try {
      // Select URL from quality array
      let songUrl = "";
      const quality = await getIndexQuality();
      
      if (Array.isArray(url) && url.length > 0) {
        if (url.length > quality && url[quality]?.url) {
          songUrl = url[quality].url;
        } else {
          songUrl = url[0].url;
        }
      } else if (typeof url === 'string') {
        songUrl = url;
      }
      
      if (!songUrl) {
        console.error("Invalid song URL");
        Alert.alert("Download Failed", "Invalid song URL");
        setDownloadInProgress(false);
        return;
      }
      
      // We already processed and validated the image URI earlier
      const validArtworkUri = typeof safeImageUri === 'string' && safeImageUri.length > 0 ? safeImageUri : null;
      
      // Ensure directories exist
      try {
        const baseDir = RNFS.DocumentDirectoryPath + '/orbit_music';
        await ensureDirectoryExists(baseDir);
        await ensureDirectoryExists(baseDir + '/songs');
        await ensureDirectoryExists(baseDir + '/artwork');
        await ensureDirectoryExists(baseDir + '/metadata');
      } catch (dirError) {
        console.error("Error creating directories:", dirError);
      }
      
      // Prepare download path
      const songFileName = `${id}.mp3`;
      const basePath = typeof RNFS.DocumentDirectoryPath === 'string' ? 
                       RNFS.DocumentDirectoryPath : 
                       String(RNFS.DocumentDirectoryPath || '');
      
      if (!basePath) {
        throw new Error("Invalid path");
      }
      
      // Construct full path
      const fullPath = basePath + '/orbit_music/songs/' + songFileName;
      const downloadPath = safePath(fullPath);
      
      // Prepare download config
      const downloadConfig = {
        fileCache: false,
        path: downloadPath,
        overwrite: true,
        indicator: false,
        timeout: 60000
      };
      
      // Start download
      const res = await ReactNativeBlobUtil.config(downloadConfig)
        .fetch('GET', songUrl, {
          'Accept': 'audio/mpeg, application/octet-stream',
          'Cache-Control': 'no-store'
        })
        .progress((received, total) => {
          if (total <= 0) return;
          const percentage = Math.floor((received / total) * 100);
          // Update UI with progress
          // Here we don't update state to avoid too many re-renders
        });
      
      if (res.info().status !== 200) {
        throw new Error(`Download failed with status: ${res.info().status}`);
      }
      
      // Save metadata after successful download
      await StorageManager.saveDownloadedSongMetadata(id, {
        id: id,
        title: title || 'Unknown',
        artist: artist || 'Unknown',
        album: 'Unknown',
        url: songUrl,
        artwork: validArtworkUri, // Use validated artwork URI
        duration: duration || 0,
        downloadedAt: new Date().toISOString()
      });
      
      // Download artwork if available
      if (validArtworkUri) {
        try {
          await StorageManager.saveArtwork(id, validArtworkUri);
        } catch (artworkError) {
          console.error("Error saving artwork:", artworkError);
        }
      }
      
      // Emit events for download completion
      EventRegister.emit('download-complete', id);
      setIsDownloaded(true);
      setDownloadInProgress(false);
      ToastAndroid.show("Download complete", ToastAndroid.SHORT);
      
    } catch (downloadError) {
      console.error("Download failed:", downloadError);
      setDownloadInProgress(false);
      ToastAndroid.show("Download failed", ToastAndroid.SHORT);
      
      // Clean up partial downloads
      try {
        const downloadPath = RNFS.DocumentDirectoryPath + '/orbit_music/songs/' + id + '.mp3';
        await safeUnlink(downloadPath);
      } catch (unlinkError) {
        console.error("Error cleaning up partial download:", unlinkError);
      }
    }
  };
  
  return (
    <>
      {/* Main container with explicit background color */}
      <View style={{
        flexDirection:'row',
        width:width ? width : width1,
        marginRight:0,
        alignItems:"center",
        paddingRight: isFromAlbum ? 0 : (isFromPlaylist ? 2 : 2),
        paddingVertical: 4,
        justifyContent: 'space-between',
        paddingHorizontal: isFromAlbum ? 5 : (isFromPlaylist ? 6 : 4),
        borderRadius: 0,
        overflow: 'hidden',
        marginVertical: 0,
        backgroundColor: theme.dark ? 'transparent' : '#FFFFFF',
      }}>
        <Pressable 
          onPress={AddSongToPlayer}
          android_ripple={{ color: 'rgba(255, 255, 255, 0.1)', borderless: false }}
          style={{
            flexDirection:'row',
            gap:10,
            alignItems:"center",
            maxHeight:60,
            flex:1,
            padding: 6,
            paddingLeft: isFromAlbum ? 8 : (isFromPlaylist ? 0 : 5), // Album: 8, Playlist: 5, Default: 12
          }}
        >
          {/* Track number - show ONLY when explicit showNumber prop is true */}
          {showNumber === true && index !== undefined && (
            <View style={{ 
              width: 24, 
              alignItems: 'center', 
              justifyContent: 'center',
              marginRight: isFromAlbum ? 10 : (isFromPlaylist ? 10 : 8)
            }}>
              <SmallText 
                text={`${index + 1}`} 
                style={{ 
                  fontWeight: '700',
                  color: id === (currentPlaying?.id ?? "") ? colors.primary : colors.textSecondary,
                  fontSize: width1 * 0.034
                }}
              />
            </View>
          )}
          <View style={{ position: 'relative' }}>
            <Image 
              source={imageSource} 
              style={{
                height:48,
                width:48,
                borderRadius:4,
              }}
            />
          </View>
          <View style={{
            flex:1,
            marginRight: isFromAlbum ? 5 : (isFromPlaylist ? 6 : 8),
          }}>
            <PlainText 
              text={formatText(title)} 
              songId={id} 
              isSongTitle={true} 
              style={{
                width: titleandartistwidth ? titleandartistwidth : width1 * (isFromAlbum ? 0.62 : (isFromPlaylist ? 0.60 : 0.63)),
                marginBottom: 2,
                color: theme.dark ? colors.text : '#333333' // Ensure text is visible in light theme
              }}
              numberOfLines={1}
              ellipsizeMode="tail"
            />
            <SmallText 
              text={formatText(artist)} 
              isArtistName={true}
              style={{
                width: titleandartistwidth ? titleandartistwidth : width1 * (isFromAlbum ? 0.60 : (isFromPlaylist ? 0.56 : 0.60)),
                color: theme.dark ? colors.textSecondary : '#666666' // Ensure artist name is visible in light theme
              }}
              numberOfLines={1}
              ellipsizeMode="tail"
            />
          </View>
        </Pressable>
        <View style={{
          flexDirection: 'row',
          justifyContent: 'flex-end',
          alignItems: 'center',
          minWidth: isFromAlbum ? 80 : (isFromPlaylist ? 80 : 75),
          paddingLeft: isFromAlbum ? 0 : (isFromPlaylist ? 3 : 2),
          marginRight: isFromAlbum ? 5 : (isFromPlaylist ? 5 : 0),
        }}>
          {/* Download Button - shown in both album and playlist views */}
          <Pressable 
            onPress={handleDownload}
            style={{
              padding: 6,
              marginRight: isFromAlbum ? 10 : (isFromPlaylist ? 10 : 8)
            }}
          >
            {isDownloaded ? (
              <Octicons name="check-circle" size={22} color="#1DB954" />
            ) : downloadInProgress ? (
              <MaterialCommunityIcons name="loading" size={24} color="#FFA500" />
            ) : (
              <Octicons name="download" size={22} color={theme.dark ? "#ffffff" : "#333333"} />
            )}
          </Pressable>
          
          <EachSongMenuButton 
            song={{
              title,
              artist,
              artwork: typeof safeImageUri === 'string' ? safeImageUri : '',
              image: typeof safeImageUri === 'string' ? safeImageUri : '',
              id,
              url,
              duration,
              language,
              artistID
            }}
            isFromPlaylist={isFromPlaylist}
            isFromAlbum={isFromAlbum}
            size={isFromAlbum ? 40 : 36}
            marginRight={isFromAlbum ? 1 : 6}
            isDownloaded={isDownloaded}
          />
        </View>
      </View>
    </>
  );
})
