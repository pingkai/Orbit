import React, { useContext, useEffect, useState, memo, useCallback, useRef } from "react";
import { View, Text, Platform, ToastAndroid } from "react-native";
import { EachSongQueue } from "./EachSongQueue";
import { BottomSheetFlatList } from "@gorhom/bottom-sheet";
import Context from "../../Context/Context";
import { useActiveTrack, useTrackPlayerEvents, Event } from "react-native-track-player";
import TrackPlayer from "react-native-track-player";
import Ionicons from "react-native-vector-icons/Ionicons";
import DraggableFlatList, { ScaleDecorator } from "react-native-draggable-flatlist";
import { SkipToTrack } from "../../MusicPlayerFunctions";
import NetInfo from "@react-native-community/netinfo";
import { StorageManager } from '../../Utils/StorageManager';

const QueueRenderSongs = memo(() => {
  // Context and state
  const { Queue } = useContext(Context);
  const currentPlaying = useActiveTrack();
  const [upcomingQueue, setUpcomingQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isLocalSource, setIsLocalSource] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [lastDraggedSongId, setLastDraggedSongId] = useState(null);
  const [isOffline, setIsOffline] = useState(false);
  const flatListRef = useRef(null);
  const operationInProgressRef = useRef(false);
  
  // Check network status on component mount
  useEffect(() => {
    const checkNetworkStatus = async () => {
      try {
        const networkState = await NetInfo.fetch();
        setIsOffline(!(networkState.isConnected && networkState.isInternetReachable));
      } catch (error) {
        console.error('Error checking network status:', error);
        // Default to online if we can't determine
        setIsOffline(false);
      }
    };
    
    checkNetworkStatus();
    
    // Subscribe to network changes
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsOffline(!(state.isConnected && state.isInternetReachable));
    });
    
    return () => unsubscribe();
  }, []);
  
  // More robust check for local tracks
  const isLocalTrack = (track) => {
    if (!track) return false;
    return Boolean(
      track.isLocalMusic || 
      track.isLocal || 
      track.isDownloaded ||
      track.path || 
      (track.url && (
        track.url.startsWith('file://') || 
        track.url.includes('content://') ||
        track.url.includes('/storage/')
      ))
    );
  };

  // Function to get all downloaded tracks
  const getDownloadedTracks = async () => {
    try {
      // Get all downloaded song metadata
      const allMetadata = await StorageManager.getAllDownloadedSongsMetadata();
      
      if (!allMetadata || Object.keys(allMetadata).length === 0) {
        console.log('No downloaded songs metadata found in queue');
        return [];
      }
      
      // Format tracks with metadata
      return Object.values(allMetadata).map(metadata => {
        const artworkPath = StorageManager.getArtworkPath(metadata.id);
        const songPath = StorageManager.getSongPath(metadata.id);
        
        return {
          id: metadata.id,
          url: `file://${songPath}`,
          title: metadata.title || 'Unknown',
          artist: metadata.artist || 'Unknown',
          artwork: `file://${artworkPath}`,
          localArtworkPath: artworkPath,
          duration: metadata.duration || 0,
          isLocal: true,
          isDownloaded: true
        };
      });
    } catch (error) {
      console.error('Error getting downloaded tracks:', error);
      return [];
    }
  };

  // Function to filter queue based on track source with offline support
  const filterQueueBySource = useCallback(async (currentTrack) => {
    try {
      if (!currentTrack) return [];
      
      // Always get downloaded tracks to have ready (regardless of offline status)
      const downloadedTracks = await getDownloadedTracks();
      console.log(`Found ${downloadedTracks.length} downloaded tracks for queue`);
      
      // If playing a downloaded track (either in offline mode or online mode)
      if (isLocalTrack(currentTrack)) {
        console.log('Playing local/downloaded track - showing all downloaded tracks in queue');
        
        // Put current track first, then other downloaded tracks
        const rearrangedTracks = [
          currentTrack,
          ...downloadedTracks.filter(track => track.id !== currentTrack.id)
        ];
        
        setIsLocalSource(true);
        return rearrangedTracks;
      }
      
      // For online tracks in online mode - normal behavior
      if (!isOffline) {
      // Determine if current track is local
      const currentIsLocal = isLocalTrack(currentTrack);
      
      // Update state to reflect current source type
      setIsLocalSource(currentIsLocal);
      
      // Get the full queue from TrackPlayer
      const fullQueue = await TrackPlayer.getQueue();
      
        if (fullQueue.length === 0) {
          console.log('TrackPlayer queue is empty, using current track');
          return [currentTrack];
        }
        
        // Filter to only include online tracks
      const filtered = fullQueue.filter(track => 
        isLocalTrack(track) === currentIsLocal
      );
      
      return filtered;
      }
      
      // Fallback for any other scenario - just return current track
      return [currentTrack];
    } catch (error) {
      console.error('Error filtering queue by source:', error);
      
      // If error occurs and we have a current track, at least show that
      if (currentTrack) {
        return [currentTrack];
      }
      return [];
    }
  }, [isLocalTrack, isOffline, getDownloadedTracks]);

  // Track change listener to update the queue
  useTrackPlayerEvents([Event.PlaybackTrackChanged], async (event) => {
    if (event.type === Event.PlaybackTrackChanged && !isDragging && !operationInProgressRef.current) {
      try {
        // Get current track
        const track = await TrackPlayer.getActiveTrack();
        const index = await TrackPlayer.getCurrentTrack();
        
        if (track) {
          setCurrentIndex(index || 0);
          
          // Filter the queue
          const filtered = await filterQueueBySource(track);
          
          // Filter out duplicate songs based on ID
          const uniqueIds = new Set();
          const uniqueFiltered = filtered.filter(track => {
            if (!track || !track.id || uniqueIds.has(track.id)) return false;
            uniqueIds.add(track.id);
            return true;
          });
          
          // Ensure current track is always first
          if (track.id && uniqueFiltered.length > 0) {
            const currentTrackIndex = uniqueFiltered.findIndex(t => t.id === track.id);
            
            // If current track isn't first and exists in the queue
            if (currentTrackIndex > 0) {
              // Move current track to the beginning
              const currentTrack = uniqueFiltered.splice(currentTrackIndex, 1)[0];
              uniqueFiltered.unshift(currentTrack);
            } 
            // If current track isn't in the queue at all
            else if (currentTrackIndex === -1) {
              uniqueFiltered.unshift(track);
            }
          }
          
          setUpcomingQueue(uniqueFiltered);
        } else {
          setUpcomingQueue([]);
        }
      } catch (error) {
        console.error('Error handling track change event:', error);
        setUpcomingQueue([]);
      }
    }
  });

  // Initialize queue when component mounts or current track changes
  useEffect(() => {
    const initializeQueue = async () => {
      if (isDragging || operationInProgressRef.current) return; // Don't update during operations
      
      try {
        if (currentPlaying) {
          // Always ensure we have the latest downloaded tracks
          await getDownloadedTracks();
          
          // Filter queue based on current track
          const filtered = await filterQueueBySource(currentPlaying);
          
          // Filter out duplicate songs based on ID
          const uniqueIds = new Set();
          const uniqueFiltered = filtered.filter(track => {
            if (!track || !track.id || uniqueIds.has(track.id)) return false;
            uniqueIds.add(track.id);
            return true;
          });
          
          // Ensure current track is always first
          if (currentPlaying.id && uniqueFiltered.length > 0) {
            const currentTrackIndex = uniqueFiltered.findIndex(t => t.id === currentPlaying.id);
            
            // If current track isn't first and exists in the queue
            if (currentTrackIndex > 0) {
              // Move current track to the beginning
              const currentTrack = uniqueFiltered.splice(currentTrackIndex, 1)[0];
              uniqueFiltered.unshift(currentTrack);
            } 
            // If current track isn't in the queue at all
            else if (currentTrackIndex === -1) {
              uniqueFiltered.unshift(currentPlaying);
            }
          }
          
          setUpcomingQueue(uniqueFiltered);
          
          // Get current index
          const index = await TrackPlayer.getCurrentTrack();
          setCurrentIndex(index || 0);
        } else {
          setUpcomingQueue([]);
        }
      } catch (error) {
        console.error('Error initializing queue:', error);
        // In case of error, at least show the current track
        if (currentPlaying) {
          setUpcomingQueue([currentPlaying]);
        } else {
        setUpcomingQueue([]);
        }
      }
    };

    // Try to suppress playlist errors
    const suppressPlaylistErrors = () => {
      const originalConsoleError = console.error;
      
      // Replace console.error with our filtered version
      console.error = (...args) => {
        // Filter out playlist errors
        if (args.some(arg => 
          typeof arg === 'string' && (
            arg.includes('Error getting playlist') || 
            arg.includes('Network Error') || 
            arg.includes('Network request failed')
          )
        )) {
          // Just log a simpler message instead
          console.log('Suppressed playlist/network error');
          return;
        }
        
        // Pass through all other errors
        originalConsoleError.apply(console, args);
      };
      
      // Return function to restore original behavior
      return () => {
        console.error = originalConsoleError;
      };
    };
    
    // Suppress playlist errors when using the component
    const restoreConsole = suppressPlaylistErrors();
    
    // Initialize the queue
    initializeQueue();
    
    // Cleanup
    return () => {
      restoreConsole();
    };
  }, [currentPlaying, isDragging, isOffline]);

  // NEW FUNCTION: Handle track selection with improved error handling
  const handleTrackSelect = async (item, displayIndex) => {
    try {
      if (!item || !item.id) {
        console.warn('Cannot select track: Invalid track data');
        return;
      }

      console.log(`Attempting to play track "${item.title}" with ID ${item.id}`);

      // Check if the item is a local/downloaded track
      if (isLocalTrack(item)) {
        console.log('Selected local/downloaded track, playing directly');
        
        try {
          // For local tracks, get the full queue of local tracks
          const localTracks = await getDownloadedTracks();
          
          // Find the selected track in the local tracks
          const localTrackIndex = localTracks.findIndex(track => track.id === item.id);
          
          if (localTrackIndex === -1) {
            console.log('Local track not found in downloaded tracks, using direct play');
            
            // If not found, try to play it directly by building a queue with it
            await TrackPlayer.reset();
            await TrackPlayer.add([item, ...localTracks.filter(t => t.id !== item.id)]);
            await TrackPlayer.play();
            return;
          }
          
          // Otherwise, play it from the local tracks collection
          await TrackPlayer.reset();
          await TrackPlayer.add([
            localTracks[localTrackIndex],
            ...localTracks.filter((_, index) => index !== localTrackIndex)
          ]);
          await TrackPlayer.play();
          return;
        } catch (error) {
          console.error('Error playing local track directly:', error);
        }
      }
      
      // For non-local tracks or if local track direct play failed
      try {
        // Get the full TrackPlayer queue to find the actual index
        const queue = await TrackPlayer.getQueue();
        
        // Find the track in the actual queue by ID
        const actualIndex = queue.findIndex(track => track.id === item.id);
        
        if (actualIndex === -1) {
          console.warn(`Track with ID ${item.id} not found in player queue`);
          
          // If the track isn't in the queue but we want to play it anyway
          if (item.url) {
            console.log('Track has URL but not in queue, adding it to queue');
            
            // Try to add it to the queue and play it
            try {
              // Keep existing queue if possible
              if (queue.length > 0) {
                await TrackPlayer.add([item], 0); // Add at beginning
                await TrackPlayer.skip(0); // Skip to our new track
              } else {
                await TrackPlayer.reset();
                await TrackPlayer.add([item]);
              }
              await TrackPlayer.play();
              return;
            } catch (err) {
              console.error('Error adding track to queue:', err);
              if (Platform.OS === 'android') {
                ToastAndroid.show('Could not play this track', ToastAndroid.SHORT);
              }
              return;
            }
          }
          
          // Final fallback - just try to add and play the current track
          try {
            await TrackPlayer.reset();
            await TrackPlayer.add([item]);
            await TrackPlayer.play();
            return;
          } catch (finalError) {
            console.error('Final attempt to play track failed:', finalError);
            if (Platform.OS === 'android') {
              ToastAndroid.show('Cannot play this track', ToastAndroid.SHORT);
            }
            return;
          }
        }
        
        console.log(`Selected track "${item.title}" at queue index ${actualIndex}`);
        
        // Skip to the actual index in the queue
        await SkipToTrack(actualIndex);
        
      } catch (error) {
        console.error('Error selecting track:', error);
        
        // Last resort - try direct play
        try {
          if (item.url) {
            await TrackPlayer.reset();
            await TrackPlayer.add([item]);
            await TrackPlayer.play();
            console.log('Using emergency direct play method');
          }
        } catch (directPlayError) {
          console.error('Direct play failed:', directPlayError);
          if (Platform.OS === 'android') {
            ToastAndroid.show('Failed to play track', ToastAndroid.SHORT);
          }
        }
      }
    } catch (outerError) {
      console.error('Outer error in handleTrackSelect:', outerError);
      if (Platform.OS === 'android') {
        ToastAndroid.show('Failed to play selected track', ToastAndroid.SHORT);
      }
    }
  };

  // Handle drag start
  const handleDragStart = useCallback((params) => {
    try {
      setIsDragging(true);
      
      // Store the ID of the song being dragged for better tracking
      if (params && params.data && params.from >= 0 && params.from < params.data.length) {
        const draggedItem = params.data[params.from];
        if (draggedItem && draggedItem.id) {
          setLastDraggedSongId(draggedItem.id);
        }
      }
    } catch (error) {
      console.error('Error in drag start:', error);
    }
  }, []);

  // Complete rewrite of the queue repositioning system using IDs not indices
  const handleDragEnd = useCallback(async (params) => {
    try {
      // Destructure params
      const { from, to, data } = params;
      
      // Skip if positions are the same
      if (from === to) {
        setIsDragging(false);
        return;
      }
      
      // Set operation flag to prevent interference
      operationInProgressRef.current = true;
      
      // Filter out any duplicates that might have been created during dragging
      const uniqueIds = new Set();
      const uniqueData = data.filter(track => {
        if (!track.id || uniqueIds.has(track.id)) return false;
        uniqueIds.add(track.id);
        return true;
      });
      
      // Update UI immediately for responsiveness
      setUpcomingQueue(uniqueData);
      
      // Get the track being moved
      const movedTrack = data[to];
      if (!movedTrack || !movedTrack.id) {
        console.error('Could not identify the moved track');
        setIsDragging(false);
        operationInProgressRef.current = false;
        return;
      }
      
      // Get the full queue from TrackPlayer
      const fullQueue = await TrackPlayer.getQueue();
      if (!fullQueue || !fullQueue.length) {
        console.error('TrackPlayer queue is empty');
        setIsDragging(false);
        operationInProgressRef.current = false;
        return;
      }
      
      // Get currently playing track information and save it
      const currentTrackIndex = await TrackPlayer.getCurrentTrack();
      const currentTrack = currentTrackIndex !== null ? fullQueue[currentTrackIndex] : null;
      
      // Check if the current track remains in the queue
      const currentTrackStillInQueue = currentTrack && data.some(track => track.id === currentTrack.id);
      
      // Check if current track is being moved - important to know for playback
      const isCurrentTrackBeingMoved = currentTrack && currentTrack.id === movedTrack.id;
      
      // MORE ROBUST: Store current state with explicit state checks
      let wasPlaying = false;
      let position = 0;
      
      try {
        // Check for playback state more thoroughly
        if (currentTrackStillInQueue) {
          // Get state using two methods for redundancy
          const playbackState = await TrackPlayer.getState();
          const playerState = await TrackPlayer.getPlaybackState();
          
          // Check if either indicates playing (3 = playing in both APIs)
          wasPlaying = playbackState === 3 || (playerState && playerState.state === 3);
          
          // Double-check through the state name if available
          if (playerState && playerState.state && !wasPlaying) {
            wasPlaying = playerState.state === 'playing' || playerState.state === 'ready';
          }
          
          // Get current position with error handling
          try {
            position = await TrackPlayer.getPosition() || 0;
          } catch (e) {
            console.warn('Could not get position:', e);
            position = 0;
          }
          
          // Pause if playing - we'll resume after queue manipulation
          if (wasPlaying) {
            await TrackPlayer.pause();
          }
        }
      } catch (error) {
        console.error('Error saving playback state:', error);
        // Default to assuming it was playing if we can't determine
        wasPlaying = true;
      }
      
      // APPROACH: Create a new queue with the right order and replace entire queue
      try {
        // 1. Map visual indices to track IDs
        const oldOrder = data.map(track => track.id);
        
        // 2. Create new array with same tracks but in the new order
        const newOrder = [...fullQueue];
        
        // 3. Sort the full queue according to the visual order
        newOrder.sort((a, b) => {
          // Only reposition tracks that match our source type
          const aIsLocal = isLocalTrack(a);
          const bIsLocal = isLocalTrack(b);
          
          // If track types don't match our filter, keep their original order
          if (aIsLocal !== isLocalSource || bIsLocal !== isLocalSource) {
            return 0;
          }
          
          const aIndex = oldOrder.indexOf(a.id);
          const bIndex = oldOrder.indexOf(b.id);
          
          // If we can't find one in our order, leave it where it is
          if (aIndex === -1 || bIndex === -1) return 0;
          
          // Otherwise sort by the visual order
          return aIndex - bIndex;
        });
        
        // 4. Replace the entire queue with our reordered queue
        await TrackPlayer.reset(); // Clear the queue
        await TrackPlayer.add(newOrder); // Add all tracks in the new order
        
        // 5. Resume playback of the proper track
        if (currentTrackStillInQueue) {
          // Find where the previously playing track is now
          const newCurrentIndex = newOrder.findIndex(track => track.id === currentTrack.id);
          
          if (newCurrentIndex !== -1) {
            // Skip to the track that was playing before
            await TrackPlayer.skip(newCurrentIndex);
            
            // Restore position with safety check
            if (position > 0) {
              try {
                await TrackPlayer.seekTo(position);
              } catch (e) {
                console.warn('Could not seek to position:', e);
              }
            }
            
            // Enhanced playback restoration with multiple attempts
            if (wasPlaying) {
              // First attempt immediately
              try {
                await TrackPlayer.play();
              } catch (e) {
                console.warn('First play attempt failed, trying again:', e);
                
                // Second attempt with delay
                setTimeout(async () => {
                  try {
                    const state = await TrackPlayer.getState();
                    // Only play if not already playing
                    if (state !== 3) {
                      await TrackPlayer.play();
                    }
                  } catch (error) {
                    console.error('Failed to resume playback on second attempt:', error);
                    
                    // Final attempt with longer delay
                    setTimeout(async () => {
                      try {
                        await TrackPlayer.play();
                      } catch (finalError) {
                        console.error('All playback restoration attempts failed:', finalError);
                      }
                    }, 500);
                  }
                }, 300);
              }
            }
          }
        }
        
        // 6. Update our filtered view
        const refreshedQueue = await filterQueueBySource(await TrackPlayer.getActiveTrack());
        setUpcomingQueue(refreshedQueue);
      } catch (error) {
        console.error('Error during queue repositioning:', error);
        
        // Attempt emergency playback restoration if everything fails
        if (wasPlaying && currentTrack) {
          setTimeout(async () => {
            try {
              // Try to find and play the track that was playing before
              const recovery = await TrackPlayer.getQueue();
              const recoveryIndex = recovery.findIndex(t => t.id === currentTrack.id);
              if (recoveryIndex >= 0) {
                await TrackPlayer.skip(recoveryIndex);
                await TrackPlayer.play();
              }
            } catch (e) {
              console.error('Emergency playback restoration failed:', e);
            }
          }, 800);
        }
      }
    } catch (error) {
      console.error('Error in drag end handler:', error);
    } finally {
      // Always clean up
      setIsDragging(false);
      operationInProgressRef.current = false;
      setLastDraggedSongId(null);
    }
  }, [isLocalSource, isLocalTrack]);

  // Empty queue state
  if ((!upcomingQueue || upcomingQueue.length === 0) && !isDragging) {
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

  // Use a simple FlatList if there's only one item to avoid drag errors
  if (upcomingQueue.length === 1) {
    return (
      <BottomSheetFlatList
        data={upcomingQueue}
        keyExtractor={(item, index) => `${item.id || 'track'}-${index}`}
        renderItem={({ item, index }) => (
          <EachSongQueue 
            title={item.title}
            artist={item.artist}
            id={item.id}
            index={index}
            artwork={item.artwork}
            isActive={false}
            onPress={() => handleTrackSelect(item, index)}
          />
        )}
        contentContainerStyle={{ 
          paddingBottom: 100,
          paddingTop: 8,
        }}
        showsVerticalScrollIndicator={false}
      />
    );
  }

  // Render queue with optimized drag support for multiple items
  return (
    <DraggableFlatList
      ref={flatListRef}
      data={upcomingQueue}
      keyExtractor={(item, index) => `${item.id || 'track'}-${index}`}
      onDragBegin={handleDragStart}
      onDragEnd={handleDragEnd}
      contentContainerStyle={{ 
        paddingBottom: 100,
        paddingTop: 8,
      }}
      showsVerticalScrollIndicator={false}
      activationDistance={8} // Increased for more reliable activation
      dragHitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }} // Larger touch area for easier grabbing
      autoscrollSpeed={300} // Faster autoscroll for improved long-distance dragging
      autoscrollThreshold={50} // Larger threshold for earlier autoscrolling
      animationConfig={{ 
        damping: 20, // More responsive damping
        stiffness: 320, // Stiffer spring for snappier animations
      }}
      dragItemOverflow={true} // Enable overflow for better visibility when dragging
      scrollEnabled={!isDragging} // Disable regular scrolling during drag for smoother interaction
      renderItem={({ item, index, drag, isActive }) => (
        <ScaleDecorator activeScale={0.98}>
          <EachSongQueue 
            title={item.title}
            artist={item.artist}
            id={item.id}
            index={index}
            artwork={item.artwork}
            drag={drag}
            isActive={isActive}
            onPress={() => handleTrackSelect(item, index)}
          />
        </ScaleDecorator>
      )}
    />
  );
});

export default QueueRenderSongs;
