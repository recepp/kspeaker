import { NativeModules, TurboModuleRegistry } from 'react-native';

/**
 * True when RNSound is linked in this binary.
 * New Architecture often exposes the module only via TurboModuleRegistry.
 */
export function isNativeSoundAvailable(): boolean {
  try {
    if (NativeModules?.RNSound) return true;
  } catch {
    // continue
  }
  try {
    // get() returns null if missing; getEnforcing throws
    if (TurboModuleRegistry.get?.('RNSound') != null) return true;
  } catch {
    // continue
  }
  return false;
}
