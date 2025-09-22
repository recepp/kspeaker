import AsyncStorage from '@react-native-async-storage/async-storage';

const REGISTRATION_KEY = '@KSpeaker:registration';

interface RegistrationData {
  email: string;
  isRegistered: boolean;
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

export const saveRegistration = async (email: string): Promise<boolean> => {
  try {
    const data: RegistrationData = {
      email,
      isRegistered: true
    };
    await AsyncStorage.setItem(REGISTRATION_KEY, JSON.stringify(data));
    return true;
  } catch (error) {
    console.error('Error saving registration:', error);
    return false;
  }
};