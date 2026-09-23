import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { Platform } from 'react-native';
import { deviceApi } from '@/services/api/notification.api';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

async function ensureAndroidChannels() {
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

  await ensureAndroidChannels();

  try {
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
