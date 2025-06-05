import { View, TouchableOpacity, ToastAndroid, Alert, StyleSheet } from "react-native";
import AntDesign from "react-native-vector-icons/AntDesign";
import { useState, useEffect } from "react";
import { useTheme } from "@react-navigation/native";
import { SmallText } from "./SmallText";
import { PermissionsAndroid, Platform } from "react-native";
import DeviceInfo from "react-native-device-info";
import RNFS from "react-native-fs";
import ReactNativeBlobUtil from "react-native-blob-util";
import { StorageManager } from '../../Utils/StorageManager';
import { safeExists, safeDownloadFile, ensureDirectoryExists } from '../../Utils/FileUtils';
import EventRegister from '../../Utils/EventRegister';
import { getIndexQuality } from "../../MusicPlayerFunctions";
import FormatArtist from "../../Utils/FormatArtists";

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

export const DownloadButton = ({ 
  songs = [], 
  albumName = "", 
  size = "normal", 
  individual = false,
  songId = null 
}) => {
  const { colors } = useTheme();
  const [downloadStatus, setDownloadStatus] = useState({});
  const [isDownloading, setIsDownloading] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);
  
  // Determine button size based on prop
  const buttonSize = size === "large" ? 48 : size === "small" ? 36 : 44;
  const iconSize = size === "large" ? 30 : size === "small" ? 22 : 26;
  const progressSize = size === "large" ? 38 : size === "small" ? 30 : 34;
  
  // Check download status on mount
  useEffect(() => {
    const checkDownloadedItems = async () => {
      if (individual && songId) {
        // For individual song
        const isDownloaded = await StorageManager.isSongDownloaded(songId);
        setDownloadStatus({
          [songId]: {
            isDownloaded,
            progress: isDownloaded ? 100 : 0,
            isDownloading: false
          }
        });
        setOverallProgress(isDownloaded ? 100 : 0);
      } else if (songs && songs.length > 0) {
        // For album/playlist
        const songStatuses = {};
        let downloadedCount = 0;
        
        // Check each song's download status
        for (const song of songs) {
          if (!song || !song.id) continue;
          
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
        if (downloadedCount === songs.length) {
          setOverallProgress(100);
        } else {
          setOverallProgress(Math.floor((downloadedCount / songs.length) * 100));
        }
      }
    };
    
    checkDownloadedItems();
  }, [songs, individual, songId]);
  
  // Get storage permissions (for Android)
  const getPermission = async () => {
    try {
      if (Platform.OS === 'ios') {
        handleDownload();
        return;
      }
      
      const deviceVersion = DeviceInfo.getSystemVersion();
      
      if (parseInt(deviceVersion) >= 13) {
        handleDownload();
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
          handleDownload();
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
  
  // Handle download logic
  const handleDownload = async () => {
    if (isDownloading) {
      ToastAndroid.show('Download already in progress', ToastAndroid.SHORT);
      return;
    }
    
    try {
      // For individual songs
      if (individual && songId) {
        const song = songs.find(s => s.id === songId);
        if (!song) {
          ToastAndroid.show('Invalid song data', ToastAndroid.SHORT);
          return;
        }
        
        // Check if already downloaded
        const isDownloaded = await StorageManager.isSongDownloaded(songId);
        if (isDownloaded) {
          ToastAndroid.show('Song already downloaded', ToastAndroid.SHORT);
          return;
        }
        
        setIsDownloading(true);
        await downloadSong(song, albumName);
        setIsDownloading(false);
        return;
      }
      
      // For albums/playlists
      // Check if all songs are already downloaded
      const allDownloaded = Object.values(downloadStatus).every(status => status.isDownloaded);
      if (allDownloaded) {
        ToastAndroid.show('All songs already downloaded', ToastAndroid.SHORT);
        return;
      }
      
      setIsDownloading(true);
      ToastAndroid.show(`Downloading ${songs.length} songs`, ToastAndroid.SHORT);
      
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
      const songsToDownload = [...songs];
      const chunkSize = 3;
      
      while (songsToDownload.length > 0) {
        chunks.push(songsToDownload.splice(0, chunkSize));
      }
      
      for (const chunk of chunks) {
        await Promise.all(chunk.map(async (song) => {
          // Skip already downloaded songs
          if (!song || !song.id || downloadStatus[song.id]?.isDownloaded) {
            completedDownloads++;
            setOverallProgress(Math.floor((completedDownloads / songs.length) * 100));
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
            await downloadSong(song, albumName, completedDownloads, songs.length);
            completedDownloads++;
            setOverallProgress(Math.floor((completedDownloads / songs.length) * 100));
          } catch (error) {
            console.error(`Error downloading song:`, error);
          }
        }));
      }
      
      ToastAndroid.show('Download complete', ToastAndroid.SHORT);
    } catch (error) {
      console.error('Error downloading:', error);
      Alert.alert('Download Error', 'There was an error downloading');
    } finally {
      setIsDownloading(false);
    }
  };
  
  // Function to download a single song
  const downloadSong = async (song, albumName, completedCount = 0, totalCount = 1) => {
    try {
      // Get quality setting
      const quality = await getIndexQuality();
      
      // Get URL based on song structure
      let songUrl;
      if (song.downloadUrl && Array.isArray(song.downloadUrl) && song.downloadUrl[quality]?.url) {
        songUrl = song.downloadUrl[quality].url;
      } else if (song.download_url && Array.isArray(song.download_url) && song.download_url[quality]?.url) {
        songUrl = song.download_url[quality].url;
      } else {
        throw new Error('No download URL available');
      }
      
      const baseDir = RNFS.DocumentDirectoryPath + '/orbit_music';
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
        
        // For individual song download, update overall progress
        if (individual || totalCount === 1) {
          setOverallProgress(percentage);
        }
      });
      
      if (res.info().status !== 200) {
        throw new Error(`Download failed with status: ${res.info().status}`);
      }
      
      // Download artwork
      if (song.image && song.image[2]?.url) {
        const artworkPath = `${baseDir}/artwork/${song.id}.jpg`;
        // Get highest quality image available
        const highestQualityImage = song.image.reduce((best, current) => {
          // If current has larger width or height, use it
          if (!best || 
              (current.width && best.width && current.width > best.width) || 
              (current.height && best.height && current.height > best.height)) {
            return current;
          }
          return best;
        }, null);
        
        // Use highest quality or fallback to original logic
        const imageUrl = highestQualityImage?.url || song.image[2].url;
        
        // Add quality=100 parameter if it's a URL
        let highQualityUrl = imageUrl;
        if (imageUrl.startsWith('http')) {
          try {
            const url = new URL(imageUrl);
            url.searchParams.set('quality', '100');
            highQualityUrl = url.toString();
          } catch (e) {
            // If URL parsing fails, use original URL
            highQualityUrl = imageUrl;
          }
        }
        
        await safeDownloadFile(highQualityUrl, artworkPath);
      }
      
      // Save metadata with highest quality artwork
      let highQualityArtwork = null;
      if (song.image) {
        // Find highest resolution image
        const highestQualityImage = song.image.reduce((best, current) => {
          if (!best || 
              (current.width && best.width && current.width > best.width) || 
              (current.height && best.height && current.height > best.height)) {
            return current;
          }
          return best;
        }, null);
        
        if (highestQualityImage?.url) {
          // Add quality parameter
          try {
            const url = new URL(highestQualityImage.url);
            url.searchParams.set('quality', '100');
            highQualityArtwork = url.toString();
          } catch (e) {
            highQualityArtwork = highestQualityImage.url;
          }
        } else if (song.image[2]?.url) {
          highQualityArtwork = song.image[2].url;
        }
      }
      
      // Save metadata
      await StorageManager.saveDownloadedSongMetadata(song.id, {
        id: song.id,
        title: song.name || 'Unknown',
        artist: FormatArtist(song.artists?.primary) || 'Unknown',
        album: albumName || 'Unknown',
        url: songUrl,
        artwork: highQualityArtwork || (song.image[2]?.url || null),
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
      
      // Emit event for download completion
      EventRegister.emit('download-complete', song.id);
      
      return true;
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
      
      return false;
    }
  };
  
  // Render the appropriate button based on state
  const renderButton = () => {
    if (isDownloading) {
      return (
        <View style={{ 
          width: buttonSize, 
          height: buttonSize, 
          justifyContent: 'center', 
          alignItems: 'center' 
        }}>
          <CircularProgress progress={overallProgress} size={progressSize} thickness={2} />
        </View>
      );
    }
    
    // If individual song
    if (individual && songId) {
      const isDownloaded = downloadStatus[songId]?.isDownloaded;
      
      if (isDownloaded) {
        return <AntDesign name="checkcircle" size={iconSize} color="#4CAF50" />;
      }
      
      return <AntDesign name="download" size={iconSize} color={colors.text} />;
    }
    
    // For albums/playlists
    const allDownloaded = songs.length > 0 && Object.keys(downloadStatus).length > 0 && 
                          Object.values(downloadStatus).every(status => status.isDownloaded);
    
    if (allDownloaded) {
      return <AntDesign name="checkcircle" size={iconSize} color="#4CAF50" />;
    }
    
    return <AntDesign name="download" size={iconSize} color="#FFFFFF" />;
  };
  
  return (
    <TouchableOpacity 
      style={[
        styles.container,
        { width: buttonSize, height: buttonSize },
        size === "small" ? styles.smallContainer : null
      ]}
      onPress={!isDownloading ? getPermission : undefined}
      disabled={isDownloading}
      activeOpacity={0.7}
    >
      {renderButton()}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: 'rgba(0,0,0,0.4)',
    borderRadius: 50,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 3,
  },
  smallContainer: {
    backgroundColor: 'rgba(0,0,0,0.3)',
  }
}); 