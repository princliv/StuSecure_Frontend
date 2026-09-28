import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { deviceApi } from '@/services/api/notification.api';
// Type-only import: erased at compile time, so it has zero runtime footprint
// and can't trigger expo-notifications' module-init throw below.
import type * as NotificationsType from 'expo-notifications';

// expo-notifications throws SYNCHRONOUSLY the moment its module is loaded
// when remote notifications aren't available in the current runtime (e.g.
// Expo Go on Android since SDK 53). A static `import * as Notifications from
// 'expo-notifications'` is hoisted and evaluated unconditionally — it can't
// be wrapped in try/catch. `require()` is a plain function call and can, so
// we lazily require + cache it instead of statically importing it.
let cachedNotifications: typeof NotificationsType | null | undefined;

function getNotifications(): typeof NotificationsType | null {
  if (cachedNotifications !== undefined) return cachedNotifications;
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    cachedNotifications = require('expo-notifications') as typeof NotificationsType;
  } catch (err) {
    console.warn('expo-notifications unavailable in this environment', err);
    cachedNotifications = null;
  }
  return cachedNotifications;
}

try {
  getNotifications()?.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
} catch (err) {
  console.warn('expo-notifications unavailable in this environment', err);
}

async function ensureAndroidChannels(Notifications: typeof NotificationsType) {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync('default', {
    name: 'General',
    importance: Notifications.AndroidImportance.HIGH,
    vibrationPattern: [0, 250, 250, 250],
    sound: 'default',
  });
  await Notifications.setNotificationChannelAsync('emergencies', {
    name: 'Emergencies',
    importance: Notifications.AndroidImportance.MAX,
    vibrationPattern: [0, 400, 200, 400],
    sound: 'default',
    enableVibrate: true,
  });
}

function projectId() {
  return (
    Constants.easConfig?.projectId ??
    (Constants.expoConfig?.extra as { eas?: { projectId?: string } } | undefined)?.eas?.projectId ??
    process.env.EXPO_PUBLIC_EAS_PROJECT_ID ??
    null
  );
}

export async function registerForPushNotifications(): Promise<string | null> {
  if (Platform.OS === 'web') return null;
  if (!Device.isDevice) {
    console.warn('Push notifications only work on physical devices.');
    return null;
  }

  const Notifications = getNotifications();
  if (!Notifications) return null;

  try {
    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;
    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync({
        ios: {
          allowAlert: true,
          allowBadge: true,
          allowSound: true,
        },
      });
      finalStatus = status;
    }
    if (finalStatus !== 'granted') {
      console.warn('Failed to get push token: permission not granted.');
      return null;
    }

    await ensureAndroidChannels(Notifications);

    const easId = projectId();
    if (easId) {
      const expo = await Notifications.getExpoPushTokenAsync({ projectId: easId });
      return expo.data;
    }
    const native = await Notifications.getDevicePushTokenAsync();
    return typeof native.data === 'string' ? native.data : null;
  } catch (err) {
    console.warn('Could not obtain a push token', err);
    return null;
  }
}

export async function registerDeviceWithBackend() {
  const token = await registerForPushNotifications();
  if (!token) return null;
  const platform = Platform.OS === 'ios' ? 'IOS' : Platform.OS === 'android' ? 'ANDROID' : 'WEB';
  const provider =
    token.startsWith('ExponentPushToken') || token.startsWith('ExpoPushToken') ? 'EXPO' : 'FCM';
  await deviceApi.register({ token, platform, provider });
  return token;
}
