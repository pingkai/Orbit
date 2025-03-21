import React, { useState, useContext, useRef, useEffect } from 'react';
import { View, Text, Pressable, StyleSheet, findNodeHandle, UIManager, Platform } from 'react-native';
import FastImage from 'react-native-fast-image';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { PlainText } from '../Global/PlainText';
import { SmallText } from '../Global/SmallText';
import Context from '../../Context/Context';
import { useActiveTrack, usePlaybackState } from 'react-native-track-player';
import { useTheme, useNavigation } from '@react-navigation/native';
import * as RNFS from 'react-native-fs';
import { PlayOneSong } from '../../MusicPlayerFunctions';
import TrackPlayer from 'react-native-track-player';

// Default music image
const DEFAULT_MUSIC_IMAGE = require('../../Images/Music.jpeg');

export const LocalMusicCard = ({ song, index, allSongs, artist }) => {
  const { updateTrack, setVisible, setIndex, setPreviousScreen, setMusicPreviousScreen } = useContext(Context);
  const currentPlaying = useActiveTrack();
  const playerState = usePlaybackState();
  const menuButtonRef = useRef(null);
  const theme = useTheme();
  const [albumArt, setAlbumArt] = useState(null);
  const navigation = useNavigation();

  useEffect(() => {
    const fetchAlbumArt = async () => {
      try {
        const fileExists = await RNFS.exists(song.path);
        if (fileExists) {
          const stats = await RNFS.stat(song.path);
          if (stats.size > 0) {
            // Try to use the provided cover art if available
            if (song.cover && typeof song.cover === 'string' && song.cover.trim() !== '') {
              // Make sure cover is a valid string URI
              setAlbumArt(song.cover);
              return;
            }
            
            // If we reach here, no valid cover image found
            // We'll use the default image instead (handled in render)
            setAlbumArt(null);
          }
        }
      } catch (error) {
        console.warn('Error handling album art:', error);
        // Use null to indicate we should use the default image
        setAlbumArt(null);
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
      // Save current navigation state before opening fullscreen player
      const currentState = navigation.getState();
      if (currentState && currentState.routes && currentState.routes.length > 0) {
        const currentTabRoute = currentState.routes[currentState.index];
        let fullNavPath = currentTabRoute.name;

        // Try to get current route name (safer method)
        let currentRouteName = null;
        try {
          // Check if we're in the MyMusicPage by inspecting the navigation state
          if (currentTabRoute.name === 'Library' && currentTabRoute.state) {
            const libraryRoute = currentTabRoute.state.routes[currentTabRoute.state.index];
            currentRouteName = libraryRoute.name;
            
            // If we found MyMusicPage, set it explicitly
            if (currentRouteName === 'MyMusicPage') {
              console.log('Detected MyMusicPage through navigation state inspection');
              fullNavPath = 'Library/MyMusicPage';
              setPreviousScreen(fullNavPath);
              setMusicPreviousScreen(fullNavPath);
              console.log('Explicitly set music previous screen to:', fullNavPath);
            }
          }
        } catch (routeError) {
          console.log('Error trying to get current route name:', routeError);
        }
        
        // If we already identified MyMusicPage, skip the rest of route detection
        if (fullNavPath === 'Library/MyMusicPage') {
          // Format tracks and start playback
          await prepareAndPlayTracks();
          return;
        }
        
        // If there's a nested navigation state, get the current active route
        const nestedState = currentTabRoute.state;
        if (nestedState && nestedState.routes && nestedState.routes.length > 0) {
          const activeNestedRoute = nestedState.routes[nestedState.index];
          
          // Check for deeper nesting (for screens like MyMusicPage in Library)
          if (activeNestedRoute.state && activeNestedRoute.state.routes && activeNestedRoute.state.routes.length > 0) {
            const deepNestedRoute = activeNestedRoute.state.routes[activeNestedRoute.state.index];
            // Store the full navigation path with tab, screen and nested screen
            fullNavPath = `${currentTabRoute.name}/${activeNestedRoute.name}/${deepNestedRoute.name}`;
            console.log('LocalMusicCard detected deep nesting:', fullNavPath);
          } else {
            // Store the full navigation path (tab/screen)
            fullNavPath = `${currentTabRoute.name}/${activeNestedRoute.name}`;
          }
        }
        
        // Save the current screen before opening player to both state variables
        console.log('Setting music previous screen before player opens:', fullNavPath);
        // Make sure we're using a consistent path format - remove MainRoute prefix if present
        if (fullNavPath.startsWith('MainRoute/')) {
          fullNavPath = fullNavPath.replace('MainRoute/', '');
          console.log('Cleaned MainRoute prefix from path:', fullNavPath);
        }
        setPreviousScreen(fullNavPath);
        setMusicPreviousScreen(fullNavPath);
      }

      // If we get here, proceed with normal playback
      await prepareAndPlayTracks();
    } catch (error) {
      console.error('Error playing track:', error);
      
      // Fallback method if the normal approach fails
      try {
        const song = allSongs[index];
        
        // Ensure we have a valid artwork that won't cause type issues
        let artwork;
        if (song.cover && typeof song.cover === 'string' && song.cover.trim() !== '') {
          artwork = { uri: song.cover };
        } else {
          // Use default local image
          artwork = DEFAULT_MUSIC_IMAGE;
        }
        
        const singleTrack = {
          id: song.id,
          url: song.url || `file://${song.path}`,
          title: song.title,
          artist: song.artist,
          artwork: artwork,
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

  // Helper function to prepare and play tracks
  const prepareAndPlayTracks = async () => {
    // Format all tracks for the queue
    const formattedTracks = allSongs.map(track => {
      // Ensure we have a valid artwork that won't cause type issues
      let artwork;
      if (track.cover && typeof track.cover === 'string' && track.cover.trim() !== '') {
        artwork = { uri: track.cover };
      } else {
        // Use default local image
        artwork = DEFAULT_MUSIC_IMAGE;
      }
      
      return {
        id: track.id,
        url: track.url || `file://${track.path}`,
        title: track.title,
        artist: track.artist,
        artwork: artwork,
        isLocal: true
      };
    });
    
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
  };

  const isCurrentlyPlaying = currentPlaying?.id === song.id && playerState.state === 'playing';
  const isPaused = currentPlaying?.id === song.id && playerState.state !== 'playing';

  // Determine what image source to use
  const getImageSource = () => {
    if (isCurrentlyPlaying) {
      return require("../../Images/playing.gif");
    } else if (isPaused) {
      return require("../../Images/songPaused.gif");
    } else if (song.cover && typeof song.cover === 'string' && song.cover.trim() !== '') {
      return { uri: song.cover };
    } else {
      return DEFAULT_MUSIC_IMAGE;
    }
  };

  return (
    <View style={styles.container}>
      <Pressable onPress={handlePress} style={styles.songInfo}>
        <View style={styles.imageContainer}>
          <FastImage 
            source={getImageSource()}
            style={styles.image}
            resizeMode={FastImage.resizeMode.cover}
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