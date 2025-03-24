import { Pressable, findNodeHandle, UIManager, View, Modal, Text, TouchableOpacity, StyleSheet, Dimensions } from "react-native";
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import React, { useRef, useState, useContext, useEffect } from "react";
import { StorageManager } from '../../Utils/StorageManager';
import { ToastAndroid } from 'react-native';
import ReactNativeBlobUtil from 'react-native-blob-util';
import TrackPlayer from 'react-native-track-player';
import Context from "../../Context/Context";
import { AddOneSongToPlaylist } from "../../MusicPlayerFunctions";
import PlaylistSelectorWrapper from '../Playlist/PlaylistSelectorWrapper';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export const EachSongMenuButton = ({ song, size = 18, hitSlopSize = 18, paddingSize = 4, minWidth = 28, marginRight = 10, isFromAlbum = false, isFromPlaylist = false }) => {
  const buttonRef = useRef(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, right: 20 });
  const { updateTrack } = useContext(Context);
  const [showPlaylistSelector, setShowPlaylistSelector] = useState(false);
  
  // Ensure we have a valid song object
  useEffect(() => {
    if (!song) {
      console.error('EachSongMenuButton received undefined song object');
    }
  }, [song]);

  // Calculate style based on context
  const getMarginRight = () => {
    if (isFromAlbum) return 8; // Reduced margin for albums
    if (isFromPlaylist) return 15; // Increased margin for playlists
    return marginRight; // Default for other contexts
  };

  // Calculate size based on context
  const getIconSize = () => {
    return isFromAlbum ? 18 : 20; // Slightly smaller for albums
  };

  const handlePress = () => {
    if (buttonRef.current) {
      const handle = findNodeHandle(buttonRef.current);
      UIManager.measure(handle, (x, y, width, height, pageX, pageY) => {
        // Calculate if menu would go off screen
        const menuHeight = 180; // Approximate height of menu
        const spaceBelow = SCREEN_HEIGHT - pageY - height;
        
        // If not enough space below, position menu above the button
        if (spaceBelow < menuHeight) {
          setMenuPosition({ 
            top: Math.max(pageY - menuHeight, 50),
            right: 20
          });
        } else {
          setMenuPosition({ 
            top: pageY + (height * 1.5),
            right: 20 
          });
        }
        
        setMenuVisible(true);
      });
    }
  };

  const closeMenu = () => {
    setMenuVisible(false);
  };
  
  const addToQueue = async () => {
    closeMenu();
    if (!song?.url) {
      ToastAndroid.show('No song URL available', ToastAndroid.SHORT);
      return;
    }

    try {
      // Get the actual URL from array if needed
      const songUrl = getHighestQualityUrl(song.url);
      console.log('Using URL for add to queue:', songUrl);
      
      if (!songUrl) {
        ToastAndroid.show('Invalid song URL format', ToastAndroid.SHORT);
        return;
      }
      
      // Add to queue using TrackPlayer
      await TrackPlayer.add({
        url: songUrl,
        title: song.title || 'Unknown Title',
        artist: song.artist || 'Unknown Artist',
        artwork: song.artwork || song.image,
        id: song.id || Date.now().toString(),
        duration: song.duration || 0,
        language: song.language || '',
        artistID: song.artistID || ''
      });
      
      updateTrack();
      ToastAndroid.show(`Added ${song.title} to queue`, ToastAndroid.SHORT);
    } catch (error) {
      console.error('Error adding to queue:', error);
      ToastAndroid.show('Failed to add to queue', ToastAndroid.SHORT);
    }
  };

  const playNext = async () => {
    closeMenu();
    if (!song?.url) {
      ToastAndroid.show('No song URL available', ToastAndroid.SHORT);
      return;
    }

    try {
      // Get the actual URL from array if needed
      const songUrl = getHighestQualityUrl(song.url);
      console.log('Using URL for play next:', songUrl);
      
      if (!songUrl) {
        ToastAndroid.show('Invalid song URL format', ToastAndroid.SHORT);
        return;
      }
      
      // Format the track object
      const trackToAdd = {
        url: songUrl,
        title: song.title || 'Unknown Title',
        artist: song.artist || 'Unknown Artist',
        artwork: song.artwork || song.image,
        id: song.id || Date.now().toString(),
        duration: song.duration || 0,
        language: song.language || '',
        artistID: song.artistID || ''
      };
      
      // Get current index
      const currentIndex = await TrackPlayer.getCurrentTrack();
      console.log('Current track index:', currentIndex);
      
      if (currentIndex === null) {
        // If no track is playing, just start playing this song
        await TrackPlayer.reset();
        await TrackPlayer.add([trackToAdd]);
        const playerState = await TrackPlayer.getState();
        console.log('Player state after adding track:', playerState);
        await TrackPlayer.play();
        console.log('Added song to empty queue and started playing:', trackToAdd.title);
      } else {
        // Add right after current track
        await TrackPlayer.add([trackToAdd], currentIndex + 1);
        console.log('Added song to play next at position', currentIndex + 1);
      }
      
      updateTrack();
      ToastAndroid.show(`${song.title} will play next`, ToastAndroid.SHORT);
    } catch (error) {
      console.error('Error setting play next:', error);
      // Try a more basic approach if the first method fails
      try {
        // Get the actual URL from array if needed
        const songUrl = getHighestQualityUrl(song.url);
        
        if (!songUrl) {
          ToastAndroid.show('Invalid song URL format', ToastAndroid.SHORT);
          return;
        }
        
        // Use a simpler approach
        await TrackPlayer.add({
          url: songUrl,
          title: song.title || 'Unknown',
          artist: song.artist || 'Unknown',
          artwork: song.artwork || song.image,
          id: song.id || Date.now().toString()
        });
        ToastAndroid.show('Added to queue', ToastAndroid.SHORT);
        updateTrack();
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
        ToastAndroid.show('Failed to set play next', ToastAndroid.SHORT);
      }
    }
  };

  const addToPlaylist = async () => {
    closeMenu();
    if (!song?.id) {
      ToastAndroid.show('Song information not available', ToastAndroid.SHORT);
      return;
    }

    try {
      // Call the function to add song to playlist
      const result = await AddOneSongToPlaylist(song);
      if (!result) {
        ToastAndroid.show('Failed to open playlist selector', ToastAndroid.SHORT);
      }
    } catch (error) {
      console.error('Error adding to playlist:', error);
      ToastAndroid.show('Failed to add to playlist', ToastAndroid.SHORT);
    }
  };
  
  const downloadSong = async () => {
    closeMenu();
    if (!song?.url) {
      ToastAndroid.show('No song URL available', ToastAndroid.SHORT);
      return;
    }

    try {
      console.log('Starting download process for:', song.title);
      console.log('URL data to process:', JSON.stringify(song.url));
      
      // Ensure directories exist
      const dirsExist = await StorageManager.ensureDirectoriesExist();
      if (!dirsExist) {
        console.error('Failed to create download directories');
        ToastAndroid.show('Failed to create download directories', ToastAndroid.SHORT);
        return;
      }
      
      console.log('Directories created successfully');

      // Get highest quality URL
      const downloadUrl = getHighestQualityUrl(song.url);
      if (!downloadUrl) {
        console.error('Could not determine download URL');
        ToastAndroid.show('Could not determine download URL', ToastAndroid.SHORT);
        return;
      }
      
      console.log('Download URL determined:', downloadUrl);

      // Prepare metadata
      const metadata = {
        id: song.id || Date.now().toString(),
        title: song.title || 'Unknown Title',
        artist: song.artist || 'Unknown Artist',
        duration: song.duration || 0,
        artwork: song.artwork || song.image, // Handle both artwork and image properties
        originalUrl: downloadUrl,
        language: song.language || '',
        artistID: song.artistID || song.primary_artists_id || '',
        downloadTime: Date.now()
      };

      // Save metadata first
      const metadataSaved = await StorageManager.saveDownloadedSongMetadata(metadata.id, metadata);
      if (!metadataSaved) {
        console.error('Failed to save song metadata');
        ToastAndroid.show('Failed to save song metadata', ToastAndroid.SHORT);
        return;
      }
      
      console.log('Metadata saved successfully');

      // Download artwork if available
      const artworkUrl = song.artwork || song.image;
      if (artworkUrl && typeof artworkUrl === 'string') {
        try {
          const artworkPath = await StorageManager.saveArtwork(metadata.id, artworkUrl);
          if (artworkPath) {
            console.log('Artwork saved successfully at:', artworkPath);
          } else {
            console.warn('Failed to save artwork, but continuing with song download');
          }
        } catch (artworkError) {
          console.warn('Error saving artwork:', artworkError);
          // Continue with download even if artwork fails
        }
      }

      // Get the song path
      const songPath = StorageManager.getSongPath(metadata.id);
      console.log('Song will be saved at:', songPath);

      // Show download started toast
      ToastAndroid.showWithGravity(
        `Download Started: ${metadata.title}`,
        ToastAndroid.SHORT,
        ToastAndroid.CENTER,
      );

      // Download the song
      console.log('Starting file download from:', downloadUrl);
      
      const res = await ReactNativeBlobUtil
        .config({
          fileCache: true,
          appendExt: 'mp3',
          path: songPath,
          addAndroidDownloads: {
            useDownloadManager: true,
            notification: true,
            title: metadata.title,
            description: `Downloading ${metadata.title}`,
            mime: 'audio/mpeg',
          },
        })
        .fetch('GET', downloadUrl, {});
      
      console.log('Download completed:', res.path());
      ToastAndroid.showWithGravity(
        "Download successfully completed",
        ToastAndroid.SHORT,
        ToastAndroid.CENTER,
      );

    } catch (error) {
      console.error('Download error:', error);
      ToastAndroid.showWithGravity(
        "Download failed: " + (error.message || 'Unknown error'),
        ToastAndroid.SHORT,
        ToastAndroid.CENTER,
      );

      // Clean up metadata if download fails
      if (song?.id) {
        try {
          await StorageManager.removeDownloadedSongMetadata(song.id);
        } catch (cleanupError) {
          console.error('Error cleaning up metadata:', cleanupError);
        }
      }
    }
  };

  // Helper function to get highest quality URL from an array of URL objects
  const getHighestQualityUrl = (urlData) => {
    console.log('Processing URL data type:', typeof urlData);
    
    // If it's already a string, return it
    if (typeof urlData === 'string') {
      return urlData;
    }
    
    // If it's an array of quality objects
    if (Array.isArray(urlData)) {
      try {
        // Check if the first item has a quality property (Saavn format)
        if (urlData[0] && typeof urlData[0] === 'object' && 'quality' in urlData[0]) {
          // Sort by quality (assuming quality is in format like "320kbps")
          const sortedUrls = [...urlData].sort((a, b) => {
            // Extract numbers from quality strings
            const qualityA = parseInt(a.quality?.replace(/[^\d]/g, '') || 0);
            const qualityB = parseInt(b.quality?.replace(/[^\d]/g, '') || 0);
            return qualityB - qualityA; // Descending order
          });
          
          console.log('Selected highest quality:', sortedUrls[0]?.quality);
          return sortedUrls[0]?.url || '';
        } 
        // If it's just an array of URLs, return the first one
        else if (typeof urlData[0] === 'string') {
          return urlData[0];
        }
        // If it's a different format with URL property
        else if (urlData[0] && typeof urlData[0] === 'object' && 'url' in urlData[0]) {
          return urlData[0].url;
        }
      } catch (error) {
        console.error('Error parsing URL array:', error);
        // Fallback to first item if possible
        if (urlData[0]) {
          return typeof urlData[0] === 'string' ? urlData[0] : 
                 (urlData[0].url || '');
        }
        return '';
      }
    }
    
    // Handle object with multiple URLs
    if (urlData && typeof urlData === 'object') {
      // Check for common URL properties in different formats
      if ('url' in urlData) return urlData.url;
      if ('320kbps' in urlData) return urlData['320kbps'];
      if ('160kbps' in urlData) return urlData['160kbps'];
      if ('96kbps' in urlData) return urlData['96kbps'];
      if ('48kbps' in urlData) return urlData['48kbps'];
      
      // Try to find any property that looks like a URL
      for (const key in urlData) {
        if (typeof urlData[key] === 'string' && 
            (urlData[key].startsWith('http') || urlData[key].startsWith('file:'))) {
          return urlData[key];
        }
      }
    }
    
    // Unknown format, return empty string
    return '';
  };

  return (
    <>
      <View style={{
        marginLeft: isFromAlbum ? 0 : 0,
        marginRight: getMarginRight(),
        paddingRight: paddingSize,
      }}>
        <Pressable 
          ref={buttonRef}
          onPress={handlePress}
          hitSlop={{ top: hitSlopSize, bottom: hitSlopSize, left: hitSlopSize, right: hitSlopSize }}
          android_ripple={{ color: 'rgba(255,255,255,0.1)', borderless: true, radius: hitSlopSize + 5 }}
          style={({ pressed }) => ({
            padding: paddingSize,
            justifyContent: 'center',
            alignItems: 'center',
            minWidth: minWidth,
            minHeight: minWidth,
            backgroundColor: pressed ? 'rgba(255,255,255,0.08)' : 'transparent',
            borderRadius: minWidth / 2,
          })}
        >
          <MaterialCommunityIcons
            name="dots-vertical"
            size={24}
            color="#FFFFFF"
            style={styles.menuIcon}
          />
        </Pressable>
      </View>

      <Modal
        visible={menuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={closeMenu}
      >
        <Pressable style={styles.modalOverlay} onPress={closeMenu}>
          <View style={[styles.menuContainer, { top: menuPosition.top, right: menuPosition.right }]}>
            <TouchableOpacity style={styles.menuItem} onPress={addToQueue}>
              <MaterialCommunityIcons name="playlist-plus" size={20} color="white" />
              <Text style={styles.menuText}>Add to queue</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.menuItem} onPress={playNext}>
              <MaterialCommunityIcons name="play-speed" size={20} color="white" />
              <Text style={styles.menuText}>Play next</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.menuItem} onPress={addToPlaylist}>
              <MaterialCommunityIcons name="playlist-music" size={20} color="white" />
              <Text style={styles.menuText}>Add to playlist</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.menuItem} onPress={downloadSong}>
              <MaterialCommunityIcons name="download" size={20} color="white" />
              <Text style={styles.menuText}>Download</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  menuContainer: {
    position: 'absolute',
    right: 20,
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    padding: 8,
    minWidth: 180,
    elevation: 5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 10,
  },
  menuText: {
    color: 'white',
    marginLeft: 10,
    fontSize: 14,
  },
  menuIcon: {
    opacity: 1, // Ensure full opacity
    marginRight: 8,
  },
});
