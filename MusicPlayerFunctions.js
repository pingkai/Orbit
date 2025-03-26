import TrackPlayer from "react-native-track-player";
import { setRepeatMode } from "react-native-track-player/lib/trackPlayer";
import { GetPlaybackQuality } from "./LocalStorage/AppSettings";
import NetInfo from "@react-native-community/netinfo";
import { ToastAndroid } from "react-native";

let isPlayerInitialized = false;

export const setupPlayer = async () => {
  try {
    if (!isPlayerInitialized) {
      try {
        await TrackPlayer.setupPlayer({
          android: {
            appKilledPlaybackBehavior: 'StopPlaybackAndRemoveNotification'
          },
          autoHandleInterruptions: true
        });
        console.log('Player initialized successfully in MusicPlayerFunctions');
        
        // Add event listeners
        TrackPlayer.addEventListener('remote-play', () => TrackPlayer.play());
        TrackPlayer.addEventListener('remote-pause', () => TrackPlayer.pause());
        TrackPlayer.addEventListener('remote-stop', () => TrackPlayer.destroy());
        TrackPlayer.addEventListener('remote-next', () => PlayNextSong());
        TrackPlayer.addEventListener('remote-previous', () => PlayPreviousSong());
        await TrackPlayer.updateOptions({
          android: {
            appKilledPlaybackBehavior: 'StopPlaybackAndRemoveNotification'
          },
          capabilities: [
            'play',
            'pause',
            'stop',
            'seekTo',
            'skip',
            'skipToNext',
            'skipToPrevious',
          ],
          compactCapabilities: [
            'play',
            'pause',
            'stop',
            'seekTo',
            'skip',
            'skipToNext',
            'skipToPrevious',
          ],
          notificationCapabilities: [
            'play',
            'pause',
            'stop',
            'seekTo',
            'skip',
            'skipToNext',
            'skipToPrevious',
          ]
        });
        
        isPlayerInitialized = true;
      } catch (setupError) {
        // Check if the error is about player already being initialized
        if (setupError.message && setupError.message.includes('player has already been initialized')) {
          console.log('Player already initialized in MusicPlayerFunctions');
          isPlayerInitialized = true;
        } else {
          console.error('Error setting up player in MusicPlayerFunctions:', setupError);
          throw setupError;
        }
      }
    } else {
      console.log('Player already initialized, skipping setup in MusicPlayerFunctions');
    }
  } catch (error) {
    console.error('Error in setupPlayer function:', error);
  }
};

async function PlayOneSong(song) {
  try {
    // Check if the song is a local file (has a path or isLocalMusic property)
    const isLocalFile = song.isLocalMusic || song.path || song.url?.startsWith('file://');
    
    // If it's a local file, make sure the URL starts with file://
    if (isLocalFile && !song.url?.startsWith('file://') && song.path) {
      song.url = `file://${song.path}`;
    }
    
    // Check network availability for non-local files
    if (!isLocalFile) {
      const netInfo = await NetInfo.fetch();
      if (!netInfo.isConnected) {
        console.log('Cannot play online song while offline');
        // Return early or try to play a cached version
        return;
      }
    }
    
    await TrackPlayer.reset();
    await TrackPlayer.add([song]);
    await TrackPlayer.play();
  } catch (error) {
    console.error('Error playing song:', error);
  }
}

async function AddPlaylist (songs){
  await  TrackPlayer.reset()
  await TrackPlayer.add(songs);
  await TrackPlayer.play();
}

async function AddSongsToQueue(songs){
  await TrackPlayer.add(songs);
}
async function PlaySong(){
  await TrackPlayer.play();
}
async function PauseSong(){
  await TrackPlayer.pause();
}

async function SetProgressSong(value){
  await TrackPlayer.seekTo(value);
}

async function PlayNextSong(){
  try {
    // Get current track and queue info
    const currentTrack = await TrackPlayer.getCurrentTrack();
    const queue = await TrackPlayer.getQueue();
    const playerState = await TrackPlayer.getState();
    
    console.log('PlayNextSong called - Current track:', currentTrack, 'Queue length:', queue.length, 'Player state:', playerState);
    
    // If there's no next track, just return
    if (currentTrack >= queue.length - 1) {
      console.log('No next track available');
      return;
    }
    
    // Skip to next track and ensure it plays
    await TrackPlayer.skipToNext();
    
    // Short delay to allow track to change
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Check player state and play if not already playing
    const stateAfterSkip = await TrackPlayer.getState();
    console.log('Player state after skip:', stateAfterSkip);
    
    if (stateAfterSkip !== TrackPlayer.STATE_PLAYING) {
      try {
        await TrackPlayer.play();
        console.log('Play command issued after skip');
      } catch (playError) {
        console.error('Error playing after skip:', playError);
      }
    }
  } catch (error) {
    console.error('Error in PlayNextSong:', error);
  }
}

async function PlayPreviousSong(){
  await TrackPlayer.skipToPrevious();
  PlaySong()
}
async function SkipToTrack(trackIndex){
  try {
    // Ensure trackIndex is a valid number
    const validIndex = Number(trackIndex);
    if (isNaN(validIndex)) {
      console.error('Invalid trackIndex provided to SkipToTrack:', trackIndex);
      return;
    }
    
    // Get the queue to verify index is within bounds
    const queue = await TrackPlayer.getQueue();
    if (validIndex < 0 || validIndex >= queue.length) {
      console.error('Track index out of bounds:', validIndex, 'Queue length:', queue.length);
      return;
    }
    
    await TrackPlayer.skip(validIndex);
    await PlaySong();
  } catch (error) {
    console.error('Error in SkipToTrack:', error);
  }
}
async function SetRepeatMode(mode){
  await setRepeatMode(mode)
}

async function getIndexQuality(){
  const PlaybackQuality = [
    { value: '12kbps' },
    { value: '48kbps' },
    { value: '96kbps' },
    { value: '160kbps' },
    { value: '320kbps' },
  ];
  const data = await GetPlaybackQuality()
  let index = 4
  PlaybackQuality.map((e, i)=>{
    if (e.value === data){
      index = i
    }
  })
  return index
}

async function AddOneSongToPlaylist(song) {
  try {
    // Direct import to avoid circular dependency issues
    const { showPlaylistSelector } = require('./Utils/PlaylistManager');
    
    // Validate song object
    if (!song || !song.id) {
      console.error('Invalid song object provided to AddOneSongToPlaylist');
      ToastAndroid.show('Invalid song data', ToastAndroid.SHORT);
      return false;
    }
    
    console.log('AddOneSongToPlaylist called with song:', song.title);
    
    // Format song object for playlist compatibility if needed
    const formattedSong = {
      id: song.id,
      title: song.title || 'Unknown Title',
      artist: song.artist || 'Unknown Artist',
      artwork: song.artwork || song.image || null,
      url: song.url || '',
      duration: song.duration || 0,
      language: song.language || '',
      artistID: song.artistID || song.primary_artists_id || '',
    };
    
    // Use the PlaylistManager function to show the playlist selector
    const result = await showPlaylistSelector(formattedSong);
    return result;
  } catch (error) {
    console.error('Error showing playlist selector:', error);
    ToastAndroid.show('Error opening playlist selector', ToastAndroid.SHORT);
    return false;
  }
}

export {
  PlayOneSong, 
  PlaySong, 
  PauseSong, 
  SetProgressSong, 
  PlayNextSong, 
  AddPlaylist, 
  PlayPreviousSong, 
  AddSongsToQueue, 
  SkipToTrack,
  SetRepeatMode, 
  getIndexQuality,
  AddOneSongToPlaylist
}
