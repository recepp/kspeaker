import Voice from '@react-native-community/voice';

let errorCallback: (() => void) | null = null;

export function startListening(onResult: (text: string) => void, onError?: () => void) {
  // Store error callback
  if (onError) {
    errorCallback = onError;
  }
  
  Voice.onSpeechResults = (event) => {
    if (event.value && event.value.length > 0) {
      onResult(event.value[0]);
    }
  };
  
  Voice.onSpeechError = (event) => {
    console.log('[Voice] Speech error:', event); // Changed from console.error - don't show red error to user
    
    // Call error callback to reset state
    if (errorCallback) {
      console.log('[Voice] Calling error callback to reset state');
      errorCallback();
      errorCallback = null;
    }
  };
  
  Voice.onSpeechStart = () => {
    console.log('[Voice] ✅ Speech started');
  };
  
  Voice.start('en-US').catch((error) => {
    console.log('[Voice] Failed to start:', error); // Changed from console.error
    
    // Call error callback on startup failure too
    if (errorCallback) {
      errorCallback();
      errorCallback = null;
    }
  });
}

export function stopListening() {
  Voice.stop().catch((error) => {
    console.log('[Voice] Failed to stop:', error); // Changed from console.error
  });
}
