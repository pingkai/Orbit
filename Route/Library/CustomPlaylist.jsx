import { useEffect, useState } from "react";
import { View, Modal, TextInput, Pressable, Text, FlatList, StyleSheet, Animated, Easing } from "react-native";
import { GetCustomPlaylists, CreateCustomPlaylist } from "../../LocalStorage/CustomPlaylists";
import { useTheme } from "@react-navigation/native";
import { Heading } from "../../Component/Global/Heading";
import { SmallText } from "../../Component/Global/SmallText";
import { Spacer } from "../../Component/Global/Spacer";
import MaterialIcons from "react-native-vector-icons/MaterialIcons";
import FastImage from "react-native-fast-image"; // Add this import
import { useNavigation } from "@react-navigation/native";

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

  const renderPlaylist = ({ item, index }) => {
    const translateY = new Animated.Value(20); // Reduced from 30
      
    Animated.timing(translateY, { // Changed from spring to timing
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
                ? { uri: playlists[item][playlists[item].length - 1].image }
                : require('../../Images/wav.png')}
              style={styles.playlistImage}
            />
            <View style={styles.playlistInfo}>
              <Heading text={item} style={styles.playlistTitle} />
              <SmallText text={`${playlists[item]?.length || 0} songs`}
              style={styles.text}
              />
            </View>
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
    padding: 2, // Reduced from 4
    borderRadius: 12,
    marginBottom: 0, // Reduced from 1
  },
  playlistContent: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 6, // Reduced from 8
  },
  playlistInfo: {
    flex: 1,
    gap: 0, // Reduced from 2
  },
  playlistImage: {
    width: 50,
    height: 50,
    borderRadius: 10,
    marginRight: 10, // Reduced from 15
  },
  playlistTitle: {
    fontSize:16, // Added font size
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
  }
});