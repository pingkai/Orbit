import Modal from "react-native-modal";
import { Dimensions, PermissionsAndroid, Platform, Pressable, ToastAndroid, View } from "react-native";
import FastImage from "react-native-fast-image";
import { PlainText } from "./PlainText";
import { SmallText } from "./SmallText";
import React, { useContext } from "react";
import FormatTitleAndArtist from "../../Utils/FormatTitleAndArtist";
import { Spacer } from "./Spacer";
import AntDesign from "react-native-vector-icons/AntDesign";
import MaterialCommunityIcons from "react-native-vector-icons/MaterialCommunityIcons";
import ReactNativeBlobUtil from "react-native-blob-util";
import { GetDownloadPath } from "../../LocalStorage/AppSettings";
import DeviceInfo from "react-native-device-info";
import { AddSongsToQueue, getIndexQuality} from "../../MusicPlayerFunctions";
import Context from "../../Context/Context";
import TrackPlayer from "react-native-track-player";

export const EachSongMenuModal = ({Visible, setVisible}) => {
  const {updateTrack} = useContext(Context)
  
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
  return (
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
        {/* <MenuButton
          icon={<MaterialCommunityIcons name="playlist-plus" size={22} color="white"/>}
          text="Add to Playlist"
          onPress={() =>
        /> */}
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
