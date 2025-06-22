# FullScreenMusic Three-Dot Menu Feature

## Overview
This feature adds a comprehensive three-dot menu to the FullScreenMusic component, providing users with quick access to various song-related actions and information.

## Features Implemented

### 1. **Go to Artist**
- Navigates to the artist page showing all songs by the current artist
- Uses existing ArtistPage component with card-based song display
- Handles offline mode gracefully

### 2. **View Album**
- Navigates to the album page showing all songs from the current album
- Uses existing Album component
- Requires albumId from song metadata

### 3. **Add to Playlist**
- Opens playlist selector modal
- Allows adding current song to existing playlists or creating new ones
- Reuses existing playlist management functionality

### 4. **Song Info**
- Displays detailed song information in a modal
- Shows metadata including:
  - Title, Artist, Album
  - Duration, Language, Quality
  - Source (JioSaavn/Tidal)
  - Release date and copyright (for Tidal tracks)

### 5. **More from Artist**
- Fetches and displays 5 additional songs from the same artist
- Uses paginated artist songs API
- Shows loading feedback and error handling

## Component Structure

### Core Components
- **FullScreenMusicMenuButton**: Three-dot button with theme support
- **FullScreenMusicMenuModal**: Main menu modal with options
- **SongInfoModal**: Detailed song information display
- **useFullScreenMusicMenu**: Custom hook managing all menu logic

### File Organization
```
Component/MusicPlayer/FullScreenMusicMenu/
├── FullScreenMusicMenuButton.jsx    # Menu trigger button
├── FullScreenMusicMenuModal.jsx     # Main menu modal
├── SongInfoModal.jsx                # Song details modal
├── useFullScreenMusicMenu.js        # Menu logic hook
├── index.js                         # Export barrel
└── README.md                        # This documentation
```

## UI/UX Design

### Layout
- **Lyrics icon**: Positioned on the left side
- **Three-dot menu**: Positioned on the right side
- **Spacing**: 20px gap between icons for proper visual separation
- **Theme support**: Follows app theme (dark/light mode)

### Menu Positioning
- Appears in top-right area of screen
- Proper backdrop and animation
- Themed background and text colors

### Interactions
- Smooth fade-in/out animations
- Ripple effects on menu items
- Proper touch targets and accessibility

## Technical Implementation

### Monolithic Approach
- Code split into manageable, readable modules
- Each component has single responsibility
- Reusable components with proper prop interfaces
- Optimized for performance and maintainability

### Error Handling
- Graceful handling of missing song data
- Offline mode support
- API error handling with user feedback
- Fallback behaviors for navigation failures

### Theme Integration
- Uses existing theme system
- Proper color schemes for dark/light modes
- Consistent styling with app design

## API Integration

### Endpoints Used
- `/api/artists/{artistId}/songs` - For artist songs
- `/api/albums/{albumId}` - For album navigation
- Existing playlist management APIs
- Song metadata from current track

### Data Requirements
- `artistID` or `primary_artists_id` for artist navigation
- `albumId` for album navigation
- Complete song object for info display
- Playlist management data

## Usage

### Integration
```jsx
import { 
  FullScreenMusicMenuButton, 
  FullScreenMusicMenuModal, 
  SongInfoModal, 
  useFullScreenMusicMenu 
} from './FullScreenMusicMenu';

// In component
const {
  menuVisible,
  menuPosition,
  songInfoVisible,
  showMenu,
  closeMenu,
  closeSongInfo,
  getMenuOptions,
} = useFullScreenMusicMenu(currentPlaying, isOffline);
```

### Menu Options Configuration
Menu options are dynamically generated based on:
- Current song data availability
- Online/offline status
- Theme settings

## Future Enhancements

### Potential Additions
1. **Share Song**: Share song details via system share
2. **Set as Favorite**: Add to user favorites
3. **Similar Songs**: Show recommendations
4. **Download Options**: Quality selection for downloads
5. **Queue Management**: Advanced queue operations

### Performance Optimizations
1. Lazy loading of menu components
2. Memoization of menu options
3. Optimized API calls with caching
4. Reduced re-renders with proper dependencies

## Testing Considerations

### Test Cases
1. Menu visibility and positioning
2. Navigation to artist/album pages
3. Playlist addition functionality
4. Song info modal display
5. Offline mode behavior
6. Error handling scenarios
7. Theme switching compatibility

### Edge Cases
- Missing song metadata
- Network connectivity issues
- Invalid artist/album IDs
- Empty playlist scenarios
- Theme switching during menu display

## Accessibility

### Features
- Proper touch targets (minimum 44px)
- Screen reader support
- Keyboard navigation support
- High contrast theme compatibility
- Reduced motion support

This implementation provides a comprehensive, user-friendly three-dot menu that enhances the FullScreenMusic experience while maintaining code quality and performance standards.
