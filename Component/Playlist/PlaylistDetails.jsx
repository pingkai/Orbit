import { Dimensions, View, StyleSheet, TouchableOpacity } from "react-native";
import { Heading } from "../Global/Heading";
import { SmallText } from "../Global/SmallText";
import { Spacer } from "../Global/Spacer";
import { PlayButton } from "./PlayButton";
import LinearGradient from "react-native-linear-gradient";
import { useTheme } from "@react-navigation/native";
import { AddPlaylist, getIndexQuality } from "../../MusicPlayerFunctions";
import { useContext, useState, useEffect } from "react";
import Context from "../../Context/Context";
import { LikedPlaylist } from "./LikedPlaylist";
import Ionicons from "react-native-vector-icons/Ionicons";
import FormatArtist from "../../Utils/FormatArtists";
import FormatTitleAndArtist from "../../Utils/FormatTitleAndArtist";
import { CacheManager } from '../../Utils/CacheManager';
import TrackPlayer from "react-native-track-player";
import { DownloadButton } from "../Global/DownloadButton";

// Reduce truncate limit further to avoid layout issues
const truncateText = (text, limit = 20) => {
  if (!text) return '';
  return text.length > limit ? text.substring(0, limit) + '...' : text;
};

// Helper to format artist data properly, avoiding [object Object] display
const formatArtistData = (artistData) => {
  // If it's already a string, return it
  if (typeof artistData === 'string') return artistData;
  
  // If it's an array, use the FormatArtist function
  if (Array.isArray(artistData)) return FormatArtist(artistData);
  
  // If it's an object with a primary property that's an array
  if (artistData && artistData.primary && Array.isArray(artistData.primary)) {
    return FormatArtist(artistData.primary);
  }
  
  // If it's an object with a name property
  if (artistData && artistData.name) return artistData.name;
  
  // Default fallback
  return "Unknown Artist";
};

// Helper to safely get song URL
const getSongUrl = (song, quality) => {
  // Check if downloadUrl exists in proper format
  if (song.downloadUrl && Array.isArray(song.downloadUrl) && song.downloadUrl.length > quality && song.downloadUrl[quality]?.url) {
    return song.downloadUrl[quality].url;
  } 
  // Check if download_url exists (alternate format)
  else if (song.download_url && Array.isArray(song.download_url) && song.download_url.length > quality && song.download_url[quality]?.url) {
    return song.download_url[quality].url;
  }
  // Fallback to any available URL in the array
  else if (song.downloadUrl && Array.isArray(song.downloadUrl)) {
    for (let i = 0; i < song.downloadUrl.length; i++) {
      if (song.downloadUrl[i]?.url) return song.downloadUrl[i].url;
    }
  }
  // Final fallback for download_url
  else if (song.download_url && Array.isArray(song.download_url)) {
    for (let i = 0; i < song.download_url.length; i++) {
      if (song.download_url[i]?.url) return song.download_url[i].url;
    }
  }
  
  return "";
};

export const PlaylistDetails = ({name = "", listener = "", notReleased = false, Data = {}, Loading = true, id = "", image = "", follower = "", playlistId = ""}) => {
  const {updateTrack, currentPlaying} = useContext(Context);
  const [isPlaying, setIsPlaying] = useState(false);
  const [loading, setLoading] = useState(Loading);
  const theme = useTheme();
  const width = Dimensions.get('window').width;
  const [playlistData, setPlaylistData] = useState(Data);
  
  // Reset isPlaying when Loading changes to false
  useEffect(() => {
    if (!Loading) {
      checkPlaybackState();
    }
  }, [Loading]);
  
  // Check if this playlist is currently playing
  const checkPlaybackState = async () => {
    try {
      // Check if player is playing
      const playerState = await TrackPlayer.getState();
      const isPlayerPlaying = playerState === TrackPlayer.STATE_PLAYING;
      
      // Check if current track is from this playlist
      if (isPlayerPlaying && currentPlaying) {
        const queue = await TrackPlayer.getQueue();
        const playlistSongs = Data?.data?.songs || [];
        
        // Create a set of playlist song IDs for faster lookup
        const playlistSongIds = new Set();
        playlistSongs.forEach(song => {
          if (song && song.id) {
            playlistSongIds.add(song.id);
          }
        });
        
        // Check if any queue item is from this playlist
        const isPlaylistPlaying = queue.some(track => 
          playlistSongIds.has(track.id)
        );
        
        setIsPlaying(isPlaylistPlaying);
      } else {
        setIsPlaying(false);
      }
    } catch (error) {
      console.error("Error checking playback state:", error);
      setIsPlaying(false);
    }
  };
  
  // Setup listener for track changes
  useEffect(() => {
    checkPlaybackState();
    
    const playerStateListener = TrackPlayer.addEventListener(
      'playback-state',
      () => checkPlaybackState()
    );
    
    return () => playerStateListener.remove();
  }, [currentPlaying, Data]);
  
  useEffect(() => {
    const loadPlaylistData = async () => {
      try {
        setLoading(true);
        
        // Try to get data from cache first
        const cachedData = await CacheManager.getFromCache(playlistId, 'playlist');
        if (cachedData) {
          setPlaylistData(cachedData);
          setLoading(false);
          // Fetch fresh data in background
          fetchPlaylistData();
          return;
        }

        // If no cache, fetch fresh data
        await fetchPlaylistData();
      } catch (error) {
        console.error('Error loading playlist:', error);
        setLoading(false);
      }
    };

    const fetchPlaylistData = async () => {
      try {
        // Your existing fetch logic here
        const response = await fetch(`${API_BASE_URL}/playlists/${playlistId}`);
        const data = await response.json();
        
        setPlaylistData(data);
        // Cache the fresh data
        await CacheManager.saveToCache(playlistId, data, 'playlist');
      } catch (error) {
        console.error('Error fetching playlist:', error);
      } finally {
        setLoading(false);
      }
    };

    if (playlistId) {
      loadPlaylistData();
    }
  }, [playlistId]);
  
  async function AddToPlayer(){
    console.log("PlaylistDetails: AddToPlayer called with data:", {
      hasSongs: !!Data?.data?.songs,
      songCount: Data?.data?.songs?.length || 0
    });
    
    if (!Data?.data?.songs || Data.data.songs.length === 0) {
      console.log("No songs available to play");
      return;
    }
    
    try {
      // If already playing, pause playback
      if (isPlaying) {
        await TrackPlayer.pause();
        return;
      }
      
      // Start loading indicator
      setLoading(true);
      
      const quality = await getIndexQuality();
      
      const ForMusicPlayer = [];
      
      // Process each song in the playlist
      for (let i = 0; i < Data.data.songs.length; i++) {
        const e = Data.data.songs[i];
        if (!e) continue;
        
        // Process artist data to avoid [object Object] display
        const artistData = e?.artists || e?.primary_artists;
        const formattedArtist = formatArtistData(artistData);
        
        // Get song URL using helper function
        const songUrl = getSongUrl(e, quality);

        if (!songUrl) {
          console.log(`No valid URL found for song at index ${i}, song ID: ${e?.id || 'unknown'}`);
          continue;
        }

        ForMusicPlayer.push({
          url: songUrl,
          title: FormatTitleAndArtist(e?.name || e?.song || ""),
          artist: FormatTitleAndArtist(formattedArtist),
          artwork: e?.image?.[2]?.url || e?.images?.[2]?.url || "",
          image: e?.image?.[2]?.url || e?.images?.[2]?.url || "",
          duration: e?.duration || 0,
          id: e?.id || `unknown-${i}`,
          language: e?.language || "",
          artistID: e?.primary_artists_id || e?.artist_id || "",
          // Include basic info for debugging
          downloadUrl: e?.downloadUrl || e?.download_url || [],
        });
      }
      
      console.log(`Prepared ${ForMusicPlayer.length} songs for playback`);
      
      if (ForMusicPlayer.length === 0) {
        console.log("No valid tracks to play");
        return;
      }
      
      // Use AddPlaylist function to play the songs
      await AddPlaylist(ForMusicPlayer);
      updateTrack();
      console.log("Successfully added songs to player");
    } catch (error) {
      console.error("Error adding songs to player:", error);
    } finally {
      setLoading(false);
    }
  }
  
  // If not released, don't render anything
  if (notReleased) return null;
  
  // Make sure to truncate the name properly for display
  const displayName = truncateText(name, 24); // Increased character limit for better display
  
  return (
    <View style={styles.outerContainer}>
      {/* Like button removed as it's now in the PlaylistTopHeader component */}

      <View style={styles.container}>
        <LinearGradient 
          start={{x: 0, y: 0}} 
          end={{x: 0, y: 1}} 
          colors={['rgba(44,44,44,0)', 'rgb(23,23,23)', '#121212']} 
          style={styles.gradientContainer}
        >
          {/* Playlist info on the left */}
          <View style={styles.infoContainer}>
            <Heading 
              text={displayName} 
              style={styles.heading}
              numberOfLines={1} 
            />
            
          </View>

          {/* Controls on the right - Download icon and Play button */}
          <View style={styles.controlsContainer}>
            {/* Download button in middle */}
            <DownloadButton 
              songs={Data?.data?.songs || []} 
              albumName={name}
              size="normal"
            />
            
            {/* Play button on right */}
            <PlayButton 
              onPress={AddToPlayer}
              Loading={loading}
              isPlaying={isPlaying}
            />
          </View>
        </LinearGradient>
      </View>
    </View>
  );
};

// Move styles to StyleSheet for better performance
const styles = StyleSheet.create({
  outerContainer: {
    position: "relative",
    width: "100%",
  },
  container: {
    width: "100%",
  },
  gradientContainer: {
    padding: 16,
    paddingVertical: 18,
    paddingTop: 24,
    alignItems: "center",
    justifyContent: "space-between",
    flexDirection: "row",
  },
  infoContainer: {
    flex: 1,
    paddingLeft: 4,
    paddingRight: 12, // Increased padding for better spacing
  },
  heading: {
    fontSize: 22,
    marginBottom: 4,
    flex: 1, // Allow text to flex and truncate properly
  },
  followerContainer: {
    flexDirection: "row", 
    alignItems: "center", 
    gap: 5,
    marginTop: 2,
  },
  controlsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16, // Increased gap for better spacing between buttons
  }
});
