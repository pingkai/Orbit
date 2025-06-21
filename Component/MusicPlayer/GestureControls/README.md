# Gesture Controls

This directory contains modular, reusable gesture control components extracted from the FullScreenMusic component. The gesture controls follow a monolithic approach with code split into manageable, readable, and modular parts while maintaining exact UI consistency and optimizing for readability, reusability, and performance.

## Components Overview

### 1. VolumeGestureControl.jsx
**Purpose**: Handles vertical pan gestures for volume adjustment

**Features**:
- Vertical pan gesture detection
- Real-time volume adjustment with TrackPlayer and VolumeManager
- Volume overlay UI with animated volume bar
- Smooth volume transitions with debouncing
- Visual feedback with volume icons and progress bar

**Usage**:
```jsx
import { useVolumeGestureControl, volumeBarContainerStyle } from './VolumeGestureControl';

const MyComponent = () => {
  const volumeControl = useVolumeGestureControl();
  
  return (
    <GestureDetector gesture={volumeControl.createVolumeGesture()}>
      <View>
        {/* Your content */}
        <Animated.View style={volumeControl.volumeOverlayStyle}>
          {/* Volume overlay UI */}
        </Animated.View>
      </View>
    </GestureDetector>
  );
};
```

### 2. NavigationGestureControl.jsx
**Purpose**: Handles horizontal swipe gestures for song navigation

**Features**:
- Horizontal swipe detection (left/right)
- Next/Previous song navigation
- Velocity and translation-based gesture recognition
- Configurable sensitivity thresholds
- Standalone and integrated gesture modes

**Usage**:
```jsx
import { useNavigationGestureControl } from './NavigationGestureControl';

const MyComponent = () => {
  const navigationControl = useNavigationGestureControl();
  
  return (
    <GestureDetector gesture={navigationControl.createStandaloneNavigationGesture()}>
      <View>
        {/* Your content */}
      </View>
    </GestureDetector>
  );
};
```

### 3. TapToCloseGestureControl.jsx
**Purpose**: Handles tap gestures to close the fullscreen player

**Features**:
- Simple tap gesture detection
- Conditional tap handling (prevents interference with other gestures)
- Debounced tap support
- Customizable validation logic
- Multiple tap gesture variants

**Usage**:
```jsx
import { useTapToCloseGestureControl } from './TapToCloseGestureControl';

const MyComponent = ({ onClose }) => {
  const tapControl = useTapToCloseGestureControl(onClose);
  
  return (
    <GestureDetector gesture={tapControl.createStandaloneTapGesture()}>
      <View>
        {/* Your content */}
      </View>
    </GestureDetector>
  );
};
```

### 4. GestureManager.jsx
**Purpose**: Combines all gesture controls and manages their interactions

**Components**:
- `GestureManager`: Full-featured gesture manager with all controls
- `SimpleGestureManager`: Configurable gesture manager for specific needs
- `VolumeOnlyGestureManager`: Volume-only gesture control

**Usage**:
```jsx
import { GestureManager } from './GestureManager';

const MyComponent = ({ onClose }) => {
  return (
    <GestureManager onClose={onClose} showVolumeOverlay={true}>
      <YourContent />
    </GestureManager>
  );
};
```

## Gesture Interactions

### Priority System
The gesture system uses `Gesture.Exclusive()` to manage gesture priorities:

1. **Volume Control** (Highest Priority)
   - Vertical pan gestures
   - Takes precedence over navigation and tap

2. **Navigation Control** (Medium Priority)
   - Horizontal swipe gestures
   - Only triggers when volume gesture is not active

3. **Tap-to-Close** (Lowest Priority)
   - Simple tap gestures
   - Only triggers when no other gestures are active

### Gesture Recognition Thresholds

**Volume Control**:
- Sensitivity: 1.0 multiplier
- Height mapping: 180px total range
- Update throttling: 33ms intervals
- Minimum change: 0.001 volume units

**Navigation Control**:
- Horizontal dominance: velocityX > velocityY * 1.2
- Minimum translation: 25px
- Velocity thresholds: ±120 (with translation) or ±200 (standalone)
- Translation thresholds: ±20 (with velocity) or ±35 (standalone)

**Tap Control**:
- Simple tap detection
- Conditional validation to prevent interference
- Optional debouncing (default: 300ms)

## Integration with FullScreenMusic

The gesture controls have been integrated into the FullScreenMusic component:

```jsx
// Before (monolithic approach)
const pan = Gesture.Pan().onBegin(...).onUpdate(...).onFinalize(...);
const tap = Gesture.Tap().onEnd(...);
const combinedGestures = Gesture.Exclusive(pan, tap);

// After (modular approach)
import { GestureManager } from './GestureControls';

<GestureManager onClose={handlePlayerClose}>
  <FastImage source={artwork} />
</GestureManager>
```

## Benefits of Modular Approach

1. **Readability**: Each gesture type is in its own file with clear responsibilities
2. **Reusability**: Components can be used in other parts of the app
3. **Maintainability**: Easier to debug and modify individual gesture behaviors
4. **Testability**: Each component can be tested independently
5. **Performance**: Optimized gesture handling with proper debouncing and throttling
6. **Modularity**: Mix and match gesture controls as needed

## Testing

Use the `GestureTest` component for development and testing:

```jsx
import { GestureTest } from './GestureControls';

// Add to your development screens for testing
<GestureTest />
```

## Performance Considerations

- Volume updates are throttled to prevent excessive system calls
- Gesture state is managed with shared values for optimal performance
- Animations use `withTiming` for smooth transitions
- Event listeners are properly cleaned up to prevent memory leaks

## Future Enhancements

- Add haptic feedback for gesture recognition
- Implement gesture customization settings
- Add gesture recording/playback for testing
- Support for additional gesture types (pinch, rotate, etc.)
- Gesture analytics and usage tracking
