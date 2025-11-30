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
const getHeaders = (conversationMode?: string) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    'X-Platform': apiState.platform,
    'X-Platform-Version': apiState.systemVersion,
    'X-App-Version': `${apiState.appVersion}+${apiState.buildNumber}`,
    'X-Api-Key': `kspeaker_secure_api_key_1`,
  };
  
  if (apiState.deviceId) {
    headers['X-Device-ID'] = apiState.deviceId;
  }
  
  if (conversationMode) {
    headers['X-Conversation-Mode'] = conversationMode;
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
export async function sendChatMessage(text: string, conversationMode?: string): Promise<string> {
  // Initialize device ID if not already done
  if (!apiState.deviceId) {
    await initializeApi();
  }

  const response = await fetch(`${config.API_BASE_URL}/generate`, {
    method: 'POST',
    headers: getHeaders(conversationMode),
    body: JSON.stringify({ text }),
  });
  
  const data = await response.json();
  
  // Check if response is empty or null, throw special error
  const reply = data.response || data.reply;
  if (!reply || reply.trim() === '') {
    throw new Error('WAITING_APPROVAL');
  }
  
  return reply;
}

// Generate speech using ElevenLabs free public TTS
export async function generateSpeechElevenLabs(text: string): Promise<string | null> {
  try {
    // Using ElevenLabs free public voices
    // Rachel voice (natural, clear, female)
    const voiceId = 'Rachel'; // Other free voices: Adam, Antoni, Bella, Domi, Elli, Josh
    
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        text: text,
        model_id: 'eleven_monolingual_v1', // Free model
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75
        }
      }),
    });

    if (!response.ok) {
      console.error('[ElevenLabs TTS] Error:', response.status);
      return null;
    }

    // Response is audio blob
    const audioBlob = await response.blob();
    const base64Audio = await blobToBase64(audioBlob);
    return base64Audio;
  } catch (error) {
    console.error('[ElevenLabs TTS] Error:', error);
    return null;
  }
}

// Helper function to convert blob to base64
const blobToBase64 = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64 = (reader.result as string).split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
};

// Generate speech using OpenAI TTS (same voice as ChatGPT)
export async function generateSpeech(text: string, voice: 'alloy' | 'echo' | 'fable' | 'onyx' | 'nova' | 'shimmer' = 'nova'): Promise<string | null> {
  try {
    if (!apiState.deviceId) {
      await initializeApi();
    }

    const response = await fetch(`${config.API_BASE_URL}/tts`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ 
        text,
        voice, // nova = female, natural, warm (most GPT-like)
        model: 'tts-1-hd', // High quality model
        speed: 1.0 // Normal speed
      }),
    });

    if (!response.ok) {
      console.error('[TTS API] Error:', response.status);
      return null;
    }

    // Response is audio file data (base64 or URL)
    const data = await response.json();
    return data.audioUrl || data.audioData || null;
  } catch (error) {
    console.error('[TTS API] Error generating speech:', error);
    return null;
  }
}
