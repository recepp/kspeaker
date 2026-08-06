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
  /** Ignore native errors while we intentionally stop/cancel (prevents UNKNOWN loops). */
  suppressingErrors: boolean;
}

enum VoiceErrorType {
  AUDIO_FORMAT = 'AUDIO_FORMAT',
  PERMISSION = 'PERMISSION',
  INITIALIZATION = 'INITIALIZATION',
  LOCALE = 'LOCALE',
  BUSY = 'BUSY',
  NO_MATCH = 'NO_MATCH',
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
    suppressingErrors: false,
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

  setSuppressingErrors(value: boolean): void {
    this.state.suppressingErrors = value;
  }

  isSuppressingErrors(): boolean {
    return this.state.suppressingErrors;
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
      suppressingErrors: false,
    };
  }

  isReady(): boolean {
    return this.state.isInitialized && !this.state.isListening;
  }
}

// ============================================
// ERROR HANDLING (SOLID: Open/Closed Principle)
// ============================================

type NormalizedVoiceError = {
  code: string;
  message: string;
  raw: string;
};

class VoiceErrorHandler {
  static normalize(error: any): NormalizedVoiceError {
    const nested = error?.error ?? error;
    const code = String(
      nested?.code ?? error?.code ?? nested?.errorCode ?? ''
    ).toLowerCase();
    const message = String(
      nested?.message ?? error?.message ?? nested ?? ''
    );
    const raw = JSON.stringify(error ?? '').toLowerCase();
    return { code, message: message.toLowerCase(), raw };
  }

  /**
   * Benign end-of-utterance / empty capture — treat as graceful end, not failure.
   */
  static isBenignEnd(error: any): boolean {
    const { code, message, raw } = this.normalize(error);
    const blob = `${code} ${message} ${raw}`;

    // Android SpeechRecognizer codes
    if (code === '6' || code === '7' || code === 'speech_timeout' || code === 'no_match') {
      return true;
    }

    return (
      code === 'recognition_fail' ||
      blob.includes('no speech') ||
      blob.includes('1110') ||
      blob.includes('203') || // iOS retry / no speech-ish
      blob.includes('no audio') ||
      blob.includes('speech not detected') ||
      blob.includes('no match') ||
      blob.includes('speech timeout') ||
      blob.includes('client side error') ||
      blob.includes('"error":false') ||
      blob === '""' ||
      blob === '{}' ||
      blob === 'null'
    );
  }

  /** @deprecated use isBenignEnd */
  static isNoSpeechDetected(error: any): boolean {
    return this.isBenignEnd(error);
  }
  
  static categorizeError(error: any): VoiceErrorType {
    const { code, message, raw } = this.normalize(error);
    const blob = `${code} ${message} ${raw}`;
    
    if (
      blob.includes('isformatsamplerateandchannelcountvalid') ||
      blob.includes('audio format') ||
      blob.includes('sample rate') ||
      blob.includes('start_recording') ||
      code === '3' ||
      code === 'audio'
    ) {
      return VoiceErrorType.AUDIO_FORMAT;
    }
    
    if (
      blob.includes('permission') ||
      blob.includes('denied') ||
      code === '9' ||
      code === 'insufficient_permissions'
    ) {
      return VoiceErrorType.PERMISSION;
    }
    
    if (blob.includes('initialization') || blob.includes('not initialized')) {
      return VoiceErrorType.INITIALIZATION;
    }

    if (code === '8' || blob.includes('busy') || blob.includes('already')) {
      return VoiceErrorType.BUSY;
    }

    if (this.isBenignEnd(error)) {
      return VoiceErrorType.NO_MATCH;
    }

    // Language switch / missing speech locale on device
    if (
      blob.includes('locale') ||
      blob.includes('language') ||
      blob.includes('recognizer') ||
      blob.includes('not available') ||
      blob.includes('l10n')
    ) {
      return VoiceErrorType.LOCALE;
    }
    
    return VoiceErrorType.UNKNOWN;
  }

  static async handleError(errorType: VoiceErrorType, stateManager: VoiceStateManager): Promise<boolean> {
    // Benign / busy → quiet recovery (no ERROR log spam)
    if (errorType === VoiceErrorType.NO_MATCH || errorType === VoiceErrorType.BUSY) {
      if (__DEV__) log.info('Voice', `Soft speech event: ${errorType}`);
      stateManager.setListening(false);
      return true;
    }

    if (errorType === VoiceErrorType.UNKNOWN) {
      log.warning('Voice', `Error type: ${errorType}`);
    } else {
      log.error('Voice', `Error type: ${errorType}`);
    }
    
    switch (errorType) {
      case VoiceErrorType.AUDIO_FORMAT: {
        stateManager.incrementAudioFormatError();
        const errorCount = stateManager.getAudioFormatErrorCount();
        // Aggressive destroy breaks BOTH mic and TTS audio session on iOS.
        // Soft-recover first; only nuke after repeated failures.
        log.warning(
          'Voice',
          `Audio format error (#${errorCount}) — soft session recovery`
        );
        stateManager.setSuppressingErrors(true);
        try {
          try {
            await Voice.stop();
          } catch {
            // ignore
          }
          try {
            await Voice.cancel();
          } catch {
            // ignore
          }
          await new Promise<void>((r) =>
            setTimeout(r, Math.min(400 * errorCount, 1600))
          );
        } finally {
          stateManager.setSuppressingErrors(false);
        }
        stateManager.setListening(false);

        if (errorCount >= 3) {
          log.warning('Voice', 'Repeated AUDIO_FORMAT — aggressive reset once');
          await VoiceCleanupService.aggressiveReset(800);
          stateManager.reset();
          return false;
        }
        return true;
      }
        
      case VoiceErrorType.PERMISSION:
        log.warning('Voice', 'Permission error - cannot recover');
        stateManager.setListening(false);
        return false;
        
      case VoiceErrorType.INITIALIZATION:
        log.warning('Voice', 'Initialization error - resetting state');
        stateManager.setInitialized(false);
        return true;

      case VoiceErrorType.LOCALE:
        log.warning('Voice', 'Locale/recognizer error — soft cleanup');
        await VoiceCleanupService.softCleanup();
        stateManager.setListening(false);
        return true;
        
      default:
        // UNKNOWN: do NOT tear down listeners here (stop() would re-enter onSpeechError).
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
        stateManager.setSuppressingErrors(true);
        try {
          await Voice.stop();
        } catch {
          // ignore
        }
        await this.delay(LISTENING_POLICY.softStopDelayMs);
        stateManager.setSuppressingErrors(false);
      }
    } catch (error) {
      stateManager.setSuppressingErrors(false);
      log.warning('Voice', 'prepareForStart check failed (continuing)', error);
    }
  }

  static async softCleanup(): Promise<void> {
    try {
      log.info('Voice', 'Soft cleanup...');
      stateManager.setSuppressingErrors(true);
      try {
        await Voice.stop();
      } catch {
        // ignore if not running
      }
      await this.delay(LISTENING_POLICY.softStopDelayMs);
      Voice.removeAllListeners();
    } catch (error) {
      log.error('Voice', 'Soft cleanup error', error);
    } finally {
      stateManager.setSuppressingErrors(false);
    }
  }

  static async aggressiveReset(additionalWait: number = 0): Promise<void> {
    try {
      log.info('Voice', 'AGGRESSIVE RESET - destroying iOS audio session...');
      stateManager.setSuppressingErrors(true);
      
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
    } finally {
      stateManager.setSuppressingErrors(false);
    }
  }

  static async fullReset(): Promise<void> {
    return this.aggressiveReset(0);
  }

  static async cancel(): Promise<void> {
    try {
      log.info('Voice', 'Cancelling...');
      stateManager.setSuppressingErrors(true);
      await Voice.cancel();
      await this.delay(200);
      Voice.removeAllListeners();
    } catch (error) {
      log.error('Voice', 'Cancel error', error);
    } finally {
      stateManager.setSuppressingErrors(false);
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
      // stop()/cancel() often emit a follow-up error — ignore those
      if (stateManager.isSuppressingErrors()) {
        if (__DEV__) log.info('Voice', 'Ignoring speech error during intentional stop');
        return;
      }

      const norm = VoiceErrorHandler.normalize(event?.error ?? event);
      log.warning('Voice', 'Speech error', { code: norm.code, message: norm.message });
      this.clearPendingEnd();
      
      const callbacks = stateManager.getState().callbacks;
      const errorType = VoiceErrorHandler.categorizeError(event);

      // Empty / timeout / no-match → same as natural end (send if we have text)
      if (
        errorType === VoiceErrorType.NO_MATCH ||
        VoiceErrorHandler.isBenignEnd(event?.error)
      ) {
        log.info('Voice', 'Benign speech end — finalize if any text');
        stateManager.setListening(false);
        this.endGraceTimer = setTimeout(() => {
          this.endGraceTimer = null;
          callbacks?.onEnd?.();
        }, LISTENING_POLICY.endGraceMs);
        return;
      }

      // Recognizer busy after TTS handoff — quiet soft retry via onError
      if (errorType === VoiceErrorType.BUSY) {
        stateManager.setListening(false);
        await VoiceErrorHandler.handleError(errorType, stateManager);
        if (callbacks?.onError) {
          const errorCallback = callbacks.onError;
          stateManager.setCallbacks(null);
          errorCallback();
        }
        return;
      }

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
 * Release the mic / audio session so device TTS can play.
 * Must run before every speak — overlapping Voice recognition causes
 * AUDIO_FORMAT and total silence on iOS.
 */
export async function releaseMicForPlayback(): Promise<void> {
  try {
    stateManager.setSuppressingErrors(true);
    VoiceEventService.clearPendingEnd();
    try {
      await Voice.stop();
    } catch {
      // ignore
    }
    try {
      await Voice.cancel();
    } catch {
      // ignore
    }
    stateManager.setListening(false);
    await new Promise<void>((r) =>
      setTimeout(r, LISTENING_POLICY.preTtsReleaseMs)
    );
  } catch (error) {
    log.warning('Voice', 'releaseMicForPlayback failed (continuing)', error);
  } finally {
    stateManager.setSuppressingErrors(false);
  }
}

/**
 * Warm the voice stack while TTS is speaking so Voice.start is near-instant
 * when the assistant finishes (prevents missing the user's first words).
 *
 * IMPORTANT: Do NOT call this while TTS is playing — it steals the session.
 * Only call after speech ends, before startListening.
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
    try {
      await startNativeRecognition(locale);
    } catch (startError) {
      // Locale pack missing → fall back to en-US once, then surface error
      if (locale !== 'en-US' && VoiceErrorHandler.categorizeError(startError) === VoiceErrorType.LOCALE) {
        log.warning('Voice', `Locale ${locale} failed — retrying en-US`);
        await startNativeRecognition('en-US');
      } else {
        throw startError;
      }
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

async function startNativeRecognition(locale: string): Promise<void> {
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
