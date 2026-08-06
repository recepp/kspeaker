import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { flashTheme } from '../theme';
import type { FlashcardScore } from '../types';

type Props = {
  score: FlashcardScore;
  onRetry: () => void;
  onNewDeck: () => void;
  onBackToLevels: () => void;
};

export function FlashcardResult({
  score,
  onRetry,
  onNewDeck,
  onBackToLevels,
}: Props) {
  const tone =
    score.percentage >= 80
      ? 'Strong round'
      : score.percentage >= 50
        ? 'Solid progress'
        : 'Keep going';

  return (
    <LinearGradient colors={[...flashTheme.gradient]} style={styles.root}>
      <View style={styles.center}>
        <Text style={styles.kicker}>Challenge complete</Text>
        <Text style={styles.title}>{tone}</Text>

        <View style={styles.ring}>
          <Text style={styles.pct}>{score.percentage}%</Text>
          <Text style={styles.pctLabel}>accuracy</Text>
        </View>

        <View style={styles.stats}>
          <View style={styles.stat}>
            <Text style={[styles.statNum, { color: flashTheme.success }]}>
              {score.correct}
            </Text>
            <Text style={styles.statLabel}>Known</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.stat}>
            <Text style={[styles.statNum, { color: flashTheme.danger }]}>
              {score.wrong}
            </Text>
            <Text style={styles.statLabel}>Missed</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.stat}>
            <Text style={styles.statNum}>{score.total}</Text>
            <Text style={styles.statLabel}>Cards</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.primary} onPress={onNewDeck} activeOpacity={0.85}>
          <Ionicons name="flash" size={18} color="#07110E" />
          <Text style={styles.primaryText}>New AI deck</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.secondary} onPress={onRetry} activeOpacity={0.85}>
          <Text style={styles.secondaryText}>Retry same cards</Text>
        </TouchableOpacity>

        <TouchableOpacity onPress={onBackToLevels} style={styles.link}>
          <Text style={styles.linkText}>Back to levels</Text>
        </TouchableOpacity>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  kicker: {
    color: flashTheme.textFaint,
    fontSize: 13,
    letterSpacing: 1.4,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: flashTheme.text,
    marginBottom: 28,
    letterSpacing: -0.4,
  },
  ring: {
    width: 140,
    height: 140,
    borderRadius: 70,
    borderWidth: 2,
    borderColor: flashTheme.borderStrong,
    backgroundColor: flashTheme.accentSoft,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 28,
  },
  pct: {
    fontSize: 40,
    fontWeight: '700',
    color: flashTheme.accent,
  },
  pctLabel: {
    fontSize: 12,
    color: flashTheme.textMuted,
    marginTop: 2,
  },
  stats: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 36,
    backgroundColor: flashTheme.bgElevated,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: flashTheme.border,
    paddingVertical: 16,
    paddingHorizontal: 8,
    width: '100%',
  },
  stat: { flex: 1, alignItems: 'center' },
  divider: {
    width: StyleSheet.hairlineWidth,
    height: 36,
    backgroundColor: flashTheme.border,
  },
  statNum: {
    fontSize: 24,
    fontWeight: '700',
    color: flashTheme.text,
  },
  statLabel: {
    marginTop: 4,
    fontSize: 12,
    color: flashTheme.textMuted,
  },
  primary: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: flashTheme.accent,
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 16,
    marginBottom: 12,
    width: '100%',
    justifyContent: 'center',
  },
  primaryText: {
    color: '#07110E',
    fontSize: 16,
    fontWeight: '700',
  },
  secondary: {
    paddingVertical: 12,
    width: '100%',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: flashTheme.border,
    marginBottom: 8,
  },
  secondaryText: {
    color: flashTheme.text,
    fontSize: 15,
    fontWeight: '600',
  },
  link: { paddingVertical: 10 },
  linkText: { color: flashTheme.textMuted, fontSize: 14 },
});
