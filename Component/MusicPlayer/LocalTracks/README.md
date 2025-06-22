# Local Tracks Components

This folder contains modular, reusable components for handling local tracks functionality in the Orbit music app. The components follow a monolithic approach with code split into manageable, readable, modular, and optimized files.

## Components Overview

### 1. **useLocalTracks** (`useLocalTracks.js`)
Custom hook for managing local tracks functionality.

**Features:**
- Loading local tracks from storage
- Playing local tracks
- Managing local tracks state
- Error handling for file operations
- Auto-loading based on offline status

**Usage:**
```javascript
import { useLocalTracks } from '../LocalTracks';

const MyComponent = () => {
  const {
    localTracks,
    showLocalTracks,
    playLocalTrack,
    closeLocalTracks,
    isLoading,
    error,
    hasLocalTracks
  } = useLocalTracks({ 
    isOffline: true,
    onError: (error, context) => {
      console.error('Local tracks error:', error, context);
    }
  });
  
  return (
    <View>
      {hasLocalTracks && (
        <Button onPress={() => playLocalTrack(localTracks[0])} title="Play First Track" />
      )}
    </View>
  );
};
```

### 2. **LocalTracksMetadataProcessor** (`LocalTracksMetadataProcessor.js`)
Utility for processing local tracks metadata.

**Features:**
- Converting metadata to track objects
- Validating track data
- Handling file path resolution
- Error handling for individual tracks
- Filtering and sorting tracks
- Track statistics

**Usage:**
```javascript
import { LocalTracksMetadataProcessor } from '../LocalTracks';

// Process metadata to tracks
const tracks = await LocalTracksMetadataProcessor.processMetadataToTracks(metadata);

// Filter tracks
const filteredTracks = LocalTracksMetadataProcessor.filterTracks(tracks, {
  artist: 'John Doe',
  minDuration: 180
});

// Sort tracks
const sortedTracks = LocalTracksMetadataProcessor.sortTracks(tracks, 'title', 'asc');

// Get statistics
const stats = LocalTracksMetadataProcessor.getTracksStatistics(tracks);
```

### 3. **LocalTracksErrorBoundary** (`LocalTracksErrorBoundary.jsx`)
Error boundary for local tracks file operations.

**Features:**
- Catching and handling file operation errors
- Displaying user-friendly error messages
- Providing recovery options
- Logging errors for debugging
- Error categorization

**Usage:**
```javascript
import { LocalTracksErrorBoundary } from '../LocalTracks';

<LocalTracksErrorBoundary
  onError={(error, errorInfo) => {
    console.error('Error boundary caught:', error, errorInfo);
  }}
  onRetry={() => {
    console.log('Retrying operation');
  }}
  showRetry={true}
  showReset={true}
>
  <LocalTracksList />
</LocalTracksErrorBoundary>
```

### 4. **FileOperationErrorHandler** (`FileOperationErrorHandler.js`)
Utility for handling file operation errors.

**Features:**
- Error categorization and classification
- User-friendly error messages
- Recovery suggestions
- Error logging and reporting
- Retry mechanisms with exponential backoff

**Usage:**
```javascript
import { FileOperationErrorHandler } from '../LocalTracks';

// Handle error with user feedback
const result = FileOperationErrorHandler.handleError(error, 'loading tracks', {
  showToast: true,
  onError: (error, errorInfo, userMessage) => {
    console.log('User message:', userMessage);
  }
});

// Wrap async operation with error handling
const safeOperation = FileOperationErrorHandler.wrapAsyncOperation(
  async () => {
    // Your async operation
  },
  'operation name',
  { showToast: true }
);

// Retry operation with exponential backoff
const result = await FileOperationErrorHandler.retryOperation(
  async () => {
    // Your operation
  },
  {
    maxRetries: 3,
    baseDelay: 1000,
    onRetry: (attempt, error, delay) => {
      console.log(`Retry attempt ${attempt} in ${delay}ms`);
    }
  }
);
```

## API Reference

### useLocalTracks Hook

#### Options
```javascript
const options = {
  isOffline: false,                    // Whether app is offline
  autoLoad: true,                      // Auto-load tracks on mount/offline
  onTrackPlay: (track) => {},          // Callback when track is played
  onError: (error, context) => {}      // Error callback
};
```

#### Properties
- `localTracks` - Array of local track objects
- `showLocalTracks` - Boolean indicating if local tracks list is visible
- `isLoading` - Boolean indicating if tracks are loading
- `error` - Current error object (if any)
- `hasLocalTracks` - Boolean indicating if any local tracks exist
- `isEmpty` - Boolean indicating if no tracks and not loading
- `hasError` - Boolean indicating if there's an error

#### Methods
- `loadLocalTracks()` - Manually load local tracks
- `playLocalTrack(track)` - Play a specific local track
- `toggleLocalTracks()` - Toggle local tracks list visibility
- `closeLocalTracks()` - Close local tracks list
- `openLocalTracks()` - Open local tracks list
- `refreshLocalTracks()` - Refresh local tracks
- `clearError()` - Clear current error
- `getTrackById(id)` - Get track by ID
- `isTrackAvailableLocally(id)` - Check if track is available locally
- `getLocalTracksCount()` - Get count of local tracks

### LocalTracksMetadataProcessor Methods

#### Static Methods
- `processMetadataToTracks(metadata)` - Convert metadata to track objects
- `processIndividualTrack(songId, metadata)` - Process single track
- `validateMetadata(songId, metadata)` - Validate metadata object
- `resolveFilePaths(songId)` - Resolve file paths for track
- `createTrackObject(songId, metadata, filePaths)` - Create track object
- `filterTracks(tracks, criteria)` - Filter tracks by criteria
- `sortTracks(tracks, sortBy, order)` - Sort tracks
- `getTracksStatistics(tracks)` - Get tracks statistics

### FileOperationErrorHandler Methods

#### Static Methods
- `handleError(error, operation, options)` - Handle file operation error
- `categorizeError(error)` - Categorize error type
- `getUserMessage(errorInfo, operation)` - Get user-friendly message
- `canRetry(errorInfo)` - Check if error is retryable
- `getSuggestedAction(errorInfo)` - Get suggested recovery action
- `createErrorReport(error, operation, context)` - Create error report
- `wrapAsyncOperation(fn, operation, options)` - Wrap function with error handling
- `retryOperation(operation, options)` - Retry operation with backoff

## Error Types

The system categorizes errors into the following types:

1. **Permission Errors** - File access permission issues
2. **File Not Found** - Missing or deleted files
3. **Storage Errors** - Disk space or storage issues
4. **Network Errors** - Network-related problems
5. **Data Corruption** - Corrupted metadata or files
6. **Memory Errors** - Insufficient memory
7. **Unknown Errors** - Uncategorized errors

## Integration with FullScreenMusic

The LocalTracks components are designed to replace local tracks logic in FullScreenMusic:

**Before:**
```javascript
const [localTracks, setLocalTracks] = useState([]);
const [showLocalTracks, setShowLocalTracks] = useState(false);

const playLocalTrack = useCallback(async (track) => {
  // Complex track playing logic...
}, []);

useEffect(() => {
  const loadLocalTracksData = async () => {
    // Complex loading logic...
  };
  loadLocalTracksData();
}, [isOffline]);
```

**After:**
```javascript
const {
  localTracks,
  showLocalTracks,
  playLocalTrack,
  closeLocalTracks,
  isLoading,
  error
} = useLocalTracks({ 
  isOffline,
  onError: (error, context) => {
    console.error('Local tracks error:', error, context);
  }
});

<LocalTracksErrorBoundary>
  <LocalTracksList
    localTracks={localTracks}
    onTrackPress={playLocalTrack}
    onClose={closeLocalTracks}
    visible={showLocalTracks}
    isLoading={isLoading}
    error={error}
  />
</LocalTracksErrorBoundary>
```

## File Structure

```
Component/MusicPlayer/LocalTracks/
├── index.js                           # Main exports
├── useLocalTracks.js                  # Custom hook
├── LocalTracksMetadataProcessor.js    # Metadata processing utility
├── LocalTracksErrorBoundary.jsx       # Error boundary component
├── FileOperationErrorHandler.js       # Error handling utility
└── README.md                          # This documentation
```

## Benefits

1. **Error Resilience**: Comprehensive error handling and recovery
2. **Modularity**: Separated concerns for different aspects
3. **Reusability**: Can be used across different components
4. **Maintainability**: Easier to maintain and update
5. **Performance**: Optimized loading and processing
6. **User Experience**: Better error messages and recovery options
