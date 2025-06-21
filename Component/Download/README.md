# Download Components

This folder contains modular, reusable components for handling song downloads in the Orbit music app. The components follow a monolithic approach with code split into manageable, readable, modular, and optimized files.

## Components Overview

### 1. **PermissionHandler** (`PermissionHandler.js`)
Manages storage permissions across different Android versions and iOS.

**Features:**
- Automatic Android version detection
- Handles Android 13+ scoped storage
- Legacy Android permission requests
- iOS compatibility

**Usage:**
```javascript
import { PermissionHandler } from '../Download';

const hasPermission = await PermissionHandler.requestStoragePermission();
```

### 2. **DownloadManager** (`DownloadManager.js`)
Core download logic with metadata saving and artwork caching.

**Features:**
- Song file downloading with progress tracking
- Metadata saving to StorageManager
- High-quality artwork downloading
- Error handling and cleanup
- Directory management

**Usage:**
```javascript
import { DownloadManager } from '../Download';

const success = await DownloadManager.downloadSong(
  songData,
  (progress) => console.log(`Progress: ${progress}%`),
  (success, songId) => console.log('Download complete'),
  (error, songId) => console.error('Download failed')
);
```

### 3. **DownloadProgressIndicator** (`DownloadProgressIndicator.jsx`)
Visual progress indicators for downloads.

**Components:**
- `DownloadProgressIndicator` - Circular progress with percentage
- `SimpleProgressBar` - Linear progress bar
- `DownloadProgressWithText` - Progress with text label

**Usage:**
```javascript
import { DownloadProgressIndicator } from '../Download';

<DownloadProgressIndicator 
  progress={75} 
  size={32} 
  showPercentage={true}
/>
```

### 4. **DownloadControl** (`DownloadControl.jsx`)
Smart download button that adapts to different states.

**Components:**
- `DownloadControl` - Standard download button
- `CompactDownloadControl` - Smaller version for lists
- `LargeDownloadControl` - Larger version for prominent placement

**States:**
- Download button (when not downloaded)
- Progress indicator (while downloading)
- Checkmark (when completed or offline)

**Usage:**
```javascript
import { DownloadControl } from '../Download';

<DownloadControl
  isDownloaded={isDownloaded}
  isDownloading={isDownloading}
  downloadProgress={downloadProgress}
  onDownloadPress={startDownload}
  isOffline={isOffline}
  size={28}
/>
```

### 5. **useDownload** (`useDownload.js`)
Custom hook that manages download state and functionality.

**Features:**
- Download status tracking
- Progress monitoring
- Permission handling integration
- Event-based updates
- Offline mode support

**Usage:**
```javascript
import { useDownload } from '../Download';

const {
  isDownloaded,
  isDownloading,
  downloadProgress,
  startDownload,
  removeDownload,
  canDownload
} = useDownload(songData, isOffline);
```

## Integration Example

Here's how the components work together in a music player:

```javascript
import React from 'react';
import { View } from 'react-native';
import { useDownload, DownloadControl } from '../Download';

const MusicPlayer = ({ currentSong, isOffline }) => {
  const {
    isDownloaded,
    isDownloading,
    downloadProgress,
    startDownload,
    canDownload
  } = useDownload(currentSong, isOffline);

  return (
    <View>
      {/* Other player controls */}
      
      <DownloadControl
        isDownloaded={isDownloaded}
        isDownloading={isDownloading}
        downloadProgress={downloadProgress}
        onDownloadPress={startDownload}
        isOffline={isOffline}
        disabled={!canDownload}
      />
    </View>
  );
};
```

## Benefits of This Architecture

1. **Modularity**: Each component has a single responsibility
2. **Reusability**: Components can be used across different screens
3. **Maintainability**: Easy to update and debug individual components
4. **Testability**: Each component can be tested independently
5. **Performance**: Optimized rendering and state management
6. **Consistency**: Unified download behavior across the app

## File Structure

```
Component/Download/
├── index.js                     # Main exports
├── PermissionHandler.js         # Permission management
├── DownloadManager.js           # Core download logic
├── DownloadProgressIndicator.jsx # Progress UI components
├── DownloadControl.jsx          # Download button components
├── useDownload.js               # Download state hook
├── DownloadTest.jsx             # Test component
└── README.md                    # This documentation
```

## Testing

Use the `DownloadTest` component to verify functionality:

```javascript
import { DownloadTest } from '../Download';

// Render DownloadTest in your development environment
<DownloadTest />
```

This modular approach replaces the previous monolithic download logic in FullScreenMusic.jsx, making the codebase more maintainable and the download functionality more reusable across the application.
