import React, { useContext, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { View, ScrollView, Pressable, ToastAndroid, TextInput } from 'react-native';
import FastImage from 'react-native-fast-image';
import { PlainText } from '../Global/PlainText';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import TrackPlayer from 'react-native-track-player';
import { AddPlaylist, AddSongsToQueue } from '../../MusicPlayerFunctions';
import Context from '../../Context/Context';
import Modal from "react-native-modal";
import { GetCustomPlaylists, AddSongToCustomPlaylist } from '../../LocalStorage/CustomPlaylists';
import { StyleSheet } from 'react-native';
import { Heading } from '../Global/Heading';

export const CustomPlaylistView = ({ route, navigation }) => {
  const { playlistName, songs } = route.params;
  const { updateTrack } = useContext(Context);
  const [menuVisible, setMenuVisible] = useState(false);
  const [selectedSong, setSelectedSong] = useState(null);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [availablePlaylists, setAvailablePlaylists] = useState({});
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [showOptions, setShowOptions] = useState(false);
  const handlePlayPlaylist = async () => {
    await TrackPlayer.reset();
    await AddPlaylist(songs);
    await TrackPlayer.play();
    updateTrack();
  };
  const handlePlaySong = async (index) => {
    await TrackPlayer.reset();
    await AddPlaylist(songs.slice(index));
    await TrackPlayer.play();
    updateTrack();
  };
  const truncateText = (text, limit = 20) => {
    return text.length > limit ? text.substring(0, limit) + '...' : text;
  };
  const handleShufflePlay = async () => {
    const shuffledSongs = [...songs].sort(() => Math.random() - 0.5);
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
      const playlists = await GetCustomPlaylists();
      const updatedSongs = playlists[playlistName].filter(s => s.id !== song.id);
      playlists[playlistName] = updatedSongs;
      await AsyncStorage.setItem('@custom_playlists', JSON.stringify(playlists));
      ToastAndroid.show('Song removed from playlist', ToastAndroid.SHORT);
      setMenuVisible(false);
      navigation.goBack();
    } catch (error) {
      console.log('Delete error:', error);
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
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <FastImage
          source={songs?.length > 0 
            ? { uri: songs[songs.length - 1].image }
            : require('../../Images/wav.png')}
          style={styles.playlistCover}
        />
        <View style={styles.playlistInfo}>
          <PlainText text={playlistName} style={styles.playlistName} />
          <PlainText text={`${songs?.length || 0} Songs`} style={styles.songCount} />
          <View style={styles.controls}>
            <Pressable style={styles.shuffleButton} onPress={handleShufflePlay}>
              <MaterialCommunityIcons name="shuffle" size={24} color="white" />
              <PlainText text="Shuffle" style={styles.controlText} />
            </Pressable>
            <Pressable style={styles.playButton} onPress={handlePlayPlaylist}>
              <MaterialCommunityIcons name="play" size={24} color="white" />
            </Pressable>
          </View>
        </View>
      </View>

      <ScrollView style={styles.songList}>
        {songs?.map((song, index) => (
          <Pressable
            key={song.id}
            style={styles.songItem}
            onPress={() => handlePlaySong(index)}
          >
            <FastImage source={{ uri: song.image }} style={styles.songImage} />
            <View style={styles.songInfo}>
              <PlainText 
                text={truncateText(song.title)} 
                style={styles.songTitle} 
              />
              <PlainText 
                text={truncateText(song.artist)} 
                style={styles.artistName} 
              />
            </View>
            <Pressable
              onPress={(event) => {
                const { pageY } = event.nativeEvent;
                setMenuPosition({ y: pageY - 100 }); // Adjusted position
                setSelectedSong(song);
                setMenuVisible(true);
              }}
              style={styles.menuButton}
            >
              <MaterialCommunityIcons name="dots-vertical" size={24} color="white" />
            </Pressable>
          </Pressable>
        ))}
      </ScrollView>

      <Modal
        isVisible={menuVisible}
        onBackdropPress={() => setMenuVisible(false)}
        onBackButtonPress={() => setMenuVisible(false)}
        backdropOpacity={0}
        animationIn="fadeIn"
        animationOut="fadeOut"
        style={[styles.menuModal, { top: menuPosition.y }]}
      >
        <View style={styles.menuContainer}>
          <MenuButton
            icon={<MaterialCommunityIcons name="playlist-plus" size={22} color="white"/>}
            text="Add to Playlist"
            onPress={handleAddToPlaylist}
          />
          <MenuButton
            icon={<MaterialCommunityIcons name="playlist-remove" size={22} color="white"/>}
            text="Delete from Playlist"
            onPress={() => handleDeleteFromPlaylist(selectedSong)}
          />
          <MenuButton
            icon={<MaterialCommunityIcons name="play-box-multiple" size={22} color="white"/>}
            text="Play Next"
            onPress={() => handlePlayNext(selectedSong)}
          />
        </View>
      </Modal>

      {/* Playlist Selection Modal */}
      <Modal
        isVisible={showPlaylistModal}
        onBackdropPress={() => setShowPlaylistModal(false)}
        style={styles.playlistModal}
      >
        <View style={styles.playlistModalContent}>
          <Heading text="Add to Playlist" />
          <ScrollView style={styles.playlistList}>
            {Object.keys(availablePlaylists).map((playlist) => (
              <Pressable
                key={playlist}
                style={styles.playlistItem}
                onPress={() => addSongToSelectedPlaylist(playlist)}
              >
                <PlainText text={playlist} style={styles.playlistName} />
              </Pressable>
            ))}
          </ScrollView>
        </View>
      </Modal>
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
    borderRadius: 8,
  },
  playlistInfo: {
    marginLeft: 15,
    flex: 1,
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
    paddingHorizontal: 15,
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
  },
  menuContainer: {
    backgroundColor: '#282828',
    borderRadius: 4,
    width: 200,
    overflow: 'hidden',
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
    borderRadius: 20,
    gap: 5,
  },
  playButton: {
    backgroundColor: '#1DB954',
    padding: 12,
    borderRadius: 25,
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