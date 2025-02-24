import AsyncStorage from "@react-native-async-storage/async-storage";

async function GetCustomPlaylists() {
  try {
    const value = await AsyncStorage.getItem('CustomPlaylists');
    if (value !== null) {
      return JSON.parse(value);
    } else {
      return {};
    }
  } catch (e) {
    console.log("Error reading custom playlists");
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
    customPlaylists[playlistName].push(song);
    try {
      const jsonValue = JSON.stringify(customPlaylists);
      await AsyncStorage.setItem('CustomPlaylists', jsonValue);
    } catch (e) {
      console.log("Error adding song to custom playlist");
    }
  }
}

export { GetCustomPlaylists, CreateCustomPlaylist, AddSongToCustomPlaylist };