import { analyticsService, AnalyticsEvents, UserProperties } from './AnalyticsUtils';

/**
 * This file contains functions to test Firebase Analytics integration
 * Run these tests to verify that events are being sent to Firebase
 */

export const testAnalytics = async () => {
  try {
    console.log('Running Firebase Analytics tests...');

    // Test basic event logging
    await analyticsService.logEvent('test_event', {
      test_parameter: 'test_value',
      timestamp: Date.now()
    });
    console.log('Test event logged successfully');

    // Test screen view
    await analyticsService.logScreenView('TestScreen');
    console.log('Test screen view logged successfully');

    // Test user property
    await analyticsService.setUserProperty(UserProperties.USER_THEME, 'dark');
    console.log('Test user property set successfully');

    // Test download tracking
    await analyticsService.logDownloadStart('test_song_id', 'song', 'Test Song');
    await analyticsService.logDownloadComplete('test_song_id', 'song', 'Test Song', true);
    console.log('Test download events logged successfully');

    // Test active user tracking
    analyticsService.trackActiveUser();
    console.log('Test active user tracked successfully');

    // Test download count
    analyticsService.trackDownloadCount(5);
    console.log('Test download count tracked successfully');

    console.log('All Firebase Analytics tests completed successfully');
    return true;
  } catch (error) {
    console.error('Error running Firebase Analytics tests:', error);
    return false;
  }
};

/**
 * Run this function from your app to verify Firebase Analytics is working
 * For example, add a button in a development screen that calls this function
 */
export const verifyFirebaseAnalyticsSetup = async () => {
  const success = await testAnalytics();
  if (success) {
    return 'Firebase Analytics tests passed! Check Firebase Debug View to confirm data is being received.';
  } else {
    return 'Firebase Analytics tests failed. Check console for errors.';
  }
}; 