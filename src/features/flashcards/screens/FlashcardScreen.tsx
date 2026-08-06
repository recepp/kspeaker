import React from 'react';
import { Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import LinearGradient from 'react-native-linear-gradient';
import { FlashcardLoading } from '../components/FlashcardLoading';
import { FlashcardChallenge } from '../components/FlashcardChallenge';
import { FlashcardResult } from '../components/FlashcardResult';
import { FLASHCARD_LANGUAGES } from '../constants';
import { getFlashcardLanguageProfile } from '../domain/languageProfile';
import { useFlashcardSession } from '../hooks/useFlashcardSession';
import { flashTheme } from '../theme';
import type { CefrLevel, FlashcardLanguageCode } from '../types';

type Props = {
  navigation: any;
  route: any;
};

export function FlashcardScreen({ navigation, route }: Props) {
  const level = (route?.params?.level || 'A1') as CefrLevel;
  const language = (route?.params?.language || 'en') as FlashcardLanguageCode;
  const profile = getFlashcardLanguageProfile(language);
  const languageLabel =
    FLASHCARD_LANGUAGES.find((l) => l.code === language)?.name || profile.name;

  const session = useFlashcardSession(language, level);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right', 'bottom']}>
      <StatusBar barStyle="light-content" />

      {session.phase === 'loading' && (
        <FlashcardLoading
          level={level}
          languageLabel={languageLabel}
          step={session.loadingStep}
          onCancel={() => navigation.goBack()}
        />
      )}

      {session.phase === 'error' && (
        <LinearGradient colors={[...flashTheme.gradient]} style={styles.errorRoot}>
          <Text style={styles.errorTitle}>Couldn’t prepare cards</Text>
          <Text style={styles.errorBody}>
            {session.errorMessage || 'Please check your connection and try again.'}
          </Text>
          <TouchableOpacity style={styles.retry} onPress={session.regenerateDeck}>
            <Text style={styles.retryText}>Try again</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Text style={styles.backLink}>Back</Text>
          </TouchableOpacity>
        </LinearGradient>
      )}

      {session.phase === 'challenge' && session.currentCard && (
        <FlashcardChallenge
          level={level}
          card={session.currentCard}
          index={session.currentIndex}
          total={session.cards.length}
          correct={session.correctCount}
          wrong={session.wrongCount}
          isFlipped={session.isFlipped}
          rtl={profile.rtl}
          flipAnim={session.flipAnim}
          slideAnim={session.slideAnim}
          onBack={() => navigation.goBack()}
          onFlip={session.flipCard}
          onKnow={() => session.handleAnswer(true)}
          onDontKnow={() => session.handleAnswer(false)}
        />
      )}

      {session.phase === 'result' && (
        <FlashcardResult
          score={session.score}
          onRetry={session.restartSameDeck}
          onNewDeck={session.regenerateDeck}
          onBackToLevels={() => navigation.goBack()}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: flashTheme.bg },
  errorRoot: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  errorTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: flashTheme.text,
    marginBottom: 10,
  },
  errorBody: {
    fontSize: 14,
    color: flashTheme.textMuted,
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  retry: {
    backgroundColor: flashTheme.accent,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 14,
    marginBottom: 14,
  },
  retryText: {
    color: '#07110E',
    fontWeight: '700',
    fontSize: 15,
  },
  backLink: { color: flashTheme.textMuted, fontSize: 14 },
});
