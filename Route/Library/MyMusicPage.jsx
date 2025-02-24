import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, ActivityIndicator, PermissionsAndroid, StyleSheet, Button, Linking } from 'react-native';
import MusicFiles from 'react-native-get-music-files';

export const MyMusicPage = () => {
  const [localMusic, setLocalMusic] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const requestStoragePermission = async () => {
    try {
      console.log('Checking storage permission...');
      const alreadyGranted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE);
      if (alreadyGranted) {
        console.log('Permission already granted.');
        return { granted: true };
      }

      console.log('Requesting storage permission...');
      const granted = await PermissionsAndroid.request(
        PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
        {
          title: 'Music App Storage Permission',
          message: 'This app needs access to your storage to fetch music files.',
          buttonNeutral: 'Ask Me Later',
          buttonNegative: 'Cancel',
          buttonPositive: 'OK',
        }
      );
      console.log('Permission result:', granted);

      if (granted === PermissionsAndroid.RESULTS.GRANTED) {
        return { granted: true };
      } else if (granted === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
        return { granted: false, neverAskAgain: true };
      } else {
        return { granted: false };
      }
    } catch (err) {
      console.warn('Permission request failed:', err);
      return { granted: false };
    }
  };

  useEffect(() => {
    const fetchLocalMusic = async () => {
      setLoading(true);
      setError(null);
      console.log('Starting fetchLocalMusic...');

      const permissionStatus = await requestStoragePermission();
      console.log('Permission status:', permissionStatus);

      if (!permissionStatus.granted) {
        if (permissionStatus.neverAskAgain) {
          setError('Permission denied permanently. Please enable it in settings.');
          console.log('Set error: Permission denied permanently');
        } else {
          setError('Permission denied. Please grant storage access to view music files.');
          console.log('Set error: Permission denied');
        }
        setLoading(false);
        return;
      }

      try {
        console.log('Fetching music files...');
        const tracks = await MusicFiles.getAll({
          title: true,
          artist: true,
          duration: true,
          cover: false,
          minimumSongDuration: 10000,
          batchNumber: 100,
        });
        console.log('Tracks fetched:', tracks?.length || 0);

        if (!tracks || tracks.length === 0) {
          setError('No music files found on your device.');
          console.log('Set error: No music files found');
        } else {
          const musicFilesList = tracks.map((song, index) => ({
            id: song.path || `${index}`,
            title: song.title || song.path?.split('/').pop() || `Track ${index + 1}`,
            artist: song.author || 'Unknown Artist', // Note: 'author' is correct per library docs
            duration: formatDuration(song.duration),
          }));
          setLocalMusic(musicFilesList);
          console.log('Music files set:', musicFilesList.length);
        }
      } catch (err) {
        setError('Failed to fetch music files. Please try again.');
        console.error('Music fetch error:', err);
      } finally {
        setLoading(false);
        console.log('Loading complete');
      }
    };

    fetchLocalMusic();
  }, []);

  const formatDuration = (duration) => {
    if (!duration || isNaN(duration)) return '00:00';
    const minutes = Math.floor(duration / 60000);
    const seconds = Math.floor((duration % 60000) / 1000);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1E90FF" />
        <Text style={styles.loadingText}>Fetching your music...</Text>
      </View>
    );
  }

  if (error) {
    console.log('Rendering error state with message:', error);
    return (
      <View style={styles.centered}>
        <Text style={styles.errorText}>{error}</Text>
        {error.includes('settings') && (
          <Button
            title="Open Settings"
            onPress={() => Linking.openSettings()}
          />
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>My Music</Text>
      <FlatList
        data={localMusic}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.listItem}>
            <Text style={styles.title}>{item.title}</Text>
            <Text style={styles.subtitle}>{item.artist} • {item.duration}</Text>
          </View>
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No music files available.</Text>}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    fontSize: 24,
    fontWeight: 'bold',
    padding: 16,
    color: '#333',
  },
  listContainer: {
    paddingBottom: 16,
  },
  listItem: {
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  title: {
    fontSize: 16,
    color: '#333',
  },
  subtitle: {
    fontSize: 14,
    color: '#666',
    marginTop: 2,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 16,
    color: '#D32F2F',
    textAlign: 'center',
    paddingHorizontal: 16,
    marginBottom: 10, // Added for spacing before button
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    padding: 16,
  },
});

export default MyMusicPage;