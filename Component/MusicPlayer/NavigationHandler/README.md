# Navigation Handler Components

This folder contains modular, reusable components for handling complex navigation logic in the Orbit music app. The components follow a monolithic approach with code split into manageable, readable, modular, and optimized files.

## Components Overview

### 1. **NavigationHandler** (`NavigationHandler.jsx`)
Context provider that manages complex navigation logic for music player.

**Features:**
- Screen transitions and routing
- Back button handling
- Navigation state management
- Route parameter preservation

**Usage:**
```javascript
import { NavigationHandler } from '../NavigationHandler';

<NavigationHandler musicPreviousScreen={musicPreviousScreen}>
  <YourComponent />
</NavigationHandler>
```

### 2. **useNavigationHandler** (`useNavigationHandler.js`)
Custom hook for navigation management.

**Features:**
- Screen transitions and routing
- Back button handling
- Navigation state management
- Route parameter preservation

**Usage:**
```javascript
import { useNavigationHandler } from '../NavigationHandler';

const MyComponent = () => {
  const { 
    handlePlayerClose,
    handleBackNavigation,
    navigateToScreen,
    getCurrentPath 
  } = useNavigationHandler({
    musicPreviousScreen: 'Library/MyMusicPage',
    onNavigationChange: (path, params) => {
      console.log('Navigation changed:', path, params);
    }
  });
  
  return (
    <View>
      <Button onPress={handlePlayerClose} title="Close Player" />
      <Button onPress={handleBackNavigation} title="Go Back" />
    </View>
  );
};
```

### 3. **BackButtonHandler** (`BackButtonHandler.jsx`)
Handles hardware back button for music player navigation.

**Features:**
- Hardware back button interception
- Custom back navigation logic
- Player minimization on back press
- Navigation state restoration

**Usage:**
```javascript
import { BackButtonHandler } from '../NavigationHandler';

<BackButtonHandler
  Index={Index}
  setIndex={setIndex}
  musicPreviousScreen={musicPreviousScreen}
  enabled={true}
  onBackPress={() => {
    console.log('Custom back press handling');
    return false; // Let default handling continue
  }}
>
  <YourComponent />
</BackButtonHandler>
```

### 4. **ScreenTransitionManager** (`ScreenTransitionManager.jsx`)
Manages screen transitions and navigation state.

**Features:**
- Transition state tracking
- Navigation history management
- Screen parameter preservation
- Transition callbacks

**Usage:**
```javascript
import { ScreenTransitionManager } from '../NavigationHandler';

<ScreenTransitionManager
  musicPreviousScreen={musicPreviousScreen}
  onTransitionStart={(type, screen) => console.log('Transition start:', type, screen)}
  onTransitionEnd={(type, screen) => console.log('Transition end:', type, screen)}
  onNavigationChange={(path, params) => console.log('Navigation:', path, params)}
  preserveHistory={true}
  maxHistoryLength={10}
>
  <YourComponent />
</ScreenTransitionManager>
```

## API Reference

### useNavigationHandler Hook

#### Options
```javascript
const options = {
  musicPreviousScreen: 'Library/MyMusicPage',  // Previous screen path
  onNavigationChange: (path, params) => {},    // Navigation change callback
  preserveParams: true                         // Whether to preserve route params
};
```

#### Methods
- `handlePlayerClose()` - Handle player close with complex navigation
- `handleBackNavigation()` - Handle back button navigation
- `navigateToScreen(path, params)` - Navigate to specific screen
- `getCurrentPath()` - Get current navigation path
- `canGoBack()` - Check if can go back
- `goBack()` - Go back if possible

### BackButtonHandler Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `Index` | Number | - | Current player index (0=minimized, 1=fullscreen) |
| `setIndex` | Function | - | Function to set player index |
| `musicPreviousScreen` | String | null | Previous screen path |
| `enabled` | Boolean | true | Whether back button handling is enabled |
| `onBackPress` | Function | null | Custom back press handler |

### ScreenTransitionManager Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `musicPreviousScreen` | String | null | Previous screen path |
| `onTransitionStart` | Function | null | Callback when transition starts |
| `onTransitionEnd` | Function | null | Callback when transition ends |
| `onNavigationChange` | Function | null | Callback when navigation changes |
| `preserveHistory` | Boolean | true | Whether to preserve navigation history |
| `maxHistoryLength` | Number | 10 | Maximum history entries to keep |

#### Enhanced Navigation Context
The ScreenTransitionManager provides enhanced navigation functions:

```javascript
const enhancedNavigationContext = {
  handlePlayerClose,           // Enhanced player close with transitions
  handleBackNavigation,        // Enhanced back navigation with transitions
  navigateToScreen,           // Enhanced screen navigation with transitions
  getNavigationHistory,       // Get navigation history
  getPreviousScreen,          // Get previous screen from history
  clearNavigationHistory,     // Clear navigation history
  getTransitionState,         // Get current transition state
  isTransitioning,           // Boolean indicating if transitioning
  currentScreen,             // Current screen info
  navigationHistory          // Full navigation history array
};
```

## Integration with FullScreenMusic

The NavigationHandler components are designed to replace navigation-related logic in FullScreenMusic:

**Before:**
```javascript
const handlePlayerClose = useCallback(() => {
  try {
    setIndex(0);
    const navigationState = navigation.getState();
    // Complex navigation logic...
    if (musicPreviousScreen) {
      // More complex logic...
    }
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
const { handlePlayerClose } = useNavigationHandler({
  musicPreviousScreen
});

<BackButtonHandler
  Index={Index}
  setIndex={setIndex}
  musicPreviousScreen={musicPreviousScreen}
>
  <ScreenTransitionManager
    musicPreviousScreen={musicPreviousScreen}
    onTransitionStart={(type) => console.log('Transition:', type)}
  >
    {/* Your component content */}
  </ScreenTransitionManager>
</BackButtonHandler>
```

## File Structure

```
Component/MusicPlayer/NavigationHandler/
├── index.js                      # Main exports
├── NavigationHandler.jsx         # Context provider component
├── useNavigationHandler.js       # Custom hook
├── BackButtonHandler.jsx         # Back button handling component
├── ScreenTransitionManager.jsx   # Transition management component
└── README.md                     # This documentation
```

## Benefits

1. **Separation of Concerns**: Navigation logic separated from UI components
2. **Reusability**: Can be used across different music player screens
3. **State Management**: Centralized navigation state handling
4. **Parameter Preservation**: Automatic route parameter preservation
5. **Transition Management**: Built-in transition state tracking
