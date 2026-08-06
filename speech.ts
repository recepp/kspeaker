import Voice, { SpeechResultsEvent, SpeechErrorEvent } from '@react-native-community/voice';
import { Platform, Alert } from 'react-native';
import DeviceInfo from 'react-native-device-info';
import { logInfo, logError, logWarning } from './logger';
import {
  requestMicrophonePermission,
  hasMicrophonePermission,
} from './src/platform/permissions';
import { LISTENING_POLICY, type ListenStartPriority } from './src/shared/speech/listeningPolicy';
import {
  ANDROID_LISTEN_LOOP,
  AUDIO_HANDOFF,
  VOICE_AGGRESSIVE_DESTROY_PASSES,
} from './src/shared/speech/audioPlatform';
import { pickBestHypothesis } from './src/shared/speech/mergeTranscript';
import {
  registerMicSessionHooks,
  releaseMicForPlayback as releaseMicCore,
} from './src/platform/speech/micRelease';
import {
  AndroidListenLoop,
  restartAndroidRecognition,
  startAndroidRecognition,
  type AndroidRestartReason,
} from './src/platform/speech/androidSttEngine';

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
  /** Last locale passed to Voice.start — needed for Android one-shot restarts. */
  activeLocale: string;
  /** True once partial/final hypothesis arrived in this recognition segment. */
  gotHypothesis: boolean;
  /** Consecutive empty Android one-shot ends in this mic session. */
  emptyRestartCount: number;
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
    activeLocale: 'en-US',
    gotHypothesis: false,
    emptyRestartCount: 0,
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

  setActiveLocale(locale: string): void {
    this.state.activeLocale = locale || 'en-US';
  }

  setGotHypothesis(value: boolean): void {
    this.state.gotHypothesis = value;
    if (value) {
      this.state.emptyRestartCount = 0;
    }
  }

  /** Recognizer became ready — treat like iOS session still healthy. */
  markRecognizerReady(): void {
    this.state.emptyRestartCount = 0;
    this.state.isListening = true;
    this.state.audioFormatErrorCount = 0;
  }

  bumpEmptyRestartCount(): number {
    this.state.emptyRestartCount += 1;
    return this.state.emptyRestartCount;
  }

  resetEmptyRestartCount(): void {
    this.state.emptyRestartCount = 0;
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
      activeLocale: 'en-US',
      gotHypothesis: false,
      emptyRestartCount: 0,
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
   * True empty capture ends (timeout / no match) — safe to soft-restart on Android.
   * Do NOT include ERROR_CLIENT here; rapid restart on client errors kills Samsung processes.
   */
  static isEmptyCaptureEnd(error: any): boolean {
    const { code, message, raw } = this.normalize(error);
    const blob = `${code} ${message} ${raw}`;
    if (
      code === '6' ||
      code === '7' ||
      code === 'speech_timeout' ||
      code === 'no_match'
    ) {
      return true;
    }
    return (
      blob.includes('no speech') ||
      blob.includes('no match') ||
      blob.includes('speech timeout') ||
      blob.includes('speech not detected') ||
      blob.includes('no audio')
    );
  }

  static isClientGlitch(error: any): boolean {
    const { code, message, raw } = this.normalize(error);
    const blob = `${code} ${message} ${raw}`;
    return (
      code === '5' ||
      blob.includes('client side error') ||
      blob.includes('error_client')
    );
  }

  /**
   * Benign end-of-utterance / empty capture — treat as graceful end, not failure.
   */
  static isBenignEnd(error: any): boolean {
    if (this.isEmptyCaptureEnd(error) || this.isClientGlitch(error)) {
      return true;
    }
    const { code, message, raw } = this.normalize(error);
    const blob = `${code} ${message} ${raw}`;

    return (
      code === 'recognition_fail' ||
      blob.includes('1110') ||
      blob.includes('203') || // iOS retry / no speech-ish
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
      const passes = VOICE_AGGRESSIVE_DESTROY_PASSES;
      log.info(
        'Voice',
        `Aggressive reset (${Platform.OS}, ${passes} destroy pass${passes > 1 ? 'es' : ''})...`
      );
      stateManager.setSuppressingErrors(true);

      try {
        await Voice.stop();
        await this.delay(Platform.OS === 'android' ? 150 : 300);
      } catch {
        log.warning('Voice', 'Voice.stop() (ok if not running)');
      }

      Voice.removeAllListeners();
      await this.delay(Platform.OS === 'android' ? 100 : 200);

      // iOS: triple-destroy clears stubborn AVAudioSession; Android: one destroy is enough
      for (let i = 0; i < passes; i += 1) {
        try {
          await Voice.destroy();
          await this.delay(Platform.OS === 'android' ? 250 : 600);
        } catch {
          log.warning('Voice', `Destroy pass ${i + 1} (expected)`);
        }
      }

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
      if (!permissionOk) {
        const requested = await requestMicrophonePermission();
        if (!requested) return false;
      }

      // Android Voice native module can be briefly null before bridge settle;
      // coerce 0|1|boolean and fall back to speech-service discovery.
      const available = await Voice.isAvailable();
      // Android bridge may return 0|1 (typed); some runtimes coerce to boolean
      const availableFlag = Number(available as number | boolean) === 1;
      if (availableFlag) {
        return true;
      }

      if (Platform.OS === 'android') {
        try {
          const services = await Voice.getSpeechRecognitionServices?.();
          if (Array.isArray(services) && services.length > 0) {
            log.info('Voice', `Android STT engines: ${services.join(', ')}`);
            return true;
          }
        } catch (servicesError) {
          log.warning('Voice', 'getSpeechRecognitionServices failed', servicesError);
        }
        // Mic granted — allow start attempt; real failures surface from Voice.start
        return true;
      }

      return false;
    } catch (error) {
      log.error('Voice', 'Permission check failed', error);
      // Android: don't hard-block on flaky isAvailable if mic is granted
      if (Platform.OS === 'android') {
        try {
          return await hasMicrophonePermission();
        } catch {
          return false;
        }
      }
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

  static clearAndroidRestart(): void {
    AndroidListenLoop.clear();
  }

  /**
   * Perform one Android segment restart (invoked only by AndroidListenLoop).
   */
  static async runAndroidRestart(
    stateManager: VoiceStateManager,
    reason: AndroidRestartReason
  ): Promise<void> {
    const state = stateManager.getState();
    if (!state.callbacks || stateManager.isSuppressingErrors()) return;

    const attempt = stateManager.bumpEmptyRestartCount();
    if (attempt > ANDROID_LISTEN_LOOP.maxEmptyRestarts) {
      log.warning(
        'Voice',
        `Android idle cap (${ANDROID_LISTEN_LOOP.maxEmptyRestarts}) — ending session`
      );
      stateManager.setListening(false);
      const errorCallback = state.callbacks.onError;
      stateManager.setCallbacks(null);
      errorCallback?.();
      return;
    }

    const locale = state.activeLocale || 'en-US';
    try {
      log.info(
        'Voice',
        `Android STT segment #${attempt} (${reason}, ${locale})`
      );
      stateManager.setGotHypothesis(false);
      await restartAndroidRecognition(locale);
      stateManager.setListening(true);
    } catch (error) {
      log.warning('Voice', 'Android STT restart failed', error);
      if (stateManager.getState().callbacks) {
        AndroidListenLoop.queueRestart('client_glitch');
      }
    }
  }

  /** Empty native segment → keep UI listening; queue at most one delayed restart. */
  static handleAndroidEmptySegment(
    stateManager: VoiceStateManager,
    source: 'error' | 'end',
    reason: AndroidRestartReason
  ): void {
    if (!AndroidListenLoop.noteEmptySegmentEnd(source)) {
      if (__DEV__) {
        log.info('Voice', `Ignoring duplicate Android ${source} for same segment`);
      }
      return;
    }
    stateManager.setListening(false);
    if (!stateManager.getState().callbacks) return;
    AndroidListenLoop.queueRestart(reason);
  }

  static setup(stateManager: VoiceStateManager): void {
    log.info('Voice', 'Setting up event handlers...');
    
    this.clearPendingEnd();
    this.clearAndroidRestart();
    Voice.removeAllListeners();

    AndroidListenLoop.setRestartHandler((reason) =>
      this.runAndroidRestart(stateManager, reason)
    );
    
    Voice.onSpeechStart = () => {
      log.info('Voice', 'Speech started - mic is active');
      stateManager.markRecognizerReady();
    };

    Voice.onSpeechRecognized = () => {
      log.info('Voice', 'Speech recognized - got audio input');
    };

    const emitBest = (event: SpeechResultsEvent, label: string) => {
      const callbacks = stateManager.getState().callbacks;
      const best = pickBestHypothesis(event.value);
      if (!best || !callbacks?.onResult) return;
      stateManager.setGotHypothesis(true);
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
      if (stateManager.isSuppressingErrors()) {
        if (__DEV__) log.info('Voice', 'Ignoring speech error during intentional stop');
        return;
      }

      const norm = VoiceErrorHandler.normalize(event?.error ?? event);
      log.warning('Voice', 'Speech error', { code: norm.code, message: norm.message });
      this.clearPendingEnd();
      
      const callbacks = stateManager.getState().callbacks;
      const errorType = VoiceErrorHandler.categorizeError(event);
      const hadText = stateManager.getState().gotHypothesis;
      const emptyCapture = VoiceErrorHandler.isEmptyCaptureEnd(event?.error ?? event);
      const clientGlitch = VoiceErrorHandler.isClientGlitch(event?.error ?? event);

      if (
        errorType === VoiceErrorType.NO_MATCH ||
        VoiceErrorHandler.isBenignEnd(event?.error) ||
        emptyCapture ||
        clientGlitch
      ) {
        if (hadText) {
          AndroidListenLoop.noteEmptySegmentEnd('error');
          stateManager.setListening(false);
          log.info('Voice', 'Utterance complete — finalize captured text');
          this.endGraceTimer = setTimeout(() => {
            this.endGraceTimer = null;
            callbacks?.onEnd?.();
          }, LISTENING_POLICY.endGraceMs);
          return;
        }
        if (Platform.OS === 'android' && callbacks) {
          this.handleAndroidEmptySegment(
            stateManager,
            'error',
            clientGlitch && !emptyCapture ? 'client_glitch' : 'empty'
          );
          return;
        }
        stateManager.setListening(false);
        this.endGraceTimer = setTimeout(() => {
          this.endGraceTimer = null;
          callbacks?.onEnd?.();
        }, LISTENING_POLICY.endGraceMs);
        return;
      }

      if (errorType === VoiceErrorType.BUSY) {
        if (Platform.OS === 'android' && callbacks && !hadText) {
          this.handleAndroidEmptySegment(stateManager, 'error', 'client_glitch');
          return;
        }
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
      
      if (!canRecover && errorType === VoiceErrorType.AUDIO_FORMAT && __DEV__) {
        Alert.alert(
          'Microphone Issue',
          'Unable to start voice recognition. Please close and reopen the app.',
          [{ text: 'OK' }]
        );
      }
    };

    Voice.onSpeechEnd = () => {
      log.info('Voice', 'Speech ended — waiting for final hypothesis');
      this.clearPendingEnd();
      this.endGraceTimer = setTimeout(() => {
        this.endGraceTimer = null;
        const state = stateManager.getState();
        if (state.gotHypothesis) {
          AndroidListenLoop.noteEmptySegmentEnd('end');
          stateManager.setListening(false);
          state.callbacks?.onEnd?.();
          return;
        }
        if (Platform.OS === 'android' && state.callbacks) {
          // If onSpeechError already queued restart, this is a no-op.
          this.handleAndroidEmptySegment(stateManager, 'end', 'empty');
          return;
        }
        stateManager.setListening(false);
        state.callbacks?.onEnd?.();
      }, LISTENING_POLICY.endGraceMs);
    };
    
    log.info('Voice', 'Event handlers ready');
  }
}

// ============================================
// SINGLETON INSTANCE
// ============================================

const stateManager = new VoiceStateManager();

registerMicSessionHooks({
  setSuppressingErrors: (value) => stateManager.setSuppressingErrors(value),
  clearPendingEnd: () => VoiceEventService.clearPendingEnd(),
  setListening: (value) => stateManager.setListening(value),
  onWarning: (message, error) => log.warning('Voice', message, error),
});

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
 * Release the mic / audio session so TTS (device or premium) can play.
 * Shared by iOS + Android — suppress follow-up Voice errors during stop.
 */
export async function releaseMicForPlayback(): Promise<void> {
  return releaseMicCore();
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
    stateManager.setActiveLocale(locale);
    stateManager.setGotHypothesis(false);
    // Every UI / post-TTS listen begins a fresh empty budget (iOS session reset)
    stateManager.resetEmptyRestartCount();
    VoiceEventService.setup(stateManager);

    log.info('Voice', `Starting recognition with locale ${locale}...`);
    try {
      await startNativeRecognition(locale);
    } catch (startError) {
      // Locale pack missing → fall back to en-US once, then surface error
      if (locale !== 'en-US' && VoiceErrorHandler.categorizeError(startError) === VoiceErrorType.LOCALE) {
        log.warning('Voice', `Locale ${locale} failed — retrying en-US`);
        stateManager.setActiveLocale('en-US');
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
    await startAndroidRecognition(locale);
  } else {
    await Voice.start(locale);
  }
}

/**
 * Stop listening
 */
export async function stopListening(): Promise<void> {
  const state = stateManager.getState();
  VoiceEventService.clearPendingEnd();
  VoiceEventService.clearAndroidRestart();

  // Android may be between one-shot sessions (isListening=false, callbacks still set)
  if (!state.isListening && !state.callbacks) {
    log.info('Voice', 'Not listening, skipping stop');
    return;
  }

  try {
    log.info('Voice', 'Stopping...');
    stateManager.setSuppressingErrors(true);
    await VoiceCleanupService.softCleanup();
    stateManager.setListening(false);
    stateManager.setCallbacks(null);
    stateManager.setGotHypothesis(false);
    log.info('Voice', 'Stopped');
  } catch (error) {
    log.error('Voice', 'Stop error', error);
    stateManager.setListening(false);
    stateManager.setCallbacks(null);
  } finally {
    stateManager.setSuppressingErrors(false);
  }
}

/**
 * Cancel listening
 */
export async function cancelListening(): Promise<void> {
  try {
    log.info('Voice', 'Cancelling...');
    VoiceEventService.clearPendingEnd();
    VoiceEventService.clearAndroidRestart();
    await VoiceCleanupService.cancel();
    stateManager.setListening(false);
    stateManager.setCallbacks(null);
    stateManager.setGotHypothesis(false);
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
    VoiceEventService.clearAndroidRestart();
    await VoiceCleanupService.aggressiveReset(500);
    stateManager.reset();
    log.info('Voice', 'Destroyed');
  } catch (error) {
    log.error('Voice', 'Destroy error', error);
    stateManager.reset();
  }
}
