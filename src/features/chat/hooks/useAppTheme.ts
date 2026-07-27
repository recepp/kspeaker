import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { Theme } from '../types';
import { triggerHaptic } from '../../../platform/haptic';

const THEME_KEY = 'appTheme';

export function useAppTheme(initial: Theme = 'dark') {
  const [theme, setTheme] = useState<Theme>(initial);

  useEffect(() => {
    const load = async () => {
      try {
        const saved = await AsyncStorage.getItem(THEME_KEY);
        if (saved === 'light' || saved === 'dark') {
          setTheme(saved);
        }
      } catch (e) {
        console.error('[Theme] Error loading theme:', e);
      }
    };
    load();
  }, []);

  const toggleTheme = useCallback(async () => {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    triggerHaptic('light');
    try {
      await AsyncStorage.setItem(THEME_KEY, next);
    } catch (e) {
      console.error('[Theme] Error saving theme:', e);
    }
  }, [theme]);

  return { theme, setTheme, toggleTheme };
}
