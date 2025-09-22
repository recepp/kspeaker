import { getOrCreateDeviceId } from './deviceId';
import { Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';

import { config } from './config';

interface ApiState {
  deviceId: string | null;
  appVersion: string;
  buildNumber: string;
  platform: string;
  systemVersion: string;
  email: string | null;
  isRegistered: boolean;
}

const apiState: ApiState = {
  deviceId: null,
  appVersion: DeviceInfo.getVersion(),
  buildNumber: DeviceInfo.getBuildNumber(),
  platform: Platform.OS,
  systemVersion: Platform.Version.toString(),
  email: null,
  isRegistered: false,
};

// Initialize device ID and other device information
export const initializeApi = async () => {
  apiState.deviceId = await getOrCreateDeviceId();
};

// Get headers with device ID, platform, and version information
const getHeaders = () => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Platform': apiState.platform,
    'X-Platform-Version': apiState.systemVersion,
    'X-App-Version': `${apiState.appVersion}+${apiState.buildNumber}`,
  };
  
  if (apiState.deviceId) {
    headers['X-Device-ID'] = apiState.deviceId;
  }
  
  return headers;
};

// Register a new user
export async function registerUser(email: string): Promise<boolean> {
  try {
    if (!apiState.deviceId) {
      await initializeApi();
    }

    const response = await fetch(`${config.API_BASE_URL}/register`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({
        email,
        apiKey: 'kartezya-kspeaker-beta'
      }),
    });

    if (response.ok) {
      apiState.email = email;
      apiState.isRegistered = true;
      return true;
    }
    return false;
  } catch (error) {
    console.error('Registration error:', error);
    return false;
  }
}

// Simple API request function for chat
export async function sendChatMessage(text: string): Promise<string> {
  // Initialize device ID if not already done
  if (!apiState.deviceId) {
    await initializeApi();
  }

  const response = await fetch(`${config.API_BASE_URL}/generate`, {
    method: 'POST',
    headers: getHeaders(),
    body: JSON.stringify({ text }),
  });
  
  const data = await response.json();
  return data.response || data.reply || 'No response';
}
