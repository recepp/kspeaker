import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Easing,
  TouchableOpacity,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { flashTheme } from '../theme';
import type { CefrLevel } from '../types';
import { LEVEL_META } from '../constants';

const STEPS = [
  'Sampling level vocabulary',
  'Asking AI for fresh words',
  'Building your challenge deck',
  'Ready',
];

type Props = {
  level: CefrLevel;
  languageLabel: string;
  step: number;
  onCancel: () => void;
};

export function FlashcardLoading({
  level,
  languageLabel,
  step,
  onCancel,
}: Props) {
  const pulse = useRef(new Animated.Value(0)).current;
  const meta = LEVEL_META[level];

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {
          toValue: 1,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
        Animated.timing(pulse, {
          toValue: 0,
          duration: 900,
          easing: Easing.inOut(Easing.quad),
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  const scale = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.92, 1.06],
  });
  const glow = pulse.interpolate({
    inputRange: [0, 1],
    outputRange: [0.35, 0.85],
  });

  return (
    <LinearGradient colors={[...flashTheme.gradient]} style={styles.root}>
      <TouchableOpacity style={styles.back} onPress={onCancel} hitSlop={12}>
        <Ionicons name="close" size={24} color={flashTheme.textMuted} />
      </TouchableOpacity>

      <View style={styles.center}>
        <Animated.View
          style={[
            styles.orb,
            {
              borderColor: meta.accent,
              transform: [{ scale }],
              opacity: glow,
            },
          ]}
        >
          <Text style={[styles.levelMark, { color: meta.accent }]}>{level}</Text>
        </Animated.View>

        <Text style={styles.title}>Preparing challenge</Text>
        <Text style={styles.subtitle}>
          {languageLabel} · {meta.title}
        </Text>

        <View style={styles.steps}>
          {STEPS.map((label, index) => {
            const active = index <= step;
            const current = index === Math.min(step, STEPS.length - 1);
            return (
              <View key={label} style={styles.stepRow}>
                <View
                  style={[
                    styles.dot,
                    active && { backgroundColor: meta.accent },
                    current && styles.dotCurrent,
                  ]}
                />
                <Text
                  style={[
                    styles.stepText,
                    active && styles.stepTextActive,
                    current && { color: meta.accent },
                  ]}
                >
                  {label}
                </Text>
              </View>
            );
          })}
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  back: {
    position: 'absolute',
    top: 16,
    left: 16,
    zIndex: 2,
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
  },
  orb: {
    width: 112,
    height: 112,
    borderRadius: 56,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: flashTheme.accentSoft,
    marginBottom: 28,
  },
  levelMark: {
    fontSize: 36,
    fontWeight: '700',
    letterSpacing: 1,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: flashTheme.text,
    letterSpacing: -0.3,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: flashTheme.textMuted,
    marginBottom: 36,
  },
  steps: {
    alignSelf: 'stretch',
    gap: 14,
    paddingHorizontal: 12,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.18)',
  },
  dotCurrent: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  stepText: {
    fontSize: 14,
    color: flashTheme.textFaint,
  },
  stepTextActive: {
    color: flashTheme.textMuted,
  },
});
