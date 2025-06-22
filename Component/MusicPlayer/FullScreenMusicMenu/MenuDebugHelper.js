/**
 * MenuDebugHelper - Utility functions for debugging menu functionality
 * Helps identify issues with song data structure and API responses
 */

export const debugCurrentPlaying = (currentPlaying) => {
  if (!currentPlaying) {
    console.log('🔍 DEBUG: No current playing track');
    return;
  }

  console.log('🔍 DEBUG: Current Playing Track Structure:');
  console.log('📍 Basic Info:', {
    id: currentPlaying.id,
    title: currentPlaying.title,
    artist: currentPlaying.artist,
    duration: currentPlaying.duration,
  });

  console.log('📍 Artist Info:', {
    artistID: currentPlaying.artistID,
    primary_artists_id: currentPlaying.primary_artists_id,
    artist: currentPlaying.artist,
  });

  console.log('📍 Album Info:', {
    album: currentPlaying.album,
    albumId: currentPlaying.albumId,
    album_id: currentPlaying.album_id,
    'album.id': currentPlaying.album?.id,
    'album.name': currentPlaying.album?.name,
  });

  console.log('📍 Source Info:', {
    source: currentPlaying.source,
    sourceType: currentPlaying.sourceType,
    api: currentPlaying.api,
    is_tidal: currentPlaying.is_tidal,
  });

  console.log('📍 Image Info:', {
    artwork: currentPlaying.artwork,
    image: currentPlaying.image,
  });

  console.log('📍 Full Object Keys:', Object.keys(currentPlaying));

  // Check if we have enough data for menu actions
  const hasArtistInfo = !!(currentPlaying.artistID || currentPlaying.primary_artists_id || currentPlaying.artist);
  const hasAlbumInfo = !!(currentPlaying.albumId || currentPlaying.album_id || currentPlaying.album?.id || currentPlaying.album);
  const hasBasicInfo = !!(currentPlaying.id && currentPlaying.title);

  console.log('📊 Menu Readiness:', {
    canNavigateToArtist: hasArtistInfo,
    canNavigateToAlbum: hasAlbumInfo,
    canAddToPlaylist: hasBasicInfo,
    canShowInfo: hasBasicInfo,
    canFindMoreFromArtist: hasArtistInfo,
  });
};

export const debugMenuAction = (actionName, data) => {
  console.log(`🎯 DEBUG: Menu Action - ${actionName}`);
  console.log('📊 Action Data:', data);
};

export const validateSongForPlaylist = (song) => {
  const issues = [];
  
  if (!song) {
    issues.push('Song object is null/undefined');
    return { valid: false, issues };
  }

  if (!song.id) {
    issues.push('Missing song ID');
  }

  if (!song.title) {
    issues.push('Missing song title');
  }

  if (!song.artist) {
    issues.push('Missing song artist');
  }

  const valid = issues.length === 0;
  
  console.log(`✅ Song validation for playlist: ${valid ? 'PASSED' : 'FAILED'}`);
  if (!valid) {
    console.log('❌ Issues found:', issues);
  }

  return { valid, issues };
};

export const validateNavigationData = (type, data) => {
  console.log(`🧭 DEBUG: Navigation validation for ${type}`);
  
  switch (type) {
    case 'artist':
      const artistValid = !!(data.artistId && data.artistName);
      console.log(`Artist navigation: ${artistValid ? 'VALID' : 'INVALID'}`, {
        artistId: data.artistId,
        artistName: data.artistName,
      });
      return artistValid;

    case 'album':
      const albumValid = !!(data.albumId);
      console.log(`Album navigation: ${albumValid ? 'VALID' : 'INVALID'}`, {
        albumId: data.albumId,
        albumName: data.albumName,
      });
      return albumValid;

    default:
      console.log(`Unknown navigation type: ${type}`);
      return false;
  }
};
