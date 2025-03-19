import AsyncStorage from "@react-native-async-storage/async-storage";

async function GetLocalMusicFavorites() {
  try {
    const value = await AsyncStorage.getItem('LocalMusicFavorites');
    if (value !== null) {
      return JSON.parse(value);
    } else {
      return {};
    }
  } catch (e) {
    console.log("Error retrieving local music favorites", e);
    return {};
  }
}

async function AddLocalMusicToFavorites(song) {
  try {
    const favorites = await GetLocalMusicFavorites();
    favorites[song.id] = song;
    const jsonValue = JSON.stringify(favorites);
    await AsyncStorage.setItem('LocalMusicFavorites', jsonValue);
    return true;
  } catch (e) {
    console.log("Error adding local music to favorites", e);
    return false;
  }
}

async function RemoveLocalMusicFromFavorites(songId) {
  try {
    const favorites = await GetLocalMusicFavorites();
    if (favorites[songId]) {
      delete favorites[songId];
      const jsonValue = JSON.stringify(favorites);
      await AsyncStorage.setItem('LocalMusicFavorites', jsonValue);
      return true;
    }
    return false;
  } catch (e) {
    console.log("Error removing local music from favorites", e);
    return false;
  }
}

async function IsLocalMusicFavorite(songId) {
  try {
    const favorites = await GetLocalMusicFavorites();
    return !!favorites[songId];
  } catch (e) {
    console.log("Error checking if local music is favorite", e);
    return false;
  }
}

export { GetLocalMusicFavorites, AddLocalMusicToFavorites, RemoveLocalMusicFromFavorites, IsLocalMusicFavorite };