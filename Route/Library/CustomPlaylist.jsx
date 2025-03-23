import { useEffect, useState } from "react";
import { View, Modal, TextInput, Pressable, Text, FlatList, StyleSheet, Animated, Easing, ToastAndroid, BackHandler } from "react-native";
import { GetCustomPlaylists, CreateCustomPlaylist } from "../../LocalStorage/CustomPlaylists";
import { useTheme } from "@react-navigation/native";
import { Heading } from "../../Component/Global/Heading";
import { SmallText } from "../../Component/Global/SmallText";
import { Spacer } from "../../Component/Global/Spacer";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import FastImage from "react-native-fast-image";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from '@react-native-async-storage/async-storage';

export const CustomPlaylist = () => {
  const navigation = useNavigation();
  const theme = useTheme();
  const [modalVisible, setModalVisible] = useState(false);
  const [playlistName, setPlaylistName] = useState('');
  const [playlists, setPlaylists] = useState({});
  const [hasPlaylists, setHasPlaylists] = useState(false);

  const loadPlaylists = async () => {
    const customPlaylists = await GetCustomPlaylists();
    setPlaylists(customPlaylists);
    setHasPlaylists(Object.keys(customPlaylists).length > 0);
  };

  const handleCreatePlaylist = async () => {
    if (playlistName.trim()) {
      await CreateCustomPlaylist(playlistName);
      setPlaylistName('');
      setModalVisible(false);
      loadPlaylists();
    }
  };
  const [fadeAnim] = useState(new Animated.Value(0));

  useEffect(() => {
    loadPlaylists();
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  // Add a direct back button handler to ensure proper navigation
  useEffect(() => {
    const handleBackPress = () => {
      console.log('Back pressed in CustomPlaylist, navigating to LibraryPage');
      navigation.navigate('LibraryPage');
      return true; // Prevent default back action
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);
    
    return () => {
      backHandler.remove();
    };
  }, [navigation]);

  const [editModalVisible, setEditModalVisible] = useState(false);
  const [selectedPlaylist, setSelectedPlaylist] = useState('');
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [menuVisible, setMenuVisible] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });

  const handleDeletePlaylist = async (playlistName) => {
    const customPlaylists = await GetCustomPlaylists();
    delete customPlaylists[playlistName];
    await AsyncStorage.setItem('CustomPlaylists', JSON.stringify(customPlaylists));
    loadPlaylists();
    setMenuVisible(false);
    ToastAndroid.show('Playlist deleted', ToastAndroid.SHORT);
  };

  const handleEditPlaylist = () => {
    setNewPlaylistName(selectedPlaylist);
    setEditModalVisible(true);
    setMenuVisible(false);
  };

  const handleUpdatePlaylistName = async () => {
    if (newPlaylistName.trim() && newPlaylistName !== selectedPlaylist) {
      const customPlaylists = await GetCustomPlaylists();
      customPlaylists[newPlaylistName] = customPlaylists[selectedPlaylist];
      delete customPlaylists[selectedPlaylist];
      
      await AsyncStorage.setItem('CustomPlaylists', JSON.stringify(customPlaylists));
      loadPlaylists();
      setEditModalVisible(false);
      ToastAndroid.show('Playlist name updated', ToastAndroid.SHORT);
    } else if (newPlaylistName === selectedPlaylist) {
      setEditModalVisible(false);
    } else {
      ToastAndroid.show('Please enter a valid name', ToastAndroid.SHORT);
    }
  };

  const renderPlaylist = ({ item, index }) => {
    const translateY = new Animated.Value(20); 
      
    Animated.timing(translateY, { 
      toValue: 0,
      duration: 300,
      delay: index * 100,
      useNativeDriver: true,
      easing: Easing.out(Easing.ease),
    }).start();
    
    return (
      <Animated.View style={{
        opacity: fadeAnim,
        transform: [{ translateY }]
      }}>
        <Pressable 
          style={styles.playlistItem}
          onPress={() => navigation.navigate('CustomPlaylistView', {
            playlistName: item,
            songs: playlists[item]
          })}
        >
          <View style={styles.playlistContent}>
            <FastImage
              source={playlists[item]?.length > 0 
                ? (() => {
                    const lastSong = playlists[item][playlists[item].length - 1];
                    // Handle local songs or songs with numeric/invalid artwork
                    if (lastSong.isLocalMusic || lastSong.path || 
                        (typeof lastSong.artwork === 'number') || 
                        (typeof lastSong.image === 'number') || 
                        (!lastSong.image && !lastSong.artwork) ||
                        (lastSong.image && typeof lastSong.image === 'string' && 
                         !lastSong.image.startsWith('http') && !lastSong.image.startsWith('file://')) ||
                        (lastSong.artwork && typeof lastSong.artwork === 'string' && 
                         !lastSong.artwork.startsWith('http') && !lastSong.artwork.startsWith('file://'))) {
                      return require('../../Images/default.jpg');
                    }
                    // Normal songs with valid image
                    return { uri: lastSong.image || lastSong.artwork };
                  })()
                : require('../../Images/wav.png')}
              style={styles.playlistImage}
            />
            <View style={styles.playlistInfo}>
              <Heading text={item} style={styles.playlistTitle} />
              <SmallText text={`${playlists[item]?.length || 0} songs`}
              style={styles.text}
              />
            </View>
            <Pressable
              onPress={(event) => {
                const { pageX, pageY } = event.nativeEvent;
                setMenuPosition({ x: pageX - 150, y: pageY - 30 });
                setSelectedPlaylist(item);
                setMenuVisible(true);
              }}
              style={styles.menuButton}
            >
              <MaterialIcons name="more-vert" size={24} color={theme.colors.text} />
            </Pressable>
          </View>
        </Pressable>
      </Animated.View>
    );
  };
  return (
    <View style={styles.container}>
      {!hasPlaylists ? (
        <Pressable 
          style={styles.createButton}
          onPress={() => setModalVisible(true)}
        >
          <MaterialIcons name="add" size={24} color={theme.colors.text} />
          <Text style={[styles.buttonText, { color: theme.colors.text }]}>
            Create Your First Playlist
          </Text>
        </Pressable>
      ) : (
        <>
          <View style={styles.header}>
            <Heading text="Your Playlists" />
            <Pressable 
              style={styles.addButton}
              onPress={() => setModalVisible(true)}
            >
              <MaterialIcons name="add" size={24} color={theme.colors.text} />
            </Pressable>
          </View>
          <Spacer />
          <FlatList
            data={Object.keys(playlists)}
            keyExtractor={item => item}
            renderItem={renderPlaylist}
            ItemSeparatorComponent={() => <Spacer />}
          />
        </>
      )}
      <Modal
        animationType="slide"
        transparent={true}
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: '#121212' }]}>
            <Heading text="Create New Playlist" />
            <SmallText text="Enter playlist name" style={styles.modalLabel} />
            <TextInput
              placeholder="Playlist name"
              placeholderTextColor="rgba(255,255,255,0.5)"
              value={playlistName}
              onChangeText={setPlaylistName}
              style={styles.input}
            />
            <Pressable 
              style={styles.createPlaylistButton}
              onPress={handleCreatePlaylist}
            >
              <Text style={styles.createButtonText}>Create</Text>
            </Pressable>
            <Pressable 
              style={styles.cancelButton}
              onPress={() => setModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
      <Modal
        transparent={true}
        visible={menuVisible}
        onRequestClose={() => setMenuVisible(false)}
        animationType="fade"
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setMenuVisible(false)}
        >
          <View 
            style={[
              styles.menuContainer, 
              { top: menuPosition.y, right: 20 }
            ]}
          >
            <Pressable 
              style={styles.menuItem}
              onPress={handleEditPlaylist}
            >
              <MaterialIcons name="edit" size={22} color="white" />
              <Text style={styles.menuText}>Edit Playlist</Text>
            </Pressable>
            <Pressable 
              style={styles.menuItem}
              onPress={() => handleDeletePlaylist(selectedPlaylist)}
            >
              <MaterialIcons name="delete" size={22} color="white" />
              <Text style={styles.menuText}>Delete Playlist</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>
      <Modal
        animationType="slide"
        transparent={true}
        visible={editModalVisible}
        onRequestClose={() => setEditModalVisible(false)}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: '#121212' }]}>
            <Heading text="Edit Playlist Name" />
            <SmallText text="Enter new playlist name" style={styles.modalLabel} />
            <TextInput
              placeholder="Playlist name"
              placeholderTextColor="rgba(255,255,255,0.5)"
              value={newPlaylistName}
              onChangeText={setNewPlaylistName}
              style={styles.input}
            />
            <Pressable 
              style={styles.createPlaylistButton}
              onPress={handleUpdatePlaylistName}
            >
              <Text style={styles.createButtonText}>Update</Text>
            </Pressable>
            <Pressable 
              style={styles.cancelButton}
              onPress={() => setEditModalVisible(false)}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  createButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    gap: 10,
  },
  addButton: {
    padding: 5,
  },
  playlistItem: {
    padding: 2,
    borderRadius: 12,
    marginBottom: 0,
  },
  playlistContent: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 6,
  },
  playlistInfo: {
    flex: 1,
    gap: 0, 
  },
  playlistImage: {
    width: 50,
    height: 50,
    borderRadius: 10,
    marginRight: 10,
  },
  playlistTitle: {
    fontSize:16,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#121212',
  },
  modalContent: {
    flex: 1,
    padding: 20,
  },
  modalLabel: {
    marginTop: 20,
    marginBottom: 10,
    color: 'rgba(255,255,255,0.7)',
    fontSize: 16,
  },
  input: {
    color: 'white',
    fontSize: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    paddingVertical: 8,
    marginBottom: 20,
  },
  createPlaylistButton: {
    backgroundColor: '#1DB954',
    padding: 15,
    alignItems: 'center',
    marginBottom: 10,
    borderRadius:12,
  },
  cancelButton: {
    backgroundColor: '#404040',
    padding: 15,
    alignItems: 'center',
    borderRadius:12,
  },
  createButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  text:{
    fontSize:12,
  },
  menuButton: {
    padding: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  menuContainer: {
    position: 'absolute',
    backgroundColor: '#282828',
    borderRadius: 8,
    width: 180,
    overflow: 'hidden',
    elevation: 5,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    paddingHorizontal: 16,
  },
  menuText: {
    color: 'white',
    marginLeft: 12,
    fontSize: 14,
  },
  menuText: {
    color: 'white',
    marginLeft: 12,
    fontSize: 14,
  },
  cancelButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  text:{
    fontSize:12,
  }
});