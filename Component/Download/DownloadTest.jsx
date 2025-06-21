import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { 
  DownloadControl, 
  CompactDownloadControl, 
  LargeDownloadControl,
  DownloadProgressIndicator,
  useDownload 
} from './index';

/**
 * DownloadTest - A simple test component to verify download functionality
 * This can be used to test the modular download components
 */
export const DownloadTest = () => {
  // Mock song data for testing
  const mockSong = {
    id: 'test-song-123',
    title: 'Test Song',
    artist: 'Test Artist',
    url: 'https://example.com/test-song.mp3',
    artwork: 'https://example.com/test-artwork.jpg'
  };

  // Use the download hook
  const {
    isDownloaded,
    isDownloading,
    downloadProgress,
    startDownload,
    canDownload
  } = useDownload(mockSong, false);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Download Components Test</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Download States:</Text>
        <Text>Is Downloaded: {isDownloaded ? 'Yes' : 'No'}</Text>
        <Text>Is Downloading: {isDownloading ? 'Yes' : 'No'}</Text>
        <Text>Progress: {downloadProgress}%</Text>
        <Text>Can Download: {canDownload ? 'Yes' : 'No'}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Download Controls:</Text>
        
        <View style={styles.controlRow}>
          <Text>Regular: </Text>
          <DownloadControl
            isDownloaded={isDownloaded}
            isDownloading={isDownloading}
            downloadProgress={downloadProgress}
            onDownloadPress={startDownload}
            disabled={!canDownload}
          />
        </View>

        <View style={styles.controlRow}>
          <Text>Compact: </Text>
          <CompactDownloadControl
            isDownloaded={isDownloaded}
            isDownloading={isDownloading}
            downloadProgress={downloadProgress}
            onDownloadPress={startDownload}
            disabled={!canDownload}
          />
        </View>

        <View style={styles.controlRow}>
          <Text>Large: </Text>
          <LargeDownloadControl
            isDownloaded={isDownloaded}
            isDownloading={isDownloading}
            downloadProgress={downloadProgress}
            onDownloadPress={startDownload}
            disabled={!canDownload}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Progress Indicators:</Text>
        
        <View style={styles.progressRow}>
          <DownloadProgressIndicator progress={25} size={24} />
          <DownloadProgressIndicator progress={50} size={32} />
          <DownloadProgressIndicator progress={75} size={40} />
          <DownloadProgressIndicator progress={100} size={48} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: '#f5f5f5'
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center'
  },
  section: {
    marginBottom: 20,
    padding: 15,
    backgroundColor: 'white',
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10
  },
  progressRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    alignItems: 'center'
  }
});
