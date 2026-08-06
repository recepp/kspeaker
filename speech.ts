import Voice, { SpeechResultsEvent, SpeechErrorEvent } from '@react-native-community/voice';
import { Platform, Alert } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import { logInfo, logError, logWarning } from './logger';
import {
  requestMicrophonePermission,
  hasMicrophonePermission,
} from './src/platform/permissions';
import { LISTENING_POLICY, type ListenStartPriority } from './src/shared/speech/listeningPolicy';
import { pickBestHypothesis } from './src/shared/speech/mergeTranscript';

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
  try {
    return await DeviceInfo.isEmulator();
  } catch (error) {
    log.error('Voice', 'Error detecting simulator/emulator', error);
    return false;
  }
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

  /** Fast path before first / next start — no destroy storm */
  static async prepareForStart(): Promise<void> {
    try {
      const recognizing = await Voice.isRecognizing();
      if (recognizing) {
        try {
          await Voice.stop();
        } catch {
          // ignore
        }
        await this.delay(LISTENING_POLICY.softStopDelayMs);
      }
    } catch (error) {
      log.warning('Voice', 'prepareForStart check failed (continuing)', error);
    }
  }

  static async softCleanup(): Promise<void> {
    try {
      log.info('Voice', 'Soft cleanup...');
      try {
        await Voice.stop();
      } catch {
        // ignore if not running
      }
      await this.delay(LISTENING_POLICY.softStopDelayMs);
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
    return requestMicrophonePermission();
  }

  static async check(): Promise<boolean> {
    try {
      const permissionOk = await hasMicrophonePermission();
      if (!permissionOk) return false;
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
  private static endGraceTimer: ReturnType<typeof setTimeout> | null = null;

  static clearPendingEnd(): void {
    if (this.endGraceTimer) {
      clearTimeout(this.endGraceTimer);
      this.endGraceTimer = null;
    }
  }

  static setup(stateManager: VoiceStateManager): void {
    log.info('Voice', 'Setting up event handlers...');
    
    this.clearPendingEnd();
    Voice.removeAllListeners();
    
    Voice.onSpeechStart = () => {
      log.info('Voice', 'Speech started - mic is active');
      stateManager.setListening(true);
      stateManager.resetAudioFormatErrorCount();
    };

    Voice.onSpeechRecognized = () => {
      log.info('Voice', 'Speech recognized - got audio input');
    };

    const emitBest = (event: SpeechResultsEvent, label: string) => {
      const callbacks = stateManager.getState().callbacks;
      const best = pickBestHypothesis(event.value);
      if (!best || !callbacks?.onResult) return;
      log.info('Voice', `${label}: "${best}"`);
      callbacks.onResult(best);
    };

    Voice.onSpeechResults = (event: SpeechResultsEvent) => {
      emitBest(event, 'Final');
    };

    Voice.onSpeechPartialResults = (event: SpeechResultsEvent) => {
      emitBest(event, 'Partial');
    };

    Voice.onSpeechError = async (event: SpeechErrorEvent) => {
      log.warning('Voice', 'Speech error', event?.error);
      this.clearPendingEnd();
      
      const callbacks = stateManager.getState().callbacks;

      if (VoiceErrorHandler.isNoSpeechDetected(event?.error)) {
        log.info('Voice', 'No speech detected - graceful shutdown');
        stateManager.setListening(false);
        // Grace so a late final result can still land
        this.endGraceTimer = setTimeout(() => {
          this.endGraceTimer = null;
          callbacks?.onEnd?.();
        }, LISTENING_POLICY.endGraceMs);
        return;
      }

      const errorType = VoiceErrorHandler.categorizeError(event);
      const canRecover = await VoiceErrorHandler.handleError(errorType, stateManager);
      
      if (callbacks?.onError) {
        const errorCallback = callbacks.onError;
        stateManager.setCallbacks(null);
        errorCallback();
      }
      
      if (!canRecover && errorType === VoiceErrorType.AUDIO_FORMAT) {
        Alert.alert(
          'Microphone Issue',
          'Unable to start voice recognition. Please close and reopen the app.',
          [{ text: 'OK' }]
        );
      }
    };

    Voice.onSpeechEnd = () => {
      log.info('Voice', 'Speech ended — waiting for final hypothesis');
      stateManager.setListening(false);
      this.clearPendingEnd();
      this.endGraceTimer = setTimeout(() => {
        this.endGraceTimer = null;
        const callbacks = stateManager.getState().callbacks;
        callbacks?.onEnd?.();
      }, LISTENING_POLICY.endGraceMs);
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
    
    const hasPermission = await VoicePermissionService.request();
    if (!hasPermission) {
      log.error('Voice', 'Permission denied');
      return false;
    }

    // Light prep only — aggressive destroy is reserved for audio-format recovery
    await VoiceCleanupService.prepareForStart();
    
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

export interface StartListeningOptions {
  /** Skip availability round-trip + heavy prepare (post-TTS conversation turn) */
  priority?: ListenStartPriority;
}

/** Cached after first successful availability check — hot path must not wait on it. */
let voiceAvailableCache: boolean | null = null;

/**
 * Warm the voice stack while TTS is speaking so Voice.start is near-instant
 * when the assistant finishes (prevents missing the user's first words).
 */
export async function primeVoiceSession(): Promise<void> {
  try {
    const state = stateManager.getState();
    if (!state.isInitialized) {
      await initializeVoice();
    }
    VoiceEventService.clearPendingEnd();
    // Ensure we are not still recognizing from a prior turn
    await VoiceCleanupService.prepareForStart();
    if (voiceAvailableCache === null) {
      voiceAvailableCache = await isVoiceAvailable();
    }
    log.info('Voice', 'Primed for next listen turn');
  } catch (error) {
    log.warning('Voice', 'primeVoiceSession failed (non-fatal)', error);
  }
}

/**
 * Start listening for speech
 * ALWAYS uses real voice recognition (even on simulator)
 */
export async function startListening(
  onResult: (text: string) => void,
  onError?: () => void,
  onEnd?: () => void,
  locale: string = 'en-US',
  options: StartListeningOptions = {}
): Promise<void> {
  const state = stateManager.getState();
  const fast = options.priority === 'fast';

  try {
    log.info('Voice', `🎤 Starting REAL voice recognition (${locale}, priority=${fast ? 'fast' : 'normal'})...`);
    
    if (!state.isInitialized) {
      const initialized = await initializeVoice();
      if (!initialized) {
        log.error('Voice', 'Cannot start - initialization failed');
        onError?.();
        return;
      }
    }

    // Soft restart if already listening — keep session warm
    if (state.isListening) {
      log.warning('Voice', 'Already listening - soft restart...');
      VoiceEventService.clearPendingEnd();
      await VoiceCleanupService.softCleanup();
      stateManager.setListening(false);
    } else if (!fast) {
      await VoiceCleanupService.prepareForStart();
    }
    // fast path: priming already ran during TTS — skip extra prepare latency

    if (!fast || voiceAvailableCache !== true) {
      const available = await isVoiceAvailable();
      voiceAvailableCache = available;
      if (!available) {
        log.error('Voice', 'Not available');
        Alert.alert('Not Available', 'Speech recognition is not available.');
        onError?.();
        return;
      }
    }

    stateManager.setCallbacks({ onResult, onError, onEnd });
    VoiceEventService.setup(stateManager);

    log.info('Voice', `Starting recognition with locale ${locale}...`);
    if (Platform.OS === 'android') {
      await Voice.start(locale, {
        EXTRA_LANGUAGE_MODEL: 'LANGUAGE_MODEL_FREE_FORM',
        EXTRA_MAX_RESULTS: 5,
        EXTRA_PARTIAL_RESULTS: true,
        EXTRA_SPEECH_INPUT_COMPLETE_SILENCE_LENGTH_MILLIS: 2000,
        EXTRA_SPEECH_INPUT_POSSIBLY_COMPLETE_SILENCE_LENGTH_MILLIS: 1500,
        EXTRA_SPEECH_INPUT_MINIMUM_LENGTH_MILLIS: 800,
      });
    } else {
      await Voice.start(locale);
    }
    stateManager.setListening(true);
    voiceAvailableCache = true;
    log.info('Voice', '✅ Real voice recognition started - speak now!');

  } catch (error) {
    log.error('Voice', 'Failed to start', error);
    stateManager.setListening(false);
    // Invalidate cache so next attempt re-checks
    voiceAvailableCache = null;
    
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
    VoiceEventService.clearPendingEnd();
    return;
  }

  try {
    log.info('Voice', 'Stopping...');
    VoiceEventService.clearPendingEnd();
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
    VoiceEventService.clearPendingEnd();
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
    VoiceEventService.clearPendingEnd();
    await VoiceCleanupService.aggressiveReset(500);
    stateManager.reset();
    log.info('Voice', 'Destroyed');
  } catch (error) {
    log.error('Voice', 'Destroy error', error);
    stateManager.reset();
  }
}
