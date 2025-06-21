import React, { useState } from 'react';
import {
  View,
  ScrollView,
  Dimensions,
  ToastAndroid,
  RefreshControl
} from 'react-native';
import { MainWrapper } from '../Layout/MainWrapper';
import { PlainText } from '../Component/Global/PlainText';
import { SmallText } from '../Component/Global/SmallText';
import { LoadingComponent } from '../Component/Global/Loading';
import { useRoute, useNavigation } from '@react-navigation/native';
import { AddPlaylist } from '../MusicPlayerFunctions';

// Import custom hooks
import { useArtistData, useArtistSongs } from '../hooks/useArtistData';
import { useArtistNavigation } from '../hooks/useArtistNavigation';

// Import utility functions
import { validateRouteParams, formatSongsForPlaylist } from '../Utils/ArtistUtils';

// Import extracted components
import ArtistHeader from '../Component/Artist/ArtistHeader';
import ArtistTabs from '../Component/Artist/ArtistTabs';
import ArtistSongs from '../Component/Artist/ArtistSongs';
import ArtistAlbums from '../Component/Artist/ArtistAlbums';
import ArtistBio from '../Component/Artist/ArtistBio';

const { height: screenHeight } = Dimensions.get('window');

const ArtistPage = () => {
  const route = useRoute();
  const navigation = useNavigation();

  // Validate and sanitize route parameters
  const routeParams = route.params || {};
  const { safeArtistId, safeArtistName, safeInitialTab } = validateRouteParams(routeParams);

  // Validate required parameters
  if (!safeArtistId) {
    console.error('ArtistPage: Missing artistId parameter');
    return (
      <MainWrapper>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 }}>
          <SmallText text="Error: Missing artist information" style={{ textAlign: 'center' }} />
          <PlainText
            text="Go Back"
            style={{
              marginTop: 20,
              paddingHorizontal: 20,
              paddingVertical: 10,
              borderRadius: 8,
              color: 'white'
            }}
            onPress={() => navigation.goBack()}
          />
        </View>
      </MainWrapper>
    );
  }

  // State management
  const [activeTab, setActiveTab] = useState(safeInitialTab || 'songs');

  // Custom hooks for data management
  const { artistData, artistAlbums, loading, refreshing, onRefresh } = useArtistData(safeArtistId);
  const {
    visibleSongs,
    songLoading,
    hasMoreSongs,
    totalSongs,
    loadMoreSongs,
    resetSongs
  } = useArtistSongs(safeArtistId);

  // Navigation hook
  const { navigateToAlbum } = useArtistNavigation(safeArtistId, safeArtistName, activeTab);

  // Play all songs handler
  const playAllSongs = async () => {
    if (!visibleSongs || visibleSongs.length === 0) {
      ToastAndroid.show('No songs available to play', ToastAndroid.SHORT);
      return;
    }

    try {
      const formattedSongs = formatSongsForPlaylist(visibleSongs);
      await AddPlaylist(formattedSongs);
      ToastAndroid.show(`Playing ${formattedSongs.length} songs`, ToastAndroid.SHORT);
    } catch (error) {
      console.error('Error playing all songs:', error);
      ToastAndroid.show('Failed to play songs', ToastAndroid.SHORT);
    }
  };

  // Handle scroll to bottom for infinite loading
  const handleScroll = (event) => {
    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const paddingToBottom = 20;

    // Check if user has scrolled to bottom
    if (layoutMeasurement.height + contentOffset.y >= contentSize.height - paddingToBottom) {
      // Only load more if we're on songs tab and have more songs to load
      if (activeTab === 'songs' && hasMoreSongs && !songLoading) {
        loadMoreSongs();
      }
    }
  };

  if (loading) {
    return (
      <MainWrapper>
        <LoadingComponent loading={true} height={screenHeight} />
      </MainWrapper>
    );
  }

  return (
    <MainWrapper>
      <ScrollView
        style={{ flex: 1 }}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={async () => {
            resetSongs();
            await onRefresh();
          }} />
        }
        showsVerticalScrollIndicator={false}
        onScroll={handleScroll}
        scrollEventThrottle={400}
      >
        {/* Artist Header */}
        <ArtistHeader
          artistData={artistData}
          artistName={safeArtistName}
          onPlayAll={playAllSongs}
        />

        {/* Artist Tabs */}
        <ArtistTabs
          activeTab={activeTab}
          onTabChange={setActiveTab}
        />

        {/* Tab Content */}
        <View style={{ marginTop: 20, paddingBottom: 100 }}>
          {activeTab === 'songs' && (
            <ArtistSongs
              visibleSongs={visibleSongs}
              totalSongs={totalSongs}
              songLoading={songLoading}
              hasMoreSongs={hasMoreSongs}
              onLoadMore={loadMoreSongs}
            />
          )}

          {activeTab === 'albums' && (
            <ArtistAlbums
              artistAlbums={artistAlbums}
              onAlbumPress={navigateToAlbum}
            />
          )}

          {activeTab === 'bio' && (
            <ArtistBio bioData={artistData?.data?.bio} />
          )}
        </View>
      </ScrollView>
    </MainWrapper>
  );
};

export default ArtistPage;
