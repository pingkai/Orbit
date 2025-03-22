import React, { useContext, useEffect, useState, memo } from "react";
import { View, Text } from "react-native";
import { EachSongQueue } from "./EachSongQueue";
import { BottomSheetFlatList } from "@gorhom/bottom-sheet";
import Context from "../../Context/Context";
import { useActiveTrack, useTrackPlayerEvents, Event } from "react-native-track-player";
import TrackPlayer from "react-native-track-player";
import Ionicons from "react-native-vector-icons/Ionicons";

const QueueRenderSongs = memo(() => {
  // Context and state
  const { Queue } = useContext(Context);
  const currentPlaying = useActiveTrack();
  const [upcomingQueue, setUpcomingQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLocalSource, setIsLocalSource] = useState(false);
  const [loading, setLoading] = useState(true);

  // More robust check for local tracks
  const isLocalTrack = (track) => {
    if (!track) return false;
    return Boolean(
      track.isLocalMusic || 
      track.isLocal || 
      track.path || 
      (track.url && (
        track.url.startsWith('file://') || 
        track.url.includes('content://') ||
        track.url.includes('/storage/')
      ))
    );
  };

  // Function to filter queue based on track source
  const filterQueueBySource = async (currentTrack) => {
    try {
      if (!currentTrack) {
        console.log('No current track to filter queue');
        return [];
      }
      
      // Check if current track is local
      const isOfflineTrack = isLocalTrack(currentTrack);
      setIsLocalSource(isOfflineTrack);
      console.log(`Current track "${currentTrack.title}" is ${isOfflineTrack ? 'LOCAL' : 'ONLINE'}`);
      
      // Always get the latest queue directly from TrackPlayer for accuracy
      const latestQueue = await TrackPlayer.getQueue();
      console.log(`Total tracks in queue: ${latestQueue.length}`);
      
      // Filter to match source type (local vs online)
      const filteredTracks = latestQueue.filter(track => isLocalTrack(track) === isOfflineTrack);
      console.log(`Filtered queue by source type. Results: ${filteredTracks.length} tracks`);
      
      return filteredTracks;
    } catch (error) {
      console.error('Error filtering queue by source:', error);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // Track change listener to update the queue
  useTrackPlayerEvents([Event.PlaybackTrackChanged], async (event) => {
    if (event.type === Event.PlaybackTrackChanged) {
      try {
        setLoading(true);
        console.log('Track changed, updating queue display');
        
        // Get current track
        const track = await TrackPlayer.getActiveTrack();
        const index = await TrackPlayer.getCurrentTrack();
        
        if (track) {
          setCurrentIndex(index || 0);
          
          // Filter the queue
          const filtered = await filterQueueBySource(track);
          setUpcomingQueue(filtered);
        } else {
          console.log('No active track found');
          setUpcomingQueue([]);
        }
      } catch (error) {
        console.error('Error handling track change event:', error);
        setUpcomingQueue([]);
      } finally {
        setLoading(false);
      }
    }
  });

  // Initialize queue when component mounts or current track changes
  useEffect(() => {
    const initializeQueue = async () => {
      try {
        setLoading(true);
        
        if (currentPlaying) {
          console.log(`Initializing queue with current track: ${currentPlaying.title}`);
          
          // Filter queue based on current track
          const filtered = await filterQueueBySource(currentPlaying);
          setUpcomingQueue(filtered);
          
          // Get current index
      const index = await TrackPlayer.getCurrentTrack();
          setCurrentIndex(index || 0);
        } else {
          console.log('No active track, empty queue');
          setUpcomingQueue([]);
        }
      } catch (error) {
        console.error('Error initializing queue:', error);
        setUpcomingQueue([]);
      } finally {
        setLoading(false);
      }
    };

    initializeQueue();
  }, [currentPlaying]);

  // Loading indicator
  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#151515' }}>
        <Text style={{ color: 'white', marginBottom: 10 }}>Loading queue...</Text>
      </View>
    );
  }

  // Empty queue state
  if (!upcomingQueue || upcomingQueue.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#151515', paddingHorizontal: 20 }}>
        <Ionicons name="musical-notes-outline" size={40} color="#777" />
        <Text style={{ color: '#fff', fontSize: 16, marginTop: 10, textAlign: 'center' }}>
          {isLocalSource ? "No more local songs in queue" : "No more online songs in queue"}
        </Text>
        <Text style={{ color: '#aaa', fontSize: 12, marginTop: 5, textAlign: 'center', paddingHorizontal: 20 }}>
          {isLocalSource ? "Add more local songs to your queue" : "Add more songs from playlists to your queue"}
        </Text>
      </View>
    );
  }

  // Render queue
  return (
    <BottomSheetFlatList
      data={upcomingQueue}
      keyExtractor={(item) => item.id}
      renderItem={({ item, index }) => (
        <EachSongQueue 
          title={item.title}
          artist={item.artist}
          id={item.id}
          index={index}
          artwork={item.artwork}
        />
      )}
      contentContainerStyle={{ paddingBottom: 90 }}
    />
  );
});

export default QueueRenderSongs;
