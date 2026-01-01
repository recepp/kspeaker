import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ScrollView,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';

interface LevelSelectionScreenProps {
  navigation: any;
}

const LANGUAGES = [
  { code: 'en', name: 'English', flag: '🇬🇧', desc: 'İngilizce öğren' },
  { code: 'ar', name: 'عربي', flag: '🇸🇦', desc: 'Arapça öğren' },
  { code: 'tr', name: 'Türkçe', flag: '🇹🇷', desc: 'Türkçe öğren' },
  { code: 'ru', name: 'Русский', flag: '🇷🇺', desc: 'Rusça öğren' },
];

const LEVELS = [
  {
    level: 'A1',
    title: 'Beginner',
    description: 'Temel kelimeler ve günlük ifadeler',
    color: '#10B981',
    icon: '🌱',
  },
  {
    level: 'A2',
    title: 'Elementary',
    description: 'Basit cümleler ve sık kullanılan kelimeler',
    color: '#3B82F6',
    icon: '🌿',
  },
  {
    level: 'B1',
    title: 'Intermediate',
    description: 'Günlük konuşma ve iş İngilizcesi',
    color: '#8B5CF6',
    icon: '🌳',
  },
  {
    level: 'B2',
    title: 'Upper Intermediate',
    description: 'Karmaşık metinler ve detaylı tartışmalar',
    color: '#F59E0B',
    icon: '🌲',
  },
  {
    level: 'C1',
    title: 'Advanced',
    description: 'Akademik ve profesyonel İngilizce',
    color: '#EF4444',
    icon: '🏔️',
  },
  {
    level: 'C2',
    title: 'Proficiency',
    description: 'Native speaker seviyesi kelimeler',
    color: '#EC4899',
    icon: '⭐',
  },
];

const LevelSelectionScreen: React.FC<LevelSelectionScreenProps> = ({ navigation }) => {
  const [selectedLanguage, setSelectedLanguage] = useState('en');

  const handleLevelSelect = (level: string) => {
    navigation.navigate('Flashcard', { level, language: selectedLanguage });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Seviye Seç</Text>
        <View style={{ width: 28 }} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={styles.subtitle}>
          Dil Seç 🌍
        </Text>

        <View style={styles.languageGrid}>
          {LANGUAGES.map((lang) => (
            <TouchableOpacity
              key={lang.code}
              style={[
                styles.languageCard,
                selectedLanguage === lang.code && styles.languageCardSelected,
              ]}
              onPress={() => setSelectedLanguage(lang.code)}
              activeOpacity={0.8}
            >
              <Text style={styles.languageFlag}>{lang.flag}</Text>
              <Text style={styles.languageName}>{lang.name}</Text>
              <Text style={styles.languageDesc}>{lang.desc}</Text>
              {selectedLanguage === lang.code && (
                <View style={styles.selectedBadge}>
                  <Ionicons name="checkmark-circle" size={24} color="#7DD3C0" />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.subtitle}>
          Seviye Seç 🎯
        </Text>

        {LEVELS.map((item, index) => (
          <TouchableOpacity
            key={item.level}
            style={[styles.levelCard, { borderLeftColor: item.color }]}
            onPress={() => handleLevelSelect(item.level)}
            activeOpacity={0.8}
          >
            <View style={styles.levelLeft}>
              <Text style={styles.levelIcon}>{item.icon}</Text>
              <View style={styles.levelInfo}>
                <Text style={styles.levelName}>{item.level} - {item.title}</Text>
                <Text style={styles.levelDescription}>{item.description}</Text>
              </View>
            </View>
            <Ionicons name="chevron-forward" size={24} color="#7DD3C0" />
          </TouchableOpacity>
        ))}

        <View style={styles.infoCard}>
          <Text style={styles.infoIcon}>💡</Text>
          <Text style={styles.infoTitle}>Nasıl Çalışır?</Text>
          <Text style={styles.infoText}>
            • Her seviyede 5 kelime kartı{'\n'}
            • Kartı çevirerek anlamını gör{'\n'}
            • Bildiysen ✅, bilmediysen ❌{'\n'}
            • Skorunu göre ve tekrar dene!
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A2E',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 15,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  subtitle: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 20,
    marginTop: 10,
    textAlign: 'center',
    fontWeight: '600',
  },
  languageGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  languageCard: {
    width: '48%',
    backgroundColor: '#16213E',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    marginBottom: 15,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  languageCardSelected: {
    borderColor: '#7DD3C0',
    backgroundColor: '#1a2f4a',
  },
  languageFlag: {
    fontSize: 50,
    marginBottom: 10,
  },
  languageName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  languageDesc: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
  },
  selectedBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
  },
  levelCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#16213E',
    padding: 20,
    borderRadius: 15,
    marginBottom: 15,
    borderLeftWidth: 4,
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  levelLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  levelIcon: {
    fontSize: 40,
    marginRight: 15,
  },
  levelInfo: {
    flex: 1,
  },
  levelName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 5,
  },
  levelDescription: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
  },
  infoCard: {
    backgroundColor: 'rgba(125, 211, 192, 0.1)',
    padding: 20,
    borderRadius: 15,
    marginTop: 10,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: 'rgba(125, 211, 192, 0.3)',
  },
  infoIcon: {
    fontSize: 32,
    marginBottom: 10,
  },
  infoTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#7DD3C0',
    marginBottom: 10,
  },
  infoText: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 22,
  },
});

export default LevelSelectionScreen;
