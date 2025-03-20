import React from 'react';
import { View, Text, Pressable, Image } from 'react-native';
import FastImage from 'react-native-fast-image';
import { useActiveTrack } from 'react-native-track-player';
import { PlayPauseButton } from './PlayPauseButton';
import { NextSongButton } from './NextSongButton';
// Add other imports as needed

export const CollapsePlayer = ({ setIndex }) => {
  const currentPlaying = useActiveTrack();
  const isLocal = currentPlaying?.isLocal;
  
  // Handler for clicking on the player
  const handlePress = () => {
    setIndex(1);
  };

  // If no song is playing, don't show the player
  if (!currentPlaying) return null;

  return (
    <Pressable onPress={handlePress} style={styles.container}>
      {/* Show b.gif when playing local music */}
      {isLocal ? (
        <Image
          source={require('../../Images/b.gif')}
          style={styles.artwork}
        />
      ) : (
        <FastImage
          source={{ uri: currentPlaying.artwork }}
          style={styles.artwork}
        />
      )}
      
      <View style={styles.songInfo}>
        <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">
          {currentPlaying.title}
        </Text>
        <Text style={styles.artist} numberOfLines={1} ellipsizeMode="tail">
          {currentPlaying.artist}
        </Text>
      </View>
      
      <View style={styles.controls}>
        <PlayPauseButton isFullScreen={false} />
        <NextSongButton size={24} />
      </View>
    </Pressable>
  );
};

const styles = {
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(20, 20, 20, 0.9)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    padding: 10,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  artwork: {
    width: 50,
    height: 50,
    borderRadius: 4,
    marginRight: 10,
  },
  songInfo: {
    flex: 1,
  },
  title: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  artist: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 14,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
  },
}; 