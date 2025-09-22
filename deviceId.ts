import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

const DEVICE_ID_KEY = '@KSpeaker:deviceId';

// Generate a random device ID
const generateDeviceId = () => {
  const timestamp = Date.now().toString(36);
  const randomStr = Math.random().toString(36).substring(2, 8);
  const platform = Platform.OS;
  return `${platform}_${timestamp}_${randomStr}`;
};

// Get or create device ID
export const getOrCreateDeviceId = async (): Promise<string> => {
  try {
    // Try to get existing device ID
    let deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);
    
    if (!deviceId) {
      // Generate new device ID if none exists
      deviceId = generateDeviceId();
      // Save the new device ID
      await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
    }
    
    return deviceId;
  } catch (error) {
    console.error('Error managing device ID:', error);
    // Return a temporary device ID if storage fails
    return generateDeviceId();
  }
};