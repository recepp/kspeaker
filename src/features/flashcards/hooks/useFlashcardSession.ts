import { useCallback, useEffect, useRef, useState } from 'react';
import { Animated, Dimensions } from 'react-native';
import { FLASHCARD_MIN_LOADING_MS } from '../constants';
import { computeFlashcardScore } from '../domain/flashcardScore';
import {
  loadRecentFlashcardWords,
  rememberFlashcardWords,
} from '../persistence/recentWords';
import { generateFlashcardDeck } from '../services/generateFlashcardDeck';
import type {
  CefrLevel,
  FlashCard,
  FlashcardLanguageCode,
  FlashcardSessionPhase,
} from '../types';

const { width } = Dimensions.get('window');

export function useFlashcardSession(
  language: FlashcardLanguageCode,
  level: CefrLevel
) {
  const [phase, setPhase] = useState<FlashcardSessionPhase>('loading');
  const [cards, setCards] = useState<FlashCard[]>([]);
  const [source, setSource] = useState<'ai' | 'fallback'>('ai');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [loadingStep, setLoadingStep] = useState(0);

  const flipAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;
  const mounted = useRef(true);
  const recentWordsRef = useRef<string[]>([]);
  const generation = useRef(0);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  const resetCardMotion = useCallback(() => {
    flipAnim.setValue(0);
    slideAnim.setValue(0);
    setIsFlipped(false);
  }, [flipAnim, slideAnim]);

  const prepareDeck = useCallback(async () => {
    const gen = ++generation.current;
    setPhase('loading');
    setErrorMessage(null);
    setLoadingStep(0);
    setCurrentIndex(0);
    setCorrectCount(0);
    setWrongCount(0);
    resetCardMotion();

    const stepTimers = [
      setTimeout(() => mounted.current && setLoadingStep(1), 400),
      setTimeout(() => mounted.current && setLoadingStep(2), 900),
    ];

    const started = Date.now();
    try {
      // Hydrate persisted history so New AI deck stays diverse across sessions
      const persisted = await loadRecentFlashcardWords(language, level);
      recentWordsRef.current = persisted;

      const deck = await generateFlashcardDeck(language, level, {
        excludeWords: recentWordsRef.current,
      });

      const elapsed = Date.now() - started;
      const wait = Math.max(0, FLASHCARD_MIN_LOADING_MS - elapsed);
      if (wait > 0) {
        await new Promise<void>((r) => setTimeout(r, wait));
      }
      if (!mounted.current || gen !== generation.current) return;

      if (!deck.cards.length) {
        setErrorMessage('Could not prepare cards. Please try again.');
        setPhase('error');
        return;
      }

      const nextWords = deck.cards.map((c) => c.word);
      recentWordsRef.current = await rememberFlashcardWords(
        language,
        level,
        nextWords
      );

      setCards(deck.cards);
      setSource(deck.source);
      setLoadingStep(3);
      setPhase('challenge');
      if (__DEV__) {
        console.log(
          '[Flashcards] Deck ready',
          deck.source,
          nextWords.join(', ')
        );
      }
    } catch (error) {
      if (!mounted.current || gen !== generation.current) return;
      setErrorMessage(
        error instanceof Error ? error.message : 'Failed to prepare deck'
      );
      setPhase('error');
    } finally {
      stepTimers.forEach(clearTimeout);
    }
  }, [language, level, resetCardMotion]);

  useEffect(() => {
    prepareDeck();
  }, [prepareDeck]);

  const flipCard = useCallback(() => {
    const next = !isFlipped;
    Animated.spring(flipAnim, {
      toValue: next ? 180 : 0,
      friction: 8,
      tension: 64,
      useNativeDriver: true,
    }).start();
    setIsFlipped(next);
  }, [flipAnim, isFlipped]);

  const handleAnswer = useCallback(
    (isCorrect: boolean) => {
      const nextCorrect = correctCount + (isCorrect ? 1 : 0);
      const nextWrong = wrongCount + (isCorrect ? 0 : 1);
      if (isCorrect) setCorrectCount(nextCorrect);
      else setWrongCount(nextWrong);

      Animated.timing(slideAnim, {
        toValue: isCorrect ? width : -width,
        duration: 280,
        useNativeDriver: true,
      }).start(() => {
        if (currentIndex < cards.length - 1) {
          setCurrentIndex((i) => i + 1);
          resetCardMotion();
        } else {
          setPhase('result');
        }
      });
    },
    [
      cards.length,
      correctCount,
      currentIndex,
      resetCardMotion,
      slideAnim,
      wrongCount,
    ]
  );

  const restartSameDeck = useCallback(() => {
    setCurrentIndex(0);
    setCorrectCount(0);
    setWrongCount(0);
    resetCardMotion();
    setPhase('challenge');
  }, [resetCardMotion]);

  const score = computeFlashcardScore(correctCount, wrongCount);

  return {
    phase,
    cards,
    source,
    errorMessage,
    currentIndex,
    currentCard: cards[currentIndex],
    isFlipped,
    correctCount,
    wrongCount,
    score,
    loadingStep,
    flipAnim,
    slideAnim,
    flipCard,
    handleAnswer,
    restartSameDeck,
    regenerateDeck: prepareDeck,
  };
}
