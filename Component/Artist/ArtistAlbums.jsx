import React from 'react';
import { View, Pressable, Dimensions } from 'react-native';
import { useTheme } from '@react-navigation/native';
import FastImage from 'react-native-fast-image';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Heading } from '../Global/Heading';
import { SmallText } from '../Global/SmallText';
import { PlainText } from '../Global/PlainText';
import { getValidImageUrl, safeString } from '../../Utils/ArtistUtils';

const { width: screenWidth } = Dimensions.get('window');

/**
 * AlbumCard component - renders individual album card
 * @param {object} props - Component props
 * @param {object} props.album - Album object
 * @param {function} props.onPress - Function to call when album is pressed
 * @returns {JSX.Element} - AlbumCard component
 */
const AlbumCard = ({ album, onPress }) => {
  const theme = useTheme();

  return (
    <Pressable
      onPress={() => onPress(album)}
      style={{
        width: (screenWidth - 60) / 2, // Two columns with proper spacing
        marginBottom: 15,
        marginHorizontal: 5,
      }}
    >
      <View style={{
        backgroundColor: 'transparent',
        borderRadius: 10,
        overflow: 'hidden',
      }}>
        <FastImage
          source={{ uri: getValidImageUrl(album.image) }}
          style={{
            width: '100%',
            height: (screenWidth - 60) / 2, // Square aspect ratio
            borderRadius: 10,
            marginBottom: 8,
          }}
          resizeMode={FastImage.resizeMode.cover}
        />
        <View style={{
          paddingHorizontal: 5,
        }}>
          <PlainText
            text={safeString(album.name, 'Unknown Album')}
            numberOfLine={2}
            style={{
              color: theme.colors.text,
              fontSize: 14,
              fontWeight: 'bold',
              marginBottom: 2,
            }}
          />
          <SmallText
            text={safeString(`${album.year || 'Unknown'} • ${album.songCount || 0} songs`)}
            style={{
              color: theme.colors.text,
              opacity: 0.8,
              fontSize: 12,
            }}
            maxLine={1}
          />
        </View>
      </View>
    </Pressable>
  );
};

/**
 * ArtistAlbums component - displays artist albums in grid layout
 * @param {object} props - Component props
 * @param {object} props.artistAlbums - Artist albums data
 * @param {function} props.onAlbumPress - Function to call when album is pressed
 * @returns {JSX.Element} - ArtistAlbums component
 */
const ArtistAlbums = ({ artistAlbums, onAlbumPress }) => {
  const theme = useTheme();

  if (!artistAlbums?.data?.albums?.length) {
    return (
      <View style={{ padding: 40, alignItems: 'center' }}>
        <Ionicons name="albums-outline" size={48} color={theme.colors.text} style={{ opacity: 0.3, marginBottom: 16 }} />
        <PlainText text="No albums available" style={{ color: theme.colors.text, opacity: 0.6, fontSize: 16 }} />
      </View>
    );
  }

  return (
    <View style={{ paddingHorizontal: 20 }}>
      <View style={{ 
        flexDirection: 'row', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: 15 
      }}>
        <Heading text="Albums" style={{ color: theme.colors.text, fontSize: 20 }} />
        <SmallText
          text={safeString(`${artistAlbums?.data?.total || 0} albums`)}
          style={{ color: theme.colors.text, opacity: 0.6 }}
        />
      </View>
      
      <View style={{
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        marginHorizontal: -5, // Negative margin to offset card margins
      }}>
        {artistAlbums.data.albums.slice(0, 20).map((album) => (
          <AlbumCard
            key={album.id}
            album={album}
            onPress={onAlbumPress}
          />
        ))}
      </View>
    </View>
  );
};

export default ArtistAlbums;
