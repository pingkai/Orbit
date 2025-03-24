import React, { useState, useEffect } from 'react';
import { View, Text, FlatList, StyleSheet, RefreshControl, ToastAndroid } from 'react-native';
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

  const loadDownloadedSongs = async () => {
    try {
      const path = await GetDownloadPath();
      const dirs = ReactNativeBlobUtil.fs.dirs;
      const downloadDir = (path === "Downloads") 
        ? dirs.LegacyDownloadDir + `/Orbit` 
        : dirs.LegacyMusicDir + `/Orbit`;
      
      // Check if directory exists
      const exists = await ReactNativeBlobUtil.fs.exists(downloadDir);
      if (!exists) {
        console.log('Download directory does not exist');
        setDownloads([]);
        return;
      }
      
      // List files in the directory
      const files = await ReactNativeBlobUtil.fs.ls(downloadDir);
      
      // Filter music files
      const musicFiles = files.filter(file => 
        file.endsWith('.mp3') || 
        file.endsWith('.m4a') || 
        file.endsWith('.wav') || 
        file.endsWith('.flac')
      );
      
      if (musicFiles.length === 0) {
        console.log('No music files found');
        setDownloads([]);
        return;
      }
      
      // Extract artist from title
      const extractArtistFromTitle = (title) => {
        const regex = /- (.+)$/;
        const match = title.match(regex);
        return match ? match[1].trim() : "Unknown Artist";
      };

      // Format tracks for display
      const formattedTracks = musicFiles.map(file => {
        const title = file.replace(/\.(mp3|m4a|wav|flac)$/, '');
        const artist = extractArtistFromTitle(title);

        return {
          id: `local_${file}`,
          url: `file://${downloadDir}/${file}`,
          title: title,
          artist: artist,
          artwork: 'https://htmlcolorcodes.com/assets/images/colors/gray-color-solid-background-1920x1080.png',
          duration: 0, // Duration will be set when playing
          isLocal: true,
          downloadUrl: [{url: `file://${downloadDir}/${file}`}]
        };
      });
      
      setDownloads(formattedTracks);
    } catch (error) {
      console.error('Error loading downloaded songs:', error);
      ToastAndroid.show('Error loading downloads', ToastAndroid.SHORT);
    }
  };

  useEffect(() => {
    loadDownloadedSongs().finally(() => setLoading(false));
  }, []);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadDownloadedSongs();
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