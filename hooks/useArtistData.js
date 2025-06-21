import { useState, useEffect } from 'react';
import { ToastAndroid } from 'react-native';
import { getArtistDetails, getArtistSongsPaginated, getArtistAlbums } from '../Api/Songs';

/**
 * Custom hook for managing artist data fetching and state
 * @param {string} artistId - Artist ID
 * @returns {object} - Artist data state and functions
 */
export const useArtistData = (artistId) => {
  const [artistData, setArtistData] = useState(null);
  const [artistAlbums, setArtistAlbums] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchArtistData = async () => {
    try {
      setLoading(true);

      const [detailsResponse, albumsResponse] = await Promise.allSettled([
        getArtistDetails(artistId),
        getArtistAlbums(artistId)
      ]);

      if (detailsResponse.status === 'fulfilled') {
        setArtistData(detailsResponse.value);
      } else {
        console.error('Failed to fetch artist details:', detailsResponse.reason);
      }

      if (albumsResponse.status === 'fulfilled') {
        setArtistAlbums(albumsResponse.value);
      } else {
        console.error('Failed to fetch artist albums:', albumsResponse.reason);
      }

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
    artistAlbums,
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
