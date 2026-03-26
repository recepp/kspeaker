import Voice, { SpeechResultsEvent, SpeechErrorEvent } from '@react-native-community/voice';
import { Platform, PermissionsAndroid, Alert } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import { logInfo, logError, logWarning } from './logger';

// ============================================
// GLOBAL TYPE DECLARATIONS
// ============================================

declare const __DEV__: boolean;

// ============================================
// LOGGER WRAPPER (Production-Safe)
// ============================================

const log = {
  info: (tag: string, message: string, data?: any) => {
    if (__DEV__) console.log(`[${tag}] ${message}`, data || '');
    logInfo(`[${tag}] ${message}`, data);
  },
  error: (tag: string, message: string, error?: any) => {
    console.error(`[${tag}] ${message}`, error || '');
    // Convert error to Error object for Sentry
    const errorObj = error instanceof Error ? error : new Error(`${tag}: ${message}`);
    logError(errorObj, `${tag}: ${message}`);
  },
  warning: (tag: string, message: string, data?: any) => {
    if (__DEV__) console.warn(`[${tag}] ${message}`, data || '');
    logWarning(`[${tag}] ${message}`, data);
  },
};

// ============================================
// SIMULATOR DETECTION
// ============================================

const isSimulator = async (): Promise<boolean> => {
  if (Platform.OS === 'ios') {
    try {
      return await DeviceInfo.isEmulator();
    } catch (error) {
      log.error('Voice', 'Error detecting simulator', error);
      return false;
    }
  }
  return false;
};

// ============================================
// MOCK VOICE SERVICE FOR SIMULATOR (Development Only)
// ============================================

class MockVoiceService {
  private static mockTexts = [
    "Hello, how are you doing today",
    "I want to practice my English speaking skills",
    "Can you help me improve my pronunciation",
    "What topics can we discuss together",
    "Tell me about your favorite hobbies",
    "I'm learning English for my career",
    "How do I sound when I speak English",
    "Let's talk about something interesting"
  ];
  
  private static getRandomText(): string {
    return this.mockTexts[Math.floor(Math.random() * this.mockTexts.length)];
  }
  
  /**
   * Simulates real voice recognition with partial results
   * This mimics how real voice recognition works on device:
   * 1. Start listening (immediate)
   * 2. Send partial results as "user speaks" (incremental)
   * 3. Send final result when "user stops speaking"
   * 4. Trigger onEnd callback
   */
  static async simulateVoiceRecognition(
    onResult: (text: string) => void,
    onEnd?: () => void
  ): Promise<void> {
    log.info('MockVoice', '🎭 Simulating realistic voice recognition...');
    
    const mockText = this.getRandomText();
    const words = mockText.split(' ');
    
    // Phase 1: Simulate "listening" delay (user starting to speak)
    await new Promise<void>(resolve => setTimeout(() => resolve(), 500));
    log.info('MockVoice', '🎤 User "started speaking" (simulated)');
    
    // Phase 2: Send PARTIAL results word by word (realistic incremental recognition)
    let accumulatedText = '';
    for (let i = 0; i < words.length; i++) {
      accumulatedText += (i > 0 ? ' ' : '') + words[i];
      
      // Send partial result (simulates real-time recognition)
      log.info('MockVoice', `📝 Partial result ${i + 1}/${words.length}:`, accumulatedText);
      onResult(accumulatedText);
      
      // Random delay between words (150-300ms) - simulates natural speech
      await new Promise<void>(resolve => 
        setTimeout(() => resolve(), 150 + Math.random() * 150)
      );
    }
    
    // Phase 3: Small pause before finalizing (user stopped speaking)
    await new Promise<void>(resolve => setTimeout(() => resolve(), 300));
    
    // Phase 4: Send FINAL result one more time (ensures it's captured)
    log.info('MockVoice', '✅ Final result:', mockText);
    onResult(mockText);
    
    // Phase 5: Trigger onEnd after a short delay (simulates iOS native event)
    setTimeout(() => {
      log.info('MockVoice', '🏁 Recognition ended (simulated)');
      if (onEnd) onEnd();
    }, 200);
  }
}

// ============================================
// TYPES & INTERFACES (SOLID: Interface Segregation)
// ============================================

interface VoiceCallbacks {
  onResult: (text: string) => void;
  onError?: () => void;
  onEnd?: () => void;
}

interface VoiceState {
  isInitialized: boolean;
  isListening: boolean;
  callbacks: VoiceCallbacks | null;
  audioFormatErrorCount: number; // Track consecutive audio format errors
}

enum VoiceErrorType {
  AUDIO_FORMAT = 'AUDIO_FORMAT',
  PERMISSION = 'PERMISSION',
  INITIALIZATION = 'INITIALIZATION',
  UNKNOWN = 'UNKNOWN',
}

// ============================================
// STATE MANAGEMENT (SOLID: Single Responsibility)
// ============================================

class VoiceStateManager {
  private state: VoiceState = {
    isInitialized: false,
    isListening: false,
    callbacks: null,
    audioFormatErrorCount: 0,
  };

  getState(): VoiceState {
    return { ...this.state };
  }

  setInitialized(value: boolean): void {
    this.state.isInitialized = value;
  }

  setListening(value: boolean): void {
    this.state.isListening = value;
  }

  setCallbacks(callbacks: VoiceCallbacks | null): void {
    this.state.callbacks = callbacks;
  }

  incrementAudioFormatError(): void {
    this.state.audioFormatErrorCount++;
  }

  resetAudioFormatErrorCount(): void {
    this.state.audioFormatErrorCount = 0;
  }

  getAudioFormatErrorCount(): number {
    return this.state.audioFormatErrorCount;
  }

  reset(): void {
    this.state = {
      isInitialized: false,
      isListening: false,
      callbacks: null,
      audioFormatErrorCount: 0,
    };
  }

  isReady(): boolean {
    return this.state.isInitialized && !this.state.isListening;
  }
}

// ============================================
// ERROR HANDLING (SOLID: Open/Closed Principle)
// ============================================

class VoiceErrorHandler {
  /**
   * Check if error is a "No speech detected" graceful shutdown
   * This is NOT an error - it's normal iOS behavior when user stops speaking
   */
  static isNoSpeechDetected(error: any): boolean {
    const errorMsg = JSON.stringify(error?.error || error?.message || error || '').toLowerCase();
    const errorCode = error?.code || error?.error?.code || '';
    
    return (
      errorCode === 'recognition_fail' ||
      errorMsg.includes('no speech') ||
      errorMsg.includes('1110') ||
      errorMsg.includes('no audio') ||
      errorMsg.includes('speech not detected')
    );
  }
  
  static categorizeError(error: any): VoiceErrorType {
    const errorMsg = JSON.stringify(error?.error || error?.message || error || '');
    
    if (errorMsg.includes('IsFormatSampleRateAndChannelCountValid') ||
        errorMsg.includes('audio format') ||
        errorMsg.includes('sample rate') ||
        errorMsg.includes('start_recording')) {
      return VoiceErrorType.AUDIO_FORMAT;
    }
    
    if (errorMsg.includes('permission') || errorMsg.includes('denied')) {
      return VoiceErrorType.PERMISSION;
    }
    
    if (errorMsg.includes('initialization') || errorMsg.includes('not initialized')) {
      return VoiceErrorType.INITIALIZATION;
    }
    
    return VoiceErrorType.UNKNOWN;
  }

  static async handleError(errorType: VoiceErrorType, stateManager: VoiceStateManager): Promise<boolean> {
    log.error('Voice', `Error type: ${errorType}`);
    
    switch (errorType) {
      case VoiceErrorType.AUDIO_FORMAT:
        stateManager.incrementAudioFormatError();
        const errorCount = stateManager.getAudioFormatErrorCount();
        
        log.warning('Voice', `Audio format error (#${errorCount}) - performing aggressive reset...`);
        
        // CRITICAL: Exponential backoff for iOS audio session recovery
        const waitTime = Math.min(1000 * errorCount, 3000); // 1s, 2s, 3s max
        log.info('Voice', `Waiting ${waitTime}ms for iOS audio session to stabilize...`);
        
        await VoiceCleanupService.aggressiveReset(waitTime);
        stateManager.reset();
        
        // Return false if too many errors (unrecoverable)
        return errorCount < 3;
        
      case VoiceErrorType.PERMISSION:
        log.warning('Voice', 'Permission error - cannot recover');
        stateManager.setListening(false);
        return false;
        
      case VoiceErrorType.INITIALIZATION:
        log.warning('Voice', 'Initialization error - resetting state');
        stateManager.setInitialized(false);
        return true;
        
      default:
        // For UNKNOWN errors, just do a soft reset without excessive logging
        stateManager.setListening(false);
        return true;
    }
  }
}

// ============================================
// CLEANUP SERVICE (SOLID: Single Responsibility)
// ============================================

class VoiceCleanupService {
  private static async delay(ms: number): Promise<void> {
    return new Promise(resolve => {
      setTimeout(() => resolve(), ms);
    });
  }

  static async softCleanup(): Promise<void> {
    try {
      log.info('Voice', 'Soft cleanup...');
      await Voice.stop();
      await this.delay(300);
      Voice.removeAllListeners();
    } catch (error) {
      log.error('Voice', 'Soft cleanup error', error);
    }
  }

  static async aggressiveReset(additionalWait: number = 0): Promise<void> {
    try {
      log.info('Voice', 'AGGRESSIVE RESET - destroying iOS audio session...');
      
      // Step 1: Stop any active recognition
      try {
        await Voice.stop();
        await this.delay(300);
      } catch (e) {
        log.warning('Voice', 'Voice.stop() (ok if not running)');
      }
      
      // Step 2: Remove all event listeners
      Voice.removeAllListeners();
      await this.delay(200);
      
      // Step 3: First destroy
      try {
        await Voice.destroy();
        await this.delay(600); // Longer wait for iOS
      } catch (e) {
        log.warning('Voice', 'First destroy done');
      }
      
      // Step 4: Second destroy (iOS workaround)
      try {
        await Voice.destroy();
        await this.delay(600);
      } catch (e) {
        log.warning('Voice', 'Second destroy (expected)');
      }
      
      // Step 5: Third destroy for stubborn iOS audio session
      try {
        await Voice.destroy();
        await this.delay(400);
      } catch (e) {
        log.warning('Voice', 'Third destroy (expected)');
      }
      
      // Step 6: Additional wait for audio session stabilization
      if (additionalWait > 0) {
        await this.delay(additionalWait);
      }
      
      log.info('Voice', 'Aggressive reset complete');
    } catch (error) {
      log.error('Voice', 'Aggressive reset error', error);
    }
  }

  static async fullReset(): Promise<void> {
    return this.aggressiveReset(0);
  }

  static async cancel(): Promise<void> {
    try {
      log.info('Voice', 'Cancelling...');
      await Voice.cancel();
      await this.delay(200);
      Voice.removeAllListeners();
    } catch (error) {
      log.error('Voice', 'Cancel error', error);
    }
  }
}

// ============================================
// PERMISSION SERVICE (SOLID: Single Responsibility)
// ============================================

class VoicePermissionService {
  static async request(): Promise<boolean> {
    if (Platform.OS === 'android') {
      try {
        const granted = await PermissionsAndroid.request(
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
          {
            title: 'Microphone Permission',
            message: 'Kspeaker needs microphone access for speech recognition.',
            buttonNeutral: 'Ask Me Later',
            buttonNegative: 'Cancel',
            buttonPositive: 'OK',
          }
        );
        return granted === PermissionsAndroid.RESULTS.GRANTED;
      } catch (err) {
        log.error('Voice', 'Permission request error', err);
        return false;
      }
    }
    // iOS permissions handled by Info.plist
    return true;
  }

  static async check(): Promise<boolean> {
    // Voice.isAvailable() also checks permissions
    try {
      const available = await Voice.isAvailable();
      return !!available;
    } catch (error) {
      log.error('Voice', 'Permission check failed', error);
      return false;
    }
  }
}

// ============================================
// EVENT HANDLER SERVICE (SOLID: Single Responsibility)
// ============================================

class VoiceEventService {
  static setup(stateManager: VoiceStateManager): void {
    log.info('Voice', 'Setting up event handlers...');
    
    // Clean slate - remove old listeners
    Voice.removeAllListeners();
    
    Voice.onSpeechStart = () => {
      log.info('Voice', 'Speech started - mic is active');
      stateManager.setListening(true);
      // Reset error count on successful start
      stateManager.resetAudioFormatErrorCount();
    };

    Voice.onSpeechRecognized = () => {
      log.info('Voice', 'Speech recognized - got audio input');
    };

    Voice.onSpeechResults = (event: SpeechResultsEvent) => {
      const callbacks = stateManager.getState().callbacks;
      if (event.value && event.value.length > 0 && callbacks?.onResult) {
        const result = event.value[0];
        log.info('Voice', `Final result: "${result}"`);
        callbacks.onResult(result);
      }
    };

    Voice.onSpeechPartialResults = (event: SpeechResultsEvent) => {
      const callbacks = stateManager.getState().callbacks;
      if (event.value && event.value.length > 0 && callbacks?.onResult) {
        const partial = event.value[0];
        log.info('Voice', `Partial: "${partial}"`);
        callbacks.onResult(partial);
      }
    };

    Voice.onSpeechError = async (event: SpeechErrorEvent) => {
      log.warning('Voice', 'Speech error', event?.error);
      
      const callbacks = stateManager.getState().callbacks;

      // Check if it's a "No speech detected" graceful shutdown
      if (VoiceErrorHandler.isNoSpeechDetected(event?.error)) {
        log.info('Voice', 'No speech detected - graceful shutdown');
        stateManager.setListening(false);
        if (callbacks?.onEnd) {
          callbacks.onEnd();
        }
        return;
      }

      const errorType = VoiceErrorHandler.categorizeError(event);
      
      // Handle error based on type - returns false if unrecoverable
      const canRecover = await VoiceErrorHandler.handleError(errorType, stateManager);
      
      // Call user's error callback
      if (callbacks?.onError) {
        const errorCallback = callbacks.onError;
        stateManager.setCallbacks(null);
        errorCallback();
      }
      
      // Show user message if unrecoverable
      if (!canRecover && errorType === VoiceErrorType.AUDIO_FORMAT) {
        Alert.alert(
          'Microphone Issue',
          'Unable to start voice recognition. Please close and reopen the app.',
          [{ text: 'OK' }]
        );
      }
    };

    Voice.onSpeechEnd = () => {
      log.info('Voice', 'Speech ended');
      stateManager.setListening(false);
      
      const callbacks = stateManager.getState().callbacks;
      if (callbacks?.onEnd) {
        callbacks.onEnd();
      }
    };
    
    log.info('Voice', 'Event handlers ready');
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

const stateManager = new VoiceStateManager();

// ============================================
// PUBLIC API (Clean, Simple Interface)
// ============================================

/**
 * Initialize voice recognition
 * Must be called once before using voice features
 */
export async function initializeVoice(): Promise<boolean> {
  const state = stateManager.getState();
  
  if (state.isInitialized) {
    log.info('Voice', 'Already initialized');
    return true;
  }

  try {
    log.info('Voice', 'Initializing...');
    
    // Request permissions
    const hasPermission = await VoicePermissionService.request();
    if (!hasPermission) {
      log.error('Voice', 'Permission denied');
      return false;
    }

    // Aggressive cleanup before init
    await VoiceCleanupService.aggressiveReset(500);
    
    stateManager.setInitialized(true);
    log.info('Voice', 'Initialized');
    return true;
  } catch (error) {
    log.error('Voice', 'Initialization failed', error);
    return false;
  }
}

/**
 * Check if voice recognition is available
 */
export async function isVoiceAvailable(): Promise<boolean> {
  return VoicePermissionService.check();
}

/**
 * Start listening for speech
 * ALWAYS uses real voice recognition (even on simulator)
 */
export async function startListening(
  onResult: (text: string) => void,
  onError?: () => void,
  onEnd?: () => void
): Promise<void> {
  const state = stateManager.getState();

  // ============================================
  // ALWAYS USE REAL VOICE RECOGNITION
  // MockVoiceService removed - simulator will use real microphone
  // ============================================
  
  try {
    log.info('Voice', '🎤 Starting REAL voice recognition...');
    
    // Ensure initialized
    if (!state.isInitialized) {
      const initialized = await initializeVoice();
      if (!initialized) {
        log.error('Voice', 'Cannot start - initialization failed');
        onError?.();
        return;
      }
    }

    // If already listening, aggressive cleanup first
    if (state.isListening) {
      log.warning('Voice', 'Already listening - aggressive cleanup...');
      await VoiceCleanupService.aggressiveReset(800);
      stateManager.setListening(false);
      stateManager.setInitialized(false);
      
      // Re-initialize
      await initializeVoice();
    }

    // Check availability
    const available = await isVoiceAvailable();
    if (!available) {
      log.error('Voice', 'Not available');
      Alert.alert('Not Available', 'Speech recognition is not available.');
      onError?.();
      return;
    }

    // Store callbacks
    stateManager.setCallbacks({ onResult, onError, onEnd });
    
    // Setup event handlers
    VoiceEventService.setup(stateManager);

    // Start recognition
    log.info('Voice', 'Starting recognition...');
    await Voice.start('en-US');
    stateManager.setListening(true);
    log.info('Voice', '✅ Real voice recognition started - speak now!');

  } catch (error) {
    log.error('Voice', 'Failed to start', error);
    stateManager.setListening(false);
    
    const errorType = VoiceErrorHandler.categorizeError(error);
    await VoiceErrorHandler.handleError(errorType, stateManager);
    
    onError?.();
  }
}

/**
 * Stop listening
 */
export async function stopListening(): Promise<void> {
  const state = stateManager.getState();
  
  if (!state.isListening) {
    log.info('Voice', 'Not listening, skipping stop');
    return;
  }

  try {
    log.info('Voice', 'Stopping...');
    await VoiceCleanupService.softCleanup();
    stateManager.setListening(false);
    stateManager.setCallbacks(null);
    log.info('Voice', 'Stopped');
  } catch (error) {
    log.error('Voice', 'Stop error', error);
    stateManager.setListening(false);
    stateManager.setCallbacks(null);
  }
}

/**
 * Cancel listening
 */
export async function cancelListening(): Promise<void> {
  try {
    log.info('Voice', 'Cancelling...');
    await VoiceCleanupService.cancel();
    stateManager.setListening(false);
    stateManager.setCallbacks(null);
    log.info('Voice', 'Cancelled');
  } catch (error) {
    log.error('Voice', 'Cancel error', error);
    stateManager.setListening(false);
    stateManager.setCallbacks(null);
  }
}

/**
 * Destroy voice module (call on app unmount)
 */
export async function destroyVoice(): Promise<void> {
  try {
    log.info('Voice', 'Destroying...');
    await VoiceCleanupService.aggressiveReset(500);
    stateManager.reset();
    log.info('Voice', 'Destroyed');
  } catch (error) {
    log.error('Voice', 'Destroy error', error);
    stateManager.reset();
  }
}
