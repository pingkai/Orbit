import { useState, useCallback, useEffect } from 'react';
import { useActiveTrack, useTrackPlayerEvents, Event } from 'react-native-track-player';
import TrackPlayer from 'react-native-track-player';

const availableGifs = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];

const gifModules = {
  'a': require('../Images/a.gif'),
  'b': require('../Images/b.gif'),
  'c': require('../Images/c.gif'),
  'd': require('../Images/d.gif'),
  'e': require('../Images/e.gif'),
  'f': require('../Images/f.gif'),
  'g': require('../Images/g.gif'),
  'h': require('../Images/h.gif'),
  'i': require('../Images/i.gif'),
  'j': require('../Images/j.gif'),
  'k': require('../Images/k.gif'),
  'l': require('../Images/l.gif'),
  'n': require('../Images/n.gif'),
  'o': require('../Images/o.gif'),
  'p': require('../Images/p.gif'),
  'q': require('../Images/q.gif'),
  'r': require('../Images/r.gif'),
  's': require('../Images/s.gif'),
  't': require('../Images/t.gif'),
  'u': require('../Images/u.gif'),
  'v': require('../Images/v.gif'),
  'w': require('../Images/w.gif'),
  'x': require('../Images/x.gif'),
  'y': require('../Images/y.gif'),
  'z': require('../Images/z.gif'),
  'default': require('../Images/a.gif') // Default fallback
};

const useDynamicArtwork = () => {
  const currentPlaying = useActiveTrack();
  const [currentGif, setCurrentGif] = useState('a');
  const [currentSongIdForGif, setCurrentSongIdForGif] = useState(null);
  const [gifIndex, setGifIndex] = useState(0);

  const getNextSequentialGif = useCallback(() => {
    const nextGifLetter = availableGifs[gifIndex];
    setGifIndex((prevIndex) => (prevIndex + 1) % availableGifs.length);
    console.log(`Sequential GIF assigned: ${nextGifLetter} (index ${gifIndex})`);
    return nextGifLetter;
  }, [gifIndex, availableGifs]);

  const getGifModule = useCallback((letter) => {
    return gifModules[letter] || gifModules['default'];
  }, []);

  const getGifSourceInternal = useCallback(() => {
    try {
      return getGifModule(currentGif);
    } catch (error) {
      console.error('Error loading GIF in hook:', error);
      return gifModules['default'];
    }
  }, [currentGif, getGifModule]);

  useTrackPlayerEvents([Event.PlaybackTrackChanged], async (event) => {
    try {
      if (event.type === Event.PlaybackTrackChanged) {
        const track = await TrackPlayer.getActiveTrack(); // Or use event.nextTrack if available and suitable
        if (track && track.id !== currentSongIdForGif) {
          console.log(`Hook: New song detected: ${track.title}`);
          setCurrentSongIdForGif(track.id);
          if (track.sourceType === 'mymusic') {
            console.log('Hook: This is a MyMusic track, assigning next sequential GIF');
            const nextGif = getNextSequentialGif();
            setCurrentGif(nextGif);
            console.log(`Hook: Assigned GIF ${nextGif} for song: ${track.title}`);
          }
        }
      }
    } catch (error) {
      console.error('Hook: Error in track change event handler:', error);
    }
  });

  useEffect(() => {
    if (currentPlaying && currentPlaying.sourceType === 'mymusic' && 
       (!currentSongIdForGif || currentPlaying.id !== currentSongIdForGif)) {
      setCurrentSongIdForGif(currentPlaying.id);
      const nextGif = getNextSequentialGif();
      setCurrentGif(nextGif);
      console.log(`Hook: Assigned initial sequential GIF ${nextGif} for MyMusic song: ${currentPlaying.title || 'Unknown'}`);
    }
  }, [currentPlaying, currentSongIdForGif, getNextSequentialGif, setCurrentGif]);

  const getArtworkSourceFromHook = useCallback((track) => {
    if (!track) {
      // console.log('Hook: No track provided, using default Music.jpeg');
      return require('../Images/Music.jpeg');
    }

    if (track.sourceType === 'mymusic') {
      // console.log('Hook: Track is mymusic, getting GIF source');
      return getGifSourceInternal();
    }

    // Handle online tracks: Prefer image array for quality selection
    if (track.image && Array.isArray(track.image) && track.image.length > 0) {
      let imageUrl = null;
      const highQualityImage = track.image.find(i => i.quality === '500x500');

      if (highQualityImage && highQualityImage.url && typeof highQualityImage.url === 'string' && (highQualityImage.url.startsWith('http://') || highQualityImage.url.startsWith('https://'))) {
        imageUrl = highQualityImage.url;
      }

      if (imageUrl) {
        // console.log(`Hook: Using track.image array, selected 500x500 quality URL: ${imageUrl}`);
        return { uri: imageUrl };
      }
    }

    // Fallback to track.artwork if track.image array didn't yield a URL or isn't present
    if (track.artwork && typeof track.artwork === 'string' && track.artwork !== 'null' && track.artwork.trim() !== '' && (track.artwork.startsWith('http://') || track.artwork.startsWith('https://'))) {
      let artworkUrl = track.artwork;
      // Attempt to upgrade the artwork URL to 500x500 if it seems to be a lower resolution.
      // This replaces common low-resolution indicators in image URLs.
      artworkUrl = artworkUrl.replace(/150x150/g, '500x500').replace(/50x50/g, '500x500');
      // console.log(`Hook: Using modified track.artwork URI: ${artworkUrl}`);
      return { uri: artworkUrl };
    }
    
    // Final fallback if no valid artwork found
    // console.log('Hook: No valid artwork found in track.image or track.artwork, using default. Track data:', JSON.stringify(track));
    return require('../Images/Music.jpeg');
  }, [getGifSourceInternal]);

  return { getArtworkSourceFromHook };
};

export default useDynamicArtwork;
