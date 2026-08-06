import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { flashTheme } from '../theme';
import type { FlashCard } from '../types';
import { LEVEL_META } from '../constants';
import type { CefrLevel } from '../types';

const { width } = Dimensions.get('window');

type Props = {
  level: CefrLevel;
  card: FlashCard;
  index: number;
  total: number;
  correct: number;
  wrong: number;
  isFlipped: boolean;
  /** Target-language RTL (Arabic) */
  rtl?: boolean;
  flipAnim: Animated.Value;
  slideAnim: Animated.Value;
  onBack: () => void;
  onFlip: () => void;
  onKnow: () => void;
  onDontKnow: () => void;
};

export function FlashcardChallenge({
  level,
  card,
  index,
  total,
  correct,
  wrong,
  isFlipped,
  rtl = false,
  flipAnim,
  slideAnim,
  onBack,
  onFlip,
  onKnow,
  onDontKnow,
}: Props) {
  const accent = LEVEL_META[level].accent;

  const frontRotate = flipAnim.interpolate({
    inputRange: [0, 180],
    outputRange: ['0deg', '180deg'],
  });
  const backRotate = flipAnim.interpolate({
    inputRange: [0, 180],
    outputRange: ['180deg', '360deg'],
  });
  const frontOpacity = flipAnim.interpolate({
    inputRange: [0, 89, 90, 180],
    outputRange: [1, 1, 0, 0],
  });
  const backOpacity = flipAnim.interpolate({
    inputRange: [0, 89, 90, 180],
    outputRange: [0, 0, 1, 1],
  });

  const progress = ((index + 1) / total) * 100;

  return (
    <LinearGradient colors={[...flashTheme.gradient]} style={styles.root}>
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} hitSlop={12} style={styles.iconBtn}>
          <Ionicons name="arrow-back" size={22} color={flashTheme.text} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.levelBadge, { color: accent }]}>{level}</Text>
          <Text style={styles.progressLabel}>
            {index + 1} / {total}
          </Text>
        </View>
        <View style={styles.scorePair}>
          <Text style={[styles.scoreText, { color: flashTheme.success }]}>
            {correct}
          </Text>
          <Text style={styles.scoreSep}>·</Text>
          <Text style={[styles.scoreText, { color: flashTheme.danger }]}>
            {wrong}
          </Text>
        </View>
      </View>

      <View style={styles.track}>
        <View style={[styles.fill, { width: `${progress}%`, backgroundColor: accent }]} />
      </View>

      <View style={styles.stage}>
        <TouchableOpacity activeOpacity={0.92} onPress={onFlip}>
          <Animated.View
            style={[
              styles.cardShell,
              { transform: [{ translateX: slideAnim }] },
            ]}
          >
            <Animated.View
              style={[
                styles.face,
                styles.faceFront,
                {
                  opacity: frontOpacity,
                  transform: [{ rotateY: frontRotate }],
                },
              ]}
            >
              <Text style={styles.icon}>{card.icon}</Text>
              <Text
                style={[
                  styles.word,
                  rtl && styles.rtlText,
                ]}
              >
                {card.word}
              </Text>
              <Text style={styles.hint}>Tap to reveal</Text>
            </Animated.View>

            <Animated.View
              style={[
                styles.face,
                styles.faceBack,
                {
                  opacity: backOpacity,
                  transform: [{ rotateY: backRotate }],
                  borderColor: accent,
                },
              ]}
            >
              <Text style={styles.icon}>{card.icon}</Text>
              <Text style={[styles.translation, { color: accent }]}>
                {card.translation}
              </Text>
              <Text
                style={[
                  styles.example,
                  rtl && styles.rtlText,
                ]}
              >
                “{card.example}”
              </Text>
            </Animated.View>
          </Animated.View>
        </TouchableOpacity>
      </View>

      {isFlipped ? (
        <View style={styles.actions}>
          <TouchableOpacity
            style={[styles.action, styles.miss]}
            onPress={onDontKnow}
            activeOpacity={0.85}
          >
            <Ionicons name="close" size={28} color="#fff" />
            <Text style={styles.actionLabel}>Missed</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.action, styles.hit]}
            onPress={onKnow}
            activeOpacity={0.85}
          >
            <Ionicons name="checkmark" size={28} color="#07110E" />
            <Text style={[styles.actionLabel, styles.hitLabel]}>Got it</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={styles.actionsPlaceholder}>
          <Text style={styles.flipCue}>Flip the card to answer</Text>
        </View>
      )}
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: { alignItems: 'center' },
  levelBadge: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.2,
  },
  progressLabel: {
    marginTop: 2,
    fontSize: 13,
    color: flashTheme.textMuted,
  },
  scorePair: { flexDirection: 'row', alignItems: 'center', minWidth: 40 },
  scoreText: { fontSize: 15, fontWeight: '700' },
  scoreSep: { color: flashTheme.textFaint, marginHorizontal: 4 },
  track: {
    height: 3,
    marginHorizontal: 20,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.08)',
    overflow: 'hidden',
  },
  fill: { height: '100%', borderRadius: 2 },
  stage: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  cardShell: {
    width: width - 48,
    height: 420,
  },
  face: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    backfaceVisibility: 'hidden',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: flashTheme.border,
  },
  faceFront: {
    backgroundColor: flashTheme.bgCard,
  },
  faceBack: {
    backgroundColor: flashTheme.bgCardBack,
    borderWidth: 1.5,
  },
  icon: { fontSize: 56, marginBottom: 18 },
  word: {
    fontSize: 34,
    fontWeight: '700',
    color: flashTheme.text,
    textAlign: 'center',
    letterSpacing: -0.5,
  },
  rtlText: {
    writingDirection: 'rtl',
    textAlign: 'center',
  },
  hint: {
    marginTop: 22,
    fontSize: 13,
    color: flashTheme.textFaint,
    letterSpacing: 0.4,
  },
  translation: {
    fontSize: 30,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
  },
  example: {
    fontSize: 15,
    lineHeight: 22,
    color: flashTheme.textMuted,
    textAlign: 'center',
    fontStyle: 'italic',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    paddingHorizontal: 24,
    paddingBottom: 28,
  },
  actionsPlaceholder: {
    paddingBottom: 36,
    alignItems: 'center',
  },
  flipCue: {
    color: flashTheme.textFaint,
    fontSize: 13,
  },
  action: {
    flex: 1,
    minHeight: 64,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  miss: { backgroundColor: '#DC2626' },
  hit: { backgroundColor: flashTheme.accent },
  actionLabel: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
  },
  hitLabel: { color: '#07110E' },
});
