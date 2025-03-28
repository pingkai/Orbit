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
  const [fullNavPath, setFullNavPath] = useState('');

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

  useEffect(() => {
    // Try to identify if we're in the MyMusic page on mount
    try {
      const currentState = navigation.getState();
      if (currentState && currentState.routes && currentState.routes.length > 0) {
        const currentTabRoute = currentState.routes[currentState.index];
        let navigationPath = currentTabRoute.name;
        
        // Check for nested navigation to identify MyMusicPage
        if (currentTabRoute.name === 'Library' && currentTabRoute.state) {
          const libraryRoute = currentTabRoute.state.routes[currentTabRoute.state.index];
          if (libraryRoute.name === 'MyMusicPage') {
            navigationPath = 'Library/MyMusicPage';
          }
        }
        setFullNavPath(navigationPath);
      }
    } catch (error) {
      console.warn('Error detecting current route:', error);
    }
  }, [navigation]);

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
        let navPath = currentTabRoute.name;

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
              navPath = 'Library/MyMusicPage';
              setFullNavPath(navPath);
              setPreviousScreen(navPath);
              setMusicPreviousScreen(navPath);
              console.log('Explicitly set music previous screen to:', navPath);
            }
          }
        } catch (routeError) {
          console.log('Error trying to get current route name:', routeError);
        }
        
        // If we already identified MyMusicPage, skip the rest of route detection
        if (navPath === 'Library/MyMusicPage') {
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
            navPath = `${currentTabRoute.name}/${activeNestedRoute.name}/${deepNestedRoute.name}`;
            console.log('LocalMusicCard detected deep nesting:', navPath);
          } else {
            // Store the full navigation path (tab/screen)
            navPath = `${currentTabRoute.name}/${activeNestedRoute.name}`;
          }
        }
        
        // Save the current screen before opening player to both state variables
        console.log('Setting music previous screen before player opens:', navPath);
        // Make sure we're using a consistent path format - remove MainRoute prefix if present
        if (navPath.startsWith('MainRoute/')) {
          navPath = navPath.replace('MainRoute/', '');
          console.log('Cleaned MainRoute prefix from path:', navPath);
        }
        setFullNavPath(navPath);
        setPreviousScreen(navPath);
        setMusicPreviousScreen(navPath);
      }

      // If we get here, proceed with normal playback
      await prepareAndPlayTracks();
    } catch (error) {
      console.error('Error playing track:', error);
      
      // Fallback method if the normal approach fails
      try {
        const song = allSongs[index];
        const isFromMyMusic = fullNavPath === 'Library/MyMusicPage';
        
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
          isLocal: true,
          sourceType: isFromMyMusic ? 'mymusic' : 'download'
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

  // Format song title and artist
  const formatTitle = (title) => {
    if (!title) return "Unknown Title";
    
    // Remove file extensions if they exist
    let formatted = title.replace(/\.(mp3|m4a|wav|ogg|flac)$/i, '');
    
    // Limit to 20 characters
    if (formatted.length > 20) {
      return formatted.substring(0, 20) + "...";
    }
    
    return formatted;
  };
  
  const formatArtist = (artistName) => {
    if (!artistName) return "Unknown Artist";
    
    // Remove file extensions if they exist
    let formatted = artistName.replace(/\.(mp3|m4a|wav|ogg|flac)$/i, '');
    
    // Limit to 20 characters
    if (formatted.length > 20) {
      return formatted.substring(0, 20) + "...";
    }
    
    return formatted;
  };

  // Helper function to prepare and play tracks
  const prepareAndPlayTracks = async () => {
    try {
      // Check if we're in the MyMusic page
      const isFromMyMusic = fullNavPath === 'Library/MyMusicPage';
      console.log('Playing from MyMusic:', isFromMyMusic);

      // Ensure we have allSongs before proceeding
      if (!allSongs || !Array.isArray(allSongs) || allSongs.length === 0) {
        console.log('No songs available for queue');
        
        // Play just the current song if we don't have a valid array
        const singleTrack = {
          id: song.id || String(Math.random()),
          url: song.url || (song.path ? `file://${song.path}` : null),
          title: formatTitle(song.title),
          artist: formatArtist(song.artist),
          artwork: getArtworkForTrack(song),
          isLocal: true,
          sourceType: isFromMyMusic ? 'mymusic' : 'download'
        };
        
        if (!singleTrack.url) {
          console.error('Cannot play track: Missing file path');
          return;
        }
        
        await TrackPlayer.reset();
        await TrackPlayer.add(singleTrack);
        await TrackPlayer.play();
        setIndex(1);
        return;
      }
      
      // Format all tracks for the queue
      const formattedTracks = allSongs.map(track => {
        if (!track) return null;
        
        return {
          id: track.id || String(Math.random()),
          url: track.url || (track.path ? `file://${track.path}` : null),
          title: formatTitle(track.title),
          artist: formatArtist(track.artist),
          artwork: getArtworkForTrack(track),
          isLocal: true,
          sourceType: isFromMyMusic ? 'mymusic' : 'download'
        };
      }).filter(track => track && track.url); // Remove any invalid tracks
      
      if (formattedTracks.length === 0) {
        console.error('No valid tracks to play');
        return;
      }
      
      // Reset player and add all tracks
      await TrackPlayer.reset();
      
      // Make sure the index is valid for the filtered array
      const validIndex = Math.min(index || 0, formattedTracks.length - 1);
      
      // Add all tracks to queue, starting with the selected one
      const tracksToAdd = [
        ...formattedTracks.slice(validIndex),
        ...formattedTracks.slice(0, validIndex)
      ];
      
      await TrackPlayer.add(tracksToAdd);
      
      // Start playback
      await TrackPlayer.play();
      
      // Open the fullscreen player
      setIndex(1);
    } catch (error) {
      console.error('Error in prepareAndPlayTracks:', error);
      
      // Fallback to playing just this song on error
      try {
        const isFromMyMusic = fullNavPath === 'Library/MyMusicPage';
        const singleTrack = {
          id: song.id || String(Math.random()),
          url: song.url || (song.path ? `file://${song.path}` : null),
          title: formatTitle(song.title),
          artist: formatArtist(song.artist),
          artwork: getArtworkForTrack(song),
          isLocal: true,
          sourceType: isFromMyMusic ? 'mymusic' : 'download'
        };
        
        if (singleTrack.url) {
          await TrackPlayer.reset();
          await TrackPlayer.add(singleTrack);
          await TrackPlayer.play();
          setIndex(1);
        }
      } catch (fallbackError) {
        console.error('Even fallback playback failed:', fallbackError);
      }
    }
  };
  
  // Helper function to get artwork for a track
  const getArtworkForTrack = (track) => {
    // Ensure we have a valid artwork that won't cause type issues
    if (track.cover && typeof track.cover === 'string' && track.cover.trim() !== '') {
      return { uri: track.cover };
    } else {
      // Use static Music.jpeg image instead of animated GIFs in list view
      return DEFAULT_MUSIC_IMAGE;
    }
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
      // Use animated GIF from artwork function
      return getArtworkForTrack(song);
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
            text={formatTitle(song.title)} 
            style={styles.title} 
            numberOfLines={1} 
            ellipsizeMode="tail"
            songId={song.id}
            isSongTitle={true}
          />
          <SmallText 
            text={formatArtist(song.artist)} 
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
    backgroundColor: 'transparent',
    borderRadius: 16,
    marginLeft: 4,
    elevation: 0,
  },
});