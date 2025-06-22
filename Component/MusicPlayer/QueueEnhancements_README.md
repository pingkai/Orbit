# Queue Enhancements - Download Button & Three-Dot Menu

## Overview
Enhanced the queue functionality in FullScreenMusic with download capabilities and a three-dot menu for additional actions.

## Changes Made

### 1. **EachSongQueue Component Updates**
- **Added Download Button**: Integrated download functionality using the existing `useDownload` hook and `DownloadControl` component
- **Replaced Drag Handle**: Replaced the drag handle with a three-dot menu while maintaining drag functionality
- **Three-Dot Menu**: Added a modal menu with two options:
  - Remove from queue
  - Add to playlist

### 2. **QueueRenderSongs Component Updates**
- **Added Remove Function**: Implemented `handleRemoveFromQueue` function to properly remove tracks from the queue
- **Enhanced Props**: Updated renderItem functions to pass `songData` and `onRemoveFromQueue` props

## Features

### Download Button
- **Functionality**: Downloads songs with progress tracking
- **States**: Shows different states (download, progress, completed)
- **Integration**: Uses existing download infrastructure
- **Position**: Located between song info and three-dot menu

### Three-Dot Menu
- **Trigger**: Tap the three-dot icon to open menu
- **Options**:
  1. **Remove from queue**: Removes the song from the current queue
  2. **Add to playlist**: Opens playlist selector to add song to user playlists
- **Design**: Theme-aware modal with proper positioning
- **Drag Support**: Long press on three-dot menu still triggers drag functionality

### Remove from Queue
- **Smart Removal**: Handles currently playing track removal gracefully
- **Queue Management**: Automatically skips to next/previous track if needed
- **UI Updates**: Refreshes queue display after removal
- **Error Handling**: Provides fallback removal using TrackPlayer directly

### Add to Playlist
- **Integration**: Uses existing `PlaylistSelectorManager` system
- **User Experience**: Opens bottom drawer playlist selector (same as home screen song cards)
- **Bottom Drawer**: Slides up from bottom with rounded top corners
- **Features**: Create new playlist, browse existing playlists, theme-aware design
- **Error Handling**: Shows appropriate error messages if playlist selector is unavailable

## Technical Implementation

### Dependencies Added
```javascript
import { useDownload } from "../Download/useDownload";
import { DownloadControl } from "../Download/DownloadControl";
import { PlaylistSelectorManager } from "../../Utils/PlaylistSelectorManager";
```

### Props Enhanced
```javascript
// EachSongQueue now accepts:
{
  // ... existing props
  songData,           // Complete song object for download/playlist operations
  onRemoveFromQueue   // Callback function to handle queue removal
}
```

### Layout Adjustments
- **Text Width**: Adjusted `maxTextWidth` calculation to account for new buttons
- **Spacing**: Added proper margins between download button and three-dot menu
- **Responsive**: Maintains responsive design across different screen sizes

## Usage

The enhanced queue automatically provides:
1. **Download functionality** for each song in the queue
2. **Quick removal** of songs from queue via three-dot menu
3. **Playlist management** by adding songs to user playlists
4. **Drag-and-drop reordering** (maintained from original implementation)

## User Experience

### For Gaurav Sharma's Requirements:
✅ **Download Button**: Working download functionality with progress tracking
✅ **Three-Dot Menu**: Replaced existing icon with proper three-dot menu
✅ **Remove from Queue**: First menu option to remove songs from queue
✅ **Add to Playlist**: Second menu option opens bottom drawer (same as home screen)
✅ **Bottom Drawer**: Slides up from bottom with playlist selection interface
✅ **Proper Integration**: Uses existing app infrastructure and maintains theme consistency

## Testing

To test the implementation:
1. **Play any song** and open the queue
2. **Verify download button** appears and functions correctly
3. **Tap three-dot menu** and verify both options work
4. **Test remove from queue** with different songs (including currently playing)
5. **Test add to playlist** functionality
6. **Verify drag-and-drop** still works via long press on three-dot menu

## Notes

- Maintains backward compatibility with existing queue functionality
- Uses existing download and playlist management systems
- Theme-aware design matches app's visual consistency
- Proper error handling and user feedback
- Optimized for performance with memoized components
