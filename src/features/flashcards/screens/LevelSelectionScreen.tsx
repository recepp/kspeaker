import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import { FLASHCARD_LANGUAGES, FLASHCARD_LEVELS } from '../constants';
import { flashTheme } from '../theme';
import type { FlashcardLanguageCode } from '../types';

type Props = {
  navigation: any;
};

export function LevelSelectionScreen({ navigation }: Props) {
  const [selectedLanguage, setSelectedLanguage] =
    useState<FlashcardLanguageCode>('en');

  return (
    <LinearGradient colors={[...flashTheme.gradient]} style={styles.root}>
      <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
        <StatusBar barStyle="light-content" />
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            hitSlop={12}
            style={styles.iconBtn}
          >
            <Ionicons name="arrow-back" size={22} color={flashTheme.text} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Flashcards</Text>
          <View style={styles.iconBtn} />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
        >
          <Text style={styles.hero}>Build a deck</Text>
          <Text style={styles.heroSub}>
            Pick a language and level — AI creates fresh words for your challenge.
          </Text>

          <Text style={styles.section}>Language</Text>
          <View style={styles.langRow}>
            {FLASHCARD_LANGUAGES.map((lang) => {
              const selected = selectedLanguage === lang.code;
              return (
                <TouchableOpacity
                  key={lang.code}
                  style={[styles.langChip, selected && styles.langChipOn]}
                  onPress={() => setSelectedLanguage(lang.code)}
                  activeOpacity={0.8}
                >
                  <Text style={[styles.langCode, selected && styles.langCodeOn]}>
                    {lang.code.toUpperCase()}
                  </Text>
                  <Text style={[styles.langName, selected && styles.langNameOn]}>
                    {lang.nativeName}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <Text style={styles.section}>Level</Text>
          {FLASHCARD_LEVELS.map((item) => (
            <TouchableOpacity
              key={item.level}
              style={styles.levelRow}
              activeOpacity={0.85}
              onPress={() =>
                navigation.navigate('Flashcard', {
                  level: item.level,
                  language: selectedLanguage,
                })
              }
            >
              <View
                style={[styles.levelIconWrap, { backgroundColor: `${item.accent}22` }]}
              >
                <Ionicons name={item.icon as never} size={20} color={item.accent} />
              </View>
              <View style={styles.levelText}>
                <Text style={styles.levelTitle}>
                  {item.level}
                  <Text style={styles.levelTitleMuted}>  {item.title}</Text>
                </Text>
                <Text style={styles.levelDesc}>{item.description}</Text>
              </View>
              <Ionicons
                name="chevron-forward"
                size={18}
                color={flashTheme.textFaint}
              />
              <View style={[styles.levelAccent, { backgroundColor: item.accent }]} />
            </TouchableOpacity>
          ))}

          <View style={styles.how}>
            <Text style={styles.howTitle}>How it works</Text>
            <Text style={styles.howText}>
              1. Choose language & CEFR level{'\n'}
              2. AI prepares random level-fit words{'\n'}
              3. Flip · mark Got it / Missed · see your score
            </Text>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  safe: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  iconBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: flashTheme.textMuted,
    letterSpacing: 0.3,
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  hero: {
    fontSize: 34,
    fontWeight: '700',
    color: flashTheme.text,
    letterSpacing: -0.8,
    marginTop: 8,
  },
  heroSub: {
    marginTop: 8,
    marginBottom: 28,
    fontSize: 15,
    lineHeight: 22,
    color: flashTheme.textMuted,
    maxWidth: 320,
  },
  section: {
    fontSize: 12,
    fontWeight: '700',
    color: flashTheme.textFaint,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 12,
    marginTop: 8,
  },
  langRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 28,
  },
  langChip: {
    width: '47%',
    borderRadius: 16,
    paddingVertical: 14,
    paddingHorizontal: 14,
    backgroundColor: flashTheme.bgElevated,
    borderWidth: 1,
    borderColor: flashTheme.border,
  },
  langChipOn: {
    borderColor: flashTheme.borderStrong,
    backgroundColor: flashTheme.accentSoft,
  },
  langCode: {
    fontSize: 11,
    fontWeight: '700',
    color: flashTheme.textFaint,
    letterSpacing: 1,
    marginBottom: 4,
  },
  langCodeOn: { color: flashTheme.accent },
  langName: {
    fontSize: 16,
    fontWeight: '600',
    color: flashTheme.textMuted,
  },
  langNameOn: { color: flashTheme.text },
  levelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: flashTheme.bgElevated,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 14,
    marginBottom: 10,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: flashTheme.border,
    overflow: 'hidden',
  },
  levelAccent: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
  },
  levelIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  levelText: { flex: 1 },
  levelTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: flashTheme.text,
  },
  levelTitleMuted: {
    fontWeight: '500',
    color: flashTheme.textMuted,
  },
  levelDesc: {
    marginTop: 3,
    fontSize: 12,
    color: flashTheme.textFaint,
  },
  how: {
    marginTop: 18,
    padding: 18,
    borderRadius: 18,
    backgroundColor: 'rgba(45,212,191,0.08)',
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: 'rgba(45,212,191,0.25)',
  },
  howTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: flashTheme.accent,
    marginBottom: 8,
  },
  howText: {
    fontSize: 13,
    lineHeight: 21,
    color: flashTheme.textMuted,
  },
});
