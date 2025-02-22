import React, { memo, useContext, useEffect, useState } from "react";
import { BottomSheetFlatList } from "@gorhom/bottom-sheet";
import { EachSongQueue } from "./EachSongQueue";
import Context from "../../Context/Context";
import TrackPlayer, { Event, useTrackPlayerEvents } from "react-native-track-player";

export const QueueRenderSongs = memo(function QueueRenderSongs() {
  const { Queue } = useContext(Context);
  const [upcomingQueue, setUpcomingQueue] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useTrackPlayerEvents([Event.PlaybackTrackChanged], async ({ nextTrack }) => {
    if (nextTrack !== null) {
      setCurrentIndex(nextTrack);
      const remainingQueue = Queue.slice(nextTrack + 1);
      setUpcomingQueue(remainingQueue);
    }
  });

  useEffect(() => {
    const initQueue = async () => {
      const index = await TrackPlayer.getCurrentTrack();
      if (index !== null) {
        setCurrentIndex(index);
        const remainingQueue = Queue.slice(index + 1);
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
          title={item.item.title}
          key={item.item.id}
          artist={item.item.artist}
          id={item.item.id}
          index={currentIndex + item.index + 1}
          image={item.item.artwork}
        />
      )}
    />
  );
});
