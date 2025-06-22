/**
 * Asset Optimizer Utility
 * Manages and optimizes app assets for better performance
 */

// List of actually used images based on code analysis
export const USED_IMAGES = {
  // Core UI Images
  'default.jpg': 'Fallback image for albums/playlists',
  'Music.jpeg': 'Default music artwork',
  'wav.png': 'Default playlist cover',
  
  // Animation GIFs (small, essential)
  'playing.gif': 'Currently playing animation',
  'songPaused.gif': 'Paused song animation',
  
  // Local music placeholders
  'a.gif': 'Local music placeholder',
  'b.gif': 'Collapsed player local music',
  
  // Essential UI images
  'offline.png': 'Offline mode indicator',
  'likedMusic.webp': 'Liked music icon',
  'background.jpg': 'App background',
  'Logo.jpg': 'App logo',
  'me.jpg': 'Profile image',
  
  // Category/Genre images
  'lofi.jpg': 'Lofi genre image',
  'lofi.png': 'Lofi genre image (duplicate)',
  'pop.png': 'Pop genre image',
  'Trending.jpg': 'Trending section image',
  'trending.png': 'Trending section image (duplicate)',
  
  // Feature images
  'LikedPlaylist.png': 'Liked playlist image',
  'LikedSong.png': 'Liked song image',
  'MostSearched.png': 'Most searched image',
  'continueListning.png': 'Continue listening image',
  'AboutProject.png': 'About project image'
};

// Images that are safe to remove (confirmed unused after code analysis)
export const SAFE_TO_REMOVE_IMAGES = [
  // Large alphabet GIFs (confirmed unused)
  'c.gif', 'd.gif', 'e.gif', 'f.gif', 'g.gif', 'h.gif', 'i.gif', 'j.gif',
  'k.gif', 'l.gif', 'm.gif', 'n.gif', 'o.gif', 'p.gif', 'q.gif', 'r.gif',
  's.gif', 't.gif', 'u.gif', 'v.gif', 'w.gif', 'x.gif', 'y.gif', 'z.gif',

  // Large unused GIFs
  'loading.gif',

  // Duplicate files
  'offline.svg', // We have offline.png
];

// Images that are used but can be replaced with modern alternatives
export const IMAGES_TO_MODERNIZE = [
  'GiveName.gif',      // Used in onboarding - replaced with animated icon
  'selectLanguage.gif', // Used in onboarding - replaced with animated icon
  'letsgo.gif',        // Potentially used - replaced with animated icon
];

// Optimization recommendations
export const OPTIMIZATION_PLAN = {
  // Compress these large files
  COMPRESS_IMAGES: [
    { file: 'continueListning.png', currentSize: '732K', targetSize: '200K' },
    { file: 'MostSearched.png', currentSize: '700K', targetSize: '200K' },
    { file: 'AboutProject.png', currentSize: '116K', targetSize: '50K' },
    { file: 'LikedPlaylist.png', currentSize: '208K', targetSize: '80K' },
    { file: 'LikedSong.png', currentSize: '228K', targetSize: '80K' },
    { file: 'pop.png', currentSize: '380K', targetSize: '100K' },
    { file: 'trending.png', currentSize: '376K', targetSize: '100K' },
  ],
  
  // Convert these to more efficient formats
  CONVERT_FORMATS: [
    { from: 'lofi.jpg', to: 'lofi.webp', reason: 'Better compression' },
    { from: 'Trending.jpg', to: 'Trending.webp', reason: 'Better compression' },
    { from: 'background.jpg', to: 'background.webp', reason: 'Better compression' },
    { from: 'Logo.jpg', to: 'Logo.webp', reason: 'Better compression' },
    { from: 'me.jpg', to: 'me.webp', reason: 'Better compression' },
  ],
  
  // Remove duplicates
  REMOVE_DUPLICATES: [
    { keep: 'lofi.jpg', remove: 'lofi.png' },
    { keep: 'Trending.jpg', remove: 'trending.png' },
    { keep: 'offline.png', remove: 'offline.svg' },
  ],
  
  // Optimize GIFs
  OPTIMIZE_GIFS: [
    { file: 'a.gif', currentSize: '208K', targetSize: '50K', method: 'Reduce frames/colors' },
    { file: 'b.gif', currentSize: '476K', targetSize: '100K', method: 'Reduce frames/colors' },
    { file: 'playing.gif', currentSize: '4K', status: 'Already optimized' },
    { file: 'songPaused.gif', currentSize: '1K', status: 'Already optimized' },
  ]
};

/**
 * Get list of safe-to-remove images
 */
export const getSafeToRemoveImages = () => {
  return SAFE_TO_REMOVE_IMAGES;
};

/**
 * Get list of images that can be modernized
 */
export const getImagesToModernize = () => {
  return IMAGES_TO_MODERNIZE;
};

/**
 * Get optimization recommendations
 */
export const getOptimizationRecommendations = () => {
  return OPTIMIZATION_PLAN;
};

/**
 * Calculate potential size savings
 */
export const calculateSizeSavings = () => {
  // Large unused GIFs total size
  const unusedGifSizes = {
    'l.gif': 20 * 1024 * 1024, // 20MB
    'e.gif': 6 * 1024 * 1024,  // 6MB
    'g.gif': 4.4 * 1024 * 1024, // 4.4MB
    'q.gif': 4.4 * 1024 * 1024, // 4.4MB
    'GiveName.gif': 4.2 * 1024 * 1024, // 4.2MB
    'p.gif': 3.1 * 1024 * 1024, // 3.1MB
    'selectLanguage.gif': 3.6 * 1024 * 1024, // 3.6MB
    // Add other large files...
  };
  
  let totalSavings = 0;
  SAFE_TO_REMOVE_IMAGES.forEach(filename => {
    if (unusedGifSizes[filename]) {
      totalSavings += unusedGifSizes[filename];
    }
  });
  
  return {
    totalSavings: totalSavings,
    totalSavingsMB: Math.round(totalSavings / (1024 * 1024) * 10) / 10,
    percentageReduction: '60-70%' // Estimated
  };
};

export default {
  USED_IMAGES,
  SAFE_TO_REMOVE_IMAGES,
  IMAGES_TO_MODERNIZE,
  OPTIMIZATION_PLAN,
  getSafeToRemoveImages,
  getImagesToModernize,
  getOptimizationRecommendations,
  calculateSizeSavings
};
