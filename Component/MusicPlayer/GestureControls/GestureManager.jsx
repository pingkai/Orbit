import React from 'react';
import { View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue } from 'react-native-reanimated';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useThemeContext } from '../../../Context/ThemeContext';

// Import gesture control hooks
import { useVolumeGestureControl, volumeBarContainerStyle } from './VolumeGestureControl';
import { useNavigationGestureControl } from './NavigationGestureControl';
import { useTapToCloseGestureControl } from './TapToCloseGestureControl';

/**
 * GestureManager Component
 * Combines all gesture controls and manages their interactions
 */
export const GestureManager = ({
  children,
  onClose,
  style,
  showVolumeOverlay = true
}) => {
  const { theme, themeMode } = useThemeContext();

  // Initialize gesture control hooks
  const volumeControl = useVolumeGestureControl();
  const navigationControl = useNavigationGestureControl();
  const tapControl = useTapToCloseGestureControl(onClose);

  // Create the volume gesture directly
  const volumeGesture = volumeControl.createVolumeGesture();

  // Create navigation gesture
  const navigationGesture = navigationControl.createStandaloneNavigationGesture();

  // Create tap gesture
  const tapGesture = tapControl.createStandaloneTapGesture();

  // Combine gestures with volume taking priority, then navigation, then tap
  const combinedGestures = Gesture.Exclusive(volumeGesture, navigationGesture, tapGesture);

  return (
    <GestureDetector gesture={combinedGestures}>
      <View style={style}>
        {children}
        
        {/* Volume Overlay */}
        {showVolumeOverlay && (
          <Animated.View style={volumeControl.volumeOverlayStyle}>
            <Ionicons 
              name={volumeControl.getVolumeIconName()} 
              size={24} 
              color={themeMode === 'light' ? theme.colors.text : 'white'} 
              style={{ marginBottom: 10 }} 
            />
            <View style={volumeBarContainerStyle}>
              <Animated.View style={volumeControl.volumeBarFillStyle}>
                <View style={{ 
                  position: 'absolute', 
                  width: '80%', 
                  height: 1, 
                  backgroundColor: themeMode === 'light' ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.3)', 
                  left: '10%', 
                  top: '25%' 
                }} />
                <View style={{ 
                  position: 'absolute', 
                  width: '80%', 
                  height: 1, 
                  backgroundColor: themeMode === 'light' ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.3)', 
                  left: '10%', 
                  top: '50%' 
                }} />
                <View style={{ 
                  position: 'absolute', 
                  width: '80%', 
                  height: 1, 
                  backgroundColor: themeMode === 'light' ? 'rgba(0,0,0,0.2)' : 'rgba(255,255,255,0.3)', 
                  left: '10%', 
                  top: '75%' 
                }} />
              </Animated.View>
            </View>
          </Animated.View>
        )}
      </View>
    </GestureDetector>
  );
};

/**
 * Simplified GestureManager for cases where only specific gestures are needed
 */
export const SimpleGestureManager = ({ 
  children, 
  onClose, 
  style,
  enableVolume = true,
  enableNavigation = true,
  enableTapToClose = true
}) => {
  const volumeControl = enableVolume ? useVolumeGestureControl() : null;
  const navigationControl = enableNavigation ? useNavigationGestureControl() : null;
  const tapControl = enableTapToClose ? useTapToCloseGestureControl(onClose) : null;

  // Build gesture array based on enabled features
  const gestures = [];
  
  if (enableVolume && volumeControl) {
    gestures.push(volumeControl.createVolumeGesture());
  }
  
  if (enableNavigation && navigationControl) {
    gestures.push(navigationControl.createStandaloneNavigationGesture());
  }
  
  if (enableTapToClose && tapControl) {
    gestures.push(tapControl.createStandaloneTapGesture());
  }

  // Combine gestures
  const combinedGestures = gestures.length > 1 
    ? Gesture.Exclusive(...gestures)
    : gestures[0] || Gesture.Tap(); // Fallback to empty tap if no gestures

  return (
    <GestureDetector gesture={combinedGestures}>
      <View style={style}>
        {children}
      </View>
    </GestureDetector>
  );
};

/**
 * Volume-only gesture manager for components that only need volume control
 */
export const VolumeOnlyGestureManager = ({ children, style, showOverlay = true }) => {
  const { theme, themeMode } = useThemeContext();
  const volumeControl = useVolumeGestureControl();
  
  return (
    <GestureDetector gesture={volumeControl.createVolumeGesture()}>
      <View style={style}>
        {children}
        
        {showOverlay && (
          <Animated.View style={volumeControl.volumeOverlayStyle}>
            <Ionicons 
              name={volumeControl.getVolumeIconName()} 
              size={24} 
              color={themeMode === 'light' ? theme.colors.text : 'white'} 
              style={{ marginBottom: 10 }} 
            />
            <View style={volumeBarContainerStyle}>
              <Animated.View style={volumeControl.volumeBarFillStyle} />
            </View>
          </Animated.View>
        )}
      </View>
    </GestureDetector>
  );
};
