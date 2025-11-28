import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet, TouchableOpacity, Platform, KeyboardAvoidingView, Keyboard, Animated, Dimensions, useWindowDimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { sendChatMessage, initializeApi, registerUser } from './api';
import { checkRegistration, saveRegistration, clearRegistration } from './registration';
import { EmailRegistrationModal } from './components/EmailRegistrationModal';
import { startListening, stopListening } from './speech';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Tts from 'react-native-tts';
import LinearGradient from 'react-native-linear-gradient';
import { BlurView } from '@react-native-community/blur';

type Role = 'user' | 'assistant';

interface ChatMessage {
  id: string;
  role: Role;
  content: string;
}

const ChatScreen: React.FC = () => {
  console.log('[ChatScreen] LOADED v2025-11-25-VOICE-FIX');
  
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const isTablet = width >= 768;
  
  // Simple state - GPT style
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [listening, setListening] = useState(false);
  const [speaking, setSpeaking] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isLoadingResponse, setIsLoadingResponse] = useState(false);
  const [typingMessageId, setTypingMessageId] = useState<string | null>(null);
  const [displayedText, setDisplayedText] = useState('');
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'tr' | 'ar' | 'ru'>('en');
  const [quizMode, setQuizMode] = useState(false);
  const [quizLevel, setQuizLevel] = useState<string | null>(null);
  const [quizQuestionCount, setQuizQuestionCount] = useState(0);
  const [showDropup, setShowDropup] = useState(false);
  
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);
  const silenceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSending = useRef(false);
  const currentVoiceText = useRef('');
  const hasSentVoice = useRef(false);
  const drawerAnim = useRef(new Animated.Value(-280)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const micPulseAnim = useRef(new Animated.Value(1)).current;

  console.log('[ChatScreen] Current state - messages:', messages.length, 'listening:', listening, 'speaking:', speaking);

  // Shimmer animation
  useEffect(() => {
    if (isLoadingResponse) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(shimmerAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(shimmerAnim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      shimmerAnim.setValue(0);
    }
  }, [isLoadingResponse]);

  // Typing effect for assistant messages
  useEffect(() => {
    if (!typingMessageId) return;

    const message = messages.find(m => m.id === typingMessageId);
    if (!message) return;

    const fullText = message.content;
    let currentIndex = 0;

    const typingInterval = setInterval(() => {
      if (currentIndex < fullText.length) {
        setDisplayedText(fullText.substring(0, currentIndex + 1));
        currentIndex++;
      } else {
        clearInterval(typingInterval);
        setTypingMessageId(null);
        setDisplayedText('');
      }
    }, 20); // 20ms per character for smooth typing

    return () => clearInterval(typingInterval);
  }, [typingMessageId, messages]);

  // Mic pulse animation when listening
  useEffect(() => {
    if (listening) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(micPulseAnim, {
            toValue: 1.3,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(micPulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      micPulseAnim.setValue(1);
    }
  }, [listening]);

  // Text send handler
  const handleSend = async () => {
    if (!input.trim() || isSending.current) return;
    
    isSending.current = true;
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
    };
    setMessages(prev => [...prev, userMsg]);
    const userInput = input.trim();
    setInput('');
    Keyboard.dismiss();
    setIsLoadingResponse(true);
    
    try {
      let reply = '';
      
      // Quiz mode logic
      if (quizMode && !quizLevel) {
        // Level selection
        if (userInput === '1' || userInput.toLowerCase().includes('beginner')) {
          setQuizLevel('beginner');
          reply = await sendChatMessage('I want to take an English quiz at beginner level. Please give me 5 simple questions about basic English vocabulary and grammar. Number them 1-5.');
        } else if (userInput === '2' || userInput.toLowerCase().includes('intermediate')) {
          setQuizLevel('intermediate');
          reply = await sendChatMessage('I want to take an English quiz at intermediate level. Please give me 5 questions about English grammar, vocabulary and comprehension. Number them 1-5.');
        } else if (userInput === '3' || userInput.toLowerCase().includes('advanced')) {
          setQuizLevel('advanced');
          reply = await sendChatMessage('I want to take an English quiz at advanced level. Please give me 5 challenging questions about advanced English, idioms, and complex grammar. Number them 1-5.');
        } else {
          reply = 'Please type 1 for Beginner, 2 for Intermediate, or 3 for Advanced.';
        }
      } else if (quizMode && quizLevel) {
        // Quiz in progress
        setQuizQuestionCount(prev => prev + 1);
        reply = await sendChatMessage(userInput);
        
        if (quizQuestionCount >= 4) {
          // Quiz finished after 5 questions
          setQuizMode(false);
          setQuizLevel(null);
          setQuizQuestionCount(0);
        }
      } else {
        // Normal chat mode
        reply = await sendChatMessage(userInput);
      }
      
      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: reply,
      };
      setMessages(prev => [...prev, assistantMsg]);
      setTypingMessageId(assistantMsg.id);
    } catch (e) {
      const errorMsg: ChatMessage = {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: 'Sorry, error occurred.',
      };
      setMessages(prev => [...prev, errorMsg]);
    } finally {
      setIsLoadingResponse(false);
      isSending.current = false;
    }
  };

  // Voice send handler
  const sendVoiceMessage = async (voiceText: string) => {
    if (!voiceText.trim()) {
      console.log('[Voice] Empty text, skipping');
      return;
    }
    
    if (isSending.current) {
      console.log('[Voice] Already sending, skipping duplicate');
      return;
    }
    
    console.log('[Voice] 📤 Sending voice message:', voiceText);
    isSending.current = true;
    // DON'T clear input - voice mode doesn't use text input
    
    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: voiceText.trim(),
    };
    
    console.log('[Voice] Adding user message to chat');
    setMessages(prev => {
      const updated = [...prev, userMsg];
      console.log('[Voice] Messages updated, count:', updated.length);
      return updated;
    });
    setTypingMessageId(userMsg.id); // Start typing effect for user message too
    
    setIsLoadingResponse(true);
    
    try {
      const reply = await sendChatMessage(voiceText.trim());
      
      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: reply,
      };
      
      console.log('[Voice] Adding assistant message to chat');
      setMessages(prev => {
        const updated = [...prev, assistantMsg];
        console.log('[Voice] Messages updated, count:', updated.length);
        return updated;
      });
      setTypingMessageId(assistantMsg.id);
      
      // IMPORTANT: Clear TTS queue before starting new speech
      console.log('[TTS] Clearing TTS queue with empty utterance');
      Tts.speak(''); // Only reliable method on iOS
      
      // Speak the reply after a small delay
      console.log('[TTS] 🔊 Speaking reply:', reply.substring(0, 50) + '...');
      setTimeout(() => {
        setSpeaking(true);
        Tts.speak(reply);
      }, 200);
    } catch (e) {
      console.error('[Voice] Error:', e);
      setMessages(prev => [...prev, {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: 'Sorry, error occurred.',
      }]);
    } finally {
      setIsLoadingResponse(false);
      isSending.current = false;
      console.log('[Voice] Request completed');
    }
  };

  // Stop speech immediately - NATIVE PATCHED VERSION
  const stopSpeech = () => {
    console.log('[TTS] ⛔ STOPPING with patched native method');
    
    // Update state first
    setSpeaking(false);
    
    // Call patched stop() - now works without parameters!
    Tts.stop();
    
    console.log('[TTS] ✅ Native stop called (AVSpeechBoundaryImmediate)');
  };

  // Clear all messages
  const clearAll = () => {
    console.log('[Chat] 🗑️ Clearing all messages');
    setMessages([]);
    setInput('');
    setSpeaking(false);
    setListening(false);
    Tts.stop();
    stopListening();
    console.log('[Chat] ✅ All messages cleared');
  };

  // Drawer functions
  const toggleDrawer = () => {
    const toValue = drawerOpen ? -280 : 0;
    Animated.timing(drawerAnim, {
      toValue,
      duration: 300,
      useNativeDriver: true,
    }).start();
    setDrawerOpen(!drawerOpen);
  };

  const closeDrawer = () => {
    if (drawerOpen) {
      Animated.timing(drawerAnim, {
        toValue: -280,
        duration: 300,
        useNativeDriver: true,
      }).start();
      setDrawerOpen(false);
    }
  };

  const openAboutModal = () => {
    closeDrawer();
    setTimeout(() => setShowAboutModal(true), 300);
  };

  const openLanguageModal = () => {
    closeDrawer();
    setTimeout(() => setShowLanguageModal(true), 300);
  };

  const selectLanguage = (lang: 'en' | 'tr' | 'ar' | 'ru') => {
    setSelectedLanguage(lang);
    setShowLanguageModal(false);
  };

  const startEnglishQuiz = async () => {
    console.log('[Quiz] Starting English Quiz');
    setQuizMode(true);
    setQuizLevel(null);
    setQuizQuestionCount(0);
    
    const quizStartMessage = "Welcome to the English Quiz! 🎯\n\nPlease select your English level:\n\n1️⃣ Beginner - Basic vocabulary and simple sentences\n2️⃣ Intermediate - More complex grammar and conversations\n3️⃣ Advanced - Advanced vocabulary and complex topics\n\nJust type the number (1, 2, or 3) to start!";
    
    const assistantMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'assistant',
      content: quizStartMessage,
    };
    
    setMessages(prev => [...prev, assistantMsg]);
    setTypingMessageId(assistantMsg.id);
  };

  // TEST ONLY: Reset registration for testing email popup
  const resetRegistration = async () => {
    console.log('[TEST] Resetting registration...');
    await clearRegistration();
    setShowEmailModal(true);
    closeDrawer();
    console.log('[TEST] Registration cleared, email modal opened');
  };

  const getTranslation = (key: string) => {
    const translations: { [key: string]: { en: string; tr: string; ar: string; ru: string } } = {
      menu: { en: 'Menu', tr: 'Menü', ar: 'قائمة', ru: 'Меню' },
      settings: { en: 'Settings', tr: 'Ayarlar', ar: 'الإعدادات', ru: 'Настройки' },
      about: { en: 'About Kspeaker', tr: 'Kspeaker Hakkında', ar: 'حول Kspeaker', ru: 'О Kspeaker' },
      language: { en: 'Language', tr: 'Dil', ar: 'اللغة', ru: 'Язык' },
      askKspeaker: { en: 'Ask Kspeaker...', tr: 'Kspeaker\'a sor...', ar: 'اسأل Kspeaker...', ru: 'Спросите Kspeaker...' },
      startConversation: { en: 'Start a conversation', tr: 'Sohbete başla', ar: 'ابدأ محادثة', ru: 'Начать разговор' },
      askAnything: { en: 'Ask me anything or use the microphone', tr: 'Bana bir şey sor veya mikrofonu kullan', ar: 'اسألني أي شيء أو استخدم الميكروفون', ru: 'Спросите меня о чем угодно или используйте микрофон' },
      selectLanguage: { en: 'Select Language', tr: 'Dil Seçin', ar: 'اختر اللغة', ru: 'Выберите язык' },
      englishQuiz: { en: 'English Quiz', tr: 'İngilizce Quiz', ar: 'اختبار الإنجليزية', ru: 'Английский квиз' },
    };
    return translations[key]?.[selectedLanguage] || translations[key]?.en || key;
  };

  // Start voice listening - FIXED: Use refs for closure issues
  const startVoiceInput = () => {
    console.log('[Voice] 🎤 Starting voice input - VOICE CHAT MODE');
    
    // Clear any existing timer first
    if (silenceTimer.current) {
      console.log('[Voice] 🧹 Clearing old timer');
      clearTimeout(silenceTimer.current);
      silenceTimer.current = null;
    }
    
    // Reset voice state
    currentVoiceText.current = '';
    hasSentVoice.current = false;
    
    setListening(true);

    let hasReceivedAnyText = false;

    const setTimer = () => {
      if (silenceTimer.current) {
        clearTimeout(silenceTimer.current);
      }
      
      // CRITICAL: Only start 2s timer if we have received text
      const timeout = hasReceivedAnyText ? 2000 : 6000;
      console.log('[Voice] ⏰ Setting timer:', timeout, 'ms (hasText:', hasReceivedAnyText, ')');
      
      silenceTimer.current = setTimeout(() => {
        console.log('[Voice] ⏱️ Silence timeout triggered');
        console.log('[Voice] Current text:', currentVoiceText.current);
        console.log('[Voice] Has sent:', hasSentVoice.current);
        console.log('[Voice] Is sending:', isSending.current);
        
        stopListening();
        setListening(false);
        
        // CRITICAL: Check all conditions
        if (currentVoiceText.current.trim() && !isSending.current && !hasSentVoice.current) {
          console.log('[Voice] ✅ SENDING message:', currentVoiceText.current);
          hasSentVoice.current = true; // Mark as sent
          sendVoiceMessage(currentVoiceText.current);
        } else {
          console.log('[Voice] ❌ NOT SENDING - Reasons:');
          console.log('  - Empty:', !currentVoiceText.current.trim());
          console.log('  - Already sending:', isSending.current);
          console.log('  - Already sent:', hasSentVoice.current);
        }
      }, timeout);
    };

    startListening((text) => {
      console.log('[Voice] 🎤 Received text update:', text);
      currentVoiceText.current = text;
      
      if (!hasReceivedAnyText) {
        console.log('[Voice] ✅ First text received, switching to 2s timeout');
        hasReceivedAnyText = true;
      }
      
      setTimer();
    });

    setTimer();
  };

  // Microphone button handler - FIXED: Stop -> Text mode
  const handleMic = () => {
    console.log('[Mic] 🎤 Pressed - speaking:', speaking, 'listening:', listening);
    
    // If speaking, STOP and switch to text input mode
    if (speaking) {
      console.log('[Mic] 🛑 STOPPING TTS -> Switching to text input mode');
      stopSpeech();
      // Focus on text input for typing
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
      return;
    }

    // If listening, stop
    if (listening) {
      console.log('[Mic] 🛑 Stopping listening');
      if (silenceTimer.current) {
        clearTimeout(silenceTimer.current);
        silenceTimer.current = null;
      }
      stopListening();
      setListening(false);
      return;
    }

    // Start listening (only when idle)
    console.log('[Mic] 🎤 Starting voice input');
    startVoiceInput();
  };

  // TTS events - no dependencies on listening state
  useEffect(() => {
    Tts.setDefaultLanguage('en-US');

    const onStart = () => {
      console.log('[TTS] 🔊 Started speaking');
      setSpeaking(true);
    };

    const onFinish = () => {
      console.log('[TTS] ✅ Finished naturally');
      setSpeaking(false);
    };

    const onCancel = () => {
      console.log('[TTS] ⛔ Cancelled/Stopped');
      setSpeaking(false);
    };

    Tts.addEventListener('tts-start', onStart);
    Tts.addEventListener('tts-finish', onFinish);
    Tts.addEventListener('tts-cancel', onCancel);

    return () => {
      Tts.removeEventListener('tts-start', onStart as any);
      Tts.removeEventListener('tts-finish', onFinish as any);
      Tts.removeEventListener('tts-cancel', onCancel as any);
    };
  }, []); // No dependencies!

  // Initialize
  useEffect(() => {
    const init = async () => {
      await initializeApi();
      const registered = await checkRegistration();
      if (!registered) {
        setShowEmailModal(true);
      }
    };
    init();

    return () => {
      if (silenceTimer.current) {
        clearTimeout(silenceTimer.current);
      }
    };
  }, []);

  // Auto-scroll
  useEffect(() => {
    console.log('[Messages] Count changed:', messages.length);
    if (messages.length > 0) {
      console.log('[Messages] Last message:', messages[messages.length - 1].role, messages[messages.length - 1].content.substring(0, 30));
      requestAnimationFrame(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      });
    }
  }, [messages.length]);

  const handleEmailSubmit = async (email: string) => {
    const success = await registerUser(email);
    if (success) {
      await saveRegistration(email);
      setShowEmailModal(false);
    }
    return success;
  };

  const renderSkeletonLoader = () => {
    const shimmerTranslate = shimmerAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [-200, 200],
    });

    return (
      <View style={[
        styles.bubble, 
        styles.assistantBubble, 
        styles.skeletonBubble,
        isTablet && { maxWidth: 600, alignSelf: 'flex-start' },
      ]}>
        <View style={styles.skeletonLine1} />
        <View style={styles.skeletonLine2} />
        <View style={styles.skeletonLine3} />
        <Animated.View 
          style={[
            styles.shimmer, 
            { transform: [{ translateX: shimmerTranslate }] }
          ]} 
        />
      </View>
    );
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => {
    const isUser = item.role === 'user';
    const isTyping = typingMessageId === item.id;
    const textToShow = isTyping ? displayedText : item.content;
    
    console.log('[Render] Message:', item.role, item.content.substring(0, 30));
    return (
      <View style={[
        styles.bubble, 
        isUser ? styles.userBubble : styles.assistantBubble,
        isTablet && { 
          maxWidth: 600, 
          alignSelf: isUser ? 'flex-end' : 'flex-start' 
        },
      ]}>
        <Text style={[styles.messageText, isUser && styles.userMessageText]}>{textToShow}</Text>
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.empty}>
      <Ionicons name="chatbubbles-outline" size={64} color="rgba(125, 211, 192, 0.3)" />
      <Text style={styles.emptyText}>{getTranslation('startConversation')}</Text>
      <Text style={styles.emptySubtext}>{getTranslation('askAnything')}</Text>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <EmailRegistrationModal visible={showEmailModal} onSubmit={handleEmailSubmit} />

      {/* About Modal */}
      {showAboutModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>About Kspeaker</Text>
              <TouchableOpacity onPress={() => setShowAboutModal(false)}>
                <Ionicons name="close" size={28} color="#ECECEC" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <Text style={styles.aboutTitle}>English Practice AI Assistant</Text>
              <View style={styles.aboutSection}>
                <View style={styles.bulletPoint}>
                  <Ionicons name="checkmark-circle" size={20} color="#7DD3C0" />
                  <Text style={styles.aboutText}>
                    Designed specifically for English language practice and conversation
                  </Text>
                </View>
                <View style={styles.bulletPoint}>
                  <Ionicons name="checkmark-circle" size={20} color="#7DD3C0" />
                  <Text style={styles.aboutText}>
                    Voice-enabled AI that listens and responds naturally
                  </Text>
                </View>
                <View style={styles.bulletPoint}>
                  <Ionicons name="checkmark-circle" size={20} color="#7DD3C0" />
                  <Text style={styles.aboutText}>
                    Helps improve speaking, listening, and conversational skills
                  </Text>
                </View>
                <View style={styles.bulletPoint}>
                  <Ionicons name="checkmark-circle" size={20} color="#7DD3C0" />
                  <Text style={styles.aboutText}>
                    Real-time feedback and engaging dialogue practice
                  </Text>
                </View>
                <View style={styles.bulletPoint}>
                  <Ionicons name="checkmark-circle" size={20} color="#7DD3C0" />
                  <Text style={styles.aboutText}>
                    Perfect for learners at any level seeking daily practice
                  </Text>
                </View>
              </View>
              <Text style={styles.aboutFooter}>
                Start speaking and let Kspeaker help you master English!
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Language Modal */}
      {showLanguageModal && (
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{getTranslation('selectLanguage')}</Text>
              <TouchableOpacity onPress={() => setShowLanguageModal(false)}>
                <Ionicons name="close" size={28} color="#ECECEC" />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <TouchableOpacity 
                style={[styles.languageOption, selectedLanguage === 'en' && styles.languageOptionSelected]}
                onPress={() => selectLanguage('en')}
              >
                <Text style={styles.languageFlag}>🇬🇧</Text>
                <Text style={styles.languageText}>English</Text>
                {selectedLanguage === 'en' && <Ionicons name="checkmark-circle" size={24} color="#7DD3C0" />}
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.languageOption, selectedLanguage === 'tr' && styles.languageOptionSelected]}
                onPress={() => selectLanguage('tr')}
              >
                <Text style={styles.languageFlag}>🇹🇷</Text>
                <Text style={styles.languageText}>Türkçe</Text>
                {selectedLanguage === 'tr' && <Ionicons name="checkmark-circle" size={24} color="#7DD3C0" />}
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.languageOption, selectedLanguage === 'ar' && styles.languageOptionSelected]}
                onPress={() => selectLanguage('ar')}
              >
                <Text style={styles.languageFlag}>🇸🇦</Text>
                <Text style={styles.languageText}>العربية</Text>
                {selectedLanguage === 'ar' && <Ionicons name="checkmark-circle" size={24} color="#7DD3C0" />}
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.languageOption, selectedLanguage === 'ru' && styles.languageOptionSelected]}
                onPress={() => selectLanguage('ru')}
              >
                <Text style={styles.languageFlag}>🇷🇺</Text>
                <Text style={styles.languageText}>Русский</Text>
                {selectedLanguage === 'ru' && <Ionicons name="checkmark-circle" size={24} color="#7DD3C0" />}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Drawer Menu */}
      {drawerOpen && (
        <TouchableOpacity 
          style={styles.drawerOverlay} 
          activeOpacity={1} 
          onPress={closeDrawer}
        />
      )}
      <Animated.View style={[
        styles.drawer, 
        { transform: [{ translateX: drawerAnim }] },
        isTablet && { width: 400 },
      ]}>
        <View style={styles.drawerHeader}>
          <Text style={styles.drawerTitle}>{getTranslation('menu')}</Text>
          <TouchableOpacity onPress={toggleDrawer}>
            <Ionicons name="close" size={24} color="#ECECEC" />
          </TouchableOpacity>
        </View>
        <View style={styles.drawerContent}>
          <TouchableOpacity style={styles.drawerItem}>
            <Ionicons name="settings-outline" size={24} color="#ECECEC" />
            <Text style={styles.drawerItemText}>{getTranslation('settings')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.drawerItem} onPress={openAboutModal}>
            <Ionicons name="information-circle-outline" size={24} color="#ECECEC" />
            <Text style={styles.drawerItemText}>{getTranslation('about')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.drawerItem} onPress={openLanguageModal}>
            <Ionicons name="language" size={24} color="#ECECEC" />
            <Text style={styles.drawerItemText}>{getTranslation('language')}</Text>
          </TouchableOpacity>
          
          {/* TEST ONLY - Refresh Registration */}
          <View style={styles.drawerDivider} />
          <TouchableOpacity style={styles.drawerItemTest} onPress={resetRegistration}>
            <Ionicons name="refresh-outline" size={24} color="#FFA500" />
            <Text style={styles.drawerItemTestText}>Refresh Registration (Test)</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={toggleDrawer}>
          <Ionicons name="menu" size={24} color="#FFF" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>KSPEAKER</Text>
        </View>
        <View style={styles.logoContainer}>
          <Text style={styles.logoText}>KARTEZYA</Text>
          <View style={styles.plusIcon}>
            <Text style={styles.plusSymbol}>+</Text>
          </View>
        </View>
      </View>

      {/* Messages */}
      <LinearGradient colors={['#1A1A1F', '#212128', '#1A1D26']} style={styles.gradient}>
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.listContent}
          style={styles.list}
          ListEmptyComponent={renderEmpty}
          ListFooterComponent={isLoadingResponse ? renderSkeletonLoader : null}
          keyboardShouldPersistTaps="handled"
        />
      </LinearGradient>

      {/* Composer */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.composerKeyboard}
      >
        <View style={styles.composerContainer}>
          {/* Dropup Menu */}
          {showDropup && (
            <View style={styles.dropupMenu}>
              <TouchableOpacity 
                style={styles.dropupItem}
                onPress={() => {
                  setShowDropup(false);
                  startEnglishQuiz();
                }}
              >
                <Ionicons name="school" size={20} color="#ECECEC" />
                <Text style={styles.dropupItemText}>{getTranslation('englishQuiz')}</Text>
              </TouchableOpacity>
            </View>
          )}
          
          <View style={[styles.composerInner, { paddingBottom: Math.max(insets.bottom, 12) }]}>
            {Platform.OS === 'ios' ? (
              <BlurView style={styles.blur} blurType="dark" blurAmount={25}>
                <View style={styles.inputRow}>
                  <TouchableOpacity
                    style={styles.plusButton}
                    onPress={() => setShowDropup(!showDropup)}
                  >
                    <Ionicons name="add-circle" size={28} color="#4A6FA5" />
                  </TouchableOpacity>
                  <TextInput
                    ref={inputRef}
                    style={styles.input}
                    value={input}
                    onChangeText={setInput}
                    placeholder={getTranslation('askKspeaker')}
                    placeholderTextColor="rgba(255, 255, 255, 0.4)"
                    onSubmitEditing={handleSend}
                    returnKeyType="send"
                    multiline
                  />
                  {input.trim() ? (
                    <TouchableOpacity
                      style={styles.sendButton}
                      onPress={handleSend}
                    >
                      <Ionicons name="send" size={24} color="#7DD3C0" />
                    </TouchableOpacity>
                  ) : (
                    <>
                      {messages.length > 0 && (
                        <TouchableOpacity
                          style={styles.clearButton}
                          onPress={clearAll}
                        >
                          <Ionicons name="trash-outline" size={24} color="#EF4444" />
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        style={[styles.micButton, speaking && styles.micButtonActive]}
                        onPress={handleMic}
                      >
                        {speaking ? (
                          <Ionicons name="stop-circle" size={28} color="#EF4444" />
                        ) : listening ? (
                          <Ionicons name="mic" size={28} color="#10B981" />
                        ) : (
                          <Ionicons name="mic-outline" size={28} color="#7DD3C0" />
                        )}
                      </TouchableOpacity>
                    </>
                  )}
                </View>
                {listening && (
                  <Animated.View 
                    style={[
                      styles.micPulse,
                      { 
                        transform: [{ scale: micPulseAnim }],
                        opacity: micPulseAnim.interpolate({
                          inputRange: [1, 1.3],
                          outputRange: [0.3, 0],
                        }),
                      }
                    ]} 
                  />
                )}
              </BlurView>
            ) : (
              <View style={[styles.blur, styles.androidComposer]}>
                <View style={styles.inputRow}>
                  <TouchableOpacity
                    style={styles.plusButton}
                    onPress={() => setShowDropup(!showDropup)}
                  >
                    <Ionicons name="add-circle" size={28} color="#4A6FA5" />
                  </TouchableOpacity>
                  <TextInput
                    ref={inputRef}
                    style={styles.input}
                    value={input}
                    onChangeText={setInput}
                    placeholder={getTranslation('askKspeaker')}
                    placeholderTextColor="rgba(255, 255, 255, 0.4)"
                    onSubmitEditing={handleSend}
                    returnKeyType="send"
                    multiline
                  />
                  {input.trim() ? (
                    <TouchableOpacity
                      style={styles.sendButton}
                      onPress={handleSend}
                    >
                      <Ionicons name="send" size={24} color="#7DD3C0" />
                    </TouchableOpacity>
                  ) : (
                    <>
                      {messages.length > 0 && (
                        <TouchableOpacity
                          style={styles.clearButton}
                          onPress={clearAll}
                        >
                          <Ionicons name="trash-outline" size={24} color="#EF4444" />
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        style={[styles.micButton, speaking && styles.micButtonActive]}
                        onPress={handleMic}
                      >
                        {speaking ? (
                          <Ionicons name="stop-circle" size={28} color="#EF4444" />
                        ) : listening ? (
                          <Ionicons name="mic" size={28} color="#10B981" />
                        ) : (
                          <Ionicons name="mic-outline" size={28} color="#7DD3C0" />
                        )}
                      </TouchableOpacity>
                    </>
                  )}
                </View>
                {listening && (
                  <Animated.View 
                    style={[
                      styles.micPulse,
                      { 
                        transform: [{ scale: micPulseAnim }],
                        opacity: micPulseAnim.interpolate({
                          inputRange: [1, 1.3],
                          outputRange: [0.3, 0],
                        }),
                      }
                    ]} 
                  />
                )}
              </View>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#212121',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#2F2F2F',
    borderBottomWidth: 1,
    borderBottomColor: '#1A3A52',
  },
  headerCenter: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
    pointerEvents: 'none',
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: '900',
    color: '#ECECEC',
    letterSpacing: 2,
    fontStyle: 'italic',
    textShadowColor: 'rgba(255, 255, 255, 0.1)',
    textShadowOffset: { width: 1, height: 1 },
    textShadowRadius: 3,
  },
  logoContainer: {
    position: 'relative',
    paddingRight: 2,
  },
  logoText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#ECECEC',
    letterSpacing: 1,
    fontStyle: 'italic',
  },
  plusIcon: {
    position: 'absolute',
    top: -3,
    right: -6,
    width: 11,
    height: 11,
    borderRadius: 5.5,
    backgroundColor: 'rgba(125, 211, 192, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  plusSymbol: {
    fontSize: 8,
    fontWeight: '900',
    color: '#FFFFFF',
    lineHeight: 9,
  },
  gradient: {
    flex: 1,
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 24,
    maxWidth: Dimensions.get('window').width >= 768 ? 800 : '100%',
    alignSelf: 'center',
    width: '100%',
  },
  bubble: {
    maxWidth: '85%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#2A3F54',
    borderBottomRightRadius: 4,
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#2F2F2F',
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 15,
    color: '#ECECEC',
    lineHeight: 21,
  },
  userMessageText: {
    color: '#ECECEC',
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#4A6FA5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#3E3E42',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4A5568',
  },
  empty: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 100,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.4)',
    marginTop: 8,
  },
  composerKeyboard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  composerContainer: {
    width: '100%',
    maxWidth: Dimensions.get('window').width >= 768 ? 800 : '100%',
    alignSelf: 'center',
  },
  composerInner: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  blur: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  androidComposer: {
    backgroundColor: '#2F2F2F',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#ECECEC',
    maxHeight: 100,
  },
  micButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#3E3E42',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#4A5568',
  },
  micButtonListening: {
    backgroundColor: '#3D2A3A',
    borderColor: '#8B4A6F',
  },
  micButtonActive: {
    backgroundColor: '#2A3D4A',
    borderColor: '#4A7A8B',
  },
  micPulse: {
    position: 'absolute',
    bottom: 12,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#10B981',
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 5,
  },
  drawerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 999,
  },
  drawer: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    width: 280,
    backgroundColor: '#2F2F2F',
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 2, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#404040',
  },
  drawerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#ECECEC',
  },
  drawerContent: {
    paddingTop: 20,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 16,
  },
  drawerItemText: {
    fontSize: 16,
    color: '#ECECEC',
    fontWeight: '500',
  },
  skeletonBubble: {
    overflow: 'hidden',
    position: 'relative',
    maxWidth: '95%',
    minWidth: '80%',
  },
  skeletonLine1: {
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 6,
    marginBottom: 8,
    width: '95%',
  },
  skeletonLine2: {
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 6,
    marginBottom: 8,
    width: '88%',
  },
  skeletonLine3: {
    height: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 6,
    width: '92%',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    width: 200,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2000,
    paddingHorizontal: 24,
  },
  modalContent: {
    backgroundColor: '#2F2F2F',
    borderRadius: 16,
    width: '100%',
    maxWidth: Dimensions.get('window').width >= 768 ? 600 : 500,
    maxHeight: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#404040',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ECECEC',
  },
  modalBody: {
    paddingHorizontal: 20,
    paddingVertical: 20,
  },
  aboutTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#7DD3C0',
    marginBottom: 16,
    textAlign: 'center',
  },
  aboutSection: {
    marginBottom: 20,
  },
  bulletPoint: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 12,
    gap: 10,
  },
  aboutText: {
    flex: 1,
    fontSize: 15,
    color: '#ECECEC',
    lineHeight: 22,
  },
  aboutFooter: {
    fontSize: 16,
    fontWeight: '600',
    color: '#7DD3C0',
    textAlign: 'center',
    fontStyle: 'italic',
    marginTop: 8,
  },
  languageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    gap: 16,
  },
  languageOptionSelected: {
    backgroundColor: 'rgba(125, 211, 192, 0.15)',
    borderWidth: 1,
    borderColor: '#7DD3C0',
  },
  languageFlag: {
    fontSize: 32,
  },
  languageText: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#ECECEC',
  },
  plusButton: {
    marginRight: 8,
  },
  dropupMenu: {
    position: 'absolute',
    bottom: '100%',
    left: 20,
    right: 20,
    backgroundColor: '#2F2F2F',
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 5,
  },
  dropupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 12,
    borderRadius: 12,
  },
  dropupItemText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ECECEC',
  },
  quizButtonContainer: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 8,
    backgroundColor: '#212121',
  },
  quizButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4A6FA5',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
    gap: 8,
    shadowColor: '#4A6FA5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  quizButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#ECECEC',
    letterSpacing: 0.5,
  },
  drawerDivider: {
    height: 1,
    backgroundColor: '#404040',
    marginVertical: 12,
  },
  drawerItemTest: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 16,
    borderRadius: 8,
  },
  drawerItemTestText: {
    fontSize: 16,
    color: '#FFA500',
    fontWeight: '600',
  },
});

export default ChatScreen;
