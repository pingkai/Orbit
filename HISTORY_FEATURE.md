# History Feature Documentation

## Overview
The History feature tracks user listening behavior and provides comprehensive insights into music consumption patterns. It automatically tracks song play duration, play counts, and provides weekly listening statistics.

## Features

### 🎵 Song History Tracking
- **Real-time Duration Tracking**: Tracks actual listening time, not just play events
- **Smart Skip Handling**: Accurately records partial listens (30s, 1min skips)
- **Multi-source Support**: Tracks downloaded, local, and online streaming songs
- **Crash-resistant**: Saves progress every 5 seconds to prevent data loss

### 📊 Weekly Statistics
- **Visual Chart**: SVG-based weekly listening chart
- **Daily Breakdown**: Shows listening time for each day of the week
- **Summary Stats**: Total songs played, daily average, active days

### 🔍 Advanced Filtering & Search
- **Filter Options**:
  - Recent: Most recently played songs
  - Most Played: Songs with highest play count
  - Most Time: Songs with longest total listening time
- **Real-time Search**: Search by song title or artist name
- **Responsive UI**: Optimized for different screen sizes

### 🎛️ Song Actions
Each history item includes a three-dot menu with:
- **Play Next**: Add song to play queue after current track
- **Add to Playlist**: Add song to user playlists
- **Download**: Download online songs for offline listening

## Technical Implementation

### Core Components

#### HistoryManager (`Utils/HistoryManager.js`)
- Singleton class managing all history operations
- Automatic tracking with configurable intervals
- Memory-efficient with cleanup routines
- Thread-safe operations for concurrent usage

#### UI Components
- `HistoryScreen`: Main history interface
- `HistoryCard`: Individual song history item
- `HistoryChart`: Weekly statistics visualization
- `HistoryFilters`: Filter selection interface
- `HistorySearchBar`: Search functionality

### Data Structure
```javascript
{
  id: "song_id",
  title: "Song Title",
  artist: "Artist Name",
  artwork: "artwork_url",
  playCount: 5,
  listenDuration: 180000, // milliseconds
  lastPlayed: 1640995200000, // timestamp
  sourceType: "online|downloaded|local"
}
```

### Performance Optimizations
- **Lazy Loading**: Only loads visible items
- **Memory Management**: Limits history to 1000 entries
- **Background Cleanup**: Removes entries older than 30 days
- **Efficient Storage**: Uses AsyncStorage with JSON compression

## Usage

### Accessing History
1. Navigate to Library tab
2. Tap on "History" card
3. View your listening history with charts and filters

### Understanding the Chart
- **Bars**: Daily listening time for the current week
- **Height**: Proportional to listening duration
- **Stats**: Shows total songs, daily average, and active days

### Using Filters
- **Recent**: Default view showing most recently played songs
- **Most Played**: Songs you've played the most times
- **Most Time**: Songs you've spent the most time listening to

### Search Functionality
- Type in the search bar to filter by song title or artist
- Search is case-insensitive and matches partial text
- Clear search by tapping the X button

## Privacy & Data
- All data stored locally on device
- No external tracking or data sharing
- User can clear history anytime through app settings
- Automatic cleanup of old entries (30+ days)

## Error Handling
- Graceful handling of storage errors
- Automatic recovery from corrupted data
- Fallback mechanisms for network issues
- Comprehensive logging for debugging

## Performance Considerations
- Designed for thousands of concurrent users
- Memory leak prevention
- Efficient data structures
- Background processing for heavy operations

## Future Enhancements
- Export history data
- Advanced analytics (genres, time patterns)
- Social sharing of listening stats
- Integration with music discovery features
