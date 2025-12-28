// Network utility for offline detection and retry logic
import NetInfo from '@react-native-community/netinfo';

export const checkNetworkConnection = async (): Promise<boolean> => {
  const state = await NetInfo.fetch();
  return state.isConnected ?? false;
};

export const isNetworkError = (error: any): boolean => {
  return (
    error.message === 'Network request failed' ||
    error.message?.includes('network') ||
    error.message?.includes('timeout') ||
    error.message?.includes('connection')
  );
};

// Retry logic for network requests
export const retryWithExponentialBackoff = async <T>(
  fn: () => Promise<T>,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<T> => {
  let lastError: any;
  
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;
      
      if (!isNetworkError(error) || i === maxRetries - 1) {
        throw error;
      }
      
      // Exponential backoff: 1s, 2s, 4s
      const delay = baseDelay * Math.pow(2, i);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  throw lastError;
};
