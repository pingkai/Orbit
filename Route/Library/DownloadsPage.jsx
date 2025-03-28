import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl, ToastAndroid, AppState } from 'react-native';
import { MainWrapper } from "../../Layout/MainWrapper";
import { GetDownloadPath } from "../../LocalStorage/AppSettings";
import ReactNativeBlobUtil from "react-native-blob-util";
import { EachSongCard } from "../../Component/Global/EachSongCard";
import { Heading } from "../../Component/Global/Heading";
import { Spacer } from "../../Component/Global/Spacer";
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import TrackPlayer from 'react-native-track-player';

export const DownloadsPage = () => {
  const [downloads, setDownloads] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [downloadDir, setDownloadDir] = useState('');

  const scanDownloadFolders = async () => {
    try {
      const path = await GetDownloadPath();
      const dirs = ReactNativeBlobUtil.fs.dirs;
      
      // Set up primary and fallback download directories
      const primaryDir = (path === "Downloads") 
        ? dirs.LegacyDownloadDir + `/Orbit` 
        : dirs.LegacyMusicDir + `/Orbit`;
        
      // Also check the Downloads folder for existing music files
      const secondaryDir = dirs.DownloadDir;
      const musicDir = dirs.MusicDir;
      
      setDownloadDir(primaryDir);
      
      let musicFiles = [];
      
      // Function to scan a directory and return music files
      const scanDirectory = async (directory) => {
        try {
          // Check if directory exists
          const exists = await ReactNativeBlobUtil.fs.exists(directory);
          if (!exists) {
            console.log(`Directory does not exist: ${directory}`);
            return [];
          }
          
          // List files in the directory
          const files = await ReactNativeBlobUtil.fs.ls(directory);
          
          // Filter music files with more comprehensive extensions
          return files.filter(file => 
            file.toLowerCase().endsWith('.mp3') || 
            file.toLowerCase().endsWith('.m4a') || 
            file.toLowerCase().endsWith('.wav') || 
            file.toLowerCase().endsWith('.flac') ||
            file.toLowerCase().endsWith('.aac') ||
            file.toLowerCase().endsWith('.ogg') ||
            file.toLowerCase().endsWith('.wma')
          );
        } catch (error) {
          console.log(`Error scanning directory ${directory}:`, error);
          return [];
        }
      };
      
      // Scan primary directory (app's download folder)
      const primaryFiles = await scanDirectory(primaryDir);
      console.log(`Found ${primaryFiles.length} music files in primary directory`);
      
      // Create directory if it doesn't exist
      if (primaryFiles.length === 0) {
        try {
          const primaryDirExists = await ReactNativeBlobUtil.fs.exists(primaryDir);
          if (!primaryDirExists) {
            await ReactNativeBlobUtil.fs.mkdir(primaryDir);
            console.log(`Created directory: ${primaryDir}`);
          }
        } catch (error) {
          console.log(`Error creating directory ${primaryDir}:`, error);
        }
      }
      
      // Collect all music files
      musicFiles = [...primaryFiles];
      
      if (musicFiles.length === 0) {
        console.log('No music files found in any directory');
        setDownloads([]);
        return;
      }
      
      // Extract artist from title
      const extractArtistFromTitle = (title) => {
        // Try different patterns to extract artist
        const patterns = [
          /- ([^-]+)$/, // Pattern: Song Name - Artist
          /([^-]+) -/, // Pattern: Artist - Song Name
          /\[([^\]]+)\]/, // Pattern: Song Name [Artist]
        ];
        
        for (const regex of patterns) {
          const match = title.match(regex);
          if (match) {
            return match[1].trim();
          }
        }
        
        return "Unknown Artist";
      };

      // Format tracks for display
      const formattedTracks = musicFiles.map(file => {
        // Remove file extension for display
        const title = file.replace(/\.(mp3|m4a|wav|flac|aac|ogg|wma)$/i, '');
        const artist = extractArtistFromTitle(title);

        return {
          id: `local_${file}`,
          url: `file://${primaryDir}/${file}`,
          title: title,
          artist: artist,
          artwork: 'https://htmlcolorcodes.com/assets/images/colors/gray-color-solid-background-1920x1080.png',
          duration: 0, // Duration will be set when playing
          isLocal: true,
          downloadUrl: [{url: `file://${primaryDir}/${file}`}]
        };
      });
      
      setDownloads(formattedTracks);
    } catch (error) {
      console.error('Error scanning download folders:', error);
      ToastAndroid.show('Error loading downloads', ToastAndroid.SHORT);
    }
  };

  useEffect(() => {
    scanDownloadFolders().finally(() => setLoading(false));
    
    // Also scan when app comes to foreground
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (nextAppState === 'active') {
        scanDownloadFolders();
      }
    });

    return () => {
      subscription.remove();
    };
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await scanDownloadFolders();
    setRefreshing(false);
  };

  const EmptyDownloads = () => (
    <View style={styles.emptyContainer}>
      <MaterialIcons name="download" size={80} color="#666" />
      <Text style={styles.emptyText}>No downloads yet</Text>
      <Text style={styles.emptySubText}>
        Your downloaded songs will appear here
      </Text>
    </View>
  );

  return (
    <MainWrapper>
      <View style={styles.container}>
        <View style={styles.header}>
          <Heading text="Downloads" />
          <Text style={styles.songCount}>
            {downloads.length} {downloads.length === 1 ? 'song' : 'songs'}
          </Text>
        </View>
        <Spacer height={10} />
        
        <FlatList
          data={downloads}
          keyExtractor={(item) => item.id}
          renderItem={({ item, index }) => (
            <EachSongCard
              title={item.title}
              artist={item.artist}
              image={item.artwork}
              id={item.id}
              url={item.url}
              duration={item.duration}
              isLocal={true}
              index={index}
              allSongs={downloads}
              downloadUrl={item.downloadUrl}
            />
          )}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#1DB954']}
            />
          }
          ListEmptyComponent={!loading && <EmptyDownloads />}
          contentContainerStyle={
            downloads.length === 0 ? styles.emptyList : styles.list
          }
        />
      </View>
    </MainWrapper>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 15,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  songCount: {
    color: '#666',
    fontSize: 14,
  },
  list: {
    paddingBottom: 100,
  },
  emptyList: {
    flex: 1,
    justifyContent: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  emptyText: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
  },
  emptySubText: {
    color: '#666',
    fontSize: 16,
    marginTop: 8,
  },
});