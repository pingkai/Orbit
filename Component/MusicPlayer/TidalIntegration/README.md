# Tidal Integration Components

This folder contains modular, reusable components for handling Tidal music service integration in the Orbit music app. The components follow a monolithic approach with code split into manageable, readable, modular, and optimized files.

## Components Overview

### 1. **TidalIntegration** (`TidalIntegration.jsx`)
Context provider that manages Tidal music service integration.

**Features:**
- Tidal preference management
- Source switching between Tidal and Saavn
- Tidal-specific functionality handling
- Integration state management

**Usage:**
```javascript
import { TidalIntegration } from '../TidalIntegration';

<TidalIntegration>
  <YourComponent />
</TidalIntegration>
```

### 2. **useTidalIntegration** (`useTidalIntegration.js`)
Custom hook for accessing Tidal integration functionality.

**Features:**
- Tidal preference management
- Source detection and switching
- Tidal-specific functionality
- Integration state management

**Usage:**
```javascript
import { useTidalIntegration } from '../TidalIntegration';

const MyComponent = () => {
  const { 
    tidalEnabled, 
    getCurrentSource,
    switchSource,
    getSourceDisplayName 
  } = useTidalIntegration({
    onTidalToggle: (enabled) => {
      console.log('Tidal toggled:', enabled);
    }
  });
  
  return (
    <View>
      <Text>Tidal: {tidalEnabled ? 'Enabled' : 'Disabled'}</Text>
      <Text>Current Source: {getSourceDisplayName(currentTrack)}</Text>
    </View>
  );
};
```

### 3. **TidalSourceSwitcher** (`TidalSourceSwitcher.jsx`)
UI component for switching between music sources.

**Features:**
- Multiple display variants (button, chip, minimal)
- Current source display
- Interactive source switching
- Theme-aware styling

**Usage:**
```javascript
import { TidalSourceSwitcher } from '../TidalIntegration';

// Button variant
<TidalSourceSwitcher 
  currentTrack={currentTrack}
  variant="button" 
  showIcon={true}
  onSourceSwitch={(switchInfo) => console.log('Source switched:', switchInfo)}
/>

// Chip variant
<TidalSourceSwitcher 
  currentTrack={currentTrack}
  variant="chip" 
  size="small"
/>

// Minimal variant
<TidalSourceSwitcher 
  currentTrack={currentTrack}
  variant="minimal"
/>
```

### 4. **TidalPreferenceManager** (`TidalPreferenceManager.jsx`)
Comprehensive UI for managing Tidal integration preferences.

**Features:**
- Enable/disable Tidal integration
- Integration status display
- Advanced settings (future)
- Modal or inline display

**Usage:**
```javascript
import { TidalPreferenceManager } from '../TidalIntegration';

// Inline usage
<TidalPreferenceManager />

// Modal usage
<TidalPreferenceManager 
  showAsModal={true}
  visible={showModal}
  onClose={() => setShowModal(false)}
/>
```

## API Reference

### useTidalIntegration Hook

#### Options
```javascript
const options = {
  autoLoad: true,                    // Auto-load Tidal preferences on mount
  onTidalToggle: (enabled) => {},    // Callback when Tidal is toggled
  onSourceSwitch: (switchInfo) => {} // Callback when source is switched
};
```

#### Properties
- `tidalEnabled` - Boolean indicating if Tidal integration is enabled
- `isLoading` - Boolean indicating if preferences are loading
- `currentSource` - String indicating current source

#### Methods
- `loadTidalPreference()` - Manually load Tidal preferences
- `toggleTidalIntegration()` - Toggle Tidal integration on/off
- `getCurrentSource(track)` - Get current source from track
- `isTidalTrack(track)` - Check if track is from Tidal
- `switchSource(track)` - Switch source for current track
- `getSourceDisplayName(track)` - Get display name for track source
- `shouldShowTidalFeatures(isOffline)` - Check if Tidal features should be shown
- `getTidalStatus()` - Get complete Tidal integration status
- `handleTidalError(error, context)` - Handle Tidal-specific errors
- `getAvailableSources()` - Get list of available sources
- `canSwitchSource(isOffline)` - Check if source switching is available

### TidalSourceSwitcher Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `currentTrack` | Object | - | Current playing track object |
| `style` | Object | - | Custom styles for the component |
| `size` | String | 'medium' | Component size ('small', 'medium', 'large') |
| `variant` | String | 'button' | Display variant ('button', 'chip', 'minimal') |
| `showIcon` | Boolean | false | Whether to show source icon |
| `disabled` | Boolean | false | Whether the switcher is disabled |
| `onSourceSwitch` | Function | null | Callback when source is switched |

### TidalPreferenceManager Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `style` | Object | - | Custom styles for the component |
| `showAsModal` | Boolean | false | Whether to show as modal |
| `visible` | Boolean | false | Modal visibility (when showAsModal is true) |
| `onClose` | Function | null | Modal close callback |

## Integration with FullScreenMusic

The TidalIntegration components are designed to replace Tidal-related logic in FullScreenMusic:

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

// Source switcher logic
{tidalEnabled && !isOffline && (
  <TouchableOpacity onPress={() => {
    const currentSource = currentPlaying?.source || 'saavn';
    const newSource = currentSource === 'tidal' ? 'saavn' : 'tidal';
    ToastAndroid.show(`Switching to ${newSource}`, ToastAndroid.LONG);
  }}>
    <Text>{currentPlaying?.source === 'tidal' ? 'Tidal' : 'Saavn'}</Text>
  </TouchableOpacity>
)}
```

**After:**
```javascript
const { shouldShowTidalFeatures } = useTidalIntegration();

{shouldShowTidalFeatures(isOffline) && (
  <TidalSourceSwitcher
    currentTrack={currentPlaying}
    variant="chip"
  />
)}
```

## File Structure

```
Component/MusicPlayer/TidalIntegration/
├── index.js                      # Main exports
├── TidalIntegration.jsx          # Context provider component
├── useTidalIntegration.js        # Custom hook
├── TidalSourceSwitcher.jsx       # Source switching UI component
├── TidalPreferenceManager.jsx    # Preference management UI
└── README.md                     # This documentation
```

## Benefits

1. **Centralized Management**: All Tidal logic in one place
2. **Flexible UI**: Multiple components for different use cases
3. **Future-Ready**: Prepared for advanced Tidal features
4. **Error Handling**: Comprehensive Tidal-specific error management
5. **Theme Integration**: Consistent styling with app theme
