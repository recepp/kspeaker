import AsyncStorage from '@react-native-async-storage/async-storage';
import { registerUser } from './api';

const REGISTRATION_KEY = '@KSpeaker:registration';
const VOUCHER_KEY = '@KSpeaker:voucher';
const MESSAGE_COUNT_KEY = '@KSpeaker:messageCount';
const LAST_RESET_KEY = '@KSpeaker:lastReset';

interface RegistrationData {
  voucherCode: string;
  isRegistered: boolean;
  registeredAt: string;
}

export const checkRegistration = async (): Promise<RegistrationData | null> => {
  try {
    const data = await AsyncStorage.getItem(REGISTRATION_KEY);
    return data ? JSON.parse(data) : null;
  } catch (error) {
    console.error('Error checking registration:', error);
    return null;
  }
};

export const saveRegistration = async (voucherCode: string): Promise<boolean> => {
  try {
    // Register with backend API
    const success = await registerUser(voucherCode);
    
    if (!success) {
      return false;
    }
    
    // Save to local storage
    const data: RegistrationData = {
      voucherCode,
      isRegistered: true,
      registeredAt: new Date().toISOString()
    };
    await AsyncStorage.setItem(REGISTRATION_KEY, JSON.stringify(data));
    await AsyncStorage.setItem(VOUCHER_KEY, voucherCode);
    return true;
  } catch (error) {
    console.error('Error saving registration:', error);
    return false;
  }
};

export const clearRegistration = async (): Promise<boolean> => {
  try {
    // CRITICAL FIX: Clear ALL registration data including voucher and message count
    await AsyncStorage.removeItem(REGISTRATION_KEY);
    await AsyncStorage.removeItem(VOUCHER_KEY);
    await AsyncStorage.removeItem(MESSAGE_COUNT_KEY);
    await AsyncStorage.removeItem(LAST_RESET_KEY);
    console.log('[TEST] ✅ All registration data cleared (registration, voucher, message count)');
    return true;
  } catch (error) {
    console.error('[TEST] ❌ Error clearing registration:', error);
    return false;
  }
};

export const saveVoucher = async (voucherCode: string): Promise<boolean> => {
  try {
    await AsyncStorage.setItem(VOUCHER_KEY, voucherCode);
    return true;
  } catch (error) {
    console.error('Error saving voucher:', error);
    return false;
  }
};

export const checkVoucher = async (): Promise<string | null> => {
  try {
    const voucher = await AsyncStorage.getItem(VOUCHER_KEY);
    return voucher;
  } catch (error) {
    console.error('Error checking voucher:', error);
    return null;
  }
};

export const getMessageCount = async (): Promise<number> => {
  try {
    const lastReset = await AsyncStorage.getItem(LAST_RESET_KEY);
    const today = new Date().toDateString();
    
    // Reset count if it's a new day
    if (lastReset !== today) {
      await AsyncStorage.setItem(MESSAGE_COUNT_KEY, '0');
      await AsyncStorage.setItem(LAST_RESET_KEY, today);
      return 0;
    }
    
    const count = await AsyncStorage.getItem(MESSAGE_COUNT_KEY);
    return count ? parseInt(count, 10) : 0;
  } catch (error) {
    console.error('Error getting message count:', error);
    return 0;
  }
};

export const incrementMessageCount = async (): Promise<number> => {
  try {
    const currentCount = await getMessageCount();
    const newCount = currentCount + 1;
    await AsyncStorage.setItem(MESSAGE_COUNT_KEY, newCount.toString());
    return newCount;
  } catch (error) {
    console.error('Error incrementing message count:', error);
    return 0;
  }
};

export const canSendMessage = async (): Promise<boolean> => {
  try {
    const hasVoucher = await checkVoucher();
    if (hasVoucher) return true; // Unlimited if has voucher
    
    const count = await getMessageCount();
    return count < 5; // Free users get 5 messages per day
  } catch (error) {
    console.error('Error checking message permission:', error);
    return false;
  }
};