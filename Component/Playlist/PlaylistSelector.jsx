import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, TextInput, ToastAndroid, BackHandler, Dimensions, ScrollView } from 'react-native';
import { getUserPlaylists, addSongToPlaylist, createPlaylist } from '../../Utils/PlaylistManager';
import { PlainText } from '../Global/PlainText';
import { SmallText } from '../Global/SmallText';
import FastImage from 'react-native-fast-image';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const MAX_MODAL_HEIGHT = SCREEN_HEIGHT * 0.7;

// Default wave image for empty playlists
const DEFAULT_WAVE_IMAGE = require('../../Images/wav.png');

export const PlaylistSelector = ({ visible, onClose, song }) => {
  const [playlists, setPlaylists] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewPlaylistModal, setShowNewPlaylistModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');

  useEffect(() => {
    if (visible) {
      loadPlaylists();
    }
  }, [visible]);

  useEffect(() => {
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (visible) {
        if (showNewPlaylistModal) {
          setShowNewPlaylistModal(false);
          return true;
        }
        onClose();
        return true;
      }
      return false;
    });

    return () => backHandler.remove();
  }, [visible, showNewPlaylistModal, onClose]);

  const loadPlaylists = async () => {
    try {
      setIsLoading(true);
      const userPlaylists = await getUserPlaylists();
      setPlaylists(userPlaylists);
    } catch (error) {
      console.error('Error loading playlists:', error);
      ToastAndroid.show('Failed to load playlists', ToastAndroid.SHORT);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddToPlaylist = async (playlistId) => {
    try {
      const success = await addSongToPlaylist(playlistId, song);
      if (success) {
        onClose();
      }
    } catch (error) {
      console.error('Error adding song to playlist:', error);
      ToastAndroid.show('Failed to add to playlist', ToastAndroid.SHORT);
    }
  };

  const handleCreateNewPlaylist = async () => {
    if (!newPlaylistName.trim()) {
      ToastAndroid.show('Please enter a playlist name', ToastAndroid.SHORT);
      return;
    }

    try {
      const success = await createPlaylist(newPlaylistName, song);
      if (success) {
        setShowNewPlaylistModal(false);
        setNewPlaylistName('');
        onClose();
      }
    } catch (error) {
      console.error('Error creating playlist:', error);
      ToastAndroid.show('Failed to create playlist', ToastAndroid.SHORT);
    }
  };

  const renderPlaylistItem = (item) => (
    <TouchableOpacity 
      style={styles.playlistItem}
      onPress={() => handleAddToPlaylist(item.id)}
      key={item.id}
    >
      {item.coverImage ? (
        <FastImage 
          source={{ uri: item.coverImage }}
          style={styles.playlistCover}
          defaultSource={DEFAULT_WAVE_IMAGE}
        />
      ) : (
        <View style={[styles.playlistCover, styles.fallbackCover]}>
          <FastImage 
            source={DEFAULT_WAVE_IMAGE}
            style={styles.waveImage}
            resizeMode={FastImage.resizeMode.cover}
          />
        </View>
      )}
      <View style={styles.playlistInfo}>
        <PlainText text={item.name} style={styles.playlistName} />
        <SmallText text={`${item.songs ? item.songs.length : 0} songs`} style={styles.songCount} />
      </View>
      <MaterialCommunityIcons name="plus-circle" size={24} color="#1DB954" />
    </TouchableOpacity>
  );

  if (!visible) return null;

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.container}>
          <View style={styles.header}>
            <PlainText text="Add to Playlist" style={styles.title} />
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <MaterialCommunityIcons name="close" size={24} color="#FFF" />
            </TouchableOpacity>
          </View>

          <TouchableOpacity 
            style={styles.createNewButton}
            onPress={() => setShowNewPlaylistModal(true)}
          >
            <MaterialCommunityIcons name="playlist-plus" size={24} color="#FFF" />
            <PlainText text="Create New Playlist" style={styles.createNewText} />
          </TouchableOpacity>

          <ScrollView 
            style={styles.playlistListContainer}
            contentContainerStyle={styles.playlistList}
            showsVerticalScrollIndicator={true}
          >
            {isLoading ? (
              <View style={styles.emptyState}>
                <PlainText text="Loading playlists..." style={styles.emptyText} />
              </View>
            ) : playlists.length > 0 ? (
              playlists.map((item) => renderPlaylistItem(item))
            ) : (
              <View style={styles.emptyState}>
                <MaterialCommunityIcons name="playlist-music" size={48} color="#555" />
                <PlainText text="No playlists yet" style={styles.emptyText} />
                <SmallText text="Create a new playlist to add this song" style={styles.emptySubtext} />
              </View>
            )}
          </ScrollView>
        </View>
      </View>
      
      {/* New Playlist Modal */}
      <Modal
        visible={showNewPlaylistModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowNewPlaylistModal(false)}
      >
        <View style={styles.centeredModalOverlay}>
          <View style={styles.createPlaylistModalContent}>
            <PlainText text="Create New Playlist" style={styles.modalTitle} />
            
            <TextInput
              style={styles.input}
              placeholder="Playlist Name"
              placeholderTextColor="#999"
              value={newPlaylistName}
              onChangeText={setNewPlaylistName}
              autoFocus
            />
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={[styles.modalButton, styles.cancelButton]}
                onPress={() => setShowNewPlaylistModal(false)}
              >
                <Text style={styles.buttonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={[styles.modalButton, styles.createButton]}
                onPress={handleCreateNewPlaylist}
              >
                <Text style={styles.buttonText}>Create</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-end',
  },
  centeredModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  container: {
    width: '100%',
    maxHeight: MAX_MODAL_HEIGHT,
    backgroundColor: '#121212',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 8,
  },
  createNewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#1E1E1E',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  createNewText: {
    marginLeft: 12,
    fontSize: 16,
    color: '#1DB954',
  },
  playlistListContainer: {
    maxHeight: SCREEN_HEIGHT * 0.4,
  },
  playlistList: {
    padding: 16,
  },
  playlistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#1E1E1E',
    borderRadius: 8,
    marginBottom: 8,
  },
  playlistCover: {
    width: 50,
    height: 50,
    borderRadius: 4,
    backgroundColor: '#333',
    overflow: 'hidden',
  },
  fallbackCover: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  waveImage: {
    width: 50,
    height: 50,
    borderRadius: 4,
  },
  playlistInfo: {
    flex: 1,
    marginLeft: 12,
  },
  playlistName: {
    fontSize: 16,
    marginBottom: 4,
  },
  songCount: {
    color: '#999',
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 16,
    color: '#999',
    marginTop: 16,
  },
  emptySubtext: {
    color: '#666',
    marginTop: 8,
  },
  createPlaylistModalContent: {
    width: '85%',
    maxWidth: 400,
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 20,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 8,
    paddingHorizontal: 12,
    color: 'white',
    backgroundColor: '#333',
    marginBottom: 16,
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
    marginHorizontal: 8,
  },
  cancelButton: {
    backgroundColor: '#444',
  },
  createButton: {
    backgroundColor: '#1DB954',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
}); 