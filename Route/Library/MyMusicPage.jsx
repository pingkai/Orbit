import React, { useState, useEffect, useContext } from 'react';
import { View, Text, FlatList, ActivityIndicator, PermissionsAndroid, StyleSheet, Button, Linking, Platform, ToastAndroid } from 'react-native';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
import MusicFiles from 'react-native-get-music-files';
import { LocalMusicCard } from '../../Component/MusicPlayer/LocalMusicCard';
import Context from '../../Context/Context';
import { useTheme } from '@react-navigation/native';
import { StorageManager } from '../../Utils/StorageManager';
import NetInfo from '@react-native-community/netinfo';

export const MyMusicPage = () => {
  const theme = useTheme();
  const [localMusic, setLocalMusic] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOffline, setIsOffline] = useState(false);

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
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
      color: theme.colors.text,
    },
    listContainer: {
      paddingBottom: 16,
    },
    listItem: {
      padding: 12,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    title: {
      fontSize: 16,
      color: theme.colors.text,
    },
    subtitle: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      marginTop: 2,
    },
    loadingText: {
      marginTop: 8,
      fontSize: 16,
      color: theme.colors.textSecondary,
    },
    errorText: {
      fontSize: 16,
      color: '#D32F2F',
      textAlign: 'center',
      paddingHorizontal: 16,
      marginBottom: 10,
    },
    emptyText: {
      fontSize: 16,
      color: theme.colors.textSecondary,
      textAlign: 'center',
      padding: 16,
    },
  });

  const requestStoragePermission = async () => {
    try {
      console.log('Checking storage permission...');
      
      // For Android 13+ (API level 33+), we need to use READ_MEDIA_AUDIO permission
      // For Android 11-12 (API level 30-32), we need to use READ_EXTERNAL_STORAGE but with limitations
      // For Android 10 and below, we can use READ_EXTERNAL_STORAGE with full access
      
      const androidVersion = Platform.Version;
      console.log('Android version:', androidVersion);
      
      let permissionResult;
      
      if (androidVersion >= 33) {
        // Android 13+ uses READ_MEDIA_AUDIO permission
        permissionResult = await check(PERMISSIONS.ANDROID.READ_MEDIA_AUDIO);
        
        if (permissionResult !== RESULTS.GRANTED) {
          console.log('Requesting READ_MEDIA_AUDIO permission...');
          permissionResult = await request(PERMISSIONS.ANDROID.READ_MEDIA_AUDIO);
        }
      } else {
        // For Android 12 and below, use READ_EXTERNAL_STORAGE
        const alreadyGranted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE);
        if (alreadyGranted) {
          console.log('Permission already granted.');
          return { granted: true };
        }

        console.log('Requesting storage permission...');
        permissionResult = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
          {
            title: 'Music App Storage Permission',
            message: 'This app needs access to your storage to fetch music files.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
      }
      
      console.log('Permission result:', permissionResult);

      if (permissionResult === RESULTS.GRANTED || permissionResult === PermissionsAndroid.RESULTS.GRANTED) {
        return { granted: true };
      } else if (permissionResult === RESULTS.BLOCKED || permissionResult === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
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
    // Subscribe to network state updates
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOffline(!state.isConnected);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    const fetchLocalMusic = async () => {
      setLoading(true);
      setError(null);
      console.log('Starting fetchLocalMusic...');

      // Try to load from cache first
      const cachedData = await StorageManager.getLocalMusicCache();
      if (cachedData) {
        console.log('Loading music from cache...');
        setLocalMusic(cachedData.music);
        setLoading(false);
      }

      const permissionStatus = await requestStoragePermission();
      console.log('Permission status:', permissionStatus);

      if (!permissionStatus.granted) {
        if (permissionStatus.neverAskAgain) {
          setError('Permission denied permanently. Please enable it in settings.');
          console.log('Set error: Permission denied permanently');
          // Automatically open settings when permissions are permanently denied
          ToastAndroid.show('Please enable storage permission in settings', ToastAndroid.LONG);
          Linking.openSettings();
        } else {
          setError('Permission denied. Please grant storage access to view music files.');
          console.log('Set error: Permission denied');
        }
        setLoading(false);
        return;
      }

      try {
        console.log('Fetching music files...');
        
        // Try to use MusicFiles library first
        let tracks = [];
        let fetchError = null;
        
        try {
          tracks = await MusicFiles.getAll({
            title: true,
            artist: true,
            duration: true,
            cover: false,
            minimumSongDuration: 10000,
            batchNumber: 100,
          });
          console.log('Tracks fetched with MusicFiles:', tracks?.length || 0);
        } catch (err) {
          console.warn('Error using MusicFiles library:', err);
          fetchError = err;
        }

        // Save tracks to cache if we have any
        if (tracks && tracks.length > 0) {
          await StorageManager.saveLocalMusicCache({ music: tracks });
        }
        
        // If MusicFiles fails or returns no tracks, try using RNFS as fallback
        if ((!tracks || tracks.length === 0) && fetchError) {
          try {
            console.log('Trying fallback method with RNFS...');
            const RNFS = require('react-native-fs');
            
            // Define directories to search for music files
            const directories = [
              RNFS.ExternalStorageDirectoryPath + '/Music',
              RNFS.ExternalStorageDirectoryPath + '/Download',
            ];
            
            // Define supported audio file extensions
            const audioExtensions = ['.mp3', '.m4a', '.wav', '.ogg', '.flac'];
            
            // Read all directories concurrently
            const allFiles = await Promise.all(
              directories.map(async (dir) => {
                try {
                  const files = await RNFS.readDir(dir);
                  // Filter for audio files
                  return files.filter(
                    (file) =>
                      file.isFile() &&
                      audioExtensions.some((ext) =>
                        file.name.toLowerCase().endsWith(ext)
                      )
                  );
                } catch (err) {
                  console.warn(`Directory ${dir} not found or inaccessible`);
                  return []; // Return empty array if directory is inaccessible
                }
              })
            );
            
            // Convert RNFS files to the same format as MusicFiles
            tracks = allFiles.flat().map((file, index) => {
              const title = file.name.replace(/\.(mp3|m4a|wav|ogg|flac)$/, ''); // Remove file extension
              const artist = extractArtistFromTitle(title); // Extract artist name
              return {
                path: file.path,
                title: title,
                artist: artist, // Use extracted artist name
                duration: 0 // We don't have duration info from RNFS
              };
            });
            
            console.log('Tracks fetched with RNFS fallback:', tracks.length);
          } catch (fallbackErr) {
            console.error('Fallback method also failed:', fallbackErr);
            // If fallback also fails, we'll continue with the original error
          }
        }

        if (!tracks || tracks.length === 0) {
          if (!cachedData?.music?.length) {
            setError('No music files found on your device.');
            console.log('Set error: No music files found');
          }
        } else {
          const musicFilesList = tracks.map((song, index) => {
            const musicItem = {
            id: song.path || `${index}`,
              title: song.title && song.title.length > 20 ? `${song.title.substring(0, 20)}...` : song.title || song.path?.split('/').pop() || `Track ${index + 1}`,
              artist: song.artist && song.artist.length > 20 ? `${song.artist.substring(0, 20)}...` : song.artist || 'Unknown Artist', // Note: 'artist' is correct per library docs
              duration: formatDuration(song.duration || 0),
              path: song.path, // Add path for playback
              cover: song.cover || null // Add cover art if available
            };
            return musicItem;
          });
          
          // Save to cache
          await StorageManager.saveLocalMusicCache(musicFilesList);
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

  // Function to extract artist from title
  const extractArtistFromTitle = (title) => {
    const regex = /- (.+)$/; // Matches everything after the last hyphen
    const match = title.match(regex);
    return match ? match[1].trim() : "Unknown Artist"; // Return the artist name or "Unknown Artist"
  };

  if (loading && !localMusic.length) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1E90FF" />
        <Text style={styles.loadingText}>{isOffline ? 'Loading cached music...' : 'Fetching your music...'}</Text>
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
        renderItem={({ item, index }) => (
          <LocalMusicCard 
            song={item} 
            index={index} 
            allSongs={localMusic} 
            artist={item.artist.length > 20 ? item.artist.substring(0, 20) + "..." : item.artist}
          />
        )}
        ListEmptyComponent={<Text style={styles.emptyText}>No music files available.</Text>}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
};