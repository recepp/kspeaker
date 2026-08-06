import { NativeModules, TurboModuleRegistry } from 'react-native';

type ClipboardModule = {
  setString: (content: string) => void;
};

function resolveClipboard(): ClipboardModule | null {
  const turbo = TurboModuleRegistry.get?.('Clipboard') as ClipboardModule | null;
  if (turbo?.setString) return turbo;

  const bridge = NativeModules.Clipboard as ClipboardModule | undefined;
  if (bridge?.setString) return bridge;

  return null;
}

/**
 * Platform clipboard adapter. Isolates native Clipboard access from UI.
 */
export function copyToClipboard(text: string): void {
  const clipboard = resolveClipboard();
  if (!clipboard) {
    throw new Error('Clipboard is unavailable on this device');
  }
  clipboard.setString(text);
}
