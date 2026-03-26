/**
 * TTS Service - SOLID Principles Implementation
 * 
 * Single Responsibility: TTS operations management
 * Open/Closed: Extensible without modifying existing code
 * Liskov Substitution: Any TTS provider can be swapped
 * Interface Segregation: Clean interface for TTS operations
 * Dependency Inversion: Depends on abstraction, not concrete implementation
 */

import Tts from 'react-native-tts';
import { Platform } from 'react-native';

// Interface Segregation Principle (ISP)
export interface ITTSService {
  initialize(): Promise<void>;
  speak(text: string): Promise<void>;
  stop(): Promise<void>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  setRate(rate: number): Promise<void>;
  setPitch(pitch: number): Promise<void>;
  setLanguage(language: string): Promise<void>;
  addEventListener(event: string, handler: (event: any) => void): void;
  removeEventListener(event: string, handler: (event: any) => void): void;
  setDefaultLanguage(language: string): Promise<void>;
  setDefaultVoice(voiceId: string): Promise<void>;
  setDefaultRate(rate: number): Promise<void>;
  setDefaultPitch(pitch: number): Promise<void>;
  setDucking(enabled: boolean): Promise<void>;
  setIgnoreSilentSwitch(mode: string): Promise<void>;
  voices(): Promise<any[]>;
  removeAllListeners(event: string): void;
  isReady(): boolean;
}

// Single Responsibility Principle (SRP)
class TTSService implements ITTSService {
  private isInitialized: boolean = false;
  private readonly DEFAULT_RATE = 0.50;
  private readonly DEFAULT_PITCH = 1.0;
  private readonly DEFAULT_LANGUAGE = 'en-US';
  private initializationPromise: Promise<void> | null = null;

  /**
   * Check if service is ready
   */
  isReady(): boolean {
    return this.isInitialized;
  }

  /**
   * Ensure service is initialized before operations
   * Template Method Pattern
   */
  private async ensureInitialized(): Promise<void> {
    if (this.isInitialized) return;
    
    // Prevent multiple simultaneous initializations
    if (this.initializationPromise) {
      await this.initializationPromise;
      return;
    }
    
    this.initializationPromise = this.initialize();
    await this.initializationPromise;
    this.initializationPromise = null;
  }

  /**
   * Initialize TTS service with optimal settings
   * Open/Closed Principle: Can be extended without modification
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      console.log('[TTS Service] Already initialized');
      return;
    }

    try {
      console.log('[TTS Service] 🔧 Initializing with premium neural voice');
      
      await Tts.setDefaultLanguage(this.DEFAULT_LANGUAGE);
      
      // Get and select best quality voice
      const voices = await Tts.voices();
      const selectedVoice = this.selectOptimalVoice(voices);
      
      if (selectedVoice) {
        console.log(`[TTS Service] 🎯 Selected: ${selectedVoice.name} (Quality: ${selectedVoice.quality || 'N/A'})`);
        await Tts.setDefaultVoice(selectedVoice.id);
      } else {
        console.warn('[TTS Service] ⚠️ No optimal voice found, using system default');
      }
      
      // CRITICAL FIX: Set speech parameters AFTER voice selection
      // iOS native bridge sometimes has type conversion issues during init
      try {
        // Try setting rate - if it fails, continue without it (will use default 0.5)
        await Tts.setDefaultRate(this.DEFAULT_RATE);
        console.log(`[TTS Service] 🎚️ Rate set to ${this.DEFAULT_RATE}`);
      } catch (rateError) {
        console.warn('[TTS Service] ⚠️ Could not set rate during init, using default:', rateError);
        // Not critical - TTS will work with system default rate
      }
      
      try {
        await Tts.setDefaultPitch(this.DEFAULT_PITCH);
        console.log(`[TTS Service] 🎚️ Pitch set to ${this.DEFAULT_PITCH}`);
      } catch (pitchError) {
        console.warn('[TTS Service] ⚠️ Could not set pitch during init, using default:', pitchError);
        // Not critical - TTS will work with system default pitch
      }
      
      // iOS specific settings
      if (Platform.OS === 'ios') {
        try {
          await Tts.setDucking(true);
          await Tts.setIgnoreSilentSwitch('ignore');
          console.log('[TTS Service] 🎚️ iOS audio settings applied');
        } catch (iosError) {
          console.warn('[TTS Service] ⚠️ Could not set iOS audio settings:', iosError);
          // Not critical - TTS will still work
        }
      }
      
      this.isInitialized = true;
      console.log('[TTS Service] ✅ Initialization complete');
    } catch (error) {
      console.error('[TTS Service] ❌ Initialization failed:', error);
      this.isInitialized = false;
      this.initializationPromise = null;
      throw error;
    }
  }

  /**
   * Select optimal voice based on quality metrics
   * Strategy Pattern for voice selection — platform-aware
   */
  private selectOptimalVoice(voices: any[]): any | null {
    if (!voices || voices.length === 0) {
      console.warn('[TTS Service] ⚠️ No voices available');
      return null;
    }

    console.log(`[TTS Service] 📢 Available voices: ${voices.length}, platform: ${Platform.OS}`);

    // Filter for English voices
    const enVoices = voices.filter((v: any) =>
      v.language === 'en-US' || v.language?.startsWith('en-')
    );

    if (enVoices.length === 0) {
      console.warn('[TTS Service] ⚠️ No English voices found, using first available');
      return voices[0];
    }

    if (Platform.OS === 'android') {
      return this.selectAndroidVoice(enVoices, voices);
    }

    return this.selectIOSVoice(enVoices, voices);
  }

  /**
   * iOS voice selection — prefers Apple Neural voices by name
   */
  private selectIOSVoice(enVoices: any[], allVoices: any[]): any | null {
    const premiumVoices = enVoices.filter((v: any) =>
      v.quality === 'Premium' ||
      v.quality === 'Enhanced' ||
      v.quality >= 300 ||
      v.id?.toLowerCase().includes('premium') ||
      v.id?.toLowerCase().includes('enhanced') ||
      v.name?.toLowerCase().includes('enhanced')
    );

    console.log(`[TTS Service] iOS premium voices: ${premiumVoices.length}`);

    const preferredNames = ['Samantha', 'Ava', 'Allison', 'Zoe', 'Nicky', 'Susan', 'Karen'];

    for (const name of preferredNames) {
      const voice = premiumVoices.find((v: any) =>
        v.name?.toLowerCase().includes(name.toLowerCase())
      );
      if (voice) {
        console.log(`[TTS Service] 🎯 iOS selected: ${voice.name} (${voice.quality})`);
        return voice;
      }
    }

    if (premiumVoices.length > 0) {
      console.log(`[TTS Service] 🎯 iOS fallback premium: ${premiumVoices[0].name}`);
      return premiumVoices[0];
    }

    if (enVoices.length > 0) {
      console.log(`[TTS Service] 🎯 iOS fallback English: ${enVoices[0].name}`);
      return enVoices[0];
    }

    return allVoices[0];
  }

  /**
   * Android voice selection — Google TTS voices use numeric quality (100=normal, 300=high, 400=network)
   * WaveNet / Neural voices have higher quality values and network=true
   * Priority: WaveNet/Neural (quality 400) > high quality local (300) > any en-US
   */
  private selectAndroidVoice(enVoices: any[], allVoices: any[]): any | null {
    // Android quality values: 100 = default, 200 = normal, 300 = high, 400+ = WaveNet/Neural
    const networkVoices = enVoices.filter((v: any) =>
      v.networkConnectionRequired === true ||
      v.quality >= 400 ||
      v.id?.toLowerCase().includes('wavenet') ||
      v.id?.toLowerCase().includes('neural') ||
      v.name?.toLowerCase().includes('wavenet') ||
      v.name?.toLowerCase().includes('neural')
    );

    console.log(`[TTS Service] Android WaveNet/Network voices: ${networkVoices.length}`);

    // Among network voices, prefer female en-US
    const femaleNetwork = networkVoices.find((v: any) =>
      v.language === 'en-US' &&
      (v.gender === 'female' ||
       v.id?.toLowerCase().includes('female') ||
       v.id?.toLowerCase().includes('-f-') ||
       v.name?.toLowerCase().includes('female'))
    );

    if (femaleNetwork) {
      console.log(`[TTS Service] 🎯 Android selected WaveNet female: ${femaleNetwork.id || femaleNetwork.name}`);
      return femaleNetwork;
    }

    if (networkVoices.length > 0) {
      const enUS = networkVoices.find((v: any) => v.language === 'en-US') || networkVoices[0];
      console.log(`[TTS Service] 🎯 Android selected WaveNet: ${enUS.id || enUS.name}`);
      return enUS;
    }

    // High quality local voices (quality 300+)
    const highQuality = enVoices.filter((v: any) =>
      typeof v.quality === 'number' ? v.quality >= 300 : false
    );

    if (highQuality.length > 0) {
      const enUS = highQuality.find((v: any) => v.language === 'en-US') || highQuality[0];
      console.log(`[TTS Service] 🎯 Android selected high-quality: ${enUS.id || enUS.name}`);
      return enUS;
    }

    // Any en-US voice
    const enUS = enVoices.find((v: any) => v.language === 'en-US');
    if (enUS) {
      console.log(`[TTS Service] 🎯 Android fallback en-US: ${enUS.id || enUS.name}`);
      return enUS;
    }

    console.log(`[TTS Service] 🎯 Android final fallback: ${enVoices[0]?.id || enVoices[0]?.name}`);
    return enVoices[0] || allVoices[0];
  }

  /**
   * Speak text with error handling
   * Template Method Pattern
   */
  async speak(text: string): Promise<void> {
    await this.ensureInitialized();

    if (!text || text.trim().length === 0) {
      console.warn('[TTS Service] ⚠️ Empty text provided, skipping speak');
      return;
    }

    try {
      const processedText = this.preprocessText(text);
      await Tts.speak(processedText);
      console.log(`[TTS Service] 🔊 Speaking: "${processedText.substring(0, 50)}..."`);
    } catch (error) {
      console.error('[TTS Service] ❌ Speak error:', error);
      throw error;
    }
  }

  /**
   * Preprocess text for natural speech
   * Single Responsibility: Text normalization
   */
  private preprocessText(text: string): string {
    let processed = text;
    
    // Normalize punctuation with proper spacing
    processed = processed.replace(/\.\s+/g, '. ');
    processed = processed.replace(/!\s+/g, '! ');
    processed = processed.replace(/\?\s+/g, '? ');
    processed = processed.replace(/,\s+/g, ', ');
    
    // Fix common abbreviations for natural pronunciation
    const abbreviations: Record<string, string> = {
      'Dr\\.': 'Doctor',
      'Mr\\.': 'Mister',
      'Mrs\\.': 'Missus',
      'Ms\\.': 'Miss',
      'Prof\\.': 'Professor',
      'e\\.g\\.': 'for example',
      'i\\.e\\.': 'that is',
      'etc\\.': 'et cetera',
      'vs\\.': 'versus',
      'approx\\.': 'approximately'
    };
    
    Object.entries(abbreviations).forEach(([abbr, full]) => {
      const regex = new RegExp(`\\b${abbr}`, 'gi');
      processed = processed.replace(regex, full);
    });
    
    // Remove multiple spaces
    processed = processed.replace(/\s+/g, ' ');
    
    return processed.trim();
  }

  /**
   * Stop speech immediately
   * Dependency Inversion: Depends on TTS abstraction
   */
  async stop(): Promise<void> {
    try {
      console.log('[TTS Service] 🛑 Stopping speech...');
      await Tts.stop();
      console.log('[TTS Service] ✅ Stopped successfully');
    } catch (error) {
      // Expected error when TTS is not speaking - log but don't throw
      console.log('[TTS Service] ℹ️ Stop called when not speaking (expected)');
    }
  }

  async pause(): Promise<void> {
    await this.ensureInitialized();
    
    try {
      console.log('[TTS Service] ⏸️ Pausing...');
      await Tts.pause();
      console.log('[TTS Service] ✅ Paused successfully');
    } catch (error) {
      console.error('[TTS Service] ⚠️ Pause error:', error);
      throw error;
    }
  }

  async resume(): Promise<void> {
    await this.ensureInitialized();
    
    try {
      console.log('[TTS Service] ▶️ Resuming...');
      await Tts.resume();
      console.log('[TTS Service] ✅ Resumed successfully');
    } catch (error) {
      console.error('[TTS Service] ⚠️ Resume error:', error);
      throw error;
    }
  }

  async setRate(rate: number): Promise<void> {
    await this.ensureInitialized();
    
    // Validate rate (0.1 - 2.0 typical range)
    const validatedRate = Math.max(0.1, Math.min(2.0, rate));
    if (validatedRate !== rate) {
      console.warn(`[TTS Service] ⚠️ Rate ${rate} out of range, clamped to ${validatedRate}`);
    }
    
    await Tts.setDefaultRate(validatedRate);
    console.log(`[TTS Service] 🎚️ Rate set to ${validatedRate}`);
  }

  async setPitch(pitch: number): Promise<void> {
    await this.ensureInitialized();
    
    // Validate pitch (0.5 - 2.0 typical range)
    const validatedPitch = Math.max(0.5, Math.min(2.0, pitch));
    if (validatedPitch !== pitch) {
      console.warn(`[TTS Service] ⚠️ Pitch ${pitch} out of range, clamped to ${validatedPitch}`);
    }
    
    await Tts.setDefaultPitch(validatedPitch);
    console.log(`[TTS Service] 🎚️ Pitch set to ${validatedPitch}`);
  }

  async setLanguage(language: string): Promise<void> {
    await this.ensureInitialized();
    await Tts.setDefaultLanguage(language);
    console.log(`[TTS Service] 🌍 Language set to ${language}`);
  }

  addEventListener(event: string, handler: (event: any) => void): void {
    Tts.addEventListener(event, handler);
  }

  removeEventListener(event: string, handler: (event: any) => void): void {
    Tts.removeEventListener(event, handler);
  }

  // Additional direct TTS control methods
  async setDefaultLanguage(language: string): Promise<void> {
    await this.setLanguage(language);
  }

  async setDefaultVoice(voiceId: string): Promise<void> {
    await this.ensureInitialized();
    await Tts.setDefaultVoice(voiceId);
    console.log(`[TTS Service] 🎤 Voice set to ${voiceId}`);
  }

  async setDefaultRate(rate: number): Promise<void> {
    await this.setRate(rate);
  }

  async setDefaultPitch(pitch: number): Promise<void> {
    await this.setPitch(pitch);
  }

  async setDucking(enabled: boolean): Promise<void> {
    if (Platform.OS === 'ios') {
      await Tts.setDucking(enabled);
      console.log(`[TTS Service] 🔊 Ducking ${enabled ? 'enabled' : 'disabled'}`);
    }
  }

  async setIgnoreSilentSwitch(mode: string): Promise<void> {
    if (Platform.OS === 'ios') {
      await Tts.setIgnoreSilentSwitch(mode);
      console.log(`[TTS Service] 🔇 Silent switch mode: ${mode}`);
    }
  }

  async voices(): Promise<any[]> {
    await this.ensureInitialized();
    return await Tts.voices();
  }

  removeAllListeners(event: string): void {
    Tts.removeAllListeners(event);
  }
}

// Singleton Pattern: Single instance across app
export const ttsService = new TTSService();

// Factory Pattern for future extensibility
export const createTTSService = (): ITTSService => {
  return new TTSService();
};

export default ttsService;
