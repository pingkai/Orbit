import React from 'react';
import { TouchableOpacity, Text, StyleSheet, View } from 'react-native';
import { useTidalIntegration } from './useTidalIntegration';
import { useThemeManager } from '../ThemeManager/useThemeManager';
import Ionicons from 'react-native-vector-icons/Ionicons';

/**
 * TidalSourceSwitcher - Component for switching between music sources
 * 
 * This component provides UI for switching between Tidal and Saavn sources.
 * It shows the current source and allows users to switch when available.
 */

export const TidalSourceSwitcher = ({ 
  currentTrack,
  style,
  size = 'medium', // 'small', 'medium', 'large'
  variant = 'button', // 'button', 'chip', 'minimal'
  showIcon = false,
  disabled = false,
  onSourceSwitch = null
}) => {
  const { 
    tidalEnabled, 
    shouldShowTidalFeatures,
    getCurrentSource,
    getSourceDisplayName,
    switchSource,
    canSwitchSource
  } = useTidalIntegration();
  
  const { 
    getTextColor, 
    getButtonBackgroundColor, 
    getBorderColor,
    themeMode 
  } = useThemeManager();

  // Don't render if Tidal is not enabled
  if (!tidalEnabled) {
    return null;
  }

  const currentSource = getCurrentSource(currentTrack);
  const displayName = getSourceDisplayName(currentTrack);
  const isEnabled = canSwitchSource() && !disabled;

  const handlePress = () => {
    if (!isEnabled) return;
    
    const newSource = switchSource(currentTrack);
    
    if (onSourceSwitch && newSource) {
      onSourceSwitch({
        from: currentSource,
        to: newSource,
        track: currentTrack
      });
    }
  };

  const getSourceIcon = () => {
    switch (currentSource) {
      case 'tidal':
        return 'musical-notes';
      case 'saavn':
        return 'radio';
      default:
        return 'disc';
    }
  };

  const getButtonSize = () => {
    switch (size) {
      case 'small':
        return { paddingHorizontal: 8, paddingVertical: 4, fontSize: 10 };
      case 'large':
        return { paddingHorizontal: 16, paddingVertical: 8, fontSize: 14 };
      default:
        return { paddingHorizontal: 12, paddingVertical: 6, fontSize: 12 };
    }
  };

  const buttonSize = getButtonSize();

  if (variant === 'minimal') {
    return (
      <TouchableOpacity
        onPress={handlePress}
        style={[styles.minimalButton, style]}
        activeOpacity={isEnabled ? 0.7 : 1}
        disabled={!isEnabled}
      >
        <Text style={[
          styles.minimalText,
          {
            color: isEnabled ? getTextColor('primary') : getTextColor('secondary'),
            fontSize: buttonSize.fontSize
          }
        ]}>
          {displayName}
        </Text>
      </TouchableOpacity>
    );
  }

  if (variant === 'chip') {
    return (
      <TouchableOpacity
        onPress={handlePress}
        style={[
          styles.chipButton,
          {
            backgroundColor: getButtonBackgroundColor(0.15),
            borderColor: getBorderColor(0.3),
            paddingHorizontal: buttonSize.paddingHorizontal,
            paddingVertical: buttonSize.paddingVertical,
            opacity: isEnabled ? 1 : 0.6
          },
          style
        ]}
        activeOpacity={isEnabled ? 0.8 : 1}
        disabled={!isEnabled}
      >
        {showIcon && (
          <Ionicons 
            name={getSourceIcon()} 
            size={buttonSize.fontSize + 2} 
            color={getTextColor('primary')} 
          />
        )}
        <Text style={[
          styles.chipText,
          {
            color: getTextColor('primary'),
            fontSize: buttonSize.fontSize
          }
        ]}>
          {displayName}
        </Text>
      </TouchableOpacity>
    );
  }

  // Default button variant
  return (
    <TouchableOpacity
      onPress={handlePress}
      style={[
        styles.button,
        {
          backgroundColor: getButtonBackgroundColor(0.1),
          borderColor: getBorderColor(0.2),
          paddingHorizontal: buttonSize.paddingHorizontal,
          paddingVertical: buttonSize.paddingVertical,
          opacity: isEnabled ? 1 : 0.6
        },
        style
      ]}
      activeOpacity={isEnabled ? 0.8 : 1}
      disabled={!isEnabled}
    >
      {showIcon && (
        <Ionicons 
          name={getSourceIcon()} 
          size={buttonSize.fontSize + 4} 
          color={getTextColor('primary')} 
        />
      )}
      <Text style={[
        styles.buttonText,
        {
          color: getTextColor('primary'),
          fontSize: buttonSize.fontSize
        }
      ]}>
        {displayName}
      </Text>
      {isEnabled && (
        <Ionicons 
          name="swap-horizontal" 
          size={buttonSize.fontSize} 
          color={getTextColor('secondary')} 
        />
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 15,
    borderWidth: 1,
    gap: 6,
  },
  buttonText: {
    fontWeight: '500',
    flex: 1,
  },
  chipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    borderWidth: 1,
    gap: 4,
  },
  chipText: {
    fontWeight: '500',
  },
  minimalButton: {
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  minimalText: {
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
});
