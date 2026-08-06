import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { triggerHaptic } from '../../../platform/haptic';
import type { Theme } from '../types';

export type QuizLevelChoice = '1' | '2' | '3';

export interface QuizLevelPickerProps {
  theme: Theme;
  disabled?: boolean;
  labels: {
    beginner: string;
    intermediate: string;
    advanced: string;
  };
  onSelect: (choice: QuizLevelChoice) => void;
}

const LEVELS: Array<{
  choice: QuizLevelChoice;
  labelKey: keyof QuizLevelPickerProps['labels'];
}> = [
  { choice: '1', labelKey: 'beginner' },
  { choice: '2', labelKey: 'intermediate' },
  { choice: '3', labelKey: 'advanced' },
];

/**
 * Compact level chips shown while quiz awaits Beginner / Intermediate / Advanced.
 */
export function QuizLevelPicker({
  theme,
  disabled = false,
  labels,
  onSelect,
}: QuizLevelPickerProps) {
  const isDark = theme === 'dark';

  return (
    <View style={styles.row} accessibilityRole="radiogroup">
      {LEVELS.map(({ choice, labelKey }) => (
        <TouchableOpacity
          key={choice}
          accessibilityRole="button"
          accessibilityLabel={labels[labelKey]}
          disabled={disabled}
          activeOpacity={0.7}
          onPress={() => {
            if (disabled) return;
            triggerHaptic('medium');
            onSelect(choice);
          }}
          style={[
            styles.chip,
            isDark ? styles.chipDark : styles.chipLight,
            disabled && styles.chipDisabled,
          ]}
        >
          <Text style={[styles.num, isDark ? styles.numDark : styles.numLight]}>
            {choice}
          </Text>
          <Text
            numberOfLines={1}
            style={[styles.label, isDark ? styles.labelDark : styles.labelLight]}
          >
            {labels[labelKey]}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingBottom: 8,
  },
  chip: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    minHeight: 36,
    paddingHorizontal: 8,
    paddingVertical: 8,
    borderRadius: 18,
    borderWidth: StyleSheet.hairlineWidth,
  },
  chipDark: {
    backgroundColor: 'rgba(16, 185, 129, 0.14)',
    borderColor: 'rgba(16, 185, 129, 0.45)',
  },
  chipLight: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  chipDisabled: {
    opacity: 0.45,
  },
  num: {
    fontSize: 13,
    fontWeight: '700',
    color: '#10B981',
  },
  numDark: {
    color: '#34D399',
  },
  numLight: {
    color: '#059669',
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    flexShrink: 1,
  },
  labelDark: {
    color: 'rgba(255,255,255,0.9)',
  },
  labelLight: {
    color: 'rgba(26,26,31,0.88)',
  },
});
