import Modal from "react-native-modal";
import { Dimensions, PermissionsAndroid, Platform, Pressable, ToastAndroid, View } from "react-native";
import { PlainText } from "./PlainText";
import React, { useContext } from "react";
import FormatTitleAndArtist from "../../Utils/FormatTitleAndArtist";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import ReactNativeBlobUtil from "react-native-blob-util";
import { GetDownloadPath } from "../../LocalStorage/AppSettings";
import DeviceInfo from "react-native-device-info";
import { AddSongsToQueue, getIndexQuality} from "../../MusicPlayerFunctions";
import Context from "../../Context/Context";
import TrackPlayer from "react-native-track-player";
import { GetCustomPlaylists, AddSongToCustomPlaylist } from "../../LocalStorage/CustomPlaylists";
import { useState } from "react";
import { ScrollView, TextInput } from "react-native";
import { CreateCustomPlaylist } from "../../LocalStorage/CustomPlaylists";
import { Heading } from "../Global/Heading";
import FastImage from "react-native-fast-image";
const styles = {
  emptyState: {
    alignItems: 'center',
    padding: 20,
  },
  emptyStateImage: {
    width: 100,
    height: 100,
    opacity: 0.5,
  },
  playlistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  playlistImage: {
    width: 50,
    height: 50,
    borderRadius: 4,
  },
  playlistInfo: {
    marginLeft: 15,
    flex: 1,
  },
  playlistName: {
    color: 'white',
    fontSize: 16,
    fontWeight: '500',
  },
  songCount: {
    color: 'gray',
    fontSize: 12,
    marginTop: 4,
  },
};

export const EachSongMenuModal = ({Visible, setVisible}) => {
  const {updateTrack} = useContext(Context);
  const [showPlaylistModal, setShowPlaylistModal] = useState(false);
  const [newPlaylistName, setNewPlaylistName] = useState('');
  const [availablePlaylists, setAvailablePlaylists] = useState({});
  
  async function actualDownload () {
    let dirs = ReactNativeBlobUtil.fs.dirs
    const path = await GetDownloadPath()
    ToastAndroid.showWithGravity(
      `Download Started`,
      ToastAndroid.SHORT,
      ToastAndroid.CENTER,
    );
    ReactNativeBlobUtil
      .config({
        addAndroidDownloads:{
          useDownloadManager:true,
          path:(path === "Downloads") ? dirs.LegacyDownloadDir + `/Orbit/${FormatTitleAndArtist(Visible.title)}.m4a` : dirs.LegacyMusicDir + `/Orbit/${FormatTitleAndArtist(Visible.title)}.m4a`,
          notification:true,
          title:`${FormatTitleAndArtist(Visible.title)}`,
        },
        fileCache: true,
      })
      .fetch('GET', Visible.url[4].url, {
      })
      .then((res) => {
        console.log('The file saved to ', res.path())
        ToastAndroid.showWithGravity(
          "Download successfully Completed",
          ToastAndroid.SHORT,
          ToastAndroid.CENTER,
        );
      })
    setVisible({visible: false})
  }
  async function playNext() {
    const quality = await getIndexQuality()
    const song = {
      url: Visible.url[quality].url,
      title: FormatTitleAndArtist(Visible.title),
      artist: FormatTitleAndArtist(Visible.artist),
      artwork: Visible.image,
      duration: Visible.duration,
      id: Visible.id,
      language: Visible.language,
      image: Visible.image,
      downloadUrl: Visible.url,
    }
    
    try {
      const queue = await TrackPlayer.getQueue();
      const currentIndex = await TrackPlayer.getCurrentTrack();
      
      // If no track is playing, add to beginning and play
      if (currentIndex === null || queue.length === 0) {
        await TrackPlayer.add(song);
        await TrackPlayer.play();
      } else {
        await TrackPlayer.add(song, currentIndex + 1);
      }
      
      updateTrack();
      setVisible({visible: false});
      ToastAndroid.showWithGravity(
        `Song Will Play Next`,
        ToastAndroid.SHORT,
        ToastAndroid.CENTER,
      );
    } catch (error) {
      console.log("Play next error:", error);
      ToastAndroid.showWithGravity(
        `Unable to add song`,
        ToastAndroid.SHORT,
        ToastAndroid.CENTER,
      );
    }
  }
  const getPermission = async () => {
    if (Platform.OS === 'ios') {
      actualDownload();
    } else {
      try {
        let deviceVersion = DeviceInfo.getSystemVersion();
        let granted = PermissionsAndroid.RESULTS.DENIED;
        if (deviceVersion >= 13) {
          granted = PermissionsAndroid.RESULTS.GRANTED;
        } else {
          granted = await PermissionsAndroid.request(
            PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
          );
        }
        if (granted === PermissionsAndroid.RESULTS.GRANTED) {
          actualDownload();
        } else {
          console.log("please grant permission");
        }
      } catch (err) {
        console.log("display error",err)    }
    }
  };
  async function addSongToQueue(){
    const quality = await getIndexQuality()
    const song  = {
      url: Visible.url[quality].url,
      title:FormatTitleAndArtist(Visible.title),
      artist:FormatTitleAndArtist(Visible.artist),
      artwork:Visible.image,
      duration:Visible.duration,
      id:Visible.id,
      language:Visible.language,
      image:Visible.image,
      downloadUrl:Visible.url,
    }
   await AddSongsToQueue([song])
    updateTrack()
    setVisible({visible: false})
    ToastAndroid.showWithGravity(
      `Song Added To Queue`,
      ToastAndroid.SHORT,
      ToastAndroid.CENTER,
    );
  }
  const size = Dimensions.get("window").height
  // Add this function alongside other functions like playNext, addSongToQueue, etc.
  async function handleAddToPlaylist() {
    const playlists = await GetCustomPlaylists();
    setAvailablePlaylists(playlists);
    setShowPlaylistModal(true);
  }
  async function addSongToSelectedPlaylist(playlistName) {
    const quality = await getIndexQuality();
    const song = {
      url: Visible.url[quality].url,
      title: FormatTitleAndArtist(Visible.title),
      artist: FormatTitleAndArtist(Visible.artist),
      artwork: Visible.image,
      duration: Visible.duration,
      id: Visible.id,
      language: Visible.language,
      image: Visible.image,
      downloadUrl: Visible.url,
    };
  
    const playlists = await GetCustomPlaylists();
    const playlist = playlists[playlistName] || [];
    
    if (playlist.some(track => track.id === song.id)) {
      ToastAndroid.showWithGravity(
        "Song already exists in this playlist",
        ToastAndroid.SHORT,
        ToastAndroid.CENTER
      );
      return;
    }

    await AddSongToCustomPlaylist(playlistName, song);
    ToastAndroid.showWithGravity(
      "Song added to " + playlistName,
      ToastAndroid.SHORT,
      ToastAndroid.CENTER
    );
    setShowPlaylistModal(false);
    setVisible({visible: false});
  }
  async function handleCreatePlaylist() {
    if (newPlaylistName.trim()) {
      await CreateCustomPlaylist(newPlaylistName);
      const playlists = await GetCustomPlaylists();
      setAvailablePlaylists(playlists);
      setNewPlaylistName('');
      ToastAndroid.showWithGravity(
        "Playlist created successfully",
        ToastAndroid.SHORT,
        ToastAndroid.CENTER
      );
    }
  }
  const getPlaylistImage = (playlist) => {
    if (!playlist || playlist.length === 0) {
      return require('../../Images/wav.png');
    }
    return { uri: playlist[playlist.length - 1].image };
  };
  return (
    <>
      <Modal 
        onBackButtonPress={() => setVisible({visible: false})} 
        onBackdropPress={() => setVisible({visible: false})} 
        isVisible={Visible.visible} 
        backdropOpacity={0}
        animationIn="fadeIn"
        animationOut="fadeOut"
        animationInTiming={50}
        animationOutTiming={50}
        useNativeDriver
        hideModalContentWhileAnimating
        style={{
          margin: 0,
          position: 'absolute',
          top: typeof Visible.position?.y === 'number' ? Visible.position.y : 0,
          right: 16,
          justifyContent: 'flex-start',
        }}
      >
        <View style={{
          backgroundColor: "rgb(28,28,28)",
          borderRadius: 10,
          width: 200,
          overflow: 'hidden',
          elevation: 10,
          transform: [
            { translateY: -50 },
            { scale: Visible.visible ? 1 : 0.95 }
          ],
          opacity: Visible.visible ? 1 : 0,
        }}>
          {/* <MenuButton
            icon={<MaterialCommunityIcons name="magnify" size={22} color="white"/>}
            text="Search Home"
            onPress={() => {
              setVisible({visible: false});
            }}
          /> */}
          <MenuButton
            icon={<MaterialCommunityIcons name="play-box-multiple" size={22} color="white"/>}
            text="Play Next"
            onPress={playNext}
          />
          <MenuButton
            icon={<MaterialCommunityIcons name="playlist-music" size={22} color="white"/>}
            text="Add to Queue"
            onPress={addSongToQueue}
          />
          <MenuButton
            icon={<MaterialCommunityIcons name="playlist-plus" size={22} color="white"/>}
            text="Add to Playlist"
            onPress={handleAddToPlaylist}
          />
          <MenuButton
            icon={<MaterialCommunityIcons name="download" size={22} color="white"/>}
            text="Download"
            onPress={getPermission}
          />
          {/* <MenuButton
            icon={<MaterialCommunityIcons name="youtube" size={22} color="white"/>}
            text="Watch Video"
            onPress={() => {}}
          />
          <MenuButton
            icon={<MaterialCommunityIcons name="share-variant" size={22} color="white"/>}
            text="Share"
            onPress={() => {}}
          /> */}
        </View>
      </Modal>
      <Modal
        isVisible={showPlaylistModal}
        onBackdropPress={() => setShowPlaylistModal(false)}
        onBackButtonPress={() => setShowPlaylistModal(false)}
        style={{
          margin: 20,
          justifyContent: 'center',
        }}
      >
        <View style={{
          backgroundColor: "rgb(28,28,28)",
          borderRadius: 10,
          padding: 20,
          maxHeight: '80%',
        }}>
          <Heading text="Add to Playlist" />
          <View style={{ marginVertical: 15 }}>
            <TextInput
              placeholder="Create new playlist..."
              placeholderTextColor="gray"
              value={newPlaylistName}
              onChangeText={setNewPlaylistName}
              style={{
                borderWidth: 1,
                borderColor: 'gray',
                borderRadius: 5,
                padding: 10,
                color: 'white',
                marginBottom: 10,
              }}
            />
            <Pressable
              onPress={handleCreatePlaylist}
              style={{
                backgroundColor: '#1DB954',
                padding: 10,
                borderRadius: 5,
                alignItems: 'center',
              }}
            >
              <PlainText text="Create New Playlist" style={{ color: 'white' }} />
            </Pressable>
          </View>
          <ScrollView style={{ maxHeight: 300 }}>
            {Object.keys(availablePlaylists).length === 0 ? (
              <View style={styles.emptyState}>
                <FastImage
                  source={require('../../Images/wav.png')}
                  style={styles.emptyStateImage}
                />
                <PlainText 
                  text="No playlists available. Create one!" 
                  style={{ color: 'gray', textAlign: 'center', marginTop: 10 }}
                />
              </View>
            ) : (
              Object.keys(availablePlaylists).map((name) => (
                <Pressable
                  key={name}
                  onPress={() => addSongToSelectedPlaylist(name)}
                  style={styles.playlistItem}
                >
                  <FastImage
                    source={getPlaylistImage(availablePlaylists[name])}
                    style={styles.playlistImage}
                  />
                  <View style={styles.playlistInfo}>
                    <PlainText text={name} style={styles.playlistName} />
                    <PlainText 
                      text={`${availablePlaylists[name].length} songs`} 
                      style={styles.songCount}
                    />
                  </View>
                </Pressable>
              ))
            )}
          </ScrollView>
        </View>
      </Modal>
    </>
  );
};

const MenuButton = ({icon, text, onPress}) => (
  <Pressable 
    onPress={onPress}
    android_ripple={{color: 'rgba(255,255,255,0.1)'}}
    style={{
      flexDirection: 'row',
      alignItems: 'center',
      padding: 12,
      paddingHorizontal: 16,
    }}
  >
    {icon}
    <PlainText 
      text={text} 
      style={{
        color: "white",
        marginLeft: 16,
        fontSize: 14,
      }}
    />
  </Pressable>
);
