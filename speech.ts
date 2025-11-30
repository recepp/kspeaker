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
    console.error('[Voice] Speech error:', event);
    
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
    console.error('[Voice] Failed to start:', error);
    
    // Call error callback on startup failure too
    if (errorCallback) {
      errorCallback();
      errorCallback = null;
    }
  });
}

export function stopListening() {
  Voice.stop().catch((error) => {
    console.error('[Voice] Failed to stop:', error);
  });
}
