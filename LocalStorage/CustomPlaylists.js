import AsyncStorage from "@react-native-async-storage/async-storage";

// Check that this function is using the same key
async function GetCustomPlaylists() {
  try {
    const value = await AsyncStorage.getItem('CustomPlaylists');
    if (value !== null) {
      return JSON.parse(value);
    } else {
      return {};
    }
  } catch (e) {
    console.log("Error retrieving custom playlists", e);
    return {};
  }
}

async function CreateCustomPlaylist(playlistName) {
  const customPlaylists = await GetCustomPlaylists();
  if (!customPlaylists[playlistName]) {
    customPlaylists[playlistName] = [];
    try {
      const jsonValue = JSON.stringify(customPlaylists);
      await AsyncStorage.setItem('CustomPlaylists', jsonValue);
    } catch (e) {
      console.log("Error creating custom playlist");
    }
  }
}

async function AddSongToCustomPlaylist(playlistName, song) {
  const customPlaylists = await GetCustomPlaylists();
  if (customPlaylists[playlistName]) {
    // Check if this is a local song
    const isLocalFile = song.isLocalMusic || song.path || (song.url && song.url.startsWith('file://'));
    
    // Clean up the song object to ensure it's properly formatted
    const sanitizedSong = {
      id: song.id || `song-${Date.now()}`,
      title: song.title || 'Unknown Title',
      artist: song.artist || 'Unknown Artist',
      // Handle different image formats and numeric artwork values
      image: typeof song.image === 'number' ? null : song.image,
      artwork: typeof song.artwork === 'number' ? null : song.artwork,
      // Ensure duration is a number if possible
      duration: typeof song.duration === 'string' ? parseFloat(song.duration) || 0 : song.duration || 0,
      language: song.language || '',
      // For local files
      isLocalMusic: isLocalFile,
      path: song.path || '',
      // For online files
      url: song.url || '',
      downloadUrl: song.downloadUrl || [],
      artistID: song.artistID || song.primary_artists_id || '',
    };
    
    // Check if song already exists in the playlist to avoid duplicates
    const existsInPlaylist = customPlaylists[playlistName].some(s => s.id === sanitizedSong.id);
    if (!existsInPlaylist) {
      customPlaylists[playlistName].push(sanitizedSong);
      try {
        const jsonValue = JSON.stringify(customPlaylists);
        await AsyncStorage.setItem('CustomPlaylists', jsonValue);
        console.log(`Added song "${sanitizedSong.title}" to playlist "${playlistName}"`);
      } catch (e) {
        console.log("Error adding song to custom playlist", e);
      }
    } else {
      console.log(`Song "${sanitizedSong.title}" already exists in playlist "${playlistName}"`);
    }
  } else {
    console.log(`Playlist "${playlistName}" does not exist`);
  }
}

export { GetCustomPlaylists, CreateCustomPlaylist, AddSongToCustomPlaylist };