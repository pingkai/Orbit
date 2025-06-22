import React, { memo, useMemo } from 'react';
import { View, Pressable, Dimensions } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useThemeContext } from '../../Context/ThemeContext';
import { PlainText } from './PlainText';
import { SmallText } from './SmallText';
import FastImage from 'react-native-fast-image';
import { truncateText } from '../../Utils/FormatTitleAndArtist';
import FontAwesome5 from 'react-native-vector-icons/FontAwesome5';

export const EachArtistCardGrid = memo(function EachArtistCardGrid({
  id, 
  name, 
  role, 
  image, 
  followerCount,
  mainContainerStyle,
  source,
  searchText
}) {
  const navigation = useNavigation();
  const { theme } = useThemeContext();
  const { width } = Dimensions.get('window');
  
  // Calculate responsive dimensions based on screen size
  const responsiveStyles = useMemo(() => {
    // Base width is ~47% of screen width for better spacing
    const cardWidth = Math.max(170, width * 0.47);
    // Compact height for better layout
    const cardHeight = cardWidth + 70;

    return {
      container: {
        width: cardWidth,
        height: cardHeight,
        borderRadius: 12,
        marginHorizontal: 3,
        marginVertical: 6,
      },
      image: {
        height: cardWidth - 24,
        width: cardWidth - 24,
        borderRadius: 10, // Square with rounded corners
        margin: 12,
      },
      textContainer: {
        paddingHorizontal: 12,
        paddingBottom: 12,
        height: 50,
        justifyContent: 'center',
      }
    };
  }, [width]);

  const handlePress = () => {
    try {
      // Navigate using nested navigation structure
      navigation.navigate("MainRoute", {
        screen: 'Home',
        params: {
          screen: 'ArtistPage',
          params: {
            artistId: id,
            artistName: name,
            source: source,
            searchText: searchText
          }
        }
      });
    } catch (error) {
      console.error('Error navigating to Artist:', error);
      // Fallback navigation to prevent dead-end
      navigation.navigate("MainRoute", {
        screen: 'Home',
        params: { screen: "HomePage" }
      });
    }
  };

  // Add validation for empty image URLs
  const imageSource = image && image !== "" 
    ? { uri: image } 
    : require('../../Images/default.jpg');

  // Format follower count for display
  const formatFollowerCount = (count) => {
    if (!count || count === 0) return 'Artist';
    if (count >= 1000000) {
      return `${(count / 1000000).toFixed(1)}M followers`;
    } else if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}K followers`;
    } else {
      return `${count} followers`;
    }
  };

  return (
    <Pressable
      onPress={handlePress}
      style={{
        ...(mainContainerStyle || {}),
        ...responsiveStyles.container,
        backgroundColor: theme.colors.card,
        elevation: 3,
        shadowColor: "#000",
        shadowOffset: {
          width: 0,
          height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
      }}
    >
      {/* Artist Image */}
      <View style={{
        position: 'relative',
      }}>
        <FastImage
          source={imageSource}
          style={{
            ...responsiveStyles.image,
            // Square image with rounded corners (not circular)
          }}
          resizeMode={FastImage.resizeMode.cover}
        />

        {/* Play button overlay */}
        <View style={{
          position: 'absolute',
          bottom: 18,
          right: 18,
          backgroundColor: theme.colors.primary,
          borderRadius: 20,
          width: 32,
          height: 32,
          justifyContent: 'center',
          alignItems: 'center',
          elevation: 2,
          shadowColor: "#000",
          shadowOffset: {
            width: 0,
            height: 1,
          },
          shadowOpacity: 0.22,
          shadowRadius: 2.22,
        }}>
          <FontAwesome5
            name="play"
            size={12}
            color="white"
            style={{ marginLeft: 2 }} // Slight offset for visual centering
          />
        </View>
      </View>

      {/* Artist Info */}
      <View style={responsiveStyles.textContainer}>
        <PlainText
          text={truncateText(name, 18)}
          style={{
            color: theme.colors.text,
            fontSize: 15,
            fontWeight: '600',
            textAlign: 'left',
            marginBottom: 2,
          }}
          numberOfLines={1}
        />
        <SmallText
          text={formatFollowerCount(followerCount) || role || 'Artist'}
          style={{
            color: theme.colors.textSecondary || theme.colors.text,
            opacity: 0.8,
            fontSize: 12,
            textAlign: 'left',
          }}
          numberOfLines={1}
        />
      </View>
    </Pressable>
  );
});
