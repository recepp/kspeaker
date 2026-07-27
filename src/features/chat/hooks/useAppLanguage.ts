import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AppLanguage } from '../types';

const LANGUAGE_KEY = 'selectedLanguage';

export function useAppLanguage(initial: AppLanguage = 'en') {
  const [selectedLanguage, setSelectedLanguage] = useState<AppLanguage>(initial);

  useEffect(() => {
    const load = async () => {
      try {
        const saved = await AsyncStorage.getItem(LANGUAGE_KEY);
        if (
          saved === 'en' ||
          saved === 'tr' ||
          saved === 'ar' ||
          saved === 'ru'
        ) {
          setSelectedLanguage(saved);
        }
      } catch (e) {
        console.error('[Language] Error loading language:', e);
      }
    };
    load();
  }, []);

  const selectLanguage = useCallback(async (language: AppLanguage) => {
    setSelectedLanguage(language);
    try {
      await AsyncStorage.setItem(LANGUAGE_KEY, language);
    } catch (e) {
      console.error('[Language] Error saving language:', e);
    }
  }, []);

  return { selectedLanguage, setSelectedLanguage, selectLanguage };
}
