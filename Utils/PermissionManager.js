import { PermissionsAndroid, Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';

/**
 * Requests storage permission on Android when necessary.
 * For Android 10 (API 29) and above, no permission is needed for saving to public media directories.
 * For Android 9 (API 28) and below, WRITE_EXTERNAL_STORAGE is required.
 * @returns {Promise<boolean>} A promise that resolves to true if permission is granted or not needed, and false otherwise.
 */
export const requestStoragePermission = async () => {
  if (Platform.OS !== 'android') {
    return true; // Not needed for other platforms
  }

  try {
    const apiLevel = await DeviceInfo.getApiLevel();

    if (apiLevel >= 29) {
      return true; // No permission needed for Android 10+
    }

    // For Android 9 and below, request permission
    const granted = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE,
      {
        title: 'Storage Permission Required',
        message: 'This app needs access to your storage to download songs for offline playback.',
        buttonPositive: 'Allow',
        buttonNegative: 'Cancel',
      },
    );

    return granted === PermissionsAndroid.RESULTS.GRANTED;
  } catch (error) {
    console.error('Error requesting storage permission:', error);
    return false;
  }
};
