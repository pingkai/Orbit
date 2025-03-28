# Firebase Analytics Setup Instructions

## Step 1: Create a Firebase Project

1. Go to the [Firebase Console](https://console.firebase.google.com/)
2. Click on "Add project"
3. Enter a project name (e.g., "Orbit")
4. Follow the setup wizard to create your project

## Step 2: Register Your Android App

1. In the Firebase Console, click on your project
2. Click on the Android icon to add an Android app
3. Enter the package name: `com.orbit`
4. Enter the app nickname: "Orbit" (optional)
5. Enter the SHA-1 signing certificate if you plan to use Firebase Authentication
6. Click "Register app"

## Step 3: Download Configuration File

1. Download the `google-services.json` file
2. Place the file in the `android/app` directory of your project

## Step 4: Configure iOS App (if applicable)

1. In the Firebase Console, click on your project
2. Click on the iOS icon to add an iOS app
3. Enter your iOS bundle ID (check your project settings for the correct ID)
4. Enter the app nickname: "Orbit" (optional)
5. Enter the App Store ID if you have one (optional)
6. Click "Register app"
7. Download the `GoogleService-Info.plist` file
8. Place the file in the root of your iOS app in Xcode

## Step 5: Rebuild Your App

Once you've added the configuration files:

For Android:
```
npx react-native run-android
```

For iOS:
```
cd ios && pod install
npx react-native run-ios
```

## Step 6: Verify Analytics Setup

1. Go to the Firebase Console
2. Click on "Analytics" in the left sidebar
3. You should start seeing data coming in within 24 hours
4. For immediate verification, you can use the `Utils/AnalyticsTestUtil.js` file:

```javascript
import { verifyFirebaseAnalyticsSetup } from './Utils/AnalyticsTestUtil';

// Call this from a component
const result = await verifyFirebaseAnalyticsSetup();
console.log(result);
```

## Step 7: Enable Debug View in Firebase Console

To see real-time analytics events during development:

1. Go to Firebase Console → Analytics → Dashboard
2. Click on "DebugView" in the left sidebar
3. Make sure you have debug events enabled in your app in development mode

## Tracking Events

You can track custom events in your app using:

```javascript
import { analyticsService, AnalyticsEvents } from './Utils/AnalyticsUtils';

// Log a custom event
analyticsService.logEvent('custom_event', {
  parameter1: 'value1',
  parameter2: 'value2'
});

// Log a predefined event
analyticsService.logEvent(AnalyticsEvents.SONG_PLAY, {
  song_id: 'my_song_id',
  song_name: 'My Favorite Song'
});

// Track screen views
analyticsService.logScreenView('ScreenName');
```

## What to Track

1. **User Engagement**: Screen views, button clicks, feature usage
2. **App Performance**: App load times, response times
3. **User Properties**: User preferences, settings
4. **E-commerce**: In-app purchases, cart adds, checkouts
5. **Downloads**: Track download counts, completions, and errors 