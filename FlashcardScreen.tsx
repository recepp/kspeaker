import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { FLASHCARD_DATA_EXTENDED } from './flashcardData';

const { width } = Dimensions.get('window');

// Dil bazlı kelime setleri
const FLASHCARD_DATA: Record<string, Record<string, any[]>> = {
  en: {
    A1: [
      { word: 'Hello', translation: 'Merhaba', icon: '👋', example: 'Hello, how are you?' },
      { word: 'Thank you', translation: 'Teşekkür ederim', icon: '🙏', example: 'Thank you for your help!' },
      { word: 'Sorry', translation: 'Özür dilerim', icon: '😔', example: 'I\'m sorry for being late.' },
      { word: 'Please', translation: 'Lütfen', icon: '🥺', example: 'Can you help me, please?' },
      { word: 'Goodbye', translation: 'Hoşça kal', icon: '👋', example: 'Goodbye, see you tomorrow!' },
    ],
    A2: [
      { word: 'Appreciate', translation: 'Takdir etmek', icon: '💖', example: 'I appreciate your help.' },
      { word: 'Understand', translation: 'Anlamak', icon: '🧠', example: 'Do you understand the question?' },
      { word: 'Important', translation: 'Önemli', icon: '⭐', example: 'This is very important!' },
      { word: 'Different', translation: 'Farklı', icon: '🔄', example: 'Everyone is different.' },
      { word: 'Explain', translation: 'Açıklamak', icon: '💬', example: 'Can you explain this to me?' },
    ],
    B1: [
      { word: 'Achieve', translation: 'Başarmak', icon: '🎯', example: 'You can achieve your goals.' },
      { word: 'Consider', translation: 'Düşünmek', icon: '🤔', example: 'I will consider your offer.' },
      { word: 'Benefit', translation: 'Fayda', icon: '✨', example: 'Exercise has many benefits.' },
      { word: 'Opportunity', translation: 'Fırsat', icon: '🚪', example: 'This is a great opportunity!' },
      { word: 'Challenge', translation: 'Meydan okuma', icon: '💪', example: 'Learning English is a challenge.' },
    ],
    B2: [
      { word: 'Efficient', translation: 'Verimli', icon: '⚡', example: 'This method is very efficient.' },
      { word: 'Consequence', translation: 'Sonuç', icon: '🔗', example: 'Every action has consequences.' },
      { word: 'Significant', translation: 'Önemli, anlamlı', icon: '🌟', example: 'This is a significant discovery.' },
      { word: 'Adapt', translation: 'Uyum sağlamak', icon: '🦎', example: 'We must adapt to changes.' },
      { word: 'Perspective', translation: 'Bakış açısı', icon: '👁️', example: 'Everyone has a different perspective.' },
    ],
    C1: [
      { word: 'Inevitable', translation: 'Kaçınılmaz', icon: '⏰', example: 'Change is inevitable.' },
      { word: 'Comprehend', translation: 'Kavramak', icon: '🧩', example: 'It\'s hard to comprehend the complexity.' },
      { word: 'Profound', translation: 'Derin, etkileyici', icon: '🌊', example: 'He had a profound impact on society.' },
      { word: 'Ambiguous', translation: 'Belirsiz, muğlak', icon: '❓', example: 'The message was ambiguous.' },
      { word: 'Resilient', translation: 'Dayanıklı', icon: '🛡️', example: 'She is very resilient under pressure.' },
    ],
    C2: [
      { word: 'Ephemeral', translation: 'Geçici, kısa ömürlü', icon: '🌅', example: 'Morning dew is ephemeral.' },
      { word: 'Ubiquitous', translation: 'Her yerde bulunan', icon: '🌍', example: 'Smartphones are ubiquitous today.' },
      { word: 'Paradigm', translation: 'Örnek model, paradigma', icon: '🔄', example: 'A paradigm shift in technology.' },
      { word: 'Exacerbate', translation: 'Kötüleştirmek', icon: '📉', example: 'Stress can exacerbate health problems.' },
      { word: 'Nuance', translation: 'İncelik, nüans', icon: '🎨', example: 'There are many nuances in this argument.' },
    ],
  },
  ar: {
    A1: [
      { word: 'مرحبا', translation: 'Hello', icon: '👋', example: 'مرحبا، كيف حالك؟' },
      { word: 'شكرا', translation: 'Thank you', icon: '🙏', example: 'شكرا لمساعدتك!' },
      { word: 'آسف', translation: 'Sorry', icon: '😔', example: 'أنا آسف على التأخير.' },
      { word: 'من فضلك', translation: 'Please', icon: '🥺', example: 'هل يمكنك مساعدتي من فضلك؟' },
      { word: 'مع السلامة', translation: 'Goodbye', icon: '👋', example: 'مع السلامة، أراك غدا!' },
    ],
    A2: [
      { word: 'أقدر', translation: 'Appreciate', icon: '💖', example: 'أقدر مساعدتك.' },
      { word: 'أفهم', translation: 'Understand', icon: '🧠', example: 'هل تفهم السؤال؟' },
      { word: 'مهم', translation: 'Important', icon: '⭐', example: 'هذا مهم جدا!' },
      { word: 'مختلف', translation: 'Different', icon: '🔄', example: 'كل شخص مختلف.' },
      { word: 'أشرح', translation: 'Explain', icon: '💬', example: 'هل يمكنك شرح هذا لي؟' },
    ],
    B1: [
      { word: 'أحقق', translation: 'Achieve', icon: '🎯', example: 'يمكنك تحقيق أهدافك.' },
      { word: 'أعتبر', translation: 'Consider', icon: '🤔', example: 'سأعتبر عرضك.' },
      { word: 'فائدة', translation: 'Benefit', icon: '✨', example: 'للتمرين فوائد كثيرة.' },
      { word: 'فرصة', translation: 'Opportunity', icon: '🚪', example: 'هذه فرصة رائعة!' },
      { word: 'تحدي', translation: 'Challenge', icon: '💪', example: 'تعلم اللغة الإنجليزية تحدٍ.' },
    ],
    B2: [
      { word: 'فعال', translation: 'Efficient', icon: '⚡', example: 'هذه الطريقة فعالة جدا.' },
      { word: 'نتيجة', translation: 'Consequence', icon: '🔗', example: 'لكل فعل نتائج.' },
      { word: 'مهم', translation: 'Significant', icon: '🌟', example: 'هذا اكتشاف مهم.' },
      { word: 'أتكيف', translation: 'Adapt', icon: '🦎', example: 'يجب أن نتكيف مع التغييرات.' },
      { word: 'منظور', translation: 'Perspective', icon: '👁️', example: 'لكل شخص منظور مختلف.' },
    ],
    C1: [
      { word: 'حتمي', translation: 'Inevitable', icon: '⏰', example: 'التغيير حتمي.' },
      { word: 'أفهم', translation: 'Comprehend', icon: '🧩', example: 'من الصعب فهم التعقيد.' },
      { word: 'عميق', translation: 'Profound', icon: '🌊', example: 'كان له تأثير عميق على المجتمع.' },
      { word: 'غامض', translation: 'Ambiguous', icon: '❓', example: 'الرسالة كانت غامضة.' },
      { word: 'مرن', translation: 'Resilient', icon: '🛡️', example: 'إنها مرنة جدا تحت الضغط.' },
    ],
    C2: [
      { word: 'عابر', translation: 'Ephemeral', icon: '🌅', example: 'ندى الصباح عابر.' },
      { word: 'منتشر', translation: 'Ubiquitous', icon: '🌍', example: 'الهواتف الذكية منتشرة اليوم.' },
      { word: 'نموذج', translation: 'Paradigm', icon: '🔄', example: 'تحول نموذجي في التكنولوجيا.' },
      { word: 'يفاقم', translation: 'Exacerbate', icon: '📉', example: 'الإجهاد يمكن أن يفاقم المشاكل الصحية.' },
      { word: 'فارق دقيق', translation: 'Nuance', icon: '🎨', example: 'هناك فوارق دقيقة كثيرة في هذه الحجة.' },
    ],
  },
  tr: {
    A1: [
      { word: 'Hello', translation: 'Merhaba', icon: '👋', example: 'Hello, how are you?' },
      { word: 'Thank you', translation: 'Teşekkür ederim', icon: '🙏', example: 'Thank you for your help!' },
      { word: 'Sorry', translation: 'Özür dilerim', icon: '😔', example: 'I\'m sorry for being late.' },
      { word: 'Please', translation: 'Lütfen', icon: '🥺', example: 'Can you help me, please?' },
      { word: 'Goodbye', translation: 'Hoşça kal', icon: '👋', example: 'Goodbye, see you tomorrow!' },
    ],
    A2: [
      { word: 'Appreciate', translation: 'Takdir etmek', icon: '💖', example: 'I appreciate your help.' },
      { word: 'Understand', translation: 'Anlamak', icon: '🧠', example: 'Do you understand the question?' },
      { word: 'Important', translation: 'Önemli', icon: '⭐', example: 'This is very important!' },
      { word: 'Different', translation: 'Farklı', icon: '🔄', example: 'Everyone is different.' },
      { word: 'Explain', translation: 'Açıklamak', icon: '💬', example: 'Can you explain this to me?' },
    ],
    B1: [
      { word: 'Achieve', translation: 'Başarmak', icon: '🎯', example: 'You can achieve your goals.' },
      { word: 'Consider', translation: 'Düşünmek', icon: '🤔', example: 'I will consider your offer.' },
      { word: 'Benefit', translation: 'Fayda', icon: '✨', example: 'Exercise has many benefits.' },
      { word: 'Opportunity', translation: 'Fırsat', icon: '🚪', example: 'This is a great opportunity!' },
      { word: 'Challenge', translation: 'Zorluk', icon: '💪', example: 'Learning English is a challenge.' },
    ],
    B2: [
      { word: 'Efficient', translation: 'Verimli', icon: '⚡', example: 'This method is very efficient.' },
      { word: 'Consequence', translation: 'Sonuç', icon: '🔗', example: 'Every action has consequences.' },
      { word: 'Significant', translation: 'Önemli, anlamlı', icon: '🌟', example: 'This is a significant discovery.' },
      { word: 'Adapt', translation: 'Uyum sağlamak', icon: '🦎', example: 'We must adapt to changes.' },
      { word: 'Perspective', translation: 'Bakış açısı', icon: '👁️', example: 'Everyone has a different perspective.' },
    ],
    C1: [
      { word: 'Inevitable', translation: 'Kaçınılmaz', icon: '⏰', example: 'Change is inevitable.' },
      { word: 'Comprehend', translation: 'Kavramak', icon: '🧩', example: 'It\'s hard to comprehend the complexity.' },
      { word: 'Profound', translation: 'Derin, etkileyici', icon: '🌊', example: 'He had a profound impact on society.' },
      { word: 'Ambiguous', translation: 'Belirsiz, muğlak', icon: '❓', example: 'The message was ambiguous.' },
      { word: 'Resilient', translation: 'Dayanıklı', icon: '🛡️', example: 'She is very resilient under pressure.' },
    ],
    C2: [
      { word: 'Ephemeral', translation: 'Geçici, kısa ömürlü', icon: '🌅', example: 'Morning dew is ephemeral.' },
      { word: 'Ubiquitous', translation: 'Her yerde bulunan', icon: '🌍', example: 'Smartphones are ubiquitous today.' },
      { word: 'Paradigm', translation: 'Paradigma', icon: '🔄', example: 'A paradigm shift in technology.' },
      { word: 'Exacerbate', translation: 'Kötüleştirmek', icon: '📉', example: 'Stress can exacerbate health problems.' },
      { word: 'Nuance', translation: 'Nüans, incelik', icon: '🎨', example: 'There are many nuances in this argument.' },
    ],
  },
  ru: {
    A1: [
      { word: 'Привет', translation: 'Hello', icon: '👋', example: 'Привет, как дела?' },
      { word: 'Спасибо', translation: 'Thank you', icon: '🙏', example: 'Спасибо за помощь!' },
      { word: 'Извините', translation: 'Sorry', icon: '😔', example: 'Извините за опоздание.' },
      { word: 'Пожалуйста', translation: 'Please', icon: '🥺', example: 'Помогите мне, пожалуйста?' },
      { word: 'До свидания', translation: 'Goodbye', icon: '👋', example: 'До свидания, до завтра!' },
    ],
    A2: [
      { word: 'Ценить', translation: 'Appreciate', icon: '💖', example: 'Я ценю вашу помощь.' },
      { word: 'Понимать', translation: 'Understand', icon: '🧠', example: 'Вы понимаете вопрос?' },
      { word: 'Важный', translation: 'Important', icon: '⭐', example: 'Это очень важно!' },
      { word: 'Разный', translation: 'Different', icon: '🔄', example: 'Все люди разные.' },
      { word: 'Объяснить', translation: 'Explain', icon: '💬', example: 'Можете объяснить мне это?' },
    ],
    B1: [
      { word: 'Достигать', translation: 'Achieve', icon: '🎯', example: 'Вы можете достичь своих целей.' },
      { word: 'Рассмотреть', translation: 'Consider', icon: '🤔', example: 'Я рассмотрю ваше предложение.' },
      { word: 'Польза', translation: 'Benefit', icon: '✨', example: 'У упражнений много пользы.' },
      { word: 'Возможность', translation: 'Opportunity', icon: '🚪', example: 'Это отличная возможность!' },
      { word: 'Вызов', translation: 'Challenge', icon: '💪', example: 'Изучение английского - вызов.' },
    ],
    B2: [
      { word: 'Эффективный', translation: 'Efficient', icon: '⚡', example: 'Этот метод очень эффективен.' },
      { word: 'Последствие', translation: 'Consequence', icon: '🔗', example: 'У каждого действия есть последствия.' },
      { word: 'Значительный', translation: 'Significant', icon: '🌟', example: 'Это значительное открытие.' },
      { word: 'Адаптироваться', translation: 'Adapt', icon: '🦎', example: 'Мы должны адаптироваться к изменениям.' },
      { word: 'Перспектива', translation: 'Perspective', icon: '👁️', example: 'У каждого своя перспектива.' },
    ],
    C1: [
      { word: 'Неизбежный', translation: 'Inevitable', icon: '⏰', example: 'Изменения неизбежны.' },
      { word: 'Понять', translation: 'Comprehend', icon: '🧩', example: 'Сложность трудно понять.' },
      { word: 'Глубокий', translation: 'Profound', icon: '🌊', example: 'Он оказал глубокое влияние на общество.' },
      { word: 'Двусмысленный', translation: 'Ambiguous', icon: '❓', example: 'Сообщение было двусмысленным.' },
      { word: 'Устойчивый', translation: 'Resilient', icon: '🛡️', example: 'Она очень устойчива под давлением.' },
    ],
    C2: [
      { word: 'Эфемерный', translation: 'Ephemeral', icon: '🌅', example: 'Утренняя роса эфемерна.' },
      { word: 'Вездесущий', translation: 'Ubiquitous', icon: '🌍', example: 'Смартфоны сегодня вездесущи.' },
      { word: 'Парадигма', translation: 'Paradigm', icon: '🔄', example: 'Сдвиг парадигмы в технологии.' },
      { word: 'Усугублять', translation: 'Exacerbate', icon: '📉', example: 'Стресс может усугубить проблемы со здоровьем.' },
      { word: 'Нюанс', translation: 'Nuance', icon: '🎨', example: 'В этом аргументе много нюансов.' },
    ],
  },
};

interface FlashcardScreenProps {
  navigation: any;
  route: any;
}

const FlashcardScreen: React.FC<FlashcardScreenProps> = ({ navigation, route }) => {
  const { level, language } = route.params;
  
  // Tüm kelime havuzundan random 5 kelime seç
  const allCards = FLASHCARD_DATA_EXTENDED[language]?.[level] || FLASHCARD_DATA_EXTENDED['en'][level];
  const [cards] = useState(() => {
    const shuffled = [...allCards].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 5);
  });

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [wrongCount, setWrongCount] = useState(0);
  const [showResult, setShowResult] = useState(false);

  const flipAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(0)).current;

  const flipCard = () => {
    if (isFlipped) {
      Animated.spring(flipAnim, {
        toValue: 0,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.spring(flipAnim, {
        toValue: 180,
        useNativeDriver: true,
      }).start();
    }
    setIsFlipped(!isFlipped);
  };

  const handleAnswer = (isCorrect: boolean) => {
    if (isCorrect) {
      setCorrectCount(correctCount + 1);
    } else {
      setWrongCount(wrongCount + 1);
    }

    // Slide out animation
    Animated.timing(slideAnim, {
      toValue: isCorrect ? width : -width,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      if (currentIndex < cards.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setIsFlipped(false);
        flipAnim.setValue(0);
        slideAnim.setValue(0);
      } else {
        setShowResult(true);
      }
    });
  };

  const restart = () => {
    setCurrentIndex(0);
    setCorrectCount(0);
    setWrongCount(0);
    setShowResult(false);
    setIsFlipped(false);
    flipAnim.setValue(0);
    slideAnim.setValue(0);
  };

  const frontInterpolate = flipAnim.interpolate({
    inputRange: [0, 180],
    outputRange: ['0deg', '180deg'],
  });

  const backInterpolate = flipAnim.interpolate({
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

  if (showResult) {
    const percentage = Math.round((correctCount / cards.length) * 100);
    return (
      <SafeAreaView style={styles.container}>
        <StatusBar barStyle="light-content" />
        <View style={styles.resultContainer}>
          <Text style={styles.resultTitle}>🎉 Tebrikler!</Text>
          <Text style={styles.resultText}>Tamamladın!</Text>
          
          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <Text style={styles.statIcon}>✅</Text>
              <Text style={styles.statNumber}>{correctCount}</Text>
              <Text style={styles.statLabel}>Doğru</Text>
            </View>
            
            <View style={styles.statBox}>
              <Text style={styles.statIcon}>❌</Text>
              <Text style={styles.statNumber}>{wrongCount}</Text>
              <Text style={styles.statLabel}>Yanlış</Text>
            </View>
            
            <View style={styles.statBox}>
              <Text style={styles.statIcon}>📊</Text>
              <Text style={styles.statNumber}>{percentage}%</Text>
              <Text style={styles.statLabel}>Başarı</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.restartButton} onPress={restart}>
            <Ionicons name="refresh" size={24} color="#FFFFFF" />
            <Text style={styles.restartButtonText}>Tekrar Dene</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.backButtonText}>Seviye Seçimine Dön</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const currentCard = cards[currentIndex];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={28} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Level {level}</Text>
        <Text style={styles.headerProgress}>
          {currentIndex + 1} / {cards.length}
        </Text>
      </View>

      {/* Progress Bar */}
      <View style={styles.progressBarContainer}>
        <View
          style={[
            styles.progressBar,
            { width: `${((currentIndex + 1) / cards.length) * 100}%` },
          ]}
        />
      </View>

      {/* Stats */}
      <View style={styles.topStats}>
        <View style={styles.topStat}>
          <Text style={styles.topStatIcon}>✅</Text>
          <Text style={styles.topStatText}>{correctCount}</Text>
        </View>
        <View style={styles.topStat}>
          <Text style={styles.topStatIcon}>❌</Text>
          <Text style={styles.topStatText}>{wrongCount}</Text>
        </View>
      </View>

      {/* Flashcard */}
      <View style={styles.cardContainer}>
        <TouchableOpacity activeOpacity={0.9} onPress={flipCard}>
          <Animated.View
            style={[
              styles.card,
              {
                transform: [
                  { translateX: slideAnim },
                  { rotateY: frontInterpolate },
                ],
              },
            ]}
          >
            <Animated.View style={[styles.cardFront, { opacity: frontOpacity }]}>
              <Text style={styles.cardIcon}>{currentCard.icon}</Text>
              <Text style={styles.cardWord}>{currentCard.word}</Text>
              <Text style={styles.cardHint}>Kartı çevir 👆</Text>
            </Animated.View>

            <Animated.View
              style={[
                styles.cardBack,
                {
                  opacity: backOpacity,
                },
              ]}
            >
              <Text style={styles.cardIcon}>{currentCard.icon}</Text>
              <Text style={styles.cardTranslation}>{currentCard.translation}</Text>
              <Text style={styles.cardExample}>"{currentCard.example}"</Text>
            </Animated.View>
          </Animated.View>
        </TouchableOpacity>
      </View>

      {/* Action Buttons */}
      {isFlipped && (
        <View style={styles.actionButtons}>
          <TouchableOpacity
            style={[styles.actionButton, styles.wrongButton]}
            onPress={() => handleAnswer(false)}
          >
            <Ionicons name="close" size={40} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Bilmedim</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.correctButton]}
            onPress={() => handleAnswer(true)}
          >
            <Ionicons name="checkmark" size={40} color="#FFFFFF" />
            <Text style={styles.actionButtonText}>Bildim</Text>
          </TouchableOpacity>
        </View>
      )}
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
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  headerProgress: {
    fontSize: 16,
    color: '#7DD3C0',
    fontWeight: '600',
  },
  progressBarContainer: {
    height: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginHorizontal: 20,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#7DD3C0',
    borderRadius: 2,
  },
  topStats: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 30,
    marginTop: 20,
  },
  topStat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  topStatIcon: {
    fontSize: 24,
  },
  topStatText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  cardContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  card: {
    width: width - 60,
    height: 400,
    borderRadius: 20,
    backgroundColor: '#16213E',
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  cardFront: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backfaceVisibility: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    borderRadius: 20,
    backgroundColor: '#16213E',
  },
  cardBack: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 30,
    borderRadius: 20,
    backgroundColor: '#0F3460',
    transform: [{ rotateY: '180deg' }],
  },
  cardIcon: {
    fontSize: 80,
    marginBottom: 20,
  },
  cardWord: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 10,
  },
  cardTranslation: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#7DD3C0',
    marginBottom: 20,
  },
  cardExample: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.7)',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 10,
  },
  cardHint: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingHorizontal: 40,
    paddingBottom: 40,
    gap: 20,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 20,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
  },
  wrongButton: {
    backgroundColor: '#EF4444',
  },
  correctButton: {
    backgroundColor: '#10B981',
  },
  actionButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    marginTop: 8,
  },
  resultContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  resultTitle: {
    fontSize: 48,
    marginBottom: 10,
  },
  resultText: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 40,
  },
  statsContainer: {
    flexDirection: 'row',
    gap: 20,
    marginBottom: 40,
  },
  statBox: {
    backgroundColor: '#16213E',
    padding: 20,
    borderRadius: 15,
    alignItems: 'center',
    minWidth: 100,
  },
  statIcon: {
    fontSize: 32,
    marginBottom: 10,
  },
  statNumber: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#7DD3C0',
    marginBottom: 5,
  },
  statLabel: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
  },
  restartButton: {
    flexDirection: 'row',
    backgroundColor: '#7DD3C0',
    paddingHorizontal: 30,
    paddingVertical: 15,
    borderRadius: 12,
    alignItems: 'center',
    gap: 10,
    marginBottom: 15,
  },
  restartButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  backButton: {
    paddingVertical: 12,
  },
  backButtonText: {
    color: 'rgba(255, 255, 255, 0.7)',
    fontSize: 16,
  },
});

export default FlashcardScreen;
