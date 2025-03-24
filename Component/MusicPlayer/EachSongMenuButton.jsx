import { Pressable, findNodeHandle, UIManager, View, Modal, Text, TouchableOpacity, StyleSheet } from "react-native";
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import React, { useRef, useState } from "react";
import { StorageManager } from '../../Utils/StorageManager';
import { ToastAndroid } from 'react-native';
import ReactNativeBlobUtil from 'react-native-blob-util';

export const EachSongMenuButton = ({ song, size = 20, hitSlopSize = 20, paddingSize = 5, minWidth = 30, marginRight = 15, isFromAlbum = false }) => {
  const buttonRef = useRef(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0 });

  const handlePress = () => {
    if (buttonRef.current) {
      const handle = findNodeHandle(buttonRef.current);
      UIManager.measure(handle, (x, y, width, height, pageX, pageY) => {
        setMenuPosition({ top: pageY + (height * 2) });
        setMenuVisible(true);
      });
    }
  };

  const closeMenu = () => {
    setMenuVisible(false);
  };
  
  const downloadSong = async () => {
    closeMenu();
    if (!song?.url) {
      ToastAndroid.show('No song URL available', ToastAndroid.SHORT);
      return;
    }

    try {
      // Ensure directories exist
      await StorageManager.ensureDirectoriesExist();

      // Prepare metadata
      const metadata = {
        id: song.id,
        title: song.title,
        artist: song.artist,
        duration: song.duration,
        artwork: song.artwork || song.image, // Handle both artwork and image properties
        originalUrl: song.url,
        language: song.language,
        artistID: song.artistID || song.primary_artists_id,
        downloadTime: Date.now()
      };

      // Save metadata first
      await StorageManager.saveDownloadedSongMetadata(song.id, metadata);

      // Download artwork if available
      const artworkUrl = song.artwork || song.image;
      if (artworkUrl && typeof artworkUrl === 'string') {
        await StorageManager.saveArtwork(song.id, artworkUrl);
      }

      // Get the song path
      const songPath = StorageManager.getSongPath(song.id);

      // Show download started toast
      ToastAndroid.showWithGravity(
        `Download Started: ${song.title}`,
        ToastAndroid.SHORT,
        ToastAndroid.CENTER,
      );

      // Download the song
      await ReactNativeBlobUtil
        .config({
          fileCache: true,
          appendExt: 'mp3',
          path: songPath,
          addAndroidDownloads: {
            useDownloadManager: true,
            notification: true,
            title: song.title,
            description: `Downloading ${song.title}`,
            mime: 'audio/mpeg',
          },
        })
        .fetch('GET', song.url, {})
        .then((res) => {
          console.log('Download completed:', res.path());
          ToastAndroid.showWithGravity(
            "Download successfully completed",
            ToastAndroid.SHORT,
            ToastAndroid.CENTER,
          );
        });

    } catch (error) {
      console.error('Download error:', error);
      ToastAndroid.showWithGravity(
        "Download failed",
        ToastAndroid.SHORT,
        ToastAndroid.CENTER,
      );

      // Clean up metadata if download fails
      await StorageManager.removeDownloadedSongMetadata(song.id);
    }
  };

  return (
    <>
      <View style={{
        marginLeft: isFromAlbum ? 0 : 0,
        marginRight: marginRight,
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
            size={size} 
            color="white"
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
          <View style={[styles.menuContainer, { top: menuPosition.top }]}>
            <TouchableOpacity style={styles.menuItem} onPress={downloadSong}>
              <MaterialCommunityIcons name="download" size={24} color="white" />
              <Text style={styles.menuText}>Download</Text>
            </TouchableOpacity>
            {/* Add more menu items here */}
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
    minWidth: 150,
    elevation: 5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
  },
  menuText: {
    color: 'white',
    marginLeft: 12,
    fontSize: 16,
  },
});
