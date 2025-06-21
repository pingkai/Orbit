# Music Player Components

This folder contains modular, reusable components for the Orbit music app's music player functionality. The components follow a monolithic approach with code split into manageable, readable, modular, and optimized files.

## Overview

The music player has been refactored to extract complex features into separate, manageable components while maintaining exact UI consistency and optimizing for readability, reusability, and performance.

## Extracted Feature Components

### 1. **Theme Management** (`ThemeManager/`)
Handles all theme-related functionality including light/dark mode detection, dynamic styling, and theme-aware color management.

**Key Features:**
- Theme mode detection (light/dark)
- Dynamic styling based on theme
- Theme-aware color management
- Gradient and overlay calculations

**Components:**
- `ThemeManager.jsx` - Context provider
- `useThemeManager.js` - Custom hook
- `ThemeProvider.jsx` - Wrapper component
- `ThemeSelector.jsx` - Theme switching UI

### 2. **Network State Monitoring** (`NetworkMonitor/`)
Manages network state monitoring, offline/online transitions, and network-related UI states.

**Key Features:**
- Real-time network status detection
- Offline/online transition handling
- Network type detection (WiFi, Cellular, etc.)
- Connection quality monitoring
- Error suppression in offline mode

**Components:**
- `NetworkStateMonitor.jsx` - Context provider
- `useNetworkMonitor.js` - Custom hook
- `NetworkStatusIndicator.jsx` - Status display UI
- `ConnectionHandler.jsx` - Connection event handler

### 3. **Tidal Integration** (`TidalIntegration/`)
Handles Tidal music service integration including preferences, source switching, and Tidal-specific functionality.

**Key Features:**
- Tidal preference management
- Source switching between Tidal and Saavn
- Tidal-specific functionality handling
- Integration state management

**Components:**
- `TidalIntegration.jsx` - Context provider
- `useTidalIntegration.js` - Custom hook
- `TidalSourceSwitcher.jsx` - Source switching UI
- `TidalPreferenceManager.jsx` - Preference management UI

### 4. **Queue Management** (`QueueManager/`)
Manages music queue operations including filtering, reordering, and state management.

**Key Features:**
- Queue filtering by source type
- Track reordering and manipulation
- Queue state management
- Offline queue handling

**Components:**
- `QueueManager.jsx` - Context provider
- `useQueueManager.js` - Custom hook
- `QueueOperations.jsx` - Queue operations handler
- `QueueStateManager.jsx` - State management

### 5. **Navigation Handling** (`NavigationHandler/`)
Manages complex navigation logic including screen transitions, back button handling, and navigation state management.

**Key Features:**
- Screen transitions and routing
- Back button handling
- Navigation state management
- Route parameter preservation

**Components:**
- `NavigationHandler.jsx` - Context provider
- `useNavigationHandler.js` - Custom hook
- `BackButtonHandler.jsx` - Back button handling
- `ScreenTransitionManager.jsx` - Transition management

## Integration with FullScreenMusic

The `FullScreenMusic.jsx` component has been refactored to use all the extracted components:

### Before (Monolithic)
```javascript
// Complex theme logic
const backgroundOverlay = themeMode === 'light' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.44)';

// Complex navigation logic
const handlePlayerClose = useCallback(() => {
  // 100+ lines of navigation logic...
}, [navigation, musicPreviousScreen, setIndex]);

// Complex back button handling
useEffect(() => {
  const backAction = () => {
    // 50+ lines of back button logic...
  };
  const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
  return () => backHandler.remove();
}, [Index, setIndex, navigation, musicPreviousScreen]);

// Complex Tidal logic
const [tidalEnabled, setTidalEnabled] = useState(false);
useEffect(() => {
  const loadTidalPreference = async () => {
    // Tidal preference loading logic...
  };
  loadTidalPreference();
}, []);
```

### After (Modular)
```javascript
// Clean, simple component usage
const { getTextColor, getBackgroundOverlay, getGradientColors } = useThemeManager();
const { isOffline } = useOffline();
const { shouldShowTidalFeatures } = useTidalIntegration();
const { handlePlayerClose } = useNavigationHandler({ musicPreviousScreen });

// Wrap with BackButtonHandler
<BackButtonHandler Index={Index} setIndex={setIndex} musicPreviousScreen={musicPreviousScreen}>
  {/* Component content */}
</BackButtonHandler>

// Use TidalSourceSwitcher component
{shouldShowTidalFeatures(isOffline) && (
  <TidalSourceSwitcher currentTrack={currentPlaying} variant="chip" size="small" />
)}
```

## Benefits of Extraction

1. **Separation of Concerns**: Each feature has its own dedicated components
2. **Reusability**: Components can be used across different parts of the app
3. **Maintainability**: Easier to maintain and update individual features
4. **Testability**: Each component can be tested independently
5. **Readability**: Cleaner, more focused code in each component
6. **Performance**: Optimized rendering and state management
7. **Modularity**: Easy to add, remove, or modify features

## Usage Examples

### Theme Management
```javascript
import { useThemeManager } from './ThemeManager';

const MyComponent = () => {
  const { getTextColor, getBackgroundOverlay } = useThemeManager();
  
  return (
    <View style={{ backgroundColor: getBackgroundOverlay() }}>
      <Text style={{ color: getTextColor('primary') }}>Hello World</Text>
    </View>
  );
};
```

### Network Monitoring
```javascript
import { useNetworkMonitor, NetworkStatusIndicator } from './NetworkMonitor';

const MyComponent = () => {
  const { isOffline, canStreamMusic } = useNetworkMonitor();
  
  return (
    <View>
      <NetworkStatusIndicator variant="compact" />
      {canStreamMusic() ? <StreamingContent /> : <OfflineContent />}
    </View>
  );
};
```

### Navigation Handling
```javascript
import { useNavigationHandler, BackButtonHandler } from './NavigationHandler';

const MyComponent = ({ Index, setIndex, musicPreviousScreen }) => {
  const { handlePlayerClose } = useNavigationHandler({ musicPreviousScreen });
  
  return (
    <BackButtonHandler Index={Index} setIndex={setIndex} musicPreviousScreen={musicPreviousScreen}>
      <Button onPress={handlePlayerClose} title="Close Player" />
    </BackButtonHandler>
  );
};
```

## File Structure

```
Component/MusicPlayer/
├── FullScreenMusic.jsx           # Main music player component (refactored)
├── ThemeManager/                 # Theme management components
├── NetworkMonitor/               # Network monitoring components
├── TidalIntegration/             # Tidal integration components
├── QueueManager/                 # Queue management components
├── NavigationHandler/            # Navigation handling components
├── GestureControls/              # Gesture control components (existing)
├── SleepTimer/                   # Sleep timer components (existing)
├── LyricsHandler/                # Lyrics handling components (existing)
└── README.md                     # This documentation
```

## Future Enhancements

The modular structure makes it easy to add new features:

1. **Equalizer Component** - Audio equalization controls
2. **Crossfade Component** - Track crossfading functionality
3. **Visualizer Component** - Audio visualization
4. **Social Sharing Component** - Share currently playing track
5. **Voice Control Component** - Voice commands for music control

Each new feature can be developed as a separate component following the same modular pattern.
