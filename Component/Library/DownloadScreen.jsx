import React, { useState, useEffect, useCallback } from 'react';
import { View, FlatList, StyleSheet, Text, Dimensions, RefreshControl, BackHandler, ToastAndroid, Alert, TextInput, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RNFS from 'react-native-fs';
import { PlainText } from '../Global/PlainText';
import { DownloadedSongCard } from './DownloadedSongCard';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import { useNavigation } from '@react-navigation/native';
import { StorageManager } from '../../Utils/StorageManager';
import { safePath, safeExists } from '../../Utils/FileUtils';

// Hard-coded colors until we find the correct import
const AppColors = {
  backgroundColor: '#121212',
  primary: '#1DB954',
  white: '#FFFFFF',
  gray: '#9E9E9E'
};

const { width, height } = Dimensions.get('window');

export default function DownloadScreen(props) {
  const [downloadedSongs, setDownloadedSongs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredSongs, setFilteredSongs] = useState([]);
  const [showSearch, setShowSearch] = useState(false);
  const navigation = useNavigation();

  useEffect(() => {
    getDownloadedSongs();

    // Add back handler to properly navigate back to Library instead of Home
    const backHandler = BackHandler.addEventListener('hardwareBackPress', () => {
      if (showSearch) {
        setShowSearch(false);
        setSearchQuery('');
        return true;
      }
      
      console.log('Back pressed in Download screen, navigating to Library');
      
      // Check if we came from fullscreen player (special case)
      AsyncStorage.getItem('came_from_fullscreen_player')
        .then(value => {
          if (value === 'true') {
            // Clear the flag
            AsyncStorage.removeItem('came_from_fullscreen_player');
            console.log('Detected special navigation case from fullscreen player');
            
            // Navigate to LibraryPage explicitly
            navigation.navigate('Library', {
              screen: 'LibraryPage',
              params: { timestamp: Date.now() }
            });
          } else {
            // Standard navigation flow
            // Check if we were navigated from Library
            const previousScreen = props.route?.params?.previousScreen;
            
            if (previousScreen === 'Library') {
              // Go back to Library main screen explicitly
              navigation.navigate('Library', { screen: 'LibraryPage' });
            } else {
              // If we don't know where we came from, use the default library navigation
              navigation.navigate('Library', { screen: 'LibraryPage' });
            }
          }
        })
        .catch(error => {
          console.error('Error checking navigation flag:', error);
          // Fallback to standard navigation
          navigation.navigate('Library', { screen: 'LibraryPage' });
        });
      
      return true; // Prevent default back action
    });
    
    return () => {
      backHandler.remove();
    };
  }, [navigation, props.route, showSearch]);

  // Filter songs based on search query
  useEffect(() => {
    if (!searchQuery.trim()) {
      setFilteredSongs(downloadedSongs);
    } else {
      const query = searchQuery.toLowerCase().trim();
      const filtered = downloadedSongs.filter(song => 
        (song.title && song.title.toLowerCase().includes(query)) || 
        (song.artist && song.artist.toLowerCase().includes(query))
      );
      setFilteredSongs(filtered);
    }
  }, [searchQuery, downloadedSongs]);

  const onRefresh = async () => {
    setRefreshing(true);
    await getDownloadedSongs();
    setRefreshing(false);
  };

  // Function to clean up the song name from filename
  const cleanupSongName = (name) => {
    if (!name) return "Unknown Title";
    
    // Replace underscores with spaces
    let cleanName = name.replace(/_/g, ' ');
    
    // Remove any ID prefixes if present (assuming they're at the start with underscore or dash)
    cleanName = cleanName.replace(/^[a-zA-Z0-9]+[-_]/, '');
    
    // First letter capitalized and rest as is
    return cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
  };

  // Improved check if file exists with proper error handling using safeExists
  const checkFileExists = async (path) => {
    try {
      // Handle null, undefined or empty paths
      if (!path) {
        console.warn('Empty path provided to checkFileExists');
        return false;
      }
      
      // Convert to string if it's not already
      let stringPath = path;
      if (typeof path !== 'string') {
        try {
          // If it's an object with a path property
          if (path.path && typeof path.path === 'string') {
            stringPath = path.path;
          } else {
            // Force string conversion
            stringPath = String(path);
          }
          console.log('Converted non-string path:', stringPath);
        } catch (conversionError) {
          console.error('Error converting path to string:', conversionError);
          return false;
        }
      }
      
      if (!stringPath) return false;
      
      // Use safeExists from FileUtils if available
      if (typeof safeExists === 'function') {
        return await safeExists(stringPath);
      }
      
      // Fallback to RNFS.exists
      return await RNFS.exists(stringPath);
    } catch (error) {
      console.error(`Error checking if file exists:`, error);
      return false;
    }
  };

  // Get fallback artwork path if needed
  const getDefaultArtworkPath = () => {
    return 'https://htmlcolorcodes.com/assets/images/colors/gray-color-solid-background-1920x1080.png';
  };

  const getDownloadedSongs = async () => {
    try {
      setIsLoading(true);
      console.log('Fetching downloaded songs...');
      
      // Try multiple approaches to find downloaded songs
      const songs = [];
      
      // APPROACH 1: Get songs from StorageManager - preferred method
      try {
        console.log('Trying StorageManager approach...');
        const allMetadata = await StorageManager.getAllDownloadedSongsMetadata();
        
        if (allMetadata && Object.keys(allMetadata).length > 0) {
          console.log(`Found ${Object.keys(allMetadata).length} songs in StorageManager`);
          
          // Format tracks with metadata
          const formattedTracks = await Promise.all(
            Object.values(allMetadata).map(async (metadata) => {
              try {
                // Get artwork path and verify it exists
                let artworkPath = metadata.localArtworkPath || StorageManager.getArtworkPath(metadata.id);
                if (artworkPath && !artworkPath.startsWith('file://')) {
                  artworkPath = `file://${artworkPath}`;
                }
                
                // Verify artwork file exists
                const artworkExists = await checkFileExists(artworkPath);
                console.log(`Artwork exists at ${artworkPath}: ${artworkExists}`);
                
                // Get song path and verify it exists
                let songPath = metadata.localSongPath || StorageManager.getSongPath(metadata.id);
                if (songPath && !songPath.startsWith('file://')) {
                  songPath = `file://${songPath}`;
                }
                
                // Verify song file exists, use safeExists from FileUtils if available
                let exists = false;
                if (typeof safeExists === 'function') {
                  exists = await safeExists(songPath);
                } else {
                  exists = await RNFS.exists(songPath);
                }
                
                console.log(`Song exists at ${songPath}: ${exists}`);
                
                if (!exists) {
                  console.log(`Song file not found at ${songPath}`);
                  return null;
                }
                
                // Make sure we have a valid title and artist
                const songTitle = metadata.title || metadata.name || cleanupSongName(metadata.originalFilename) || 'Unknown Title';
                const artistName = metadata.artist || metadata.artists || 'Unknown Artist';
                
                // Make sure all paths are strings
                let songPathStr = typeof songPath === 'string' ? songPath : String(songPath || '');
                let artworkPathStr = typeof artworkPath === 'string' ? artworkPath : String(artworkPath || '');
                
                // Safely check if path starts with file://
                const hasFilePrefix = (path) => {
                  try {
                    return typeof path === 'string' && path.indexOf('file://') === 0;
                  } catch (e) {
                    return false;
                  }
                };
                
                // Ensure correct file:// prefix for paths
                if (!hasFilePrefix(songPathStr)) {
                  songPathStr = `file://${songPathStr}`;
                }
                
                // Construct proper artwork URL
                const artworkUrl = artworkExists 
                  ? (hasFilePrefix(artworkPathStr) ? artworkPathStr : `file://${artworkPathStr}`)
                  : metadata.artwork || getDefaultArtworkPath();
                
                return {
                  id: metadata.id,
                  title: songTitle,
                  artist: artistName,
                  name: songTitle,
                  artists: artistName,
                  image: artworkUrl,
                  artwork: artworkUrl,
                  duration: metadata.duration || 0,
                  // Ensure file:// prefix for path
                  url: hasFilePrefix(songPathStr) ? songPathStr : `file://${songPathStr}`,
                  filePath: hasFilePrefix(songPathStr) ? songPathStr : `file://${songPathStr}`,
                  isDownloaded: true,
                  isLocal: true,
                  localFilePath: songPathStr
                };
              } catch (error) {
                console.error('Error formatting track:', error);
                return null;
              }
            })
          );
          
          // Filter out null values (files that don't exist)
          const validTracks = formattedTracks.filter(track => track !== null);
          songs.push(...validTracks);
        }
      } catch (storageError) {
        console.error('Error using StorageManager approach:', storageError);
      }
      
      console.log(`Total songs found: ${songs.length}`);
      setDownloadedSongs(songs);
      setFilteredSongs(songs);
      
      // Update the orbit_downloaded_songs in AsyncStorage for future use
      try {
        if (songs.length > 0) {
          await AsyncStorage.setItem('orbit_downloaded_songs', JSON.stringify(
            songs.map(song => ({
              id: song.id,
              name: song.name || song.title,
              artists: song.artists || song.artist,
              image: song.image || song.artwork,
              duration: song.duration,
              url: song.filePath || song.url,
              localSongPath: song.filePath || song.localFilePath
            }))
          ));
        }
      } catch (updateError) {
        console.error('Error updating AsyncStorage:', updateError);
      }
    } catch (error) {
      console.error('Error getting downloaded songs:', error);
      ToastAndroid.show('Error loading downloads', ToastAndroid.SHORT);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle song deletion without confirmation
  const handleDeleteSong = async (songId, songTitle) => {
    try {
      // Delete the song using StorageManager
      await StorageManager.removeDownloadedSongMetadata(songId);
      
      // Remove from local state
      setDownloadedSongs(prev => prev.filter(song => song.id !== songId));
      setFilteredSongs(prev => prev.filter(song => song.id !== songId));
      
      // Show short toast notification
      ToastAndroid.show('Song deleted', ToastAndroid.SHORT);
    } catch (error) {
      console.error('Error deleting song:', error);
      ToastAndroid.show('Error deleting song', ToastAndroid.SHORT);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <PlainText text="Downloads" style={styles.title} />
        
        {showSearch ? (
          <View style={styles.searchBarContainer}>
            <TextInput
              style={styles.searchInput}
              placeholder="Search..."
              placeholderTextColor={AppColors.gray}
              value={searchQuery}
              onChangeText={setSearchQuery}
              returnKeyType="search"
              autoCapitalize="none"
              selectionColor={AppColors.primary}
              autoFocus={true}
            />
            <TouchableOpacity onPress={() => {
              setShowSearch(false);
              setSearchQuery('');
            }}>
              <MaterialIcons name="close" size={24} color={AppColors.gray} />
            </TouchableOpacity>
          </View>
        ) : (
          <TouchableOpacity onPress={() => setShowSearch(true)} style={styles.searchIcon}>
            <MaterialIcons name="search" size={24} color={AppColors.white} />
          </TouchableOpacity>
        )}
      </View>
      
      <FlatList
        data={filteredSongs}
        renderItem={({ item }) => (
          <DownloadedSongCard 
            song={item} 
            refetch={getDownloadedSongs}
            onDeleteRequest={handleDeleteSong}
          />
        )}
        keyExtractor={(item, index) => item.id ? item.id.toString() : index.toString()}
        contentContainerStyle={styles.songsList}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <MaterialIcons name="music-off" size={50} color={AppColors.gray} />
            <Text style={styles.emptyText}>
              {searchQuery 
                ? `No downloads matching "${searchQuery}"` 
                : "No downloaded songs found"}
            </Text>
            <Text style={styles.emptySubText}>
              {searchQuery 
                ? "Try a different search term" 
                : "Download your favorite songs to listen offline"}
            </Text>
          </View>
        }
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[AppColors.primary]}
            tintColor={AppColors.primary}
          />
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.backgroundColor,
  },
  header: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    color: AppColors.white,
  },
  searchIcon: {
    padding: 4,
  },
  searchBarContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#242424',
    borderRadius: 8,
    paddingHorizontal: 12,
    marginLeft: 16,
    height: 40,
  },
  searchInput: {
    flex: 1,
    height: 40,
    color: AppColors.white,
    fontSize: 16,
  },
  songsList: {
    paddingBottom: 150, // Extra padding for bottom tabs and player
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
    height: height * 0.5,
  },
  emptyText: {
    fontSize: 18,
    color: AppColors.white,
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubText: {
    fontSize: 14,
    color: AppColors.gray,
    marginTop: 8,
    textAlign: 'center',
  },
}); 