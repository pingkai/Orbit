import React from 'react';
import { View, TouchableOpacity, ScrollView } from 'react-native';
import { useTheme, useNavigation } from '@react-navigation/native';
import { SmallText } from '../Global/SmallText';
import MaterialIcons from 'react-native-vector-icons/MaterialIcons';
import navigationBreadcrumbs from '../../Utils/NavigationBreadcrumbs';

/**
 * BreadcrumbDisplay - Shows the current navigation path as breadcrumbs
 * Allows users to see where they are and navigate back to previous screens
 */
export const BreadcrumbDisplay = ({ 
  style,
  showHomeIcon = true,
  maxBreadcrumbs = 4,
  onBreadcrumbPress = null 
}) => {
  const theme = useTheme();
  const breadcrumbs = navigationBreadcrumbs.getBreadcrumbs();

  // Don't show if there are no breadcrumbs or only one
  if (breadcrumbs.length <= 1) {
    return null;
  }

  // Limit the number of breadcrumbs shown
  const visibleBreadcrumbs = breadcrumbs.slice(-maxBreadcrumbs);
  const hasMoreBreadcrumbs = breadcrumbs.length > maxBreadcrumbs;

  const handleBreadcrumbPress = (breadcrumb, index) => {
    if (onBreadcrumbPress) {
      onBreadcrumbPress(breadcrumb, index);
    } else {
      // Default behavior: navigate back to that breadcrumb
      // This would require implementing navigation to specific breadcrumb
      console.log('Navigate to breadcrumb:', breadcrumb.displayName);
    }
  };

  return (
    <View style={[{
      paddingHorizontal: 16,
      paddingVertical: 8,
      backgroundColor: theme.colors.card,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    }, style]}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ alignItems: 'center' }}
      >
        {showHomeIcon && (
          <>
            <TouchableOpacity
              onPress={() => handleBreadcrumbPress({ screenName: 'Home', displayName: 'Home' }, -1)}
              style={{ marginRight: 8 }}
            >
              <MaterialIcons 
                name="home" 
                size={16} 
                color={theme.colors.text} 
                style={{ opacity: 0.7 }}
              />
            </TouchableOpacity>
            <MaterialIcons 
              name="chevron-right" 
              size={14} 
              color={theme.colors.text} 
              style={{ opacity: 0.5, marginRight: 8 }}
            />
          </>
        )}

        {hasMoreBreadcrumbs && (
          <>
            <SmallText 
              text="..." 
              style={{ 
                color: theme.colors.text, 
                opacity: 0.5,
                marginRight: 8 
              }} 
            />
            <MaterialIcons 
              name="chevron-right" 
              size={14} 
              color={theme.colors.text} 
              style={{ opacity: 0.5, marginRight: 8 }}
            />
          </>
        )}

        {visibleBreadcrumbs.map((breadcrumb, index) => (
          <View key={breadcrumb.id} style={{ flexDirection: 'row', alignItems: 'center' }}>
            <TouchableOpacity
              onPress={() => handleBreadcrumbPress(breadcrumb, index)}
              style={{ 
                paddingHorizontal: 4,
                paddingVertical: 2,
                borderRadius: 4,
                backgroundColor: index === visibleBreadcrumbs.length - 1 
                  ? theme.colors.primary + '20' 
                  : 'transparent'
              }}
            >
              <SmallText 
                text={breadcrumb.displayName} 
                style={{ 
                  color: index === visibleBreadcrumbs.length - 1 
                    ? theme.colors.primary 
                    : theme.colors.text,
                  opacity: index === visibleBreadcrumbs.length - 1 ? 1 : 0.7,
                  fontWeight: index === visibleBreadcrumbs.length - 1 ? 'bold' : 'normal'
                }} 
                numberOfLines={1}
              />
            </TouchableOpacity>
            
            {index < visibleBreadcrumbs.length - 1 && (
              <MaterialIcons 
                name="chevron-right" 
                size={14} 
                color={theme.colors.text} 
                style={{ opacity: 0.5, marginHorizontal: 8 }}
              />
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
};

/**
 * SimpleBreadcrumbDisplay - A minimal breadcrumb display for tight spaces
 */
export const SimpleBreadcrumbDisplay = ({ style }) => {
  const theme = useTheme();
  const navigation = useNavigation();
  const breadcrumbs = navigationBreadcrumbs.getBreadcrumbs();

  if (breadcrumbs.length <= 1) {
    return null;
  }

  const currentBreadcrumb = breadcrumbs[breadcrumbs.length - 1];
  const previousBreadcrumb = breadcrumbs[breadcrumbs.length - 2];

  const handleBackPress = () => {
    try {
      navigationBreadcrumbs.navigateBack(navigation);
    } catch (error) {
      console.error('SimpleBreadcrumbDisplay: Error navigating back:', error);
    }
  };

  return (
    <View style={[{
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: 16,
      paddingVertical: 8,
      backgroundColor: theme.colors.card,
      borderBottomWidth: 1,
      borderBottomColor: theme.colors.border,
    }, style]}>
      <TouchableOpacity
        onPress={handleBackPress}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: 4,
          paddingHorizontal: 8,
          borderRadius: 4,
          backgroundColor: theme.colors.background
        }}
      >
        <MaterialIcons
          name="arrow-back"
          size={16}
          color={theme.colors.text}
          style={{ opacity: 0.7, marginRight: 4 }}
        />
        <SmallText
          text={previousBreadcrumb?.displayName || 'Back'}
          style={{
            color: theme.colors.text,
            opacity: 0.7
          }}
          numberOfLines={1}
        />
      </TouchableOpacity>

      <MaterialIcons
        name="chevron-right"
        size={14}
        color={theme.colors.text}
        style={{ opacity: 0.5, marginHorizontal: 8 }}
      />

      <SmallText
        text={currentBreadcrumb?.displayName || 'Current'}
        style={{
          color: theme.colors.primary,
          fontWeight: 'bold',
          flex: 1
        }}
        numberOfLines={1}
      />
    </View>
  );
};

export default BreadcrumbDisplay;
