import TrackPlayer from "react-native-track-player";
import { setRepeatMode } from "react-native-track-player/lib/trackPlayer";
import { GetPlaybackQuality } from "./LocalStorage/AppSettings";
import NetInfo from "@react-native-community/netinfo";

let isPlayerInitialized = false;

export const setupPlayer = async () => {
  try {
    if (!isPlayerInitialized) {
      await TrackPlayer.setupPlayer({
        android: {
          appKilledPlaybackBehavior: 'StopPlaybackAndRemoveNotification'
        },
        autoHandleInterruptions: true
      });
      
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
    }
  } catch (error) {
    console.log('Error setting up player:', error);
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
  await TrackPlayer.skipToNext();
  PlaySong()
}

async function PlayPreviousSong(){
  await TrackPlayer.skipToPrevious();
  PlaySong()
}
async function SkipToTrack(trackIndex){
  await TrackPlayer.skip(trackIndex);
  await PlaySong()
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

export {PlayOneSong, PlaySong, PauseSong, SetProgressSong, PlayNextSong, AddPlaylist, PlayPreviousSong, AddSongsToQueue, SkipToTrack,SetRepeatMode, getIndexQuality}
