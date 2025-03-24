import React, { useState, useEffect } from 'react';
import { View, FlatList, StyleSheet, Text, Dimensions, RefreshControl } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RNFS from 'react-native-fs';
import { PlainText } from '../Global/PlainText';
import { EachSongCard } from '../Global/EachSongCard';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';

// Hard-coded colors until we find the correct import
const AppColors = {
  backgroundColor: '#121212',
  primary: '#1DB954',
  white: '#FFFFFF',
  gray: '#9E9E9E'
};

const { width, height } = Dimensions.get('window');

export default function DownloadScreen() {
  const [downloadedSongs, setDownloadedSongs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    getDownloadedSongs();
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await getDownloadedSongs();
    setRefreshing(false);
  };

  const getDownloadedSongs = async () => {
    try {
      setIsLoading(true);
      
      // Retrieve download metadata from AsyncStorage
      const downloadMetadata = await AsyncStorage.getItem('orbit_downloaded_songs');
      const parsedMetadata = downloadMetadata ? JSON.parse(downloadMetadata) : [];
      
      // Check for file existence to ensure files are still on device
      const existingSongs = [];
      
      for (const song of parsedMetadata) {
        const filePath = `${RNFS.DocumentDirectoryPath}/Orbit/${song.id}.mp3`;
        const exists = await RNFS.exists(filePath);
        
        if (exists) {
          // Format the song with required properties for EachSongCard
          existingSongs.push({
            id: song.id,
            name: song.name,
            artists: song.artists,
            image: song.image,
            duration: song.duration,
            downloadUrl: { url: { med: { url: filePath } } }, // Structure for local files
            isDownloaded: true,
            localFilePath: filePath
          });
        }
      }
      
      setDownloadedSongs(existingSongs);
    } catch (error) {
      console.error('Error getting downloaded songs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const EmptyDownloads = () => (
    <View style={styles.emptyContainer}>
      <MaterialIcons name="download" size={80} color={AppColors.gray} />
      <Text style={styles.emptyText}>No downloads yet</Text>
      <Text style={styles.emptySubText}>Your downloaded songs will appear here</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.headerContainer}>
        <PlainText text="Downloads" style={styles.headerText} />
      </View>
      
      <FlatList
        data={downloadedSongs}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <EachSongCard
            id={item.id}
            name={item.name}
            image={item.image}
            artists={item.artists}
            duration={item.duration || "0:00"}
            downloadUrl={item.downloadUrl}
            isDownloaded={true}
            localFilePath={item.localFilePath}
          />
        )}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[AppColors.primary]}
            tintColor={AppColors.primary}
          />
        }
        ListEmptyComponent={<EmptyDownloads />}
        contentContainerStyle={downloadedSongs.length === 0 ? { flex: 1 } : styles.listContent}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: AppColors.backgroundColor,
  },
  headerContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: AppColors.gray,
  },
  headerText: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  listContent: {
    paddingBottom: 100, // To ensure content is visible above bottom tabs
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 100,
  },
  emptyText: {
    color: AppColors.white,
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 16,
  },
  emptySubText: {
    color: AppColors.gray,
    fontSize: 16,
    marginTop: 8,
  },
}); 