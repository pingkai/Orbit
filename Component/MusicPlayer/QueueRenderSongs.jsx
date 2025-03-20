import React, { memo, useContext, useEffect, useState } from "react";
import { BottomSheetFlatList } from "@gorhom/bottom-sheet";
import { EachSongQueue } from "./EachSongQueue";
import Context from "../../Context/Context";
import TrackPlayer, { Event, useTrackPlayerEvents } from "react-native-track-player";

export const QueueRenderSongs = memo(function QueueRenderSongs() {
  const { Queue, currentPlaying } = useContext(Context);
  const [upcomingQueue, setUpcomingQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  const filterQueueBySource = (queue, currentTrack) => {
    if (!currentTrack) return queue;
    // Check all possible indicators of a local track
    const isLocalTrack = currentTrack.isLocalMusic || currentTrack.path || currentTrack.isLocal || currentTrack.url?.startsWith('file://');
    return queue.filter(track => {
      // Apply the same check to each track in the queue
      const isTrackLocal = track.isLocalMusic || track.path || track.isLocal || track.url?.startsWith('file://');
      return isLocalTrack === isTrackLocal;
    });
  };

  useTrackPlayerEvents([Event.PlaybackTrackChanged], async ({ nextTrack }) => {
    if (nextTrack !== null) {
      setCurrentIndex(nextTrack);
      const filteredQueue = filterQueueBySource(Queue, Queue[nextTrack]);
      const remainingQueue = filteredQueue.slice(nextTrack + 1);
      setUpcomingQueue(remainingQueue);
    }
  });

  useEffect(() => {
    const initQueue = async () => {
      const index = await TrackPlayer.getCurrentTrack();
      if (index !== null) {
        setCurrentIndex(index);
        const filteredQueue = filterQueueBySource(Queue, Queue[index]);
        const remainingQueue = filteredQueue.slice(index + 1);
        setUpcomingQueue(remainingQueue);
      }
    };
    initQueue();
  }, [Queue]);

  return (
    <BottomSheetFlatList
      contentContainerStyle={{
        paddingHorizontal: 20, 
        paddingBottom: 100, 
        paddingRight: 60
      }}
      data={upcomingQueue}
      renderItem={(item) => (
        <EachSongQueue 
          title={item.item.title.length > 20 ? item.item.title.substring(0, 20) + '...' : item.item.title}
          key={item.item.id}
          artist={item.item.artist.length > 20 ? item.item.title.substring(0, 20) + '...' :item.item.artist}
          id={item.item.id}
          index={currentIndex + item.index + 1}
          image={item.item.artwork}
        />
      )}
    />
  );
});
