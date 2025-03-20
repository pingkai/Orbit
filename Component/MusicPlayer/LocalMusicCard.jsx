import React, { useState, useContext, useRef, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, findNodeHandle, UIManager, Platform } from 'react-native';
import FastImage from 'react-native-fast-image';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { PlainText } from '../Global/PlainText';
import { SmallText } from '../Global/SmallText';
import Context from '../../Context/Context';
import { useActiveTrack, usePlaybackState } from 'react-native-track-player';
import { useTheme } from '@react-navigation/native';
import * as RNFS from 'react-native-fs';
import { PlayOneSong } from '../../MusicPlayerFunctions';
import TrackPlayer from 'react-native-track-player';

export const LocalMusicCard = ({ song, index, allSongs, artist }) => {
  const { updateTrack, setVisible, setIndex } = useContext(Context);
  const currentPlaying = useActiveTrack();
  const playerState = usePlaybackState();
  const menuButtonRef = useRef(null);
  const theme = useTheme();
  const [albumArt, setAlbumArt] = useState(null);

  useEffect(() => {
    const fetchAlbumArt = async () => {
      try {
        const fileExists = await RNFS.exists(song.path);
        if (fileExists) {
          const stats = await RNFS.stat(song.path);
          if (stats.size > 0) {
            // Try to use the provided cover art if available
            if (song.cover) {
              setAlbumArt(song.cover);
              return;
            }
            
            // Generate a unique color-based artwork using the song title
            const colorHash = Math.abs(song.title.split('').reduce((acc, char) => {
              return char.charCodeAt(0) + ((acc << 5) - acc);
            }, 0));
            const hue = colorHash % 360;
            const artwork = `https://dummyimage.com/200x200/${colorHash.toString(16).slice(0,6)}/ffffff&text=${encodeURIComponent(song.title.charAt(0))}`;
            setAlbumArt(artwork);
          }
        }
      } catch (error) {
        console.warn('Error handling album art:', error);
        // Use a default artwork on error
        setAlbumArt('https://htmlcolorcodes.com/assets/images/colors/gray-color-solid-background-1920x1080.png');
      }
    };
    
    fetchAlbumArt();
  }, [song.path, song.title, song.cover]);

  const handleMenuPress = () => {
    if (menuButtonRef.current) {
      const handle = findNodeHandle(menuButtonRef.current);
      UIManager.measure(handle, (x, y, width, height, pageX, pageY) => {
        // Pass the song data to the modal
        setVisible({
          visible: true,
          position: { y: pageY },
          ...song,
          isLocalMusic: true,
        });
      });
    }
  };

  const handlePress = async () => {
    try {
      // Format all tracks for the queue
      const formattedTracks = allSongs.map(track => ({
        id: track.id,
        url: track.url || `file://${track.path}`,
        title: track.title,
        artist: track.artist,
        artwork: track.cover || 'https://htmlcolorcodes.com/assets/images/colors/gray-color-solid-background-1920x1080.png',
        isLocal: true
      }));
      
      // Reset player and add all tracks
      await TrackPlayer.reset();
      
      // Add all tracks to queue, starting with the selected one
      const tracksToAdd = [
        ...formattedTracks.slice(index),
        ...formattedTracks.slice(0, index)
      ];
      
      await TrackPlayer.add(tracksToAdd);
      
      // Start playback
      await TrackPlayer.play();
      
      // Open the fullscreen player
      setIndex(1);
    } catch (error) {
      console.error('Error playing track:', error);
      
      // Fallback method if the normal approach fails
      try {
        const song = allSongs[index];
        const singleTrack = {
          id: song.id,
          url: song.url || `file://${song.path}`,
          title: song.title,
          artist: song.artist,
          artwork: song.cover || 'https://htmlcolorcodes.com/assets/images/colors/gray-color-solid-background-1920x1080.png',
          isLocal: true
        };
        
        await TrackPlayer.reset();
        await TrackPlayer.add(singleTrack);
        await TrackPlayer.play();
        setIndex(1);
      } catch (fallbackError) {
        console.error('Fallback method also failed:', fallbackError);
      }
    }
  };

  const isCurrentlyPlaying = currentPlaying?.id === song.id && playerState.state === 'playing';
  const isPaused = currentPlaying?.id === song.id && playerState.state !== 'playing';

  return (
    <View style={styles.container}>
      <Pressable onPress={handlePress} style={styles.songInfo}>
        <View style={styles.imageContainer}>
          <FastImage 
            source={isCurrentlyPlaying ? require("../../Images/playing.gif") : 
                   isPaused ? require("../../Images/songPaused.gif") : 
                   { uri: song.cover || 'https://htmlcolorcodes.com/assets/images/colors/gray-color-solid-background-1920x1080.png' }}
            style={styles.image}
          />
        </View>
        <View style={styles.textContainer}>
          <PlainText 
            text={song.title} 
            style={styles.title} 
            numberOfLines={1} 
            ellipsizeMode="tail"
          />
          <SmallText 
            text={song.artist} 
            style={styles.artist} 
            numberOfLines={1} 
            ellipsizeMode="tail"
          />
        </View>
      </Pressable>
      <Pressable 
        ref={menuButtonRef}
        onPress={handleMenuPress}
        hitSlop={8}
        style={styles.menuButton}
      >
        <MaterialCommunityIcons name="dots-vertical" size={24} color="white"/>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(255,255,255,0.03)',
    marginHorizontal: 8,
    marginVertical: 4,
    borderRadius: 8,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  songInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  imageContainer: {
    width: 50,
    height: 50,
    borderRadius: 4,
    overflow: 'hidden',
    marginRight: 12,
  },
  image: {
    width: '100%',
    height: '100%',
  },
  textContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  title: {
    fontSize: 16,
    color: 'white',
    marginBottom: 4,
  },
  artist: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.7)',
  },
  menuButton: {
    padding: 8,
    justifyContent: 'center',
  },
});