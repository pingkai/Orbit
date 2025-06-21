# Migration Guide: FullScreenMusic Component Refactoring

This guide helps developers understand the changes made to the FullScreenMusic component and how to work with the new modular structure.

## Overview of Changes

The FullScreenMusic component has been refactored to extract complex features into separate, manageable components. This follows a monolithic approach with code split into different files that are manageable, readable, modular, reusable, and optimized.

## What Was Extracted

### 1. Theme Management
**Before:**
```javascript
const { theme, themeMode } = useThemeContext();
const backgroundOverlay = themeMode === 'light' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.44)';
const gradientColors = themeMode === 'light' 
  ? ['rgba(255,255,255,0.80)', 'rgba(255,255,255,0.9)', 'rgba(255,255,255,1)']
  : ['rgba(4,4,4,0.23)', 'rgba(9,9,9,0.47)', 'rgba(0,0,0,0.65)', 'rgba(0,0,0,0.89)', 'rgba(0,0,0,0.9)', 'rgba(0,0,0,1)'];
```

**After:**
```javascript
import { useThemeManager } from './ThemeManager';
const { getTextColor, getBackgroundOverlay, getGradientColors } = useThemeManager();
```

### 2. Network State Monitoring
**Before:**
```javascript
const [isOffline, setIsOffline] = useState(false);
useEffect(() => {
  const checkConnection = async () => {
    const state = await NetInfo.fetch();
    setIsOffline(!state.isConnected);
  };
  // ... more network logic
}, []);
```

**After:**
```javascript
import { useNetworkMonitor } from './NetworkMonitor';
const { isOffline, canStreamMusic } = useNetworkMonitor();
```

### 3. Tidal Integration
**Before:**
```javascript
const [tidalEnabled, setTidalEnabled] = useState(false);
useEffect(() => {
  const loadTidalPreference = async () => {
    const enabled = await GetTidalEnabled();
    setTidalEnabled(enabled);
  };
  loadTidalPreference();
}, []);

// Complex Tidal source switcher JSX
{tidalEnabled && !isOffline && (
  <TouchableOpacity onPress={() => {
    // Complex source switching logic...
  }}>
    <Text>{currentPlaying?.source === 'tidal' ? 'Tidal' : 'Saavn'}</Text>
  </TouchableOpacity>
)}
```

**After:**
```javascript
import { TidalSourceSwitcher, useTidalIntegration } from './TidalIntegration';
const { shouldShowTidalFeatures } = useTidalIntegration();

{shouldShowTidalFeatures(isOffline) && (
  <TidalSourceSwitcher currentTrack={currentPlaying} variant="chip" size="small" />
)}
```

### 4. Navigation Handling
**Before:**
```javascript
const handlePlayerClose = useCallback(() => {
  try {
    setIndex(0);
    const navigationState = navigation.getState();
    // 100+ lines of complex navigation logic...
  } catch (error) {
    // Error handling...
  }
}, [navigation, musicPreviousScreen, setIndex]);

useEffect(() => {
  const backAction = () => {
    if (Index === 1) {
      setIndex(0);
      // Complex back navigation logic...
      return true;
    }
    return false;
  };
  const backHandler = BackHandler.addEventListener('hardwareBackPress', backAction);
  return () => backHandler.remove();
}, [Index, setIndex, navigation, musicPreviousScreen]);
```

**After:**
```javascript
import { useNavigationHandler, BackButtonHandler } from './NavigationHandler';
const { handlePlayerClose } = useNavigationHandler({ musicPreviousScreen });

const handlePlayerCloseAction = () => {
  setIndex(0);
  handlePlayerClose();
};

// Wrap component with BackButtonHandler
<BackButtonHandler Index={Index} setIndex={setIndex} musicPreviousScreen={musicPreviousScreen}>
  {/* Component content */}
</BackButtonHandler>
```

## How to Use the New Components

### 1. Theme Management
```javascript
import { useThemeManager } from './ThemeManager';

const MyComponent = () => {
  const { 
    getTextColor, 
    getBackgroundOverlay, 
    getGradientColors,
    isLight,
    isDark 
  } = useThemeManager();
  
  return (
    <View style={{ backgroundColor: getBackgroundOverlay() }}>
      <Text style={{ color: getTextColor('primary') }}>Title</Text>
      <Text style={{ color: getTextColor('secondary') }}>Subtitle</Text>
    </View>
  );
};
```

### 2. Network Monitoring
```javascript
import { useNetworkMonitor, NetworkStatusIndicator } from './NetworkMonitor';

const MyComponent = () => {
  const { 
    isOffline, 
    canStreamMusic, 
    getConnectionDescription 
  } = useNetworkMonitor({
    onConnectionChange: (state) => {
      console.log('Connection changed:', state);
    }
  });
  
  return (
    <View>
      <NetworkStatusIndicator variant="compact" />
      {canStreamMusic() ? <OnlineFeatures /> : <OfflineFeatures />}
    </View>
  );
};
```

### 3. Tidal Integration
```javascript
import { TidalSourceSwitcher, useTidalIntegration } from './TidalIntegration';

const MyComponent = () => {
  const { 
    tidalEnabled, 
    shouldShowTidalFeatures,
    getCurrentSource 
  } = useTidalIntegration();
  
  return (
    <View>
      {shouldShowTidalFeatures(isOffline) && (
        <TidalSourceSwitcher 
          currentTrack={currentTrack}
          variant="button"
          showIcon={true}
        />
      )}
    </View>
  );
};
```

### 4. Queue Management
```javascript
import { useQueueManager, QueueOperations } from './QueueManager';

const MyComponent = () => {
  const queueManager = useQueueManager();
  const queueOps = new QueueOperations(queueManager);
  
  const { upcomingQueue, currentIndex } = queueManager;
  
  return (
    <View>
      <Text>Queue length: {upcomingQueue.length}</Text>
      <Text>Current index: {currentIndex}</Text>
    </View>
  );
};
```

### 5. Navigation Handling
```javascript
import { useNavigationHandler, BackButtonHandler } from './NavigationHandler';

const MyComponent = ({ Index, setIndex, musicPreviousScreen }) => {
  const { 
    handlePlayerClose,
    navigateToScreen,
    getCurrentPath 
  } = useNavigationHandler({ 
    musicPreviousScreen,
    onNavigationChange: (path, params) => {
      console.log('Navigation changed:', path);
    }
  });
  
  return (
    <BackButtonHandler 
      Index={Index} 
      setIndex={setIndex} 
      musicPreviousScreen={musicPreviousScreen}
    >
      <Button onPress={handlePlayerClose} title="Close" />
    </BackButtonHandler>
  );
};
```

## Breaking Changes

### Removed Props/Functions
- Direct theme calculations in FullScreenMusic
- Manual network state management
- Inline Tidal preference loading
- Complex navigation logic in component
- Manual BackHandler setup

### New Dependencies
Components now depend on the extracted modules:
```javascript
import { useThemeManager } from './ThemeManager';
import { TidalSourceSwitcher, useTidalIntegration } from './TidalIntegration';
import { useNavigationHandler, BackButtonHandler } from './NavigationHandler';
```

## Benefits for Developers

1. **Easier Testing**: Each component can be tested independently
2. **Better Code Organization**: Related functionality is grouped together
3. **Improved Reusability**: Components can be used in other parts of the app
4. **Simplified Debugging**: Issues are isolated to specific components
5. **Enhanced Maintainability**: Changes to one feature don't affect others
6. **Better Performance**: Optimized rendering and state management

## Common Migration Patterns

### Pattern 1: Replace Inline Logic with Hooks
```javascript
// Before
const [someState, setSomeState] = useState(false);
useEffect(() => {
  // Complex logic...
}, []);

// After
const { someState, someFunction } = useExtractedHook();
```

### Pattern 2: Replace Complex JSX with Components
```javascript
// Before
{condition && (
  <TouchableOpacity onPress={() => { /* complex logic */ }}>
    <Text>Complex UI</Text>
  </TouchableOpacity>
)}

// After
{condition && <ExtractedComponent onPress={handleAction} />}
```

### Pattern 3: Wrap with Provider Components
```javascript
// Before
<MyComponent />

// After
<ProviderComponent>
  <MyComponent />
</ProviderComponent>
```

## Troubleshooting

### Common Issues

1. **Missing Imports**: Make sure to import the new components
2. **Context Errors**: Ensure components are wrapped with proper providers
3. **Type Errors**: Check that props are passed correctly to new components

### Debug Tips

1. Use console.log in the extracted components to trace execution
2. Check that all required props are passed to new components
3. Verify that context providers are properly set up
4. Use React DevTools to inspect component hierarchy

## Future Considerations

The modular structure makes it easy to:
- Add new features as separate components
- Update individual features without affecting others
- Create different UI variants for different screens
- Implement feature flags for gradual rollouts
- Create comprehensive test suites for each feature
