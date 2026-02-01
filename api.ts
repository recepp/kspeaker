import { getOrCreateDeviceId } from './deviceId';
import { Platform } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import { checkNetworkConnection, isNetworkError, retryWithExponentialBackoff } from './networkUtils';
import { logError, logInfo, logWarning } from './logger';

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
    // API key should come from environment variables for security
    'X-Api-Key': config.API_KEY || `kspeaker_secure_api_key_1`,
  };
  
  if (apiState.deviceId) {
    headers['X-Device-ID'] = apiState.deviceId;
  }
  
  if (conversationMode) {
    headers['X-Role-Context'] = conversationMode;
  }
  
  return headers;
};

// Register a new user with voucher (or without voucher for free tier)
export async function registerUser(voucherCode?: string): Promise<boolean> {
  try {
    if (!apiState.deviceId) {
      await initializeApi();
    }

    const body: any = {};
    
    // Add voucher only if provided
    if (voucherCode) {
      body.voucher = voucherCode;
    }

    console.log('[API] Registering device with voucher:', voucherCode);
    console.log('[API] Request body:', JSON.stringify(body));
    console.log('[API] Device ID:', apiState.deviceId);
    console.log('[API] API URL:', `${config.API_BASE_URL}/register`);

    const response = await fetch(`${config.API_BASE_URL}/register`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify(body),
    });

    console.log('[API] Registration response status:', response.status);
    
    // Try to get response body for debugging
    const responseText = await response.text();
    console.log('[API] Registration response body:', responseText);

    if (response.ok) {
      apiState.isRegistered = true;
      logInfo(`[API] Device registered successfully${voucherCode ? ' with voucher' : ' (free tier)'}`);
      return true;
    }
    
    // If 409 (already registered), that's also success
    if (response.status === 409) {
      apiState.isRegistered = true;
      logInfo(`[API] Device already registered`);
      return true;
    }
    
    logWarning(`[API] Registration failed: ${response.status} - ${responseText}`);
    return false;
  } catch (error) {
    console.error('[API] Registration error:', error);
    logError(error as Error, 'API registerUser');
    return false;
  }
}

// Admin function to create a new voucher
export async function createVoucher(expiresAt: string): Promise<string | null> {
  try {
    // SECURITY WARNING: Admin key should NEVER be in client code
    // This function should only be used in development/testing
    // In production, vouchers should be created via secure backend admin panel
    if (!__DEV__) {
      console.error('[API] ⚠️ Admin functions should not be called in production!');
      return null;
    }
    
    const response = await fetch(`${config.API_BASE_URL}/vouchers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': config.ADMIN_API_KEY || 'kspeaker_secure_api_key_admin',
      },
      body: JSON.stringify({
        expiresAt
      }),
    });

    if (response.ok) {
      const data = await response.json();
      console.log('[API] 🎟️ Voucher response:', JSON.stringify(data, null, 2));
      
      // Try multiple possible field names from backend
      const voucherCode = data.voucher || data.voucherCode || data.code || data.id;
      
      if (voucherCode) {
        console.log('[API] ✅ Extracted voucher code:', voucherCode);
        logInfo(`[API] Voucher created successfully: ${voucherCode}`);
        return voucherCode;
      } else {
        console.error('[API] ❌ Could not find voucher code in response:', data);
        return null;
      }
    }
    
    const errorText = await response.text();
    console.error('[API] ❌ Voucher creation failed:', response.status, errorText);
    logWarning(`[API] Voucher creation failed: ${response.status} - ${errorText}`);
    return null;
  } catch (error) {
    console.error('[API] ❌ Voucher creation error:', error);
    logError(error as Error, 'API createVoucher');
    return null;
  }
}

// Simple API request function for chat
export async function sendChatMessage(text: string, conversationMode?: string): Promise<string> {
  // Initialize device ID if not already done
  if (!apiState.deviceId) {
    await initializeApi();
  }

  // Check network connection first
  const isConnected = await checkNetworkConnection();
  if (!isConnected) {
    throw new Error('NETWORK_ERROR: No internet connection');
  }

  // Use retry logic with exponential backoff
  return retryWithExponentialBackoff(async () => {
    try {
      const response = await fetch(`${config.API_BASE_URL}/generate`, {
        method: 'POST',
        headers: getHeaders(conversationMode),
        body: JSON.stringify({ text }),
      });
      
      if (__DEV__) console.log('[API] Response status:', response.status);
      
      // Check for rate limit error (429)
      if (response.status === 429) {
        throw new Error('RATE_LIMIT_EXCEEDED');
      }
      
      // Try to parse JSON response
      let data;
      try {
        data = await response.json();
        if (__DEV__) console.log('[API] Response data:', JSON.stringify(data).substring(0, 200));
      } catch (parseError) {
        logError(parseError as Error, 'API JSON parse');
        throw new Error('QUOTA_EXCEEDED');
      }
      
      // Check if response is empty or null
      const reply = data.response || data.reply;
      if (__DEV__) console.log('[API] Reply extracted:', reply ? reply.substring(0, 100) : 'EMPTY');
      
      if (!reply || reply.trim() === '') {
        const errorMessage = data.message || data.error;
        if (__DEV__) console.log('[API] Empty reply, error message:', errorMessage);
        throw new Error(errorMessage || 'QUOTA_EXCEEDED');
      }
      
      logInfo(`[API] Chat response received: ${reply.substring(0, 50)}...`);
      return reply;
    } catch (error: any) {
      if (!__DEV__) {
        logError(error, 'API sendChatMessage');
      }
      
      // Re-throw to be handled by UI
      throw error;
    }
  }, 2, 1500); // Max 2 retries with 1.5s base delay
}

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

/**
 * Send support message to omer.yilmaz@kartezya.com
 * Email will be sent with Kspeaker branded HTML template
 */
export async function sendSupportMessage(email: string, description: string): Promise<boolean> {
  try {
    if (!apiState.deviceId) {
      await initializeApi();
    }

    console.log('[API] Sending support message...');
    console.log('[API] From:', email);
    console.log('[API] Description:', description.substring(0, 50) + '...');

    const response = await fetch(`${config.API_BASE_URL}/support`, {
      method: 'POST',
      headers: getHeaders(),
      body: JSON.stringify({ 
        email,
        description,
        deviceInfo: {
          deviceId: apiState.deviceId,
          platform: apiState.platform,
          systemVersion: apiState.systemVersion,
          appVersion: apiState.appVersion,
          buildNumber: apiState.buildNumber,
        }
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[API] Support message failed:', response.status, errorText);
      logWarning(`[API] Support message failed: ${response.status} - ${errorText}`);
      return false;
    }

    console.log('[API] ✅ Support message sent successfully');
    logInfo('[API] Support message sent successfully');
    return true;
  } catch (error) {
    console.error('[API] Support message error:', error);
    logError(error as Error, 'API sendSupportMessage');
    return false;
  }
}
