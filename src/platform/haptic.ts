import { Platform, Vibration } from 'react-native';

export type HapticIntensity = 'light' | 'medium' | 'heavy';

/**
 * Cross-platform haptic feedback.
 * Single responsibility: vibration patterns only.
 */
export function triggerHaptic(type: HapticIntensity = 'light'): void {
  try {
    if (Platform.OS === 'ios') {
      const duration = type === 'light' ? 10 : type === 'medium' ? 20 : 30;
      Vibration.vibrate(duration);
      return;
    }

    if (Platform.OS === 'android') {
      const pattern =
        type === 'light' ? [0, 50] : type === 'medium' ? [0, 100] : [0, 150];
      Vibration.vibrate(pattern);
    }
  } catch {
    // Graceful fallback if vibration is unavailable
  }
}
