import { Dimensions, Pressable, View, Image, ToastAndroid, Alert } from "react-native";
import { PlainText } from "./PlainText";
import { SmallText } from "./SmallText";
import { AddPlaylist, getIndexQuality, PlayOneSong } from "../../MusicPlayerFunctions";
import { useTheme } from "@react-navigation/native";
import { memo, useContext, useState, useEffect } from "react";
import Context from "../../Context/Context";
import { useActiveTrack, usePlaybackState } from "react-native-track-player";
import FormatTitleAndArtist from "../../Utils/FormatTitleAndArtist";
import FormatArtist from "../../Utils/FormatArtists";
import { EachSongMenuButton } from "../MusicPlayer/EachSongMenuButton";
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { StorageManager } from '../../Utils/StorageManager';
import EventRegister from '../../Utils/EventRegister';
import Octicons from 'react-native-vector-icons/Octicons';
import { requestStoragePermission } from '../../Utils/PermissionManager';
import { downloadFileWithAnalytics } from '../../Utils/FileUtils';

export const EachSongCard = memo(function EachSongCard({title, artist, image, id, url, duration, language, artistID, isLibraryLiked, width, titleandartistwidth, isFromPlaylist, isFromAlbum = false, Data, index, showNumber = false}) {
  const theme = useTheme();
  const { colors } = theme;
  const width1 = Dimensions.get("window").width;
  const {updateTrack} = useContext(Context)
  const currentPlaying = useActiveTrack()
  const playerState = usePlaybackState()
  const [isDownloaded, setIsDownloaded] = useState(false);
  const [downloadInProgress, setDownloadInProgress] = useState(false);

  // Simple string image URI handling
  let imageSource = null;
  let safeImageUri = '';

  try {
    if (id === (currentPlaying?.id ?? "") && playerState.state === "playing") {
      imageSource = require("../../Images/playing.gif");
    } else if (id === (currentPlaying?.id ?? "") && playerState.state !== "playing") {
      imageSource = require("../../Images/songPaused.gif");
    } else {
      if (typeof image === 'string') {
        safeImageUri = image;
      } else if (image && typeof image === 'object') {
        try {
          if (typeof image.uri === 'string') {
            safeImageUri = image.uri;
          } else if (typeof image.url === 'string') {
            safeImageUri = image.url;
          } else if (Array.isArray(image) && image.length > 0 && typeof image[0] === 'string') {
            safeImageUri = image[0];
          }
        } catch (e) {
          safeImageUri = '';
        }
      }
      imageSource = safeImageUri ? { uri: safeImageUri } : null;
    }
  } catch (error) {
    console.error('Error preparing image source:', error);
    imageSource = null;
    safeImageUri = '';
  }

  useEffect(() => {
    const checkDownloadStatus = async () => {
      if (id) {
        try {
          const downloaded = await StorageManager.isSongDownloaded(id);
          setIsDownloaded(downloaded);
        } catch (error) {
          console.error('Error checking download status:', error);
          setIsDownloaded(false);
        }
      }
    };
    
    checkDownloadStatus();
    
    const downloadListener = EventRegister.addEventListener('download-complete', (songId) => {
      if (songId === id) {
        setIsDownloaded(true);
        setDownloadInProgress(false);
      }
    });
    
    const downloadStartedListener = EventRegister.addEventListener('download-started', (songId) => {
      if (songId === id) {
        setDownloadInProgress(true);
      }
    });
    
    return () => {
      EventRegister.removeEventListener(downloadListener);
      EventRegister.removeEventListener(downloadStartedListener);
    };
  }, [id]);

  const formatText = (text) => {
    const formattedText = FormatTitleAndArtist(text)
    return formattedText?.length > 25 ? formattedText.substring(0, 25) + "..." : formattedText
  }

  async function AddSongToPlayer(){
    if (isFromPlaylist){
      const ForMusicPlayer = []
      const quality = await getIndexQuality()
      
      const songs = Data?.data?.songs || []
      
      for (let i = index; i < songs.length; i++) {
        const e = songs[i]
        if (!e) continue;

        let songUrl = "";
        
        if (e.downloadUrl && Array.isArray(e.downloadUrl) && e.downloadUrl.length > quality && e.downloadUrl[quality]?.url) {
          songUrl = e.downloadUrl[quality].url;
        } 
        else if (e.download_url && Array.isArray(e.download_url) && e.download_url.length > quality && e.download_url[quality]?.url) {
          songUrl = e.download_url[quality].url;
        }
        else if (e.downloadUrl && Array.isArray(e.downloadUrl) && e.downloadUrl.length > 0 && e.downloadUrl[0]?.url) {
          songUrl = e.downloadUrl[0].url;
        }
        else if (e.download_url && Array.isArray(e.download_url) && e.download_url.length > 0 && e.download_url[0]?.url) {
          songUrl = e.download_url[0].url;
        }

        if (!songUrl) {
          continue;
        }

        let artworkUri = '';
        try {
          if (typeof e?.image === 'string') {
            artworkUri = e.image;
          } else if (e?.image && typeof e.image === 'object') {
            if (typeof e.image.uri === 'string') {
              artworkUri = e.image.uri;
            } else if (typeof e.image.url === 'string') {
              artworkUri = e.image.url;
            } else if (Array.isArray(e.image) && e.image.length > 0) {
              if (typeof e.image[0] === 'string') {
                artworkUri = e.image[0];
              } else if (e.image[0] && typeof e.image[0].url === 'string') {
                artworkUri = e.image[0].url;
              }
            }
          }
        } catch (error) {
          console.error('Error extracting artwork URI:', error);
        }
        
        ForMusicPlayer.push({
          url: songUrl,
          title: formatText(e?.name),
          artist: formatText(FormatArtist(e?.artists?.primary)),
          artwork: artworkUri,
          image: artworkUri,
          duration: e?.duration,
          id: e?.id,
          language: e?.language,
          downloadUrl: e?.downloadUrl || e?.download_url || [],
        })
      }
      
      if (ForMusicPlayer.length > 0) {
        await AddPlaylist(ForMusicPlayer)
        updateTrack()
      }
    } else if (isLibraryLiked){
      const Final = []
      
      for (let i = index; i < Data.length; i++) {
        const e = Data[i]
        
        let artworkUri = '';
        try {
          if (typeof e?.artwork === 'string') {
            artworkUri = e.artwork;
          } else if (e?.artwork && typeof e.artwork === 'object') {
            if (typeof e.artwork.uri === 'string') {
              artworkUri = e.artwork.uri;
            } else if (typeof e.artwork.url === 'string') {
              artworkUri = e.artwork.url;
            } else if (Array.isArray(e.artwork) && e.artwork.length > 0) {
              if (typeof e.artwork[0] === 'string') {
                artworkUri = e.artwork[0];
              } else if (e.artwork[0] && typeof e.artwork[0].url === 'string') {
                artworkUri = e.artwork[0].url;
              }
            }
          }
        } catch (error) {
          console.error('Error extracting artwork URI:', error);
        }
        
        let songUrl;
        if (e?.url) {
          if (typeof e.url === 'string') {
            songUrl = e.url;
          } else if (Array.isArray(e.url) && e.url.length > 0) {
            const quality = await getIndexQuality();
            songUrl = e.url[quality]?.url || e.url[0]?.url || '';
          }
        }
        
        if (!songUrl) {
          continue;
        }
        
        Final.push({
          url: songUrl,
          title: formatText(e?.title),
          artist: formatText(e?.artist),
          artwork: artworkUri,
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
      
      let songUrl;
      if (url) {
        if (Array.isArray(url) && url.length > quality && url[quality]?.url) {
          songUrl = url[quality].url;
        } else if (Array.isArray(url) && url.length > 0 && url[0]?.url) {
          songUrl = url[0].url;
        } else if (typeof url === 'string') {
          songUrl = url;
        }
      }
      
      if (!songUrl) {
        return;
      }
      
      const song  = {
        url: songUrl,
        title: formatText(title),
        artist: formatText(artist),
        artwork: safeImageUri,
        duration,
        id,
        language,
        artistID:artistID,
        image: safeImageUri,
        downloadUrl:url,
      }
      PlayOneSong(song)
    }
    updateTrack()
  }

  const handleDownload = async () => {
    if (isDownloaded) {
      ToastAndroid.show('Song is already downloaded!', ToastAndroid.SHORT);
      return;
    }
    if (downloadInProgress) {
      ToastAndroid.show('Download already in progress.', ToastAndroid.SHORT);
      return;
    }

    try {
      const permissionGranted = await requestStoragePermission();
      if (!permissionGranted) {
        Alert.alert(
          'Permission Denied',
          'Storage permission is required to download songs. Please grant it in your device settings.',
        );
        return;
      }

      setDownloadInProgress(true);
      EventRegister.emit('download-started', id);
      ToastAndroid.show(`Starting download for ${title}...`, ToastAndroid.SHORT);

      const quality = await getIndexQuality();
      const downloadUrls = url || [];
      const songUrl = downloadUrls[quality]?.url || downloadUrls[0]?.url;

      if (!songUrl) {
        throw new Error('No valid download URL found.');
      }

      let validArtworkUri = '';
      if (typeof image === 'string') {
        validArtworkUri = image;
      } else if (image && image.uri) {
        validArtworkUri = image.uri;
      } else if (safeImageUri) {
        validArtworkUri = safeImageUri;
      }

      await StorageManager.ensureDirectoriesExist();
      const songPath = await StorageManager.getSongPath(id, title);
      const artworkPath = await StorageManager.getArtworkPath(id, title);

      const songDownloadSuccess = await downloadFileWithAnalytics(songUrl, songPath, { id, name: title, type: 'song' });
      if (!songDownloadSuccess) {
        throw new Error('Failed to download song file.');
      }

      let artworkDownloadSuccess = false;
      if (validArtworkUri) {
        artworkDownloadSuccess = await downloadFileWithAnalytics(validArtworkUri, artworkPath, { id, name: `${title} - Artwork`, type: 'artwork' });
        if (!artworkDownloadSuccess) {
          console.warn(`Artwork download failed for song ID: ${id}, but continuing as song was saved.`);
        }
      }

      const metadata = {
        id,
        url: songUrl,
        title,
        artist,
        artwork: validArtworkUri,
        localSongPath: songPath,
        localArtworkPath: artworkDownloadSuccess ? artworkPath : null,
        duration,
        language,
        artistID,
        isDownloaded: true,
      };
      await StorageManager.saveDownloadedSongMetadata(id, metadata);

      ToastAndroid.show(`${title} Downloaded`, ToastAndroid.SHORT);
      setIsDownloaded(true);
      EventRegister.emit('download-complete', id);

    } catch (error) {
      console.error('Download failed:', error);
      ToastAndroid.show(`Download failed for ${title}: ${error.message}`, ToastAndroid.LONG);
      await StorageManager.removeDownloadedSong(id);
    } finally {
      setDownloadInProgress(false);
    }
  };

  return (
    <>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 8,
          paddingHorizontal: 12,
          backgroundColor: id === currentPlaying?.id ? colors.playingCard : 'transparent',
        }}>
        <Pressable
          onPress={AddSongToPlayer}
          style={{
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
          }}>
          {showNumber && (
            <View style={{ marginRight: 10 }}>
              <PlainText text={index + 1} />
            </View>
          )}
          <View style={{ marginRight: 10 }}>
            <Image
              source={imageSource || require('../../Images/default.jpg')}
              style={{
                width: isFromAlbum ? 45 : 50,
                height: isFromAlbum ? 45 : 50,
                borderRadius: 4,
              }}
            />
          </View>
          <View
            style={{
              flex: 1,
              marginRight: isFromAlbum ? 5 : isFromPlaylist ? 6 : 8,
            }}>
            <PlainText
              text={formatText(title)}
              songId={id}
              isSongTitle={true}
              style={{
                width: titleandartistwidth ? titleandartistwidth : width1 * (isFromAlbum ? 0.62 : isFromPlaylist ? 0.6 : 0.63),
                marginBottom: 2,
                color: theme.dark ? colors.text : '#333333',
              }}
              numberOfLines={1}
              ellipsizeMode="tail"
            />
            <SmallText
              text={formatText(artist)}
              isArtistName={true}
              style={{
                width: titleandartistwidth ? titleandartistwidth : width1 * (isFromAlbum ? 0.6 : isFromPlaylist ? 0.56 : 0.6),
                color: theme.dark ? colors.textSecondary : '#666666',
              }}
              numberOfLines={1}
              ellipsizeMode="tail"
            />
          </View>
        </Pressable>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'flex-end',
            alignItems: 'center',
            minWidth: isFromAlbum ? 80 : isFromPlaylist ? 80 : 75,
            paddingLeft: isFromAlbum ? 0 : isFromPlaylist ? 3 : 2,
            marginRight: isFromAlbum ? 5 : isFromPlaylist ? 5 : 0,
          }}>
          <Pressable
            onPress={handleDownload}
            style={{
              padding: 6,
              marginRight: isFromAlbum ? 10 : isFromPlaylist ? 10 : 8,
            }}>
            {isDownloaded ? (
              <Octicons name="check-circle" size={22} color="#1DB954" />
            ) : downloadInProgress ? (
              <MaterialCommunityIcons name="loading" size={24} color="#FFA500" />
            ) : (
              <Octicons name="download" size={22} color={theme.dark ? '#ffffff' : '#333333'} />
            )}
          </Pressable>

          <EachSongMenuButton
            song={{
              title,
              artist,
              artwork: typeof safeImageUri === 'string' ? safeImageUri : '',
              image: typeof safeImageUri === 'string' ? safeImageUri : '',
              id,
              url,
              duration,
              language,
              artistID,
            }}
            isFromPlaylist={isFromPlaylist}
            isFromAlbum={isFromAlbum}
            size={isFromAlbum ? 40 : 36}
            marginRight={isFromAlbum ? 1 : 6}
            isDownloaded={isDownloaded}
          />
        </View>
      </View>
    </>
  );
})
