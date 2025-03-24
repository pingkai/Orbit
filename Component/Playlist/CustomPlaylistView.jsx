import React, { useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, ScrollView, Pressable, ToastAndroid, Text, StatusBar, Image, BackHandler } from 'react-native';
import FastImage from 'react-native-fast-image';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import TrackPlayer from 'react-native-track-player';
import { AddSongsToQueue, PlayOneSong } from '../../MusicPlayerFunctions';
import Context from '../../Context/Context';
import Modal from "react-native-modal";
import { GetCustomPlaylists, AddSongToCustomPlaylist, CreateCustomPlaylist } from '../../LocalStorage/CustomPlaylists';
import { StyleSheet } from 'react-native';
import { useNavigation, CommonActions } from "@react-navigation/native";
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { PlainText } from '../Global/PlainText';
import { getUserPlaylists } from '../../Utils/PlaylistManager';

export const CustomPlaylistView = (props) => {
  const [Songs, setSongs] = useState([]);
  const [playlistName, setPlaylistName] = useState("");
  const [playlistId, setPlaylistId] = useState(null);
  const [isUserPlaylist, setIsUserPlaylist] = useState(false);
  const navigation = useNavigation();
  const { Queue, setQueue, setCurrentPlaying, currentPlaying } = useContext(Context);
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedSong, setSelectedSong] = useState(null);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [availablePlaylists, setAvailablePlaylists] = useState({});
  const [newPlaylistName, setNewPlaylistName] = useState('');

  useEffect(() => {
    // Safely extract params with error handling
    try {
      console.log('CustomPlaylistView rendering with route params:', props.route?.params);
      
      // First check navigation state for params
      const state = navigation.getState();
      let paramsFromState = null;
      
      if (state?.routes?.[0]?.params?.params?.screen === 'CustomPlaylistView') {
        paramsFromState = state.routes[0].params.params.params;
        console.log('Found params in navigation state:', paramsFromState);
      }
      
      // Check if route and params exist
      if ((props.route && props.route.params) || paramsFromState) {
        // Get songs data - prioritize route params, then navigation state
        const songs = props.route?.params?.songs || paramsFromState?.songs || [];
        setSongs(songs);
        
        // Get playlist name - properly prioritize all possible sources
        const name = props.route?.params?.playlistName || 
                     props.route?.params?.name || 
                     paramsFromState?.playlistName || 
                     paramsFromState?.name || 
                     "Custom Playlist";
        
        setPlaylistName(name);
        
        // Get and store playlist ID if available
        const id = props.route?.params?.playlistId || paramsFromState?.playlistId || null;
        setPlaylistId(id);
        
        // Check if this is a user playlist from the PlaylistManager
        const userPlaylist = (id && id.startsWith('playlist_'));
        setIsUserPlaylist(userPlaylist);
        
        console.log(`CustomPlaylistView loaded with ${songs.length} songs and name: ${name}, ID: ${id}, isUserPlaylist: ${userPlaylist}`);
        
        // Store the current playlist data for recovery
        storeCurrentPlaylist(name, songs, id);
      } else {
        console.log('No route params available, using default values');
        setSongs([]);
        setPlaylistName("Custom Playlist");
        
        // Try to recover from AsyncStorage as fallback
        recoverPlaylistDataFromStorage();
      }
    } catch (error) {
      console.error('Error initializing CustomPlaylistView:', error);
      // Set defaults on error
      setSongs([]);
      setPlaylistName("Custom Playlist");
      recoverPlaylistDataFromStorage();
    }
  }, [props.route, navigation]);
  
  // Helper for storing playlist data
  const storeCurrentPlaylist = async (name, songs, id = null) => {
    try {
      // Only store if we have valid data
      if (name && songs && songs.length > 0) {
        const playlistData = { name, songs, id };
        await AsyncStorage.setItem('last_viewed_custom_playlist', JSON.stringify(playlistData));
        console.log(`Stored playlist "${name}" with ${songs.length} songs for recovery, ID: ${id}`);
      }
    } catch (err) {
      console.error('Failed to save playlist data:', err);
    }
  };
  
  // Function to try recovering playlist data from storage
  const recoverPlaylistDataFromStorage = async () => {
    try {
      // Try to get the last viewed playlist
      const storedPlaylist = await AsyncStorage.getItem('last_viewed_custom_playlist');
      if (storedPlaylist) {
        const playlistData = JSON.parse(storedPlaylist);
        if (playlistData.songs && playlistData.songs.length > 0) {
          // Ensure we use the actual playlist name from storage
          setPlaylistName(playlistData.name || "Custom Playlist");
          setSongs(playlistData.songs || []);
          
          // Also recover playlist ID if available
          if (playlistData.id) {
            setPlaylistId(playlistData.id);
            setIsUserPlaylist(playlistData.id.startsWith('playlist_'));
          }
          
          console.log(`Recovered playlist data: ${playlistData.name} with ${playlistData.songs.length} songs, ID: ${playlistData.id}`);
          
          // Update navigation params to reflect recovered data
          navigation.setParams({
            playlistName: playlistData.name,
            name: playlistData.name,
            songs: playlistData.songs,
            playlistId: playlistData.id
          });
        } else {
          console.log('Recovered playlist had no songs, not using it');
        }
      } else {
        console.log('No stored playlist found for recovery');
      }
    } catch (error) {
      console.error('Error recovering playlist data:', error);
    }
  };
  
  // Improved back handler to ensure we can get back to Library
  useEffect(() => {
    const handleBack = () => {
      // Use CommonActions to reset navigation stack and ensure we go back to Library
      navigation.dispatch(
        CommonActions.reset({
          index: 0,
          routes: [
            { 
              name: 'MainRoute',
              state: {
                routes: [{ name: 'Library' }],
                index: 0
              }
            },
          ],
        })
      );
      return true;
    };
    
    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBack);
    
    return () => backHandler.remove();
  }, [navigation]);
  
  // Handle back button press with improved navigation
  const handleGoBack = () => {
    // Use CommonActions to reset navigation stack and ensure we go back to Library
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [
          { 
            name: 'MainRoute',
            state: {
              routes: [{ name: 'Library' }],
              index: 0
            }
          },
        ],
      })
    );
  };

  const { updateTrack } = useContext(Context);

  // Function to add all songs to the queue
  const AddAllSongsToQueue = async () => {
    try {
      if (!Songs || Songs.length === 0) {
        console.log('No songs to play');
        return;
      }
      
      // Default music image to use when artwork is missing
      const DEFAULT_MUSIC_IMAGE = require('../../Images/default.jpg');
      
      // Format all tracks for playback
      const formattedTracks = Songs.map(track => {
        // Check if this is a local song
        const isLocalFile = track.isLocalMusic || track.path || 
           (track.url && typeof track.url === 'string' && track.url.startsWith('file://'));
        
        // Format local song
        if (isLocalFile) {
          const formattedTrack = {
            id: track.id || `local-${Date.now()}`,
            url: track.url && typeof track.url === 'string' && track.url.startsWith('file://') 
                 ? track.url : `file://${track.path || track.url}`,
            title: track.title || 'Unknown',
            artist: track.artist || 'Unknown Artist',
            artwork: (typeof track.artwork === 'number' || !track.artwork) 
                     ? DEFAULT_MUSIC_IMAGE : { uri: track.artwork },
            // Ensure duration is a number
            duration: typeof track.duration === 'string' ? parseFloat(track.duration) || 0 : track.duration || 0,
            isLocalMusic: true
          };
          console.log('Formatted local track for queue:', formattedTrack);
          return formattedTrack;
        } 
        
        // Format online song - handle multiple URL formats
        let url = '';
        
        // Case 1: Direct URL string
        if (typeof track.url === 'string') {
          url = track.url;
        }
        // Case 2: URL is an array
        else if (Array.isArray(track.url)) {
          // Try to get highest quality URL from array
          const highestQualityUrl = getHighestQualityUrl(track.url);
          url = highestQualityUrl || '';
        }
        // Case 3: downloadUrl array
        else if (track.downloadUrl) {
          if (Array.isArray(track.downloadUrl) && track.downloadUrl.length > 0) {
            // Find the best quality URL from downloadUrl array
            const quality = track.downloadUrl.length - 1; // Default to highest quality
            url = track.downloadUrl[quality]?.url || '';
          } else if (typeof track.downloadUrl === 'string') {
            url = track.downloadUrl;
          }
        }
        
        // If we still don't have a URL, check if track.url is an object with properties
        if (!url && typeof track.url === 'object' && track.url !== null) {
          // Try various quality options
          url = track.url['320kbps'] || track.url['160kbps'] || track.url['96kbps'] || track.url['48kbps'] || '';
        }
        
        if (!url) {
          console.warn('Could not determine URL for track:', track.id || track.title);
        }
        
        return {
          id: track.id || `online-${Date.now()}`,
          url: url,
          title: track.title || 'Unknown',
          artist: track.artist || 'Unknown Artist',
          artwork: track.image || track.artwork || DEFAULT_MUSIC_IMAGE,
          duration: typeof track.duration === 'string' ? parseFloat(track.duration) || 0 : track.duration || 0,
          language: track.language,
          artistID: track.artistID || track.primary_artists_id
        };
      });
      
      console.log('Playing all tracks, first track:', JSON.stringify(formattedTracks[0]));
      
      // Reset queue
      await TrackPlayer.reset();
      
      // Add all songs to queue
      await TrackPlayer.add(formattedTracks);
      
      // Start playback
      await TrackPlayer.play();
      
      // Update context if needed
      if (updateTrack) {
        updateTrack();
      }
      
      ToastAndroid.show('Playing all songs', ToastAndroid.SHORT);
    } catch (error) {
      console.error('Error playing songs:', error);
      ToastAndroid.show('Failed to play songs: ' + error.message, ToastAndroid.SHORT);
    }
  };

  // Helper function to get highest quality URL from an array
  const getHighestQualityUrl = (urlArray) => {
    if (!Array.isArray(urlArray) || urlArray.length === 0) {
      return '';
    }
    
    try {
      // If array contains objects with quality property
      if (typeof urlArray[0] === 'object' && urlArray[0].quality) {
        // Sort by quality (assuming quality is in format like "320kbps")
        const sortedUrls = [...urlArray].sort((a, b) => {
          const qualityA = parseInt(a.quality?.replace(/[^\d]/g, '') || 0);
          const qualityB = parseInt(b.quality?.replace(/[^\d]/g, '') || 0);
          return qualityB - qualityA; // Descending order
        });
        
        return sortedUrls[0]?.url || '';
      }
      // If array contains string URLs
      else if (typeof urlArray[0] === 'string') {
        return urlArray[0];
      }
      // If array contains objects with URL property
      else if (urlArray[0] && typeof urlArray[0] === 'object' && 'url' in urlArray[0]) {
        return urlArray[0].url;
      }
    } catch (error) {
      console.error('Error parsing URL array:', error);
    }
    
    // Fallback to first item if possible
    return typeof urlArray[0] === 'string' ? urlArray[0] : 
           (urlArray[0]?.url || '');
  };

  // Add a custom SongCard component to replace AlbumSongCard
  const SongCard = ({ e, allSongs, index }) => {
    const { updateTrack } = useContext(Context);
    
    // Default music image to use when artwork is missing
    const DEFAULT_MUSIC_IMAGE = require('../../Images/default.jpg');
    
    // Function to get proper image source
    const getImageSource = () => {
      // For local songs that have numeric cover or missing artwork
      if (e.isLocalMusic || e.path || (typeof e.artwork === 'number') || 
          (typeof e.image === 'number') || !e.image && !e.artwork) {
        return DEFAULT_MUSIC_IMAGE;
      }
      
      // For invalid URI values
      if (e.image && typeof e.image === 'string' && !e.image.startsWith('http') && !e.image.startsWith('file://')) {
        return DEFAULT_MUSIC_IMAGE;
      }
      
      if (e.artwork && typeof e.artwork === 'string' && !e.artwork.startsWith('http') && !e.artwork.startsWith('file://')) {
        return DEFAULT_MUSIC_IMAGE;
      }
      
      // For normal songs with artwork
      return { uri: e.image || e.artwork };
    };
    
    // Format track for playback
    const formatTrack = (track) => {
      // Check if this is a local song
      const isLocalFile = track.isLocalMusic || track.path || (track.url && typeof track.url === 'string' && track.url.startsWith('file://'));
      
      // Format local song
      if (isLocalFile) {
        const formattedTrack = {
          id: track.id || `local-${Date.now()}`,
          url: track.url && typeof track.url === 'string' && track.url.startsWith('file://') ? track.url : `file://${track.path || track.url}`,
          title: track.title || 'Unknown',
          artist: track.artist || 'Unknown Artist',
          artwork: (typeof track.artwork === 'number' || !track.artwork) ? DEFAULT_MUSIC_IMAGE : { uri: track.artwork },
          // Ensure duration is a number
          duration: typeof track.duration === 'string' ? parseFloat(track.duration) || 0 : track.duration || 0,
          isLocalMusic: true
        };
        console.log('Formatted local track:', formattedTrack);
        return formattedTrack;
      } 
      
      // Format online song - handle multiple URL formats
      let url = '';
      
      // Case 1: Direct URL string
      if (typeof track.url === 'string') {
        url = track.url;
      }
      // Case 2: URL is an array
      else if (Array.isArray(track.url)) {
        // Try to get highest quality URL from array
        const highestQualityUrl = getHighestQualityUrl(track.url);
        url = highestQualityUrl || '';
      }
      // Case 3: downloadUrl array
      else if (track.downloadUrl) {
        if (Array.isArray(track.downloadUrl) && track.downloadUrl.length > 0) {
          // Find the best quality URL from downloadUrl array
          const quality = track.downloadUrl.length - 1; // Default to highest quality
          url = track.downloadUrl[quality]?.url || '';
        } else if (typeof track.downloadUrl === 'string') {
          url = track.downloadUrl;
        }
      }
      
      // If we still don't have a URL, check if track.url is an object with properties
      if (!url && typeof track.url === 'object' && track.url !== null) {
        // Try various quality options
        url = track.url['320kbps'] || track.url['160kbps'] || track.url['96kbps'] || track.url['48kbps'] || '';
      }
      
      if (!url) {
        console.warn('Could not determine URL for track:', track.id || track.title);
      }
      
      return {
        id: track.id || `online-${Date.now()}`,
        url: url,
        title: track.title || 'Unknown',
        artist: track.artist || 'Unknown Artist',
        artwork: track.image || track.artwork || DEFAULT_MUSIC_IMAGE,
        duration: typeof track.duration === 'string' ? parseFloat(track.duration) || 0 : track.duration || 0,
        language: track.language,
        artistID: track.artistID || track.primary_artists_id
      };
    };
    
    // Play this song
    const playSong = async () => {
      try {
        // Format all tracks starting from the current one
        const tracksToPlay = allSongs.slice(index).map(track => {
          // Check if this is a local song
          const isLocalFile = track.isLocalMusic || track.path || (track.url && typeof track.url === 'string' && track.url.startsWith('file://'));
          
          // Format local song
          if (isLocalFile) {
            const formattedTrack = {
              id: track.id || `local-${Date.now()}`,
              url: track.url && typeof track.url === 'string' && track.url.startsWith('file://') ? track.url : `file://${track.path || track.url}`,
              title: track.title || 'Unknown',
              artist: track.artist || 'Unknown Artist',
              artwork: (typeof track.artwork === 'number' || !track.artwork) ? DEFAULT_MUSIC_IMAGE : { uri: track.artwork },
              // Ensure duration is a number
              duration: typeof track.duration === 'string' ? parseFloat(track.duration) || 0 : track.duration || 0,
              isLocalMusic: true
            };
            console.log('Formatted local track:', formattedTrack);
            return formattedTrack;
          } 
          
          // Format online song - handle multiple URL formats
          let url = '';
          
          // Case 1: Direct URL string
          if (typeof track.url === 'string') {
            url = track.url;
          }
          // Case 2: URL is an array
          else if (Array.isArray(track.url)) {
            // Try to get highest quality URL from array
            const highestQualityUrl = getHighestQualityUrl(track.url);
            url = highestQualityUrl || '';
          }
          // Case 3: downloadUrl array
          else if (track.downloadUrl) {
            if (Array.isArray(track.downloadUrl) && track.downloadUrl.length > 0) {
              // Find the best quality URL from downloadUrl array
              const quality = track.downloadUrl.length - 1; // Default to highest quality
              url = track.downloadUrl[quality]?.url || '';
            } else if (typeof track.downloadUrl === 'string') {
              url = track.downloadUrl;
            }
          }
          
          // If we still don't have a URL, check if track.url is an object with properties
          if (!url && typeof track.url === 'object' && track.url !== null) {
            // Try various quality options
            url = track.url['320kbps'] || track.url['160kbps'] || track.url['96kbps'] || track.url['48kbps'] || '';
          }
          
          if (!url) {
            console.warn('Could not determine URL for track:', track.id || track.title);
          }
          
          return {
            id: track.id || `online-${Date.now()}`,
            url: url,
            title: track.title || 'Unknown',
            artist: track.artist || 'Unknown Artist',
            artwork: track.image || track.artwork || DEFAULT_MUSIC_IMAGE,
            duration: typeof track.duration === 'string' ? parseFloat(track.duration) || 0 : track.duration || 0,
            language: track.language,
            artistID: track.artistID || track.primary_artists_id
          };
        });
        
        console.log('Playing track:', JSON.stringify(tracksToPlay[0]));
        
        await TrackPlayer.reset();
        await TrackPlayer.add(tracksToPlay);
        await TrackPlayer.play();
        if (updateTrack) updateTrack();
      } catch (error) {
        console.error('Error playing song:', error);
        ToastAndroid.show('Failed to play song: ' + error.message, ToastAndroid.SHORT);
      }
    };
    
    // Handle options menu
    const [menuVisible, setMenuVisible] = useState(false);
    
    const handleMoreOptions = () => {
      setMenuVisible(true);
    };
    
    const handlePlayNext = async () => {
      try {
        const queue = await TrackPlayer.getQueue();
        const currentIndex = await TrackPlayer.getCurrentTrack();
        await TrackPlayer.add([e], currentIndex + 1);
        ToastAndroid.show('Added to play next', ToastAndroid.SHORT);
    setMenuVisible(false);
      } catch (error) {
        console.error('Play next error:', error);
      }
  };
    
    const handleDeleteFromPlaylist = async () => {
    try {
      // Get the latest playlists data
      const playlists = await GetCustomPlaylists();
      
      // Filter out the song to be deleted
        const updatedSongs = playlists[playlistName].filter(s => s.id !== e.id);
      
      // Update the playlist with filtered songs
      playlists[playlistName] = updatedSongs;
      
        // Save to AsyncStorage
      await AsyncStorage.setItem('CustomPlaylists', JSON.stringify(playlists));
      
        // Update local state
        setSongs(updatedSongs);
      
      ToastAndroid.show('Song removed from playlist', ToastAndroid.SHORT);
      setMenuVisible(false);
    } catch (error) {
      console.log('Delete error:', error);
      ToastAndroid.show('Failed to remove song', ToastAndroid.SHORT);
    }
  };
    
  const handleAddToPlaylist = async (song) => {
    try {
      // Import the function to add song to playlist
      const { AddOneSongToPlaylist } = require('../../MusicPlayerFunctions');
      
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

  return (
      <>
        <Pressable
          onPress={playSong}
          style={styles.songCard}
          android_ripple={{ color: 'rgba(255,255,255,0.1)' }}
        >
          {/* Song image with default fallback */}
          <FastImage
            source={getImageSource()}
            style={styles.songImage}
          />
          
          {/* Song details */}
          <View style={styles.songInfo}>
            <Text style={styles.songTitle} numberOfLines={1}>
              {e.title.length > 20 ? e.title.substring(0, 20) + '...' : e.title}
            </Text>
            <Text style={styles.artistName} numberOfLines={1}>
              {e.artist.length > 20 ? e.artist.substring(0, 20) + '...' : e.artist}
            </Text>
      </View>

          {/* Options button */}
          <Pressable
            style={styles.optionsButton}
            onPress={handleMoreOptions}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
          >
            <MaterialCommunityIcons name="dots-vertical" size={22} color="rgba(255,255,255,0.8)" />
          </Pressable>
        </Pressable>
        
        {/* Options Modal */}
        <Modal
          isVisible={menuVisible}
          onBackdropPress={() => setMenuVisible(false)}
          onBackButtonPress={() => setMenuVisible(false)}
          backdropOpacity={0.5}
          animationIn="slideInUp"
          animationOut="slideOutDown"
          style={styles.modal}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <FastImage 
                source={getImageSource()} 
                style={styles.modalImage} 
              />
              <View style={styles.modalHeaderText}>
                <Text style={styles.modalTitle} numberOfLines={1}>{e.title}</Text>
                <Text style={styles.modalSubtitle} numberOfLines={1}>{e.artist}</Text>
              </View>
            </View>
            
            <Pressable
              style={styles.modalOption}
              onPress={handlePlayNext}
              android_ripple={{ color: 'rgba(255,255,255,0.1)' }}
            >
              <MaterialCommunityIcons name="play-box-multiple" size={22} color="white" />
              <Text style={styles.modalOptionText}>Play Next</Text>
            </Pressable>
            
            <Pressable
              style={styles.modalOption}
              onPress={() => {
                setMenuVisible(false);
                handleAddToPlaylist(e);
              }}
              android_ripple={{ color: 'rgba(255,255,255,0.1)' }}
            >
              <MaterialCommunityIcons name="playlist-plus" size={22} color="white" />
              <Text style={styles.modalOptionText}>Add to Playlist</Text>
            </Pressable>
            
            <Pressable
              style={styles.modalOption}
              onPress={handleDeleteFromPlaylist}
              android_ripple={{ color: 'rgba(255,255,255,0.1)' }}
            >
              <MaterialCommunityIcons name="playlist-remove" size={22} color="white" />
              <Text style={styles.modalOptionText}>Remove from Playlist</Text>
            </Pressable>
        </View>
      </Modal>
      </>
    );
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#121212" />
      
      {/* Background gradient */}
      <LinearGradient
        colors={['#383838', '#282828', '#181818', '#121212']}
        style={styles.backgroundGradient}
      />
      
      {/* Header */}
      <View style={styles.header}>
        <Pressable
          onPress={handleGoBack}
          style={styles.backButton}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color="white" />
        </Pressable>
        
        <Text style={styles.headerTitle} numberOfLines={1}>
          {playlistName || "Custom Playlist"}
        </Text>
      </View>
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Playlist header section */}
        <View style={styles.playlistHeader}>
          <FastImage
            source={Songs.length > 0 ? 
              (() => {
                const firstSong = Songs[0];
                // Handle local songs or songs with numeric/invalid artwork
                if (firstSong.isLocalMusic || firstSong.path || 
                    (typeof firstSong.artwork === 'number') || 
                    (typeof firstSong.image === 'number') || 
                    (!firstSong.image && !firstSong.artwork) ||
                    (firstSong.image && typeof firstSong.image === 'string' && 
                     !firstSong.image.startsWith('http') && !firstSong.image.startsWith('file://')) ||
                    (firstSong.artwork && typeof firstSong.artwork === 'string' && 
                     !firstSong.artwork.startsWith('http') && !firstSong.artwork.startsWith('file://'))) {
                  return require('../../Images/default.jpg');
                }
                // Normal songs with valid image
                return { uri: firstSong.image || firstSong.artwork };
              })() : 
              require('../../Images/wav.png')}
            style={styles.playlistCover}
          />
          
          <View style={styles.playlistInfo}>
            <Text style={styles.playlistTitle}>{playlistName || "Custom Playlist"}</Text>
            <Text style={styles.songCount}>{Songs.length} {Songs.length === 1 ? 'song' : 'songs'}</Text>
            
            {/* Play buttons */}
            {Songs.length > 0 && (
              <View style={styles.playlistControls}>
                <Pressable
                  onPress={AddAllSongsToQueue}
                  style={styles.playButton}
                  android_ripple={{ color: 'rgba(0,0,0,0.1)' }}
                >
                  <Ionicons name="play" size={22} color="black" />
                  <Text style={styles.playButtonText}>Play</Text>
                </Pressable>
              </View>
            )}
          </View>
        </View>
        
        {/* Divider */}
        <View style={styles.divider} />
        
        {/* Songs list */}
        {Songs.length > 0 ? (
          <View style={styles.songsList}>
            {Songs.map((e, i) => (
              <SongCard
                key={i}
                e={e}
                allSongs={Songs}
                index={i}
              />
            ))}
          </View>
        ) : (
          <View style={styles.emptySongs}>
            <Ionicons name="musical-notes-outline" size={50} color="rgba(255,255,255,0.5)" />
            <Text style={styles.emptyText}>No songs in this playlist</Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  backgroundGradient: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 300,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    zIndex: 10,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
    marginLeft: 12,
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  playlistHeader: {
    paddingHorizontal: 16,
    paddingTop: 20,
    paddingBottom: 24,
    flexDirection: 'row',
  },
  playlistCover: {
    width: 140,
    height: 140,
    borderRadius: 8,
    backgroundColor: '#333',
  },
  playlistInfo: {
    marginLeft: 16,
    flex: 1,
    justifyContent: 'center',
  },
  playlistTitle: {
    color: 'white',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  songCount: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    marginBottom: 20,
  },
  playlistControls: {
    marginTop: 8,
  },
  playButton: {
    backgroundColor: 'white',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 24,
    borderRadius: 20,
    alignSelf: 'flex-start',
  },
  playButtonText: {
    color: 'black',
    fontWeight: '600',
    marginLeft: 8,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginHorizontal: 16,
    marginBottom: 16,
  },
  songsList: {
    paddingHorizontal: 16,
  },
  songCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    marginBottom: 8,
    backgroundColor: 'rgba(255,255,255,0.03)',
    borderRadius: 8,
    paddingHorizontal: 12,
  },
  songImage: {
    width: 48,
    height: 48,
    borderRadius: 4,
    backgroundColor: '#333',
  },
  songInfo: {
    marginLeft: 12,
    flex: 1,
    justifyContent: 'center',
  },
  songTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  artistName: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
    marginTop: 2,
  },
  optionsButton: {
    padding: 8,
  },
  modal: {
    margin: 0,
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#282828',
    borderTopLeftRadius: 12,
    borderTopRightRadius: 12,
    paddingBottom: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  modalImage: {
    width: 48,
    height: 48,
    borderRadius: 4,
    backgroundColor: '#333',
  },
  modalHeaderText: {
    marginLeft: 12,
    flex: 1,
  },
  modalTitle: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  modalSubtitle: {
    color: 'rgba(255,255,255,0.7)',
    fontSize: 14,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingVertical: 14,
  },
  modalOptionText: {
    color: 'white',
    marginLeft: 16,
    fontSize: 16,
  },
  emptySongs: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 40,
  },
  emptyText: {
    color: 'rgba(255,255,255,0.7)',
    marginTop: 16,
    fontSize: 16,
  },
});