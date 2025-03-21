import React, { useContext, useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, ScrollView, Pressable, ToastAndroid, TextInput, Text, StatusBar, Image } from 'react-native';
import FastImage from 'react-native-fast-image';
import { PlainText } from '../Global/PlainText';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import TrackPlayer from 'react-native-track-player';
import { AddPlaylist, AddSongsToQueue } from '../../MusicPlayerFunctions';
import Context from '../../Context/Context';
import Modal from "react-native-modal";
import { GetCustomPlaylists, AddSongToCustomPlaylist, CreateCustomPlaylist } from '../../LocalStorage/CustomPlaylists';
import { StyleSheet } from 'react-native';
import { Heading } from "../Global/Heading";
import { useNavigation } from "@react-navigation/native";

export const CustomPlaylistView = (props) => {
  const [Songs, setSongs] = useState([]);
  const [playlistName, setPlaylistName] = useState("");
  const navigation = useNavigation();
  const { Queue, setQueue, setCurrentPlaying, currentPlaying } = useContext(Context);
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedSong, setSelectedSong] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [availablePlaylists, setAvailablePlaylists] = useState({});
  const [newPlaylistName, setNewPlaylistName] = useState('');

  useEffect(() => {
    // Safely extract params with error handling
    try {
      // Check if route and params exist
      if (props.route && props.route.params) {
        // Get songs data
        const songs = props.route.params.songs || [];
        setSongs(songs);
        
        // Get playlist name
        const name = props.route.params.playlistName || "Custom Playlist";
        setPlaylistName(name);
        
        console.log(`CustomPlaylistView loaded with ${songs.length} songs and name: ${name}`);
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
    }
  }, [props.route]);
  
  // Function to try recovering playlist data from storage
  const recoverPlaylistDataFromStorage = async () => {
    try {
      // Try to get the last viewed playlist
      const storedPlaylist = await AsyncStorage.getItem('last_viewed_custom_playlist');
      if (storedPlaylist) {
        const playlistData = JSON.parse(storedPlaylist);
        setPlaylistName(playlistData.name || "Custom Playlist");
        setSongs(playlistData.songs || []);
        console.log('Recovered playlist data from storage');
      }
    } catch (error) {
      console.error('Error recovering playlist data:', error);
    }
  };
  
  // Save the current playlist data to storage for recovery
  useEffect(() => {
    try {
      if (props.route && props.route.params && props.route.params.playlistName) {
        // Store the current playlist data for recovery
        const playlistData = {
          name: props.route.params.playlistName,
          songs: props.route.params.songs || []
        };
        
        AsyncStorage.setItem('last_viewed_custom_playlist', JSON.stringify(playlistData))
          .catch(err => console.error('Failed to save playlist data:', err));
      }
    } catch (error) {
      console.error('Error saving playlist data:', error);
    }
  }, [props.route]);

  const { updateTrack } = useContext(Context);

  const handleCreatePlaylist = async () => {
    if (newPlaylistName.trim()) {
      await CreateCustomPlaylist(newPlaylistName);
      const playlists = await GetCustomPlaylists();
      setAvailablePlaylists(playlists);
      setNewPlaylistName('');
      ToastAndroid.show(
        "Playlist created successfully",
        ToastAndroid.SHORT
      );
    }
  };
  const getPlaylistImage = (playlist) => {
    if (!playlist || playlist.length === 0) {
      return require('../../Images/wav.png');
    }
    return { uri: playlist[playlist.length - 1].image };
  };
  const handlePlayPlaylist = async () => {
    await TrackPlayer.reset();
    await AddPlaylist(Songs);
    await TrackPlayer.play();
    updateTrack();
  };
  const handlePlaySong = async (index) => {
    await TrackPlayer.reset();
    await AddPlaylist(Songs.slice(index));
    await TrackPlayer.play();
    updateTrack();
  };
  const truncateText = (text, limit = 20) => {
    return text.length > limit ? text.substring(0, limit) + '...' : text;
  };
  const handleShufflePlay = async () => {
    const shuffledSongs = [...Songs].sort(() => Math.random() - 0.5);
    await TrackPlayer.reset();
    await AddPlaylist(shuffledSongs);
    await TrackPlayer.play();
    updateTrack();
  };
  const handlePlayNext = async (song) => {
    try {
      const queue = await TrackPlayer.getQueue();
      const currentIndex = await TrackPlayer.getCurrentTrack();
      await AddSongsToQueue([song]);
      
      if (currentIndex !== null && queue.length > 0) {
        const newIndex = currentIndex + 1;
        await TrackPlayer.skip(newIndex);
      }
      
      ToastAndroid.show('Added to play next', ToastAndroid.SHORT);
      setMenuVisible(false);
    } catch (error) {
      console.log('Play next error:', error);
    }
  };
  const handleAddToPlaylist = async () => {
    const playlists = await GetCustomPlaylists();
    setAvailablePlaylists(playlists);
    setShowPlaylistModal(true);
    setMenuVisible(false);
  };
  const handleDeleteFromPlaylist = async (song) => {
    try {
      // Get the latest playlists data
      const playlists = await GetCustomPlaylists();
      
      // Filter out the song to be deleted
      const updatedSongs = playlists[playlistName].filter(s => s.id !== song.id);
      
      // Update the playlist with filtered songs
      playlists[playlistName] = updatedSongs;
      
      // Save to AsyncStorage - IMPORTANT: Use the EXACT same key as in your CustomPlaylists.js file
      await AsyncStorage.setItem('CustomPlaylists', JSON.stringify(playlists));
      
      // Update local state and navigation params to reflect changes immediately
      navigation.setParams({ songs: updatedSongs });
      
      ToastAndroid.show('Song removed from playlist', ToastAndroid.SHORT);
      setMenuVisible(false);
    } catch (error) {
      console.log('Delete error:', error);
      ToastAndroid.show('Failed to remove song', ToastAndroid.SHORT);
    }
  };
  const addSongToSelectedPlaylist = async (targetPlaylist) => {
    const playlists = await GetCustomPlaylists();
    if (playlists[targetPlaylist].some(track => track.id === selectedSong.id)) {
      ToastAndroid.show('Song already exists in this playlist', ToastAndroid.SHORT);
      return;
    }
    await AddSongToCustomPlaylist(targetPlaylist, selectedSong);
    ToastAndroid.show(`Added to ${targetPlaylist}`, ToastAndroid.SHORT);
    setShowPlaylistModal(false);
  };

  // Function to add all songs to the queue
  const AddAllSongsToQueue = async () => {
    try {
      if (!Songs || Songs.length === 0) {
        console.log('No songs to play');
        return;
      }
      
      // Reset queue
      await TrackPlayer.reset();
      
      // Add all songs to queue
      await TrackPlayer.add(Songs);
      
      // Start playback
      await TrackPlayer.play();
      
      // Update context if needed
      if (updateTrack) {
        updateTrack();
      }
      
      ToastAndroid.show('Playing all songs', ToastAndroid.SHORT);
    } catch (error) {
      console.error('Error playing songs:', error);
      ToastAndroid.show('Failed to play songs', ToastAndroid.SHORT);
    }
  };
  
  // Add helper function for adding playlist
  const AddPlaylist = async (tracks) => {
    try {
      if (!tracks || tracks.length === 0) return;
      
      await TrackPlayer.add(tracks);
      if (setQueue) {
        setQueue(tracks);
      }
    } catch (error) {
      console.error('Error adding playlist:', error);
    }
  };

  // Add a custom SongCard component to replace AlbumSongCard
  const SongCard = ({ e, allSongs, index, screenName }) => {
    const { updateTrack } = useContext(Context);
    const navigation = useNavigation();
    
    // Play this song
    const playSong = async () => {
      try {
        await TrackPlayer.reset();
        await TrackPlayer.add(allSongs.slice(index));
        await TrackPlayer.play();
        if (updateTrack) updateTrack();
      } catch (error) {
        console.error('Error playing song:', error);
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
    
    return (
      <>
        <Pressable
          onPress={playSong}
          style={{
            flexDirection: 'row',
            padding: 10,
            alignItems: 'center',
            marginVertical: 6,
            backgroundColor: 'rgba(255,255,255,0.05)',
            borderRadius: 8,
          }}
        >
          {/* Song image */}
          <FastImage
            source={{ uri: e.image }}
            style={{
              width: 50,
              height: 50,
              borderRadius: 4,
            }}
          />
          
          {/* Song details */}
          <View style={{ marginLeft: 12, flex: 1 }}>
            <Text style={{ color: 'white', fontSize: 16, fontWeight: '500' }} numberOfLines={1}>
              {e.title}
            </Text>
            <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 14 }} numberOfLines={1}>
              {e.artist}
            </Text>
          </View>
          
          {/* Options button */}
          <Pressable
            style={{ padding: 8 }}
            onPress={handleMoreOptions}
          >
            <MaterialCommunityIcons name="dots-vertical" size={24} color="white" />
          </Pressable>
        </Pressable>
        
        {/* Options Modal */}
        <Modal
          isVisible={menuVisible}
          onBackdropPress={() => setMenuVisible(false)}
          onBackButtonPress={() => setMenuVisible(false)}
          backdropOpacity={0.3}
          animationIn="fadeIn"
          animationOut="fadeOut"
          style={{ margin: 0, justifyContent: 'flex-end' }}
        >
          <View style={{
            backgroundColor: '#282828',
            borderTopLeftRadius: 12,
            borderTopRightRadius: 12,
            paddingBottom: 20
          }}>
            <View style={{ 
              padding: 16, 
              borderBottomWidth: 1, 
              borderBottomColor: 'rgba(255,255,255,0.1)',
              flexDirection: 'row',
              alignItems: 'center'
            }}>
              <FastImage 
                source={{ uri: e.image }} 
                style={{ width: 40, height: 40, borderRadius: 4 }} 
              />
              <View style={{ marginLeft: 12 }}>
                <Text style={{ color: 'white', fontWeight: '600' }} numberOfLines={1}>{e.title}</Text>
                <Text style={{ color: 'rgba(255,255,255,0.7)', fontSize: 12 }} numberOfLines={1}>{e.artist}</Text>
              </View>
            </View>
            
            <Pressable
              style={{ 
                flexDirection: 'row', 
                alignItems: 'center', 
                padding: 16,
                paddingVertical: 12
              }}
              onPress={handlePlayNext}
            >
              <MaterialCommunityIcons name="play-box-multiple" size={24} color="white" />
              <Text style={{ color: 'white', marginLeft: 16 }}>Play Next</Text>
            </Pressable>
            
            <Pressable
              style={{ 
                flexDirection: 'row', 
                alignItems: 'center', 
                padding: 16,
                paddingVertical: 12
              }}
              onPress={() => {
                ToastAndroid.show('Song information', ToastAndroid.SHORT);
                setMenuVisible(false);
              }}
            >
              <MaterialCommunityIcons name="information-outline" size={24} color="white" />
              <Text style={{ color: 'white', marginLeft: 16 }}>Song Info</Text>
            </Pressable>
          </View>
        </Modal>
      </>
    );
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#121212' }}>
      <StatusBar barStyle="light-content" />
      
      {/* Add back button */}
      <View style={{ 
        flexDirection: 'row', 
        alignItems: 'center',
        paddingHorizontal: 12,
        paddingTop: 10,
        paddingBottom: 10
      }}>
        <Pressable
          onPress={() => navigation.goBack()}
          style={{
            padding: 8,
          }}
        >
          <MaterialCommunityIcons name="arrow-left" size={28} color="white" />
        </Pressable>
        <Text style={{ 
          color: 'white', 
          fontSize: 18, 
          fontWeight: 'bold',
          marginLeft: 10
        }}>
          {playlistName || "Custom Playlist"}
        </Text>
      </View>
      
      <ScrollView
        style={{
          flex: 1,
        }}
        contentContainerStyle={{
          paddingHorizontal: 12,
          paddingVertical: 10,
          paddingTop: 50,
        }}
      >
        <Heading text={playlistName || "Custom Playlist"} style={{ marginBottom: 5 }} />
        <Text style={{ color: "white", opacity: 0.5 }}>
          {Songs.length} songs
        </Text>

        {/* Play All Button */}
        {Songs.length > 0 && (
          <Pressable
            onPress={() => AddAllSongsToQueue()}
            style={{
              marginVertical: 15,
              backgroundColor: "#fff",
              paddingVertical: 10,
              borderRadius: 5,
            }}
          >
            <Text
              style={{
                color: "#000",
                textAlign: "center",
                fontWeight: "600",
              }}
            >
              Play All
            </Text>
          </Pressable>
        )}

        {/* Song List */}
        {Songs.map((e, i) => (
          <SongCard
            key={i}
            e={e}
            allSongs={Songs}
            index={i}
            screenName={playlistName || "Custom Playlist"}
          />
        ))}
      </ScrollView>
    </View>
  );
};

const MenuButton = ({icon, text, onPress}) => (
  <Pressable 
    onPress={onPress}
    android_ripple={{color: 'rgba(255,255,255,0.1)'}}
    style={styles.menuButton}
  >
    {icon}
    <PlainText text={text} style={styles.menuText} />
  </Pressable>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  header: {
    padding: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  playlistCover: {
    width: 120,
    height: 120,
    borderRadius: 10,
  },
  playlistInfo: {
    marginLeft: 15,
    flex: 1,
    justifyContent: 'space-between',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 15,
    gap: 10,
  },
  shuffleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#282828',
    padding: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
  },
  playButton: {
    backgroundColor: '#1DB954',
    padding: 8,
    borderRadius: 20,
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuModal: {
    margin: 0,
    position: 'absolute',
    right: 16,
    justifyContent: 'flex-start',
    alignItems: 'flex-end', // Add this to align the menu to the right
  },
  menuContainer: {
    backgroundColor: '#282828',
    borderRadius: 8, // Increased from 4 to 8
    width: 200,
    overflow: 'hidden',
    elevation: 10, // Ensure the menu has proper elevation
  },
  playlistModalContent: {
    backgroundColor: '#282828',
    borderRadius: 8,
    padding: 16,
    maxHeight: '80%',
    margin: 20,
  },
  playlistName: {
    color: 'white',
    fontSize: 24,
    fontWeight: 'bold',
  },
  songCount: {
    color: 'gray',
    marginTop: 4,
  },
  playButton: {
    marginTop: 15,
  },
  songList: {
    flex: 1,
  },
  songItem: {
    flexDirection: 'row',
    padding: 12,
    alignItems: 'center',
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  songImage: {
    width: 50,
    height: 50,
    borderRadius: 4,
  },
  songInfo: {
    marginLeft: 15,
    flex: 1,
  },
  songTitle: {
    color: 'white',
    fontSize: 16,
    width: '95%', // Added to ensure text stays within bounds
  },
  artistName: {
    color: 'gray',
    fontSize: 14,
    marginTop: 2,
    width: '95%', // Added to ensure text stays within bounds
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 15,
  },
  shuffleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#282828',
    padding: 10,
    paddingHorizontal: 15,
    borderRadius: 20,
    gap: 5,
  },
  playButton: {
    backgroundColor: '#1DB954',
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  controlText: {
    color: 'white',
    marginLeft: 5,
  },
  menuButton: {
    padding: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#282828',
    borderRadius: 12,
    width: '80%',
    padding: 16,
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  modalText: {
    color: 'white',
    fontSize: 16,
  },
  menuContainer: {
    backgroundColor: "rgb(28,28,28)",
    borderRadius: 10,
    width: 200,
    overflow: 'hidden',
    elevation: 10,
  },
  menuButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingHorizontal: 16,
  },
  menuText: {
    color: "white",
    marginLeft: 16,
    fontSize: 14,
  },
});