import { Dimensions, Pressable, View } from "react-native";
import { PlainText } from "./PlainText";
import { SmallText } from "./SmallText";
import FastImage from "react-native-fast-image";
import { AddPlaylist, getIndexQuality, PlayOneSong } from "../../MusicPlayerFunctions";
import { memo, useContext, useState, useEffect } from "react";
import Context from "../../Context/Context";
import { useActiveTrack, usePlaybackState } from "react-native-track-player";
import FormatTitleAndArtist from "../../Utils/FormatTitleAndArtist";
import FormatArtist from "../../Utils/FormatArtists";
import { EachSongMenuButton } from "../MusicPlayer/EachSongMenuButton";
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { StorageManager } from '../../Utils/StorageManager';
import EventRegister from '../../Utils/EventRegister';

export const EachSongCard = memo(function EachSongCard({title, artist, image, id, url, duration, language, artistID, isLibraryLiked, width, titleandartistwidth, isFromPlaylist, isFromAlbum = false, Data, index}) {
  const width1 = Dimensions.get("window").width;
  const {updateTrack, setVisible} = useContext(Context)
  const currentPlaying = useActiveTrack()
  const playerState = usePlaybackState()
  const [isDownloaded, setIsDownloaded] = useState(false);
  
  // Check if song is downloaded
  useEffect(() => {
    const checkDownloadStatus = async () => {
      if (id) {
        try {
          const isDownloaded = await StorageManager.isSongDownloaded(id);
          setIsDownloaded(isDownloaded);
        } catch (error) {
          console.error('Error checking download status:', error);
          setIsDownloaded(false);
        }
      }
    };
    
    checkDownloadStatus();
    
    // Listen for download completion events
    const downloadListener = EventRegister.addEventListener('download-complete', (songId) => {
      if (songId === id) {
        setIsDownloaded(true);
      }
    });
    
    return () => {
      EventRegister.removeEventListener(downloadListener);
    };
  }, [id]);

  const formatText = (text) => {
    const formattedText = FormatTitleAndArtist(text)
    return formattedText?.length > 20 ? formattedText.substring(0, 20) + "..." : formattedText
  }

  async function AddSongToPlayer(){
    if (isFromPlaylist){
      const ForMusicPlayer = []
      const quality = await getIndexQuality()
      
      // Create a reference to the ordered songs
      const songs = Data?.data?.songs || []
      
      // Add songs to playlist starting from the clicked index
      for (let i = index; i < songs.length; i++) {
        const e = songs[i]
        if (!e) continue;

        // Get the correct URL using safer checks
        let songUrl = "";
        
        // Check if downloadUrl exists in proper format
        if (e.downloadUrl && Array.isArray(e.downloadUrl) && e.downloadUrl.length > quality && e.downloadUrl[quality]?.url) {
          songUrl = e.downloadUrl[quality].url;
        } 
        // Check if download_url exists (alternate format)
        else if (e.download_url && Array.isArray(e.download_url) && e.download_url.length > quality && e.download_url[quality]?.url) {
          songUrl = e.download_url[quality].url;
        }
        // Fallback to any available URL in the array
        else if (e.downloadUrl && Array.isArray(e.downloadUrl) && e.downloadUrl.length > 0 && e.downloadUrl[0]?.url) {
          songUrl = e.downloadUrl[0].url;
        }
        // Final fallback
        else if (e.download_url && Array.isArray(e.download_url) && e.download_url.length > 0 && e.download_url[0]?.url) {
          songUrl = e.download_url[0].url;
        }

        if (!songUrl) {
          console.log(`EachSongCard: No valid URL found for song at index ${i}, song ID: ${e?.id || 'unknown'}`);
          continue;
        }

        ForMusicPlayer.push({
          url: songUrl,
          title: formatText(e?.name),
          artist: formatText(FormatArtist(e?.artists?.primary)),
          artwork: e?.image[2]?.url,
          image: e?.image[2]?.url,
          duration: e?.duration,
          id: e?.id,
          language: e?.language,
          downloadUrl: e?.downloadUrl || e?.download_url || [],
        })
      }
      
      if (ForMusicPlayer.length > 0) {
        console.log(`EachSongCard: Playing ${ForMusicPlayer.length} songs starting from index ${index}`);
        await AddPlaylist(ForMusicPlayer)
        updateTrack()
      } else {
        console.log("EachSongCard: No valid songs to play");
      }
    } else if (isLibraryLiked){
      const Final = []
      
      // Use a for loop for consistent approach
      for (let i = index; i < Data.length; i++) {
        const e = Data[i]
        Final.push({
          url: e.url,
          title: formatText(e?.title),
          artist: formatText(e?.artist),
          artwork: e?.artwork,
          duration: e?.duration,
          id: e?.id,
          language: e?.language,
          artistID: e?.primary_artists_id,
          downloadUrl: e?.downloadUrl,
        })
      }
      
      await AddPlaylist(Final)
    } else {
      const quality = await getIndexQuality()
      const song  = {
        url: url[quality].url,
        title: formatText(title),
        artist: formatText(artist),
        artwork:image,
        duration,
        id,
        language,
        artistID:artistID,
        image:image,
        downloadUrl:url,
      }
      PlayOneSong(song)
    }
    updateTrack()
  }
  return (
    <>
      <View style={{
        flexDirection:'row',
        width:width ? width : width1,
        marginRight:0,
        alignItems:"center",
        paddingRight: isFromAlbum ? 0 : (isFromPlaylist ? 2 : 2),
        paddingVertical: 4,
        justifyContent: 'space-between',
        paddingHorizontal: isFromAlbum ? 4 : (isFromPlaylist ? 6 : 4),
        borderRadius: 8,
        overflow: 'hidden',
        marginVertical: 0
      }}>
        <Pressable 
          onPress={AddSongToPlayer}
          android_ripple={{ color: 'rgba(255, 255, 255, 0.1)', borderless: false }}
          style={{
            flexDirection:'row',
            gap:10,
            alignItems:"center",
            maxHeight:60,
            elevation:10,
            flex:1,
            padding: 6,
          }}
        >
          <View style={{ position: 'relative' }}>
            <FastImage source={((id === currentPlaying?.id ?? "") && playerState.state === "playing") ? require("../../Images/playing.gif") : ((id === currentPlaying?.id ?? "") && playerState.state !== "playing" ) ? require("../../Images/songPaused.gif") : {
              uri:image,
            }} style={{
              height:50,
              width:50,
              borderRadius:4,
            }}/>
          </View>
          <View style={{
            flex:1,
            marginRight: isFromAlbum ? 5 : (isFromPlaylist ? 10 : 8),
          }}>
            <PlainText 
              text={formatText(title)} 
              songId={id} 
              isSongTitle={true} 
              style={{width:titleandartistwidth ? titleandartistwidth : width1 * (isFromAlbum ? 0.68 : (isFromPlaylist ? 0.63 : 0.66))}}
              numberOfLines={1}
              ellipsizeMode="tail"
            />
            <SmallText 
              text={formatText(artist)} 
              isArtistName={true}
              style={{width:titleandartistwidth ? titleandartistwidth : width1 * (isFromAlbum ? 0.65 : (isFromPlaylist ? 0.60 : 0.63))}}
              numberOfLines={1}
              ellipsizeMode="tail"
            />
          </View>
        </Pressable>
        <View style={{
          justifyContent: 'center',
          alignItems: 'center',
          minWidth: isFromAlbum ? 42 : (isFromPlaylist ? 40 : 36),
          paddingLeft: isFromAlbum ? 0 : (isFromPlaylist ? 3 : 2),
          marginRight: isFromAlbum ? 0 : (isFromPlaylist ? 8 : 2),
        }}>
          <EachSongMenuButton 
            song={{
              title,
              artist,
              artwork: image,
              image,
              id,
              url,
              duration,
              language,
              artistID
            }}
            isFromPlaylist={isFromPlaylist}
            isFromAlbum={isFromAlbum}
            size={isFromAlbum ? 28 : 18}
            marginRight={isFromAlbum ? 2 : 10}
            isDownloaded={isDownloaded}
          />
        </View>
      </View>
    </>
  );
})
