import { useState, useEffect } from 'react';
import { ToastAndroid } from 'react-native';
import { getArtistDetails, getArtistSongsPaginated, getArtistAlbumsPaginated } from '../Api/Songs';

/**
 * Custom hook for managing artist data fetching and state
 * @param {string} artistId - Artist ID
 * @returns {object} - Artist data state and functions
 */
export const useArtistData = (artistId) => {
  const [artistData, setArtistData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchArtistData = async () => {
    try {
      setLoading(true);

      const detailsResponse = await getArtistDetails(artistId);
      setArtistData(detailsResponse);

    } catch (error) {
      console.error('Error fetching artist data:', error);
      ToastAndroid.show('Failed to load artist data', ToastAndroid.SHORT);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchArtistData();
    setRefreshing(false);
  };

  useEffect(() => {
    if (artistId) {
      fetchArtistData();
    }
  }, [artistId]);

  return {
    artistData,
    loading,
    refreshing,
    fetchArtistData,
    onRefresh
  };
};

/**
 * Custom hook for managing infinite scroll songs
 * @param {string} artistId - Artist ID
 * @param {number} songsPerPage - Number of songs per page
 * @returns {object} - Songs state and functions
 */
export const useArtistSongs = (artistId, songsPerPage = 10) => {
  const [visibleSongs, setVisibleSongs] = useState([]);
  const [currentSongPage, setCurrentSongPage] = useState(1);
  const [songLoading, setSongLoading] = useState(false);
  const [hasMoreSongs, setHasMoreSongs] = useState(true);
  const [totalSongs, setTotalSongs] = useState(0);

  const loadInitialSongs = async () => {
    try {
      setSongLoading(true);
      const response = await getArtistSongsPaginated(artistId, 1, songsPerPage);

      if (response?.data?.songs) {
        setVisibleSongs(response.data.songs);
        setTotalSongs(response.data.total || 0);
        setCurrentSongPage(1);
        setHasMoreSongs(response.data.songs.length >= songsPerPage && response.data.songs.length < response.data.total);
      }
    } catch (error) {
      console.error('Error loading initial songs:', error);
      ToastAndroid.show('Failed to load songs', ToastAndroid.SHORT);
    } finally {
      setSongLoading(false);
    }
  };

  const loadMoreSongs = async () => {
    if (songLoading || !hasMoreSongs) return;

    try {
      setSongLoading(true);
      const nextPage = currentSongPage + 1;
      const response = await getArtistSongsPaginated(artistId, nextPage, songsPerPage);

      if (response?.data?.songs && response.data.songs.length > 0) {
        setVisibleSongs(prev => [...prev, ...response.data.songs]);
        setCurrentSongPage(nextPage);

        // Check if there are more songs to load
        const totalLoaded = visibleSongs.length + response.data.songs.length;
        setHasMoreSongs(totalLoaded < response.data.total);
      } else {
        setHasMoreSongs(false);
      }
    } catch (error) {
      console.error('Error loading more songs:', error);
      ToastAndroid.show('Failed to load more songs', ToastAndroid.SHORT);
    } finally {
      setSongLoading(false);
    }
  };

  const resetSongs = () => {
    setVisibleSongs([]);
    setCurrentSongPage(1);
    setHasMoreSongs(true);
    setTotalSongs(0);
  };

  useEffect(() => {
    if (artistId) {
      loadInitialSongs();
    }
  }, [artistId]);

  return {
    visibleSongs,
    songLoading,
    hasMoreSongs,
    totalSongs,
    loadMoreSongs,
    resetSongs,
    loadInitialSongs
  };
};

/**
 * Custom hook for managing infinite scroll albums
 * @param {string} artistId - Artist ID
 * @param {number} albumsPerPage - Number of albums per page
 * @returns {object} - Albums state and functions
 */
export const useArtistAlbums = (artistId, albumsPerPage = 10) => {
  const [visibleAlbums, setVisibleAlbums] = useState([]);
  const [currentAlbumPage, setCurrentAlbumPage] = useState(1);
  const [albumLoading, setAlbumLoading] = useState(false);
  const [hasMoreAlbums, setHasMoreAlbums] = useState(true);
  const [totalAlbums, setTotalAlbums] = useState(0);

  const loadInitialAlbums = async () => {
    try {
      setAlbumLoading(true);
      const response = await getArtistAlbumsPaginated(artistId, 1, albumsPerPage);

      if (response?.data?.albums) {
        setVisibleAlbums(response.data.albums);
        setTotalAlbums(response.data.total || 0);
        setCurrentAlbumPage(1);
        setHasMoreAlbums(response.data.albums.length >= albumsPerPage && response.data.albums.length < response.data.total);
      }
    } catch (error) {
      console.error('Error loading initial albums:', error);
      ToastAndroid.show('Failed to load albums', ToastAndroid.SHORT);
    } finally {
      setAlbumLoading(false);
    }
  };

  const loadMoreAlbums = async () => {
    if (albumLoading || !hasMoreAlbums) return;

    try {
      setAlbumLoading(true);
      const nextPage = currentAlbumPage + 1;
      const response = await getArtistAlbumsPaginated(artistId, nextPage, albumsPerPage);

      if (response?.data?.albums && response.data.albums.length > 0) {
        setVisibleAlbums(prev => [...prev, ...response.data.albums]);
        setCurrentAlbumPage(nextPage);

        // Check if there are more albums to load
        const totalLoaded = visibleAlbums.length + response.data.albums.length;
        setHasMoreAlbums(totalLoaded < response.data.total);
      } else {
        setHasMoreAlbums(false);
      }
    } catch (error) {
      console.error('Error loading more albums:', error);
      ToastAndroid.show('Failed to load more albums', ToastAndroid.SHORT);
    } finally {
      setAlbumLoading(false);
    }
  };

  const resetAlbums = () => {
    setVisibleAlbums([]);
    setCurrentAlbumPage(1);
    setHasMoreAlbums(true);
    setTotalAlbums(0);
  };

  useEffect(() => {
    if (artistId) {
      loadInitialAlbums();
    }
  }, [artistId]);

  return {
    visibleAlbums,
    albumLoading,
    hasMoreAlbums,
    totalAlbums,
    loadMoreAlbums,
    resetAlbums,
    loadInitialAlbums
  };
};
