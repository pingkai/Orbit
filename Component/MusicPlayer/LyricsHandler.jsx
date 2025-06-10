import React, { useState, useEffect, useContext } from 'react';
import { ShowLyrics } from './ShowLyrics';
import { GetLyricsButton } from './GetLyricsButton';
import Context from '../../Context/Context';

export const LyricsHandler = ({ currentPlayingTrack, isOffline, Index, onLyricsVisibilityChange, currentArtworkSource }) => {
  const [ShowDailog, setShowDailog] = useState(false);
  const [Lyric, setLyric] = useState(null);
  const [Loading, setLoading] = useState(false);
  const { currentPlaylistData } = useContext(Context);

  useEffect(() => {
    if (onLyricsVisibilityChange) {
      onLyricsVisibilityChange(ShowDailog);
    }
  }, [ShowDailog, onLyricsVisibilityChange]);

  const fetchLyrics = async () => {
    if (!currentPlayingTrack?.id) { // Ensure there's a track to fetch lyrics for
      setLyric({ plain: "No song selected." });
      setShowDailog(true);
      return;
    }
    setShowDailog(true);
    setLoading(true);
    setLyric(null);

    try {
      if (!currentPlayingTrack?.title || !currentPlayingTrack?.artist) {
        setLyric({ plain: "No song playing or missing track information. Please play a song first." });
        setLoading(false);
        return;
      }

      if (isOffline) {
        setLyric({ plain: "You are offline. Lyrics are not available in offline mode." });
        setLoading(false);
        return;
      }

      let titleForAPI = null;
      let artistForAPI = null;
      let usedContextData = false;

      if (
        currentPlaylistData &&
        currentPlaylistData.length > 0 &&
        Index >= 0 &&
        Index < currentPlaylistData.length &&
        currentPlayingTrack &&
        currentPlaylistData[Index] &&
        currentPlaylistData[Index].id === currentPlayingTrack.id
      ) {
        const trackFromPlaylist = currentPlaylistData[Index];
        if (trackFromPlaylist.title && trackFromPlaylist.artist) {
          titleForAPI = trackFromPlaylist.title;
          artistForAPI = trackFromPlaylist.artist;
          usedContextData = true;
          // console.log(`LyricsHandler: Using title/artist from currentPlaylistData[${Index}]`);
        }
      }

      if (!titleForAPI && currentPlayingTrack?.title) {
        titleForAPI = currentPlayingTrack.title;
      }
      if (!artistForAPI && currentPlayingTrack?.artist) {
        artistForAPI = currentPlayingTrack.artist;
      }

      if (!usedContextData) {
        if (titleForAPI && titleForAPI.endsWith("...")) {
          titleForAPI = titleForAPI.substring(0, titleForAPI.length - 3).trim();
        }
        if (artistForAPI && artistForAPI.endsWith("...")) {
          artistForAPI = artistForAPI.substring(0, artistForAPI.length - 3).trim();
        }
        if (artistForAPI && artistForAPI.includes(',')) {
          artistForAPI = artistForAPI.split(',')[0].trim();
        }
      }

      if (!titleForAPI || !artistForAPI) {
        setLyric({ plain: "Missing track information for API call." });
        setLoading(false);
        return;
      }

      const trackName = encodeURIComponent(titleForAPI);
      const artistName = encodeURIComponent(artistForAPI);
      
      // Construct the full API URL. Assuming lrclib.net structure.
      // This was: `https://lrclib.net/api/search?artist_name=${artistName}&track_name=${trackName}`
      // The getLyricsSongData function might encapsulate this, or expect parts.
      const apiUrl = `https://lrclib.net/api/search?artist_name=${artistName}&track_name=${trackName}`;
      // console.log(`LyricsHandler: Fetching lyrics from: ${apiUrl}`);
      const apiResponse = await fetch(apiUrl);

      if (!apiResponse.ok) {
        let errorMessage = `Failed to fetch lyrics. Status: ${apiResponse.status}`;
        if (apiResponse.status === 404) {
          errorMessage = "No Lyrics Found\nSorry, we couldn't find lyrics for this song.";
        } else {
          try {
            const errorData = await apiResponse.json();
            errorMessage = errorData.message || `Service Error (${apiResponse.status})\nPlease try again later.`;
          } catch (e) {
            errorMessage = `Service Error (${apiResponse.status})\nPlease try again later.`;
          }
        }
        setLyric({ plain: errorMessage });
        console.error('LyricsHandler: Lyrics fetch error:', errorMessage);
        setLoading(false);
        return;
      }

      const results = await apiResponse.json();

      if (results && results.length > 0) {
        const firstMatch = results[0];
        // console.log('LyricsHandler: Lyrics API Response:', firstMatch);
        if (firstMatch.syncedLyrics) {
          setLyric({ synced: firstMatch.syncedLyrics, plain: firstMatch.plainLyrics });
        } else if (firstMatch.plainLyrics) {
          setLyric({ plain: firstMatch.plainLyrics });
        } else {
          setLyric({ plain: "No Lyrics Found\nLyrics data is empty for this song." });
        }
      } else {
        setLyric({ plain: "No Lyrics Found\nSorry, we couldn't find lyrics for this song." });
      }
    } catch (error) {
      console.error("Error fetching lyrics in LyricsHandler:", error);
      setLyric({ plain: "Could not fetch lyrics. Please try again." });
    } finally {
      setLoading(false);
    }
  };

  // Effect to clear lyrics when track changes if dialog is not open, to prevent stale lyrics briefly showing
  useEffect(() => {
    if (!ShowDailog) {
      setLyric(null);
    }
  }, [currentPlayingTrack?.id, ShowDailog]);

  return (
    <>
      <GetLyricsButton onPress={fetchLyrics} />
      <ShowLyrics
        ShowDailog={ShowDailog}
        Loading={Loading}
        Lyric={Lyric}
        setShowDailog={setShowDailog}
        currentArtworkSource={currentArtworkSource}
      />
    </>
  );
};
