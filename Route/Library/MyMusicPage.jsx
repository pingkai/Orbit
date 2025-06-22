import React, { useState, useEffect, useContext, useCallback } from 'react';
import { View, Text, FlatList, ActivityIndicator, PermissionsAndroid, StyleSheet, Button, Linking, Platform, ToastAndroid, Image, Pressable, BackHandler, RefreshControl } from 'react-native';
import { AnimatedSearchBar } from '../../Component/Global/AnimatedSearchBar';
import { check, request, PERMISSIONS, RESULTS } from 'react-native-permissions';
// Import MusicFiles with error handling
let MusicFiles = null;
try {
  MusicFiles = require('react-native-get-music-files').default || require('react-native-get-music-files');
} catch (error) {
  console.warn('MusicFiles library not available:', error);
}
import { LocalMusicCard } from '../../Component/MusicPlayer/LocalMusicCard';
import Context from '../../Context/Context';
import { useTheme, useNavigation } from '@react-navigation/native';
import { StorageManager } from '../../Utils/StorageManager';
import NetInfo from '@react-native-community/netinfo';
import TrackPlayer, { useActiveTrack } from 'react-native-track-player';
import { useTrackPlayerEvents, Event } from 'react-native-track-player';
import Ionicons from "react-native-vector-icons/Ionicons";
import Cover from "../../Images/Music.jpeg";
import { AudioFileValidator } from '../../Utils/AudioFileValidator';

// Temporarily disable console overrides for debugging
// Add this at the top of the file to suppress console warnings in production
// This will only affect this file's logs
const originalConsoleLog = console.log;
const originalConsoleError = console.error;
const originalConsoleWarn = console.warn;

// TEMPORARILY DISABLED FOR DEBUGGING - Enable all console logs
/*
// Only log important messages
console.log = (...args) => {
  // Check if it's an important message that we want to keep
  const message = args[0]?.toString() || '';
  if (message.includes('Error') ||
      message.includes('error') ||
      message.includes('Playing track')) {
    originalConsoleLog(...args);
  }
};

console.error = (...args) => {
  // Ignore 404 errors for recommendations endpoints
  const firstArg = args[0];
  if (firstArg &&
      typeof firstArg === 'string' &&
      firstArg.includes('404') &&
      firstArg.includes('recommendations')) {
    // Skip logging recommendation 404 errors
    return;
  }

  // Keep all other error logs but remove the stack trace to reduce clutter
  const cleanedArgs = args.map(arg => {
    if (arg instanceof Error) {
      return arg.message;
    }
    return arg;
  });
  originalConsoleError(...cleanedArgs);
};

console.warn = (...args) => {
  // Only show important warnings
  const message = args[0]?.toString() || '';
  if (message.includes('crucial') || message.includes('important')) {
    originalConsoleWarn(...args);
  }
};
*/

export const MyMusicPage = () => {
  const theme = useTheme();
  const navigation = useNavigation();
  const [localMusic, setLocalMusic] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOffline, setIsOffline] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const currentPlaying = useActiveTrack();
  const { Index, setIndex } = useContext(Context);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchVisible, setIsSearchVisible] = useState(false);

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
      paddingBottom: 70, // Extra padding to account for controls
    },
    listItem: {
      padding: 12,
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(255,255,255,0.1)',
    },
    title: {
      fontSize: 20,
      fontWeight: 'bold',
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
    offlineBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: 10, // Reduced padding from 16 to 10
      paddingBottom: 5, // Added smaller bottom padding
      marginBottom: 0, // Added to ensure no extra margin
    },
    offlineIcon: {
      width: 24,
      height: 24,
      marginRight: 8,
    },
    offlineBannerText: {
      fontSize: 16,
      color: theme.colors.textSecondary,
    },
    controlButton: {
      padding: 10,
    },
    headerContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: 16,
      paddingTop: 5, // Reduced top padding to bring it closer to the offline message
      borderBottomWidth: 1,
      borderBottomColor: 'rgba(255,255,255,0.1)',
    }
  });

  const requestStoragePermission = async () => {
    try {
      console.log('🔍 Checking storage permission...');

      // For Android 13+ (API level 33+), we need to use READ_MEDIA_AUDIO permission
      // For Android 11-12 (API level 30-32), we need to use READ_EXTERNAL_STORAGE but with limitations
      // For Android 10 and below, we can use READ_EXTERNAL_STORAGE with full access

      const androidVersion = Platform.Version;
      console.log('📱 Android version:', androidVersion);

      let permissionResult;

      if (androidVersion >= 33) {
        // Android 13+ uses READ_MEDIA_AUDIO permission
        console.log('📱 Using READ_MEDIA_AUDIO for Android 13+');
        permissionResult = await check(PERMISSIONS.ANDROID.READ_MEDIA_AUDIO);
        console.log('🔍 Current READ_MEDIA_AUDIO permission status:', permissionResult);

        if (permissionResult !== RESULTS.GRANTED) {
          console.log('🙋 Requesting READ_MEDIA_AUDIO permission...');
          permissionResult = await request(PERMISSIONS.ANDROID.READ_MEDIA_AUDIO);
          console.log('✅ READ_MEDIA_AUDIO permission request result:', permissionResult);
        }
      } else {
        // For Android 12 and below, use READ_EXTERNAL_STORAGE
        console.log('📱 Using READ_EXTERNAL_STORAGE for Android 12 and below');
        const alreadyGranted = await PermissionsAndroid.check(PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE);
        console.log('🔍 Current READ_EXTERNAL_STORAGE permission status:', alreadyGranted);

        if (alreadyGranted) {
          console.log('✅ Permission already granted.');
          return { granted: true };
        }

        console.log('🙋 Requesting storage permission...');
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
        console.log('✅ READ_EXTERNAL_STORAGE permission request result:', permissionResult);
      }

      console.log('🎯 Final permission result:', permissionResult);

      if (permissionResult === RESULTS.GRANTED || permissionResult === PermissionsAndroid.RESULTS.GRANTED) {
        console.log('✅ Permission granted successfully');
        return { granted: true };
      } else if (permissionResult === RESULTS.BLOCKED || permissionResult === PermissionsAndroid.RESULTS.NEVER_ASK_AGAIN) {
        console.log('❌ Permission permanently denied');
        return { granted: false, neverAskAgain: true };
      } else {
        console.log('❌ Permission denied');
        return { granted: false };
      }
    } catch (err) {
      console.error('💥 Permission request failed:', err);
      return { granted: false };
    }
  };

  const fetchLocalMusic = async (useCache = true) => {
    console.log('🚀 Starting fetchLocalMusic...');
    setLoading(true);
    setError(null);

    // Try to load from cache first if useCache is true
    let hasCachedData = false;
    if (useCache) {
      try {
        console.log('💾 Checking for cached data...');
        const cachedData = await StorageManager.getLocalMusicCache();
        if (cachedData && cachedData.music && cachedData.music.length > 0) {
          console.log('✅ Loading music from cache:', cachedData.music.length, 'tracks');
          setLocalMusic(cachedData.music);
          hasCachedData = true;
          // Don't set loading to false yet - we still need to check permissions and potentially refresh
        } else if (cachedData && Array.isArray(cachedData) && cachedData.length > 0) {
          // Handle case where cache data is directly an array (old format)
          console.log('✅ Loading music from cache (old format):', cachedData.length, 'tracks');
          setLocalMusic(cachedData);
          hasCachedData = true;
        } else {
          console.log('❌ No cached data found');
        }
      } catch (cacheError) {
        console.error('💥 Error loading cache:', cacheError);
        // Continue without cache
      }
    }

    console.log('🔐 Requesting storage permission...');
    const permissionStatus = await requestStoragePermission();
    console.log('🎯 Permission status result:', permissionStatus);

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
      console.log('🎵 Fetching music files...');

      let tracks = [];
      let fetchError = null;

      // Try RNFS method first (more reliable)
      try {
        console.log('🔄 Using RNFS method to scan for music files...');
        const RNFS = require('react-native-fs');

        // Log available RNFS paths for debugging
        console.log('📱 RNFS Paths available:');
        console.log('  - ExternalStorageDirectoryPath:', RNFS.ExternalStorageDirectoryPath);
        console.log('  - ExternalDirectoryPath:', RNFS.ExternalDirectoryPath);
        console.log('  - DocumentDirectoryPath:', RNFS.DocumentDirectoryPath);
        console.log('  - DownloadDirectoryPath:', RNFS.DownloadDirectoryPath);
        console.log('  - MusicDirectoryPath:', RNFS.MusicDirectoryPath);

        // Define directories to search for music files
        const directories = [
          RNFS.ExternalStorageDirectoryPath + '/Music',
          RNFS.ExternalStorageDirectoryPath + '/Download',
          RNFS.DownloadDirectoryPath, // Direct download directory
          RNFS.MusicDirectoryPath, // Direct music directory (if available)
          RNFS.ExternalDirectoryPath + '/Music', // App-specific music directory
          // Skip DocumentDirectoryPath + '/Music' as it's usually not accessible and causes warnings
        ].filter(dir => dir && !dir.includes('undefined') && !dir.includes('null') && !dir.includes('/data/user/0/'));

        // Define supported audio file extensions (only well-supported formats)
        const audioExtensions = ['.mp3', '.m4a', '.wav', '.ogg', '.flac', '.aac'];

        // Exclude problematic file patterns that might cause playback issues
        const excludePatterns = [
          'ElevenLabs_', // AI-generated audio files that might have issues
          '_pvc_', // Specific pattern causing issues
          '.tmp', // Temporary files
          '.part' // Partial downloads
        ];

        console.log('🔍 Searching directories:', directories);

        // Read all directories concurrently
        const allFiles = await Promise.all(
          directories.map(async (dir) => {
            try {
              console.log(`📂 Checking directory: ${dir}`);
              const files = await RNFS.readDir(dir);
              const audioFiles = files.filter(
                (file) =>
                  file.isFile() &&
                  audioExtensions.some((ext) =>
                    file.name.toLowerCase().endsWith(ext)
                  )
              );
              console.log(`📂 Found ${audioFiles.length} audio files in ${dir}`);
              return audioFiles;
            } catch (err) {
              console.warn(`📂 Directory ${dir} not found or inaccessible:`, err.message);
              return []; // Return empty array if directory is inaccessible
            }
          })
        );

        // Convert RNFS files to the same format as MusicFiles, filtering out problematic files
        const allFilesFlat = allFiles.flat();
        console.log(`📁 Found ${allFilesFlat.length} total audio files`);

        // Convert RNFS files to track objects for validation
        const rawTracks = allFilesFlat.map((file) => {
          const title = file.name.replace(/\.(mp3|m4a|wav|ogg|flac|aac)$/i, ''); // Remove file extension
          const artist = extractArtistFromTitle(title); // Extract artist name
          return {
            path: file.path,
            name: file.name,
            title: title,
            artist: artist, // Use extracted artist name
            duration: 0, // We don't have duration info from RNFS
            size: file.size || 0,
            cover: null // No cover info from RNFS
          };
        });

        console.log(`📁 Found ${rawTracks.length} total audio files`);

        // Validate files using AudioFileValidator
        console.log('🔍 Validating audio files...');
        const validationResult = await AudioFileValidator.validateFiles(rawTracks);

        // Log validation summary
        AudioFileValidator.logValidationSummary(validationResult);

        // Use only valid files
        tracks = validationResult.validFiles;

        console.log(`✅ After validation: ${tracks.length} valid files (excluded ${validationResult.summary.invalid} invalid files)`);

        // Log warnings for files with issues
        if (validationResult.summary.warnings > 0) {
          console.warn(`⚠️ ${validationResult.summary.warnings} files have warnings but are still playable`);
        }

        console.log('✅ Tracks fetched with RNFS method:', tracks.length);
      } catch (rnfsErr) {
        console.error('❌ Error using RNFS method:', rnfsErr);
        fetchError = rnfsErr;
      }

      // If RNFS fails, try MusicFiles library as fallback
      if ((!tracks || tracks.length === 0) && MusicFiles && MusicFiles.getAll) {
        try {
          console.log('📚 Trying MusicFiles library as fallback...');
          tracks = await MusicFiles.getAll({
            title: true,
            artist: true,
            duration: true,
            cover: true,
            minimumSongDuration: 10000,
            batchNumber: 100,
          });
          console.log('✅ Tracks fetched with MusicFiles fallback:', tracks?.length || 0);
        } catch (err) {
          console.error('❌ Error using MusicFiles library fallback:', err);
          // Keep the original RNFS error
        }
      }

      // Save tracks to cache if we have any
      if (tracks && tracks.length > 0) {
        console.log('💾 Saving tracks to cache for future use');
        await StorageManager.saveLocalMusicCache(tracks);
      }



      if (!tracks || tracks.length === 0) {
        // If we have cached data, use it even if fresh fetch failed
        if (hasCachedData && localMusic.length > 0) {
          console.log('Using existing cached music data since fresh fetch failed');
          // Keep the cached data that's already loaded
        } else if (fetchError && useCache) {
          // Try to load cached data if available when fetch fails
          const cachedData = await StorageManager.getLocalMusicCache();
          if (cachedData?.music?.length) {
            tracks = cachedData.music;
            console.log('Using cached music data as fallback');
          } else {
            setError('No music files found on your device.');
            console.log('Set error: No music files found');
          }
        } else {
          setError('No music files found on your device.');
          console.log('Set error: No music files found');
        }
      } else {
        const musicFilesList = tracks.map((song, index) => {
          // Create a unique ID using path and index to avoid duplicates
          const uniqueId = `${song.path}_${index}_${Date.now()}`;

          const musicItem = {
            id: uniqueId,
            title: song.title && song.title.length > 20 ? `${song.title.substring(0, 20)}...` : song.title || song.path?.split('/').pop() || `Track ${index + 1}`,
            artist: song.artist && song.artist.length > 20 ? `${song.artist.substring(0, 20)}...` : song.artist || 'Unknown Artist',
            duration: formatDuration(song.duration || 0),
            path: song.path,
            cover: Cover, // Use Music.jpeg for all local tracks
          };
          return musicItem;
        });

        // Save to cache and update state
        await StorageManager.saveLocalMusicCache(musicFilesList);
        setLocalMusic(musicFilesList);
        console.log('✅ Music files set:', musicFilesList.length);
      }
    } catch (err) {
      console.error('💥 Music fetch error:', err);
      setError('Failed to fetch music files. Please try again.');
    } finally {
      console.log('🏁 Loading complete, setting loading to false');
      setLoading(false);
    }
  };

  useEffect(() => {
    // Subscribe to network state updates
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOffline(!state.isConnected);
    });

    // Initial fetch with timeout
    const timeoutId = setTimeout(() => {
      if (loading) {
        console.error('⏰ Music fetch timeout - forcing loading to false');
        setLoading(false);
        setError('Loading timed out. Please try refreshing.');
      }
    }, 30000); // 30 second timeout

    fetchLocalMusic().finally(() => {
      clearTimeout(timeoutId);
    });

    return () => {
      unsubscribe();
      clearTimeout(timeoutId);
    };
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

  const loadLocalTracks = async () => {
    try {
      // Validate tracks before adding to queue
      console.log('🔍 Validating tracks for queue...');
      const validationResult = await AudioFileValidator.validateFiles(localMusic);

      if (validationResult.summary.invalid > 0) {
        console.warn(`⚠️ Excluding ${validationResult.summary.invalid} invalid tracks from queue`);
      }

      // Format valid tracks for TrackPlayer
      const formattedTracks = validationResult.validFiles
        .map(song => ({
          id: song.id,
          url: `file://${song.path}`,
          title: song.title,
          artist: song.artist,
          artwork: Cover, // Use Music.jpeg for all local tracks
          isLocal: true
        }));

      // Reset the queue and add all tracks
      await TrackPlayer.reset();
      await TrackPlayer.add(formattedTracks);
      console.log('Added tracks to queue:', formattedTracks.length);
    } catch (error) {
      console.error('Error loading local tracks:', error);
    }
  };

  const loadAndPlayTrack = async (index) => {
    if (index < 0 || index >= localMusic.length) return;
    
    try {
      // Find the track at the requested index
      const song = localMusic[index];
      
      // Validate the selected track first
      const trackValidation = await AudioFileValidator.validateFile(song);
      if (!trackValidation.isValid) {
        console.error(`❌ Cannot play track: ${trackValidation.reason}`);
        ToastAndroid.show(`Cannot play track: ${trackValidation.reason}`, ToastAndroid.LONG);
        return;
      }

      // Validate all tracks for the queue
      console.log('🔍 Validating tracks for queue...');
      const validationResult = await AudioFileValidator.validateFiles(localMusic);

      if (validationResult.summary.invalid > 0) {
        console.warn(`⚠️ Excluding ${validationResult.summary.invalid} invalid tracks from queue`);
      }

      // Format valid tracks for the queue
      const formattedTracks = validationResult.validFiles
        .map(track => ({
          id: track.id,
          url: `file://${track.path}`,
          title: track.title,
          artist: track.artist,
          artwork: Cover, // Use Music.jpeg for all local tracks
          isLocal: true
        }));
      
      // Reset player and add all tracks, starting with the selected one
      await TrackPlayer.reset();
      await TrackPlayer.add([
        ...formattedTracks.slice(index),
        ...formattedTracks.slice(0, index)
      ]);
      await TrackPlayer.play();
      
      // Open the fullscreen player
      setIndex(1);
    } catch (error) {
      console.error('Error loading and playing track:', error);
    }
  };

  const events = [Event.PlaybackActiveTrackChanged,
    Event.PlaybackError,
    Event.PlaybackState,
    Event.PlaybackQueueEnded
  ];

  useTrackPlayerEvents(events, async (event) => {
    try {
      if (event.type === Event.PlaybackState) {
        const state = await TrackPlayer.getState();
        if (state === TrackPlayer.STATE_STOPPED || state === TrackPlayer.STATE_ENDED) {
          // When playback stops or ends, automatically play the next track
          const queue = await TrackPlayer.getQueue();
          const currentTrack = await TrackPlayer.getCurrentTrack();
          
          if (queue.length > 0) {
            if (currentTrack === null) {
              // If no track is playing, start from the beginning
              await TrackPlayer.skip(0);
            } else {
              // Try to play the next track
              const nextTrack = await TrackPlayer.getTrack(currentTrack + 1);
              if (nextTrack) {
                await TrackPlayer.skipToNext();
              } else {
                // If we're at the end, loop back to the first track
                await TrackPlayer.skip(0);
              }
            }
            await TrackPlayer.play();
          }
        }
      } else if (event.type === Event.PlaybackQueueEnded) {
        // When the queue ends, restart from the beginning
        const queue = await TrackPlayer.getQueue();
        if (queue.length > 0) {
          await TrackPlayer.skip(0);
          await TrackPlayer.play();
        }
      } else if (event.type === Event.PlaybackError) {
        console.error('Playback error:', event);

        // Get current track info for better error reporting
        try {
          const currentTrack = await TrackPlayer.getActiveTrack();
          if (currentTrack) {
            console.error(`❌ Playback failed for: ${currentTrack.title} - ${currentTrack.artist}`);
            console.error(`📁 File path: ${currentTrack.url}`);

            // Check if it's a known problematic file type or unsupported format
            const isProblematicFile = currentTrack.url && (
              currentTrack.url.includes('ElevenLabs_') ||
              currentTrack.url.includes('_pvc_') ||
              currentTrack.url.includes('.tmp') ||
              currentTrack.url.includes('.part')
            );

            const isUnsupportedFormat = event.code === 'android-parsing-container-unsupported' ||
              event.message?.includes('Source error') ||
              event.message?.includes('unsupported');

            if (isProblematicFile || isUnsupportedFormat) {
              console.warn('⚠️ Detected problematic/unsupported file, attempting to skip...');

              // Try to skip to next track automatically
              try {
                const queue = await TrackPlayer.getQueue();
                if (queue.length > 1) {
                  await TrackPlayer.skipToNext();
                  console.log('✅ Successfully skipped to next track');
                } else {
                  console.warn('⚠️ No more tracks in queue to skip to');
                  await TrackPlayer.stop();
                }
              } catch (skipError) {
                console.error('❌ Failed to skip track:', skipError);
                // Stop playback as last resort
                try {
                  await TrackPlayer.stop();
                } catch (stopError) {
                  console.error('❌ Failed to stop playback:', stopError);
                }
              }
            }
          }
        } catch (trackError) {
          console.error('Error getting current track info:', trackError);
        }

        // Try to recover by playing the next track
        try {
          await TrackPlayer.skipToNext();
          await TrackPlayer.play();
          console.log('✅ Recovered by skipping to next track');
        } catch (recoveryError) {
          console.error('❌ Failed to recover from playback error:', recoveryError);
        }
      }
    } catch (error) {
      console.error('Error in track player event handler:', error);
    }
  });

  // Functions to handle track navigation
  const playPreviousSong = useCallback(async () => {
    try {
      const currentTrack = await TrackPlayer.getActiveTrack();
      if (!currentTrack) {
        // If no track is currently playing, play the first one
        await loadAndPlayTrack(0);
        return;
      }

      const currentIndex = localMusic.findIndex(track => track.id === currentTrack.id);
      const prevIndex = (currentIndex - 1 + localMusic.length) % localMusic.length; // Wrap around to the last track
      await loadAndPlayTrack(prevIndex);
    } catch (error) {
      console.error('Error playing previous song:', error);
    }
  }, [localMusic]);

  const playNextSong = useCallback(async () => {
    try {
      const currentTrack = await TrackPlayer.getActiveTrack();
      if (!currentTrack) {
        // If no track is currently playing, play the first one
        await loadAndPlayTrack(0);
        return;
      }

      const currentIndex = localMusic.findIndex(track => track.id === currentTrack.id);
      const nextIndex = (currentIndex + 1) % localMusic.length; // Wrap around to the first track
      await loadAndPlayTrack(nextIndex);
    } catch (error) {
      console.error('Error playing next song:', error);
    }
  }, [localMusic]);

  // Add a direct back button handler to ensure we go back to Library main page
  useEffect(() => {
    const handleBackPress = () => {
      console.log('Back pressed in MyMusicPage, navigating to LibraryPage');
      navigation.navigate('LibraryPage');
      return true; // Prevents default back action
    };

    // Add back handler
    const backHandler = BackHandler.addEventListener('hardwareBackPress', handleBackPress);

    // Clean up on unmount
    return () => {
      backHandler.remove();
    };
  }, [navigation]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchLocalMusic(false); // Don't use cache when refreshing
    setRefreshing(false);
  }, []);

  if (isOffline) {
    console.log('Device is offline, but still displaying local music');
  }

  if (loading && !localMusic.length) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color="#1E90FF" />
        <Text style={styles.loadingText}>{isOffline ? 'Loading cached music...' : 'Fetching your music...'}</Text>
        <Text style={[styles.loadingText, { fontSize: 12, marginTop: 10, color: '#888' }]}>
          Debug: loading={loading.toString()}, localMusic.length={localMusic.length}, error={error || 'none'}
        </Text>
        <Text style={[styles.loadingText, { fontSize: 10, marginTop: 5, color: '#666' }]}>
          If stuck here, check console logs for permission/fetch errors
        </Text>
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
        {!error.includes('settings') && (
          <Button
            title="Try Again"
            onPress={() => fetchLocalMusic(false)}
          />
        )}
        <Text style={[styles.loadingText, { fontSize: 12, marginTop: 10, color: '#666' }]}>
          Make sure you have music files in your Music or Download folders
        </Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      
      {isOffline && (
        <View style={styles.offlineBanner}>
          <Image
            source={require('../../Images/offline.png')}
            style={styles.offlineIcon}
            resizeMode="contain"
          />
          <Text style={styles.offlineBannerText}>You're currently offline</Text>
        </View>
      )}
      
      <FlatList
        ListHeaderComponent={
          <View style={styles.headerContainer}>
            <Text style={styles.title}>My Music</Text>
            <AnimatedSearchBar
              onChange={setSearchQuery}
              placeholder="Search songs..."
            />
          </View>
        }
        data={localMusic.filter(item => 
          item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          item.artist.toLowerCase().includes(searchQuery.toLowerCase())
        )}
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
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#1DB954']}
          />
        }
      />
      
      {/* Add buttons for next and previous song */}
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', padding: 10 }}>
        <Pressable onPress={playPreviousSong} style={styles.controlButton}>
          <Ionicons name="play-skip-back" size={24} color="white" />
        </Pressable>
        <Pressable onPress={playNextSong} style={styles.controlButton}>
          <Ionicons name="play-skip-forward" size={24} color="white" />
        </Pressable>
      </View>
    </View>
  );
};

export default MyMusicPage;