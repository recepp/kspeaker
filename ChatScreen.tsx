import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet, TouchableOpacity, Platform, KeyboardAvoidingView, Keyboard, Animated, Dimensions, useWindowDimensions, Vibration, ScrollView, Switch, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { sendChatMessage, initializeApi, registerUser, createVoucher } from './api';
import { checkRegistration, saveRegistration, clearRegistration, saveVoucher, checkVoucher, canSendMessage, incrementMessageCount, getMessageCount } from './registration';
import { VoucherModal } from './components/VoucherModal';
import { PremiumSuccessModal } from './components/PremiumSuccessModal';
import { startListening, stopListening, initializeVoice, destroyVoice } from './speech';
import Ionicons from 'react-native-vector-icons/Ionicons';
import ttsService from './services/ttsService';
import EmailService from './services/emailService';
import LinearGradient from 'react-native-linear-gradient';
import { BlurView } from '@react-native-community/blur';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NotificationService from './notificationService';

type Theme = 'dark' | 'light';
type Role = 'user' | 'assistant';

interface ChatMessage {
  id: string;
  role: Role;
  content: string;
}

interface ChatScreenProps {
  navigation?: any;
}

const ChatScreen: React.FC<ChatScreenProps> = (props) => {
  const navigation = useNavigation();
  // Removed debug log - too verbose
  
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const isTablet = width >= 768;
  
  // Voice Conversation State - ChatGPT Style (IDLE → LISTENING → SPEAKING)
  type VoiceState = 'idle' | 'listening' | 'speaking' | 'processing';
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  
  // Simple state - GPT style
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [showVoucherModal, setShowVoucherModal] = useState(false);
  const [showPremiumSuccessModal, setShowPremiumSuccessModal] = useState(false);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isLoadingResponse, setIsLoadingResponse] = useState(false);
  const [typingMessageId, setTypingMessageId] = useState<string | null>(null);
  const [displayedText, setDisplayedText] = useState('');
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [showFaqModal, setShowFaqModal] = useState(false); // ADIM 2: FAQ Modal
  const [showSupportModal, setShowSupportModal] = useState(false); // ADIM 2: Support Modal
  const [supportEmail, setSupportEmail] = useState('');
  const [supportDescription, setSupportDescription] = useState('');
  const [errorMessage, setErrorMessage] = useState<string>(''); // Backend error message
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'tr' | 'ar' | 'ru'>('en');
  const [quizMode, setQuizMode] = useState(false);
  const [quizLevel, setQuizLevel] = useState<string | null>(null);
  const [quizQuestionCount, setQuizQuestionCount] = useState(0);
  const [roleplayMode, setRoleplayMode] = useState(false);
  const [roleplayScenario, setRoleplayScenario] = useState<string | null>(null);
  const [showDropup, setShowDropup] = useState(false);
  const [showModeSelector, setShowModeSelector] = useState(false); // Mode selection menu
  const [theme, setTheme] = useState<Theme>('dark');
  const [messageContextMenu, setMessageContextMenu] = useState<string | null>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [conversationModeType, setConversationModeType] = useState<string | null>(null); // conversation|teacher|beginner|casual_friend|strict|roleplay|business
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [showNotificationSettings, setShowNotificationSettings] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const scrollButtonAnim = useRef(new Animated.Value(0)).current;
  
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);
  const silenceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSending = useRef(false);
  const currentVoiceText = useRef('');
  const voiceStateRef = useRef<VoiceState>('idle'); // Ref for closures
  const userStoppedVoice = useRef(false); // Track if user manually stopped voice
  const voiceRetryCount = useRef(0); // Track retry attempts
  const isProcessingVoiceMessage = useRef(false); // CRITICAL: Prevent duplicate sends
  const drawerAnim = useRef(new Animated.Value(-280)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const micPulseAnim = useRef(new Animated.Value(1)).current;

  // Removed verbose state logging - only log on specific actions

  // Sync voiceState ref with state for closures
  useEffect(() => {
    voiceStateRef.current = voiceState;
    if (__DEV__) {
      console.log('[Voice] State changed:', voiceState);
      console.log('[UI] Stop button should be visible:', voiceState !== 'idle');
    }
  }, [voiceState]);

  // Load theme and language from storage
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem('appTheme');
        if (savedTheme === 'light' || savedTheme === 'dark') {
          setTheme(savedTheme);
        }
      } catch (e) {
        console.error('[Theme] Error loading theme:', e);
      }
    };
    
    const loadLanguage = async () => {
      try {
        const savedLanguage = await AsyncStorage.getItem('selectedLanguage');
        if (savedLanguage === 'en' || savedLanguage === 'tr' || savedLanguage === 'ar' || savedLanguage === 'ru') {
          setSelectedLanguage(savedLanguage);
          console.log('[Language] Language loaded:', savedLanguage);
        }
      } catch (e) {
        console.error('[Language] Error loading language:', e);
      }
    };
    
    loadTheme();
    loadLanguage();
  }, []);

  // Dil değiştiğinde bildirimleri güncelle
  useEffect(() => {
    const updateNotificationLanguage = async () => {
      // Bildirimler açıksa, seçili dilde yeniden ayarla
      if (notificationsEnabled) {
        console.log('[Notifications] 🌍 Language changed to:', selectedLanguage);
        NotificationService.scheduleDailyReminders(selectedLanguage);
      }
    };
    
    updateNotificationLanguage();
  }, [selectedLanguage]);

  // Toggle theme
  const toggleTheme = async () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    // Haptic feedback
    if (Platform.OS === 'ios') {
      Vibration.vibrate(10);
    }
    try {
      await AsyncStorage.setItem('appTheme', newTheme);
    } catch (e) {
      console.error('[Theme] Error saving theme:', e);
    }
  };

  // Toggle notifications
  const toggleNotifications = async () => {
    const newValue = !notificationsEnabled;
    setNotificationsEnabled(newValue);
    
    try {
      if (newValue) {
        console.log('[Notifications] 📲 Requesting permissions...');
        // Bildirim izni iste
        const permissions = await NotificationService.requestPermissions();
        console.log('[Notifications] 📲 Permission result:', permissions);
        
        if (permissions) {
          console.log('[Notifications] ✅ Permission granted, scheduling...');
          
          // Günlük hatırlatıcıları seçili dilde ayarla
          NotificationService.scheduleDailyReminders(selectedLanguage);
          
          // Zamanlanmış bildirimleri kontrol et
          setTimeout(() => {
            NotificationService.checkScheduledNotifications();
          }, 1000);
          
          // Bildirim metnini seçili dile göre al
          const notificationText = NotificationService.getNotificationText(selectedLanguage);
          
          Alert.alert(
            notificationText.title,
            notificationText.message,
            [{ text: notificationText.button, style: 'default' }]
          );
        } else {
          console.log('[Notifications] ❌ Permission denied');
          setNotificationsEnabled(false);
          Alert.alert(
            'İzin Gerekli',
            'Bildirimler için lütfen ayarlardan izin verin.',
            [{ text: 'Tamam' }]
          );
        }
      } else {
        // Bildirimleri kapat
        console.log('[Notifications] 🔕 Disabling notifications...');
        NotificationService.cancelAllNotifications();
        Alert.alert('🔕 Bildirimler Kapatıldı', 'Artık hatırlatma almayacaksın.');
      }
      
      await AsyncStorage.setItem('notificationsEnabled', JSON.stringify(newValue));
    } catch (error) {
      console.error('[Notifications] ❌ Error:', error);
      setNotificationsEnabled(false);
    }
  };

  // Haptic feedback helper
  const triggerHaptic = (type: 'light' | 'medium' | 'heavy' = 'light') => {
    if (Platform.OS === 'ios') {
      const duration = type === 'light' ? 10 : type === 'medium' ? 20 : 30;
      Vibration.vibrate(duration);
    }
  };

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

  // Scroll button animation
  useEffect(() => {
    Animated.spring(scrollButtonAnim, {
      toValue: showScrollButton ? 1 : 0,
      useNativeDriver: true,
      tension: 50,
      friction: 7,
    }).start();
  }, [showScrollButton]);

  // Show/hide scroll button based on messages
  useEffect(() => {
    if (messages.length > 3) {
      setShowScrollButton(true);
    } else {
      setShowScrollButton(false);
    }
  }, [messages.length]);

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
    }, 5); // 5ms per character for fast typing

    return () => clearInterval(typingInterval);
  }, [typingMessageId, messages]);

  // Mic pulse animation - ChatGPT style
  useEffect(() => {
    if (voiceState === 'listening') {
      // Active listening - prominent pulse
      Animated.loop(
        Animated.sequence([
          Animated.timing(micPulseAnim, {
            toValue: 1.6,
            duration: 500,
            useNativeDriver: true,
          }),
          Animated.timing(micPulseAnim, {
            toValue: 1,
            duration: 500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else if (voiceState === 'speaking') {
      // Speaking - subtle breathing
      Animated.loop(
        Animated.sequence([
          Animated.timing(micPulseAnim, {
            toValue: 1.2,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(micPulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else if (voiceState === 'processing') {
      // Processing - fast pulse
      Animated.loop(
        Animated.sequence([
          Animated.timing(micPulseAnim, {
            toValue: 1.4,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(micPulseAnim, {
            toValue: 1,
            duration: 300,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      micPulseAnim.setValue(1);
    }
  }, [voiceState]);

  // Text send handler
  const handleSend = async () => {
    if (!input.trim() || isSending.current) return;

    const canSend = await canSendMessage();
    if (!canSend) {
      setShowVoucherModal(true);
      return;
    }

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

      // Roleplay mode logic
      if (roleplayMode && !roleplayScenario) {
        // Scenario selection
        if (['1', '2', '3', '4', '5'].includes(userInput)) {
          setRoleplayScenario(userInput);

          // Map scenario numbers to specific roles
          const scenarioRoles: Record<string, string> = {
            '1': 'You are a hotel receptionist. I am checking into your hotel. Start by greeting me warmly and asking for my reservation details.',
            '2': 'You are a waiter at a restaurant. I am a customer ready to order. Start by greeting me and asking what I would like to order.',
            '3': 'You are an HR manager conducting a job interview. I am the job candidate. Start by introducing yourself and asking me to tell you about myself.',
            '4': 'You are a doctor. I am a patient with health concerns. Start by greeting me and asking what brings me in today.',
            '5': 'You are a shop assistant at a clothing store. I am a customer looking for items. Start by greeting me and asking how you can help me today.',
          };

          reply = await sendChatMessage(scenarioRoles[userInput], 'roleplay');
        } else {
          reply = 'Please type a number between 1-5 to select a roleplay scenario.';
        }
      } else if (roleplayMode && roleplayScenario) {
        // Roleplay in progress
        reply = await sendChatMessage(userInput, 'roleplay');
      } else if (quizMode && !quizLevel) {
        // Quiz level selection
        if (userInput === '1' || userInput.toLowerCase().includes('beginner')) {
          setQuizLevel('beginner');
          reply = await sendChatMessage('I want to take an English quiz at beginner level. Please give me 5 simple questions about basic English vocabulary and grammar. Number them 1-5.', conversationModeType || undefined);
        } else if (userInput === '2' || userInput.toLowerCase().includes('intermediate')) {
          setQuizLevel('intermediate');
          reply = await sendChatMessage('I want to take an English quiz at intermediate level. Please give me 5 questions about English grammar, vocabulary and comprehension. Number them 1-5.', conversationModeType || undefined);
        } else if (userInput === '3' || userInput.toLowerCase().includes('advanced')) {
          setQuizLevel('advanced');
          reply = await sendChatMessage('I want to take an English quiz at advanced level. Please give me 5 challenging questions about advanced English, idioms, and complex grammar. Number them 1-5.', conversationModeType || undefined);
        } else {
          reply = 'Please type 1 for Beginner, 2 for Intermediate, or 3 for Advanced.';
        }
      } else if (quizMode && quizLevel) {
        // Quiz in progress
        setQuizQuestionCount(prev => prev + 1);
        reply = await sendChatMessage(userInput, conversationModeType || undefined);

        if (quizQuestionCount >= 4) {
          // Quiz finished after 5 questions
          setQuizMode(false);
          setQuizLevel(null);
          setQuizQuestionCount(0);
        }
      } else {
        // Normal chat mode with conversation mode type
        reply = await sendChatMessage(userInput, conversationModeType || undefined);
      }

      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: reply,
      };
      setMessages(prev => [...prev, assistantMsg]);
      setTypingMessageId(assistantMsg.id);

      // DON'T speak the reply in text mode - only speak in voice conversation mode
      // This prevents unwanted TTS when user types messages
      if (__DEV__) {
        console.log('[TTS] 🔇 Text message mode - TTS disabled');
      }

      await incrementMessageCount();
    } catch (e: any) {
      if (__DEV__) {
        console.log('[Send] ⚠️ Request error:', e.message || e);
        console.log('[Send] ⚠️ Full error:', JSON.stringify(e));
      }

      // Extract meaningful message from long backend errors
      let errorMsg = e.message || '';

      // Check for network errors first
      if (errorMsg.includes('NETWORK_ERROR') || errorMsg.includes('Network request failed')) {
        if (__DEV__) console.log('[Send] Error type: NETWORK_ERROR');
        setErrorMessage(getTranslation('networkError'));
      } else if (errorMsg.includes('429') || errorMsg.includes('quota') || errorMsg.includes('Quota') || errorMsg.includes('RESOURCE_EXHAUSTED')) {
        console.log('[Send] Error type: QUOTA_EXCEEDED (Gemini API)');
        setErrorMessage(getTranslation('quotaMessage'));
      } else if (e.message === 'RATE_LIMIT_EXCEEDED') {
        console.log('[Send] Error type: RATE_LIMIT');
        setErrorMessage(getTranslation('rateLimitMessage'));
      } else if (e.message === 'QUOTA_EXCEEDED') {
        console.log('[Send] Error type: QUOTA_EXCEEDED');
        setErrorMessage(getTranslation('quotaMessage'));
      } else if (e.message?.startsWith('API_ERROR_')) {
        console.log('[Send] Error type: API_ERROR');
        setErrorMessage(getTranslation('approvalMessage'));
      } else if (errorMsg.length > 10 && !errorMsg.startsWith('Error:')) {
        // Backend returned a custom message - but it might be too long
        // Extract first meaningful sentence
        const firstLine = errorMsg.split('\n')[0];
        const shortMsg = firstLine.length > 150 ? getTranslation('approvalMessage') : firstLine;
        console.log('[Send] Error type: CUSTOM_MESSAGE from backend');
        setErrorMessage(shortMsg);
      } else {
        console.log('[Send] Error type: UNKNOWN - showing default');
        setErrorMessage(getTranslation('approvalMessage'));
      }

      setShowApprovalModal(true);
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoadingResponse(false);
      isSending.current = false;
    }
  };

  // Voice send handler - Integrated with state machine
  const sendVoiceMessage = async (voiceText: string) => {
    if (!voiceText.trim() || isSending.current) {
      return;
    }

    const canSend = await canSendMessage();
    if (!canSend) {
      setShowVoucherModal(true);
      return;
    }

    console.log('[Voice] 📤 Sending:', voiceText);
    isSending.current = true;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: voiceText.trim(),
    };

    setMessages(prev => [...prev, userMsg]);
    setTypingMessageId(userMsg.id);
    setIsLoadingResponse(true);

    // CRITICAL: Stop listening during processing
    try {
      stopListening();
      console.log('[Voice] 🛑 Stopped listening during processing');
    } catch (e) {
      console.log('[Voice] ⚠️ Listening already stopped');
    }

    try {
      const reply = await sendChatMessage(voiceText.trim(), conversationModeType || undefined);

      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: reply,
      };

      setMessages(prev => [...prev, assistantMsg]);
      setTypingMessageId(assistantMsg.id);

      // CRITICAL: Ensure we're in speaking state BEFORE starting TTS
      console.log('[Voice] 🎙️ Preparing to speak response...');
      setVoiceState('speaking');
      voiceStateRef.current = 'speaking';

      // Speak the reply - TTS will trigger state transitions via events
      setTimeout(() => {
        console.log('[TTS] 🔊 Starting speech playback');
        ttsService.speak(reply);
      }, 300); // Small delay to ensure state transition is complete

      await incrementMessageCount();
    } catch (e: any) {
      console.log('[Voice] ⚠️ Error:', e.message);
      console.log('[Voice] ⚠️ Full error:', JSON.stringify(e));

      // Stop conversation mode on error
      stopVoiceConversation();

      // Extract meaningful message from long backend errors
      let errorMsg = e.message || '';

      // Check for network errors first
      if (errorMsg.includes('NETWORK_ERROR') || errorMsg.includes('Network request failed')) {
        if (__DEV__) console.log('[Voice] Error type: NETWORK_ERROR');
        setErrorMessage(getTranslation('networkError'));
      } else if (errorMsg.includes('429') || errorMsg.includes('quota') || errorMsg.includes('Quota') || errorMsg.includes('RESOURCE_EXHAUSTED')) {
        console.log('[Voice] Error type: QUOTA_EXCEEDED (Gemini API)');
        setErrorMessage(getTranslation('quotaMessage'));
      } else if (e.message === 'RATE_LIMIT_EXCEEDED') {
        console.log('[Voice] Error type: RATE_LIMIT');
        setErrorMessage(getTranslation('rateLimitMessage'));
      } else if (e.message === 'QUOTA_EXCEEDED') {
        console.log('[Voice] Error type: QUOTA_EXCEEDED');
        setErrorMessage(getTranslation('quotaMessage'));
      } else if (e.message?.startsWith('API_ERROR_')) {
        console.log('[Voice] Error type: API_ERROR');
        setErrorMessage(getTranslation('approvalMessage'));
      } else if (errorMsg.length > 10 && !errorMsg.startsWith('Error:')) {
        // Backend returned a custom message - but it might be too long
        // Extract first meaningful sentence
        const firstLine = errorMsg.split('\n')[0];
        const shortMsg = firstLine.length > 150 ? getTranslation('approvalMessage') : firstLine;
        console.log('[Voice] Error type: CUSTOM_MESSAGE from backend');
        setErrorMessage(shortMsg);
      } else {
        console.log('[Voice] Error type: UNKNOWN - showing default');
        setErrorMessage(getTranslation('approvalMessage'));
      }

      setShowApprovalModal(true);
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsLoadingResponse(false);
      isSending.current = false;
    }
  };

  // Clear all messages
  const clearAll = () => {
    console.log('[Chat] 🗑️ Clearing all messages');
    
    try {
      // Clear timer first to prevent any pending operations
      if (silenceTimer.current) {
        clearTimeout(silenceTimer.current);
        silenceTimer.current = null;
      }
      
      // Set manual stop flag to prevent any auto-restarts
      userStoppedVoice.current = true;
      
      // Stop listening safely
      try {
        stopListening();
      } catch (e) {
        console.log('[Chat] Warning: Error stopping speech recognition:', e);
      }
      
      // Stop speaking safely
      try {
        ttsService.stop();
      } catch (e) {
        console.log('[Chat] Warning: Error stopping TTS:', e);
      }
      
      // Clear text
      currentVoiceText.current = '';
      
      // Reset voice state
      setVoiceState('idle');
      voiceStateRef.current = 'idle';
      
      // Clear messages and input
      setMessages([]);
      setInput('');
      
      // Reset other states
      setTypingMessageId(null);
      setDisplayedText('');
      setIsLoadingResponse(false);
      
      console.log('[Chat] ✅ Messages cleared successfully');
    } catch (error) {
      console.error('[Chat] ❌ Error in clearAll:', error);
      // Even if there's an error, try to clear messages
      setMessages([]);
      setInput('');
      setVoiceState('idle');
      voiceStateRef.current = 'idle';
    }
  };

  // Scroll to bottom
  const scrollToBottom = () => {
    triggerHaptic('light');
    flatListRef.current?.scrollToEnd({ animated: true });
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

  const selectLanguage = async (lang: 'en' | 'tr' | 'ar' | 'ru') => {
    setSelectedLanguage(lang);
    setShowLanguageModal(false);
    try {
      await AsyncStorage.setItem('selectedLanguage', lang);
      console.log('[Language] Language saved:', lang);
    } catch (error) {
      console.error('[Language] Failed to save language:', error);
    }
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

  const handleVoucherSubmit = async (voucherCode: string) => {
    console.log('[Voucher] 🎟️ Submitting voucher code...');
    
    // Call saveRegistration which will register with backend API
    const success = await saveRegistration(voucherCode);
    
    if (success) {
      console.log('[Voucher] ✅ Voucher successful! Showing premium popup...');
      
      // Show premium success modal after a short delay
      setTimeout(() => {
        setShowPremiumSuccessModal(true);
      }, 500);
    } else {
      console.log('[Voucher] ❌ Voucher failed');
    }
    
    return success;
  };

  // Reset to free tier for testing (DEV ONLY)
  const resetToFreeTier = async () => {
    try {
      console.log('[Test] 🔄 Resetting to free tier...');
      triggerHaptic('medium');
      
      // First check current message count
      const currentCount = await getMessageCount();
      const hasVoucher = await checkVoucher();
      
      Alert.alert(
        '⚠️ Reset to Free Tier',
        `Current Status:\n• Voucher: ${hasVoucher ? '✅ Active' : '❌ None'}\n• Messages today: ${currentCount}/∞\n\nThis will:\n• Remove premium access\n• Reset to 5 messages/day\n• Clear all voucher data\n\nAre you sure?`,
        [
          {
            text: 'Cancel',
            style: 'cancel'
          },
          {
            text: 'Reset Now',
            style: 'destructive',
            onPress: async () => {
              // Clear ALL registration data (voucher + message count)
              const success = await clearRegistration();
              
              if (success) {
                // Verify it's really cleared
                const verifyVoucher = await checkVoucher();
                const verifyCount = await getMessageCount();
                
                // Show success message with verification
                Alert.alert(
                  '✅ Reset Complete',
                  `You are now on FREE TIER:\n\n✅ Voucher removed\n✅ Message count: ${verifyCount}/5 today\n\nYou can now test the 5-message limit!\n\nUse "🧪 Test Admin Voucher" to upgrade again.`,
                  [{ text: 'Got it!', style: 'default' }]
                );
                
                console.log('[Test] ✅ Successfully reset to free tier');
                console.log('[Test] ✅ Verification - Voucher:', verifyVoucher, 'Count:', verifyCount);
              } else {
                Alert.alert('❌ Error', 'Failed to reset. Please try again.');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('[Test] ❌ Reset error:', error);
      Alert.alert('❌ Error', 'Failed to reset. Please try again.');
    }
  };

  const getTranslation = (key: string) => {
    const translations: { [key: string]: { en: string; tr: string; ar: string; ru: string } } = {
      menu: { en: 'Menu', tr: 'Menü', ar: 'قائمة', ru: 'Меню' },
      settings: { en: 'Settings', tr: 'Ayarlar', ar: 'الإعدادات', ru: 'Настройки' },
      about: { en: 'About Kspeaker', tr: 'Kspeaker Hakkında', ar: 'حول Kspeaker', ru: 'О Kspeaker' },
      language: { en: 'Language', tr: 'Dil', ar: 'اللغة', ru: 'Язык' },
      login: { en: 'Login', tr: 'Giriş Yap', ar: 'تسجيل الدخول', ru: 'Войти' },
      askKspeaker: { en: 'Ask Kspeaker...', tr: 'Kspeaker\'a sor...', ar: 'اسأل Kspeaker...', ru: 'Спросите Kspeaker...' },
      startConversation: { en: 'Start a conversation', tr: 'Sohbete başla', ar: 'ابدأ محادثة', ru: 'Начать разговор' },
      askAnything: { en: 'Ask me anything or use the microphone', tr: 'Bana bir şey sor veya mikrofonu kullan', ar: 'اسألني أي شيء أو استخدم الميكروفون', ru: 'Спросите меня о чем угодно или используйте микрофон' },
      selectLanguage: { en: 'Select Language', tr: 'Dil Seçin', ar: 'اختر اللغة', ru: 'Выберите язык' },
      englishQuiz: { en: 'English Quiz', tr: 'İngilizce Quiz', ar: 'اختبار الإنجليزية', ru: 'Английский квиз' },
      aboutTitle: { en: 'English Practice AI Assistant', tr: 'İngilizce Pratik Yapay Zeka Asistanı', ar: 'مساعد الذكاء الاصطناعي لممارسة الإنجليزية', ru: 'AI-ассистент для практики английского' },
      aboutBullet1: { en: 'Designed specifically for English language practice and conversation', tr: 'İngilizce dil pratiği ve konuşma için özel olarak tasarlandı', ar: 'مصمم خصيصًا لممارسة ومحادثة اللغة الإنجليزية', ru: 'Специально разработан для практики и разговора на английском' },
      aboutBullet2: { en: 'Voice-enabled AI that listens and responds naturally', tr: 'Doğal olarak dinleyen ve yanıt veren sesli AI', ar: 'الذكاء الاصطناعي الصوتي الذي يستمع ويستجيب بشكل طبيعي', ru: 'Голосовой ИИ, который слушает и отвечает естественно' },
      aboutBullet3: { en: 'Helps improve speaking, listening, and conversational skills', tr: 'Konuşma, dinleme ve sohbet becerilerini geliştirmeye yardımcı olur', ar: 'يساعد على تحسين مهارات التحدث والاستماع والمحادثة', ru: 'Помогает улучшить навыки говорения, слушания и разговора' },
      aboutBullet4: { en: 'Real-time feedback and engaging dialogue practice', tr: 'Gerçek zamanlı geri bildirim ve ilgi çekici diyalog pratiği', ar: 'ملاحظات فورية وممارسة حوار جذابة', ru: 'Обратная связь в реальном времени и увлекательная практика диалогов' },
      aboutBullet5: { en: 'Perfect for learners at any level seeking daily practice', tr: 'Günlük pratik arayan her seviyedeki öğrenici için mükemmel', ar: 'مثالي للمتعلمين من أي مستوى يسعون للممارسة اليومية', ru: 'Идеально для учащихся любого уровня, ищущих ежедневную практику' },
      aboutFooter: { en: 'Start speaking and let Kspeaker help you master English!', tr: 'Konuşmaya başlayın ve Kspeaker\'ın İngilizce\'de ustalaşmanıza yardım etmesine izin verin!', ar: 'ابدأ التحدث ودع Kspeaker يساعدك على إتقان الإنجليزية!', ru: 'Начните говорить и позвольте Kspeaker помочь вам освоить английский!' },
      listening: { en: 'Listening...', tr: 'Dinleniyor...', ar: 'الاستماع...', ru: 'Слушаю...' },
      processing: { en: 'Processing...', tr: 'İşleniyor...', ar: 'معالجة...', ru: 'Обработка...' },
      speaking: { en: 'Speaking...', tr: 'Konuşuyor...', ar: 'التحدث...', ru: 'Говорю...' },
      conversation: { en: 'Conversation', tr: 'Sohbet', ar: 'محادثة', ru: 'Разговор' },
      teacher: { en: 'Teacher', tr: 'Öğretmen', ar: 'معلم', ru: 'Учитель' },
      beginner: { en: 'Beginner', tr: 'Başlangıç', ar: 'مبتدئ', ru: 'Начинающий' },
      casual_friend: { en: 'Casual Friend', tr: 'Arkadaş', ar: 'صديق غير رسمي', ru: 'Неформальный друг' },
      strict: { en: 'Strict', tr: 'Sıkı', ar: 'صارم', ru: 'Строгий' },
      roleplay: { en: 'Roleplay', tr: 'Rol Yapma', ar: 'لعب الأدوار', ru: 'Ролевая игра' },
      business: { en: 'Business', tr: 'İş', ar: 'عمل', ru: 'Бизнес' },
      clearMode: { en: 'Clear Mode', tr: 'Modu Temizle', ar: 'مسح الوضع', ru: 'Очистить режим' },
      mode: { en: 'Mode', tr: 'Mod', ar: 'الوضع', ru: 'Режим' },
      lightMode: { en: 'Light Mode', tr: 'Açık Tema', ar: 'وضع فاتح', ru: 'Светлый режим' },
      darkMode: { en: 'Dark Mode', tr: 'Koyu Tema', ar: 'وضع داكن', ru: 'Темный режим' },
      readAloud: { en: 'Read Aloud', tr: 'Sesli Oku', ar: 'اقرأ بصوت عالٍ', ru: 'Читать вслух' },
      networkError: { en: 'No internet connection. Please check your network.', tr: 'İnternet bağlantısı yok. Lütfen ağınızı kontrol edin.', ar: 'لا يوجد اتصال بالإنترنت. يرجى فحص شبكتك.', ru: 'Нет интернет-соединения. Проверьте сеть.' },
      waitingApproval: { en: 'Service Temporarily Unavailable', tr: 'Servis Geçici Olarak Kullanılamıyor', ar: 'الخدمة غير متاحة مؤقتًا', ru: 'Сервис временно недоступен' },
      approvalMessage: { en: 'Our AI service is currently experiencing high demand. Please try again in a few moments.', tr: 'AI hizmetimiz şu anda yoğun talep yaşıyor. Lütfen birkaç dakika sonra tekrar deneyin.', ar: 'تواجه خدمة الذكاء الاصطناعي لدينا طلبًا كبيرًا حاليًا. يرجى المحاولة مرة أخرى بعد لحظات.', ru: 'Наш сервис ИИ в настоящее время испытывает высокий спрос. Попробуйте еще раз через несколько минут.' },
      quotaExceeded: { en: 'Service Usage Limit Reached', tr: 'Servis Kullanım Limiti Doldu', ar: 'تم الوصول إلى حد استخدام الخدمة', ru: 'Достигнут лимит использования' },
      quotaMessage: { en: 'The AI service is currently at capacity. Please try again in a few minutes. We apologize for the inconvenience!', tr: 'AI servisi şu anda kapasite limitinde. Lütfen birkaç dakika sonra tekrar deneyin. Rahatsızlıktan dolayı özür dileriz!', ar: 'خدمة الذكاء الاصطناعي في السعة حاليًا. يرجى المحاولة مرة أخرى بعد بضع دقائق. نعتذر عن الإزعاج!', ru: 'Сервис ИИ в данный момент на пределе мощности. Попробуйте через несколько минут. Приносим извинения!' },
      rateLimitTitle: { en: 'Too Many Requests', tr: 'Çok Fazla İstek', ar: 'طلبات كثيرة جدًا', ru: 'Слишком много запросов' },
      rateLimitMessage: { en: 'You are sending messages too quickly. Please wait a moment and try again.', tr: 'Çok hızlı mesaj gönderiyorsunuz. Lütfen bir dakika bekleyin ve tekrar deneyin.', ar: 'أنت ترسل الرسائل بسرعة كبيرة. يرجى الانتظار لحظة والمحاولة مرة أخرى.', ru: 'Вы отправляете сообщения слишком быстро. Подождите немного и попробуйте снова.' },
      understood: { en: 'Understood', tr: 'Anladım', ar: 'مفهوم', ru: 'Понятно' },
      
      // FAQ & Support Translations
      faq: { en: 'FAQ', tr: 'Sık Sorulanlar', ar: 'الأسئلة الشائعة', ru: 'Часто задаваемые вопросы' },
      support: { en: 'Support', tr: 'Destek', ar: 'الدعم', ru: 'Поддержка' },
      
      // FAQ Questions
      faqQ1: { en: 'How do I use voice conversation mode?', tr: 'Sesli sohbet modunu nasıl kullanırım?', ar: 'كيف أستخدم وضع المحادثة الصوتية؟', ru: 'Как использовать режим голосового разговора?' },
      faqA1: { en: 'Tap the microphone button to start voice conversation. Speak naturally, and the AI will respond with voice. Tap the stop button to end the conversation.', tr: 'Sesli sohbeti başlatmak için mikrofon düğmesine dokunun. Doğal konuşun, yapay zeka sesle yanıt verecek. Sohbeti bitirmek için dur düğmesine dokunun.', ar: 'اضغط على زر الميكروفون لبدء المحادثة الصوتية. تحدث بشكل طبيعي، وسيستجيب الذكاء الاصطناعي بالصوت. اضغط على زر الإيقاف لإنهاء المحادثة.', ru: 'Нажмите кнопку микрофона, чтобы начать голосовой разговор. Говорите естественно, и ИИ ответит голосом. Нажмите кнопку остановки, чтобы завершить разговор.' },
      
      faqQ2: { en: 'What are conversation modes?', tr: 'Sohbet modları nedir?', ar: 'ما هي أوضاع المحادثة؟', ru: 'Что такое режимы разговора?' },
      faqA2: { en: 'Conversation modes (Teacher, Beginner, Business, etc.) adjust the AI\'s teaching style. Tap the \'+\' button and select \'Mode\' to choose one.', tr: 'Sohbet modları (Öğretmen, Başlangıç, İş vb.) yapay zekanın öğretim stilini ayarlar. \'+\' düğmesine dokunun ve birini seçmek için \'Mod\'u seçin.', ar: 'تقوم أوضاع المحادثة (المعلم، المبتدئ، الأعمال، إلخ) بضبط أسلوب تدريس الذكاء الاصطناعي. اضغط على زر \'+\' وحدد \'الوضع\' لاختيار واحد.', ru: 'Режимы разговора (Учитель, Начинающий, Бизнес и т.д.) настраивают стиль обучения ИИ. Нажмите кнопку \'+\' и выберите \'Режим\'.' },
      
      faqQ3: { en: 'How does the message limit work?', tr: 'Mesaj limiti nasıl çalışır?', ar: 'كيف يعمل حد الرسائل؟', ru: 'Как работает лимит сообщений?' },
      faqA3: { en: 'Free users get 5 messages per day. Premium users (with voucher) get unlimited messages. The limit resets daily at midnight.', tr: 'Ücretsiz kullanıcılar günde 5 mesaj alır. Premium kullanıcılar (kupon ile) sınırsız mesaj alır. Limit her gece yarısı sıfırlanır.', ar: 'يحصل المستخدمون المجانيون على 5 رسائل يوميًا. يحصل المستخدمون المميزون (بالقسيمة) على رسائل غير محدودة. يتم إعادة تعيين الحد يوميًا في منتصف الليل.', ru: 'Бесплатные пользователи получают 5 сообщений в день. Премиум-пользователи (с ваучером) получают неограниченное количество сообщений. Лимит сбрасывается ежедневно в полночь.' },
      
      faqQ4: { en: 'What is a voucher code?', tr: 'Kupon kodu nedir?', ar: 'ما هو رمز القسيمة؟', ru: 'Что такое код ваучера?' },
      faqA4: { en: 'A voucher code gives you premium access with unlimited messages. Enter it in the drawer menu under \'Add Voucher\'.', tr: 'Kupon kodu size sınırsız mesajla premium erişim sağlar. \'Kupon Ekle\' altındaki çekmece menüsüne girin.', ar: 'يمنحك رمز القسيمة وصولاً مميزًا مع رسائل غير محدودة. أدخله في قائمة الدرج تحت \'إضافة قسيمة\'.', ru: 'Код ваучера дает вам премиум-доступ с неограниченным количеством сообщений. Введите его в меню выдвижного ящика в разделе \'Добавить ваучер\'.' },
      
      faqQ5: { en: 'Can I use this app offline?', tr: 'Bu uygulamayı çevrimdışı kullanabilir miyim?', ar: 'هل يمكنني استخدام هذا التطبيق دون اتصال بالإنترنت؟', ru: 'Могу ли я использовать это приложение офлайн?' },
      faqA5: { en: 'No, Kspeaker requires an internet connection to communicate with the AI. Voice recognition and text-to-speech also need connectivity.', tr: 'Hayır, Kspeaker yapay zeka ile iletişim kurmak için internet bağlantısı gerektirir. Ses tanıma ve metinden konuşmaya da bağlantı gerekir.', ar: 'لا، يتطلب Kspeaker اتصالاً بالإنترنت للتواصل مع الذكاء الاصطناعي. يحتاج التعرف على الصوت والنص إلى الكلام أيضًا إلى الاتصال.', ru: 'Нет, Kspeaker требует подключения к Интернету для связи с ИИ. Распознавание речи и синтез речи также требуют подключения.' },
      
      faqQ6: { en: 'How do I enable daily reminders?', tr: 'Günlük hatırlatıcıları nasıl etkinleştiririm?', ar: 'كيف أقوم بتمكين التذكيرات اليومية؟', ru: 'Как включить ежедневные напоминания?' },
      faqA6: { en: 'Go to Settings (drawer menu) and toggle \'Daily Reminder\'. You\'ll get a notification every day to practice English.', tr: 'Ayarlar\'a gidin (çekmece menüsü) ve \'Günlük Hatırlatıcı\'yı açın. Her gün İngilizce pratik yapmak için bildirim alacaksınız.', ar: 'انتقل إلى الإعدادات (قائمة الدرج) وقم بتبديل \'التذكير اليومي\'. ستحصل على إشعار كل يوم لممارسة اللغة الإنجليزية.', ru: 'Перейдите в Настройки (меню выдвижного ящика) и включите \'Ежедневное напоминание\'. Вы будете получать уведомления каждый день для практики английского.' },
      
      // Support Form
      supportEmailLabel: { en: 'Email Address', tr: 'E-posta Adresi', ar: 'عنوان البريد الإلكتروني', ru: 'Адрес электронной почты' },
      supportEmailPlaceholder: { en: 'your.email@example.com', tr: 'email@ornek.com', ar: 'بريدك@مثال.com', ru: 'ваш.email@example.com' },
      supportDescLabel: { en: 'Description', tr: 'Açıklama', ar: 'الوصف', ru: 'Описание' },
      supportDescPlaceholder: { en: 'Describe your issue or question...', tr: 'Sorununuzu veya sorunuzu açıklayın...', ar: 'صف مشكلتك أو سؤالك...', ru: 'Опишите вашу проблему или вопрос...' },
      supportCharCount: { en: 'characters', tr: 'karakter', ar: 'حرف', ru: 'символов' },
      supportSendButton: { en: 'Send Message', tr: 'Mesaj Gönder', ar: 'إرسال رسالة', ru: 'Отправить сообщение' },
      supportInvalidEmail: { en: 'Invalid Email', tr: 'Geçersiz E-posta', ar: 'بريد إلكتروني غير صالح', ru: 'Неверный email' },
      supportInvalidEmailMsg: { en: 'Please enter a valid email address.', tr: 'Lütfen geçerli bir e-posta adresi girin.', ar: 'يرجى إدخال عنوان بريد إلكتروني صالح.', ru: 'Пожалуйста, введите действительный адрес электронной почты.' },
      supportSuccessTitle: { en: '✅ Message Sent', tr: '✅ Mesaj Gönderildi', ar: '✅ تم إرسال الرسالة', ru: '✅ Сообщение отправлено' },
      supportSuccessMsg: { en: 'Thank you for contacting us! We will respond to your email within 24-48 hours.', tr: 'Bizimle iletişime geçtiğiniz için teşekkür ederiz! E-postanıza 24-48 saat içinde yanıt vereceğiz.', ar: 'شكرًا لاتصالك بنا! سنرد على بريدك الإلكتروني في غضون 24-48 ساعة.', ru: 'Спасибо, что связались с нами! Мы ответим на ваш email в течение 24-48 часов.' },
      ok: { en: 'OK', tr: 'Tamam', ar: 'حسنًا', ru: 'ОК' },
    };
    return translations[key]?.[selectedLanguage] || translations[key]?.en || key;
  };

  // ========================================
  // VOICE CONVERSATION SYSTEM - ChatGPT Style (OPTIMIZED)
  // ========================================
  
  // State machine: idle → listening → processing → speaking → listening (loop)
  // Single button: Tap to start/stop entire conversation
  
  const startVoiceConversation = (isRetry = false) => {
    if (__DEV__) console.log('[Voice] 🎙️ Starting conversation mode, isRetry:', isRetry);
    setVoiceState('listening');
    voiceStateRef.current = 'listening';
    
    // Only reset flags on fresh start, not on retry
    if (!isRetry) {
      userStoppedVoice.current = false;
      voiceRetryCount.current = 0;
    }
    
    // CRITICAL FIX: Clear accumulated text on fresh start
    currentVoiceText.current = '';
    console.log('[Voice] 🧹 Cleared accumulated text');
    
    // Clear any existing silence timer
    if (silenceTimer.current) {
      clearTimeout(silenceTimer.current);
      silenceTimer.current = null;
    }
    
    let hasReceivedText = false;
    let lastTextTimestamp = Date.now();
    
    startListening(
      (text) => {
        // On speech result - ALWAYS update
        console.log('[Voice] 🎤 Received text:', text, `(length: ${text.length})`);
        
        // CRITICAL FIX: ALWAYS update currentVoiceText, don't check length
        const trimmedText = text.trim();
        currentVoiceText.current = trimmedText;
        console.log('[Voice] 💾 Stored in currentVoiceText.current:', trimmedText);
        
        // Update timestamp
        lastTextTimestamp = Date.now();
        
        // CRITICAL FIX: Reset silence timer on every text update
        if (silenceTimer.current) {
          clearTimeout(silenceTimer.current);
          silenceTimer.current = null;
        }
        
        // Start new silence timer (3 seconds)
        if (trimmedText.length > 0 && voiceStateRef.current === 'listening') {
          console.log('[Voice] ⏱️ Starting 3-second silence timer...');
          silenceTimer.current = setTimeout(() => {
            console.log('[Voice] 🔕 3 seconds of silence detected - processing text');
            
            // CRITICAL: Check if already processing
            if (isProcessingVoiceMessage.current) {
              console.log('[Voice] ⚠️ Already processing voice message, skipping duplicate send');
              return;
            }
            
            const finalText = currentVoiceText.current.trim();
            const wordCount = finalText.split(/\s+/).filter(w => w.length > 0).length;
            
            console.log('[Voice] 📝 Final text after silence:', finalText, `(${wordCount} words)`);
            
            if (finalText.length > 0 && wordCount >= 1 && voiceStateRef.current === 'listening' && !userStoppedVoice.current) {
              console.log('[Voice] ✅ Auto-sending after silence timeout');
              
              // CRITICAL: Set processing flag BEFORE sending
              isProcessingVoiceMessage.current = true;
              
              // Set to processing state
              setVoiceState('processing');
              voiceStateRef.current = 'processing';
              
              // Send message
              sendVoiceMessage(finalText);
              
              // Clear accumulated text
              currentVoiceText.current = '';
              console.log('[Voice] 🧹 Cleared accumulated text after sending');
              
              // Reset flag after 1 second (enough time for native event to be ignored)
              setTimeout(() => {
                isProcessingVoiceMessage.current = false;
                console.log('[Voice] 🔓 Processing flag reset');
              }, 1000);
            }
          }, 3000); // 3 seconds of silence
        }
        
        if (!hasReceivedText && trimmedText.length > 0) {
          hasReceivedText = true;
          console.log('[Voice] 🎤 First text received');
        }
      },
      () => {
        // On error
        console.log('[Voice] ❌ Speech recognition error occurred');
        
        // Clear silence timer on error
        if (silenceTimer.current) {
          clearTimeout(silenceTimer.current);
          silenceTimer.current = null;
        }
        
        voiceRetryCount.current++;
        const maxRetries = 5;
        
        if (voiceRetryCount.current >= maxRetries) {
          console.log(`[Voice] 🛑 Max retries reached (${maxRetries}), stopping voice mode`);
          stopVoiceConversation();
          
          Alert.alert(
            'Voice Recognition Issue',
            'Having trouble with speech recognition. Please check your microphone permissions or try again later.',
            [{ text: 'OK', style: 'default' }]
          );
          return;
        }
        
        // Only retry if still in listening state AND user hasn't manually stopped
        setTimeout(() => {
          if (voiceStateRef.current === 'listening' && !userStoppedVoice.current) {
            console.log(`[Voice] 🔄 Retrying after error... (attempt ${voiceRetryCount.current}/${maxRetries})`);
            startVoiceConversation(true);
          } else {
            console.log('[Voice] 🛑 Not retrying - user stopped or state changed');
          }
        }, 800);
      },
      () => {
        // On speech end (native iOS event) - FALLBACK
        console.log('[Voice] 🛑 Speech ended callback triggered (native event)');
        
        // Clear silence timer since native event fired
        if (silenceTimer.current) {
          clearTimeout(silenceTimer.current);
          silenceTimer.current = null;
          console.log('[Voice] 🧹 Cleared silence timer (native event fired)');
        }
        
        const text = currentVoiceText.current.trim();
        const wordCount = text.split(/\s+/).filter(w => w.length > 0).length;
        
        console.log('[Voice] 📝 Accumulated text:', text, `(${wordCount} words)`);
        console.log('[Voice] 🔍 Current state:', voiceStateRef.current);
        console.log('[Voice] 🔍 User stopped:', userStoppedVoice.current);
        
        if (text.length > 0 && wordCount >= 1 && voiceStateRef.current === 'listening') {
          console.log('[Voice] ✅ Processing text from native event:', text);
          
          // Set to processing state
          setVoiceState('processing');
          voiceStateRef.current = 'processing';
          
          // Send message
          sendVoiceMessage(text);
          
          // Clear accumulated text
          currentVoiceText.current = '';
          console.log('[Voice] 🧹 Cleared accumulated text after sending');
        } else if (text.length > 0 && wordCount < 1) {
          console.log('[Voice] ⚠️ Text too short, ignoring:', text);
          currentVoiceText.current = '';
          
          // Restart listening
          if (!userStoppedVoice.current) {
            setTimeout(() => {
              if (voiceStateRef.current === 'listening' && !userStoppedVoice.current) {
                console.log('[Voice] 🔄 Restarting listening after short text...');
                startVoiceConversation(true);
              }
            }, 300);
          }
        } else {
          console.log('[Voice] ⏸️ No text accumulated or wrong state, restarting...');
          
          // Restart listening if no text
          if (!userStoppedVoice.current && voiceStateRef.current === 'listening') {
            setTimeout(() => {
              if (voiceStateRef.current === 'listening' && !userStoppedVoice.current) {
                console.log('[Voice] 🔄 Restarting listening after no text...');
                startVoiceConversation(true);
              }
            }, 300);
          }
        }
      }
    );
  };
  
  const stopVoiceConversation = () => {
    console.log('[Voice] 🛑 Stopping conversation mode');
    
    // Set manual stop flag to prevent any auto-restarts
    userStoppedVoice.current = true;
    
    // Clear timer FIRST
    if (silenceTimer.current) {
      clearTimeout(silenceTimer.current);
      silenceTimer.current = null;
    }
    
    // Stop listening safely with try-catch
    try {
      stopListening();
    } catch (error) {
      console.log('[Voice] ⚠️ Error stopping listening:', error);
    }
    
    // Stop speaking safely with try-catch
    try {
      ttsService.stop();
    } catch (error) {
      console.log('[Voice] ⚠️ Error stopping TTS:', error);
    }
    
    // Clear text
    currentVoiceText.current = '';
    
    // IMPORTANT: Set to idle LAST to ensure UI updates properly
    // Update both state and ref
    setVoiceState('idle');
    voiceStateRef.current = 'idle';
    
    console.log('[Voice] ✅ Voice conversation stopped, state set to idle');
  };
  
  const handleMicButton = () => {
    triggerHaptic('light');
    
    console.log('[Mic] 🔘 Button pressed, current state:', voiceState);
    console.log('[Mic] 🔘 Ref state:', voiceStateRef.current);
    
    if (voiceStateRef.current === 'idle') {
      // Start conversation
      console.log('[Mic] ▶️ Starting voice conversation');
      startVoiceConversation();
    } else {
      // Stop conversation (any state: listening, processing, or speaking)
      console.log('[Mic] ⏹️ Stopping voice conversation from state:', voiceStateRef.current);
      stopVoiceConversation();
    }
  };

  // TTS Events - Integrated with voice conversation
  useEffect(() => {
    console.log('[TTS] 🔧 Initializing TTS with premium neural voice');
    ttsService.setDefaultLanguage('en-US');
    
    // Get and select best quality voice
    ttsService.voices().then((voices: any[]) => {
      console.log('[TTS] 📢 Available voices:', voices.length);
      
      // Log all voices for debugging (helps identify best voice)
      voices.forEach((v: any) => {
        if (v.language.startsWith('en')) {
          console.log(`[TTS] 🎤 ${v.name} | ${v.language} | Quality: ${v.quality} | Network: ${v.networkConnectionRequired || 'N/A'}`);
        }
      });
      
      // Strategy 1: Try to find premium/enhanced quality voices
      let selectedVoice = null;
      
      // First: Look for Enhanced quality neural voices (best quality)
      const neuralVoices = voices.filter((v: any) => 
        v.language === 'en-US' && 
        (
          v.quality === 'Premium' || 
          v.quality === 'Enhanced' ||
          v.quality >= 300 ||
          v.id?.includes('premium') ||
          v.id?.includes('enhanced')
        )
      );
      
      console.log('[TTS] 📢 Premium/Enhanced voices found:', neuralVoices.length);
      neuralVoices.forEach((v: any) => {
        console.log(`[TTS]   ⭐ ${v.name} (${v.quality})`);
      });
      
      // Preferred voices in priority order (most natural first)
      const preferredNames = [
        'Samantha',    // Most natural iOS voice
        'Ava',         // Neural, modern
        'Allison',     // Warm, conversational
        'Zoe',         // Expressive
        'Nicky',       // Clear, professional
        'Susan',       // Articulate
        'Karen',       // Classic, clear
      ];
      
      // Try to find preferred neural voice
      for (const name of preferredNames) {
        selectedVoice = neuralVoices.find((v: any) => v.name.includes(name));
        if (selectedVoice) {
          console.log(`[TTS] ✅ Found preferred voice: ${selectedVoice.name}`);
          break;
        }
      }
      
      // Fallback: Any premium/enhanced voice
      if (!selectedVoice && neuralVoices.length > 0) {
        selectedVoice = neuralVoices[0];
        console.log(`[TTS] ✅ Using first enhanced voice: ${selectedVoice.name}`);
      }
      
      // Final fallback: Any decent en-US female voice
      if (!selectedVoice) {
        selectedVoice = voices.find((v: any) => 
          v.language === 'en-US' && 
          v.name.toLowerCase().includes('female')
        );
        
        if (!selectedVoice) {
          selectedVoice = voices.find((v: any) => v.language === 'en-US');
        }
        
        console.log(`[TTS] ⚠️ Using fallback voice: ${selectedVoice?.name || 'default'}`);
      }
      
      if (selectedVoice) {
        console.log(`[TTS] 🎯 FINAL SELECTION: ${selectedVoice.name} (Quality: ${selectedVoice.quality})`);
        ttsService.setDefaultVoice(selectedVoice.id);
      }
      
      // CRITICAL: Speech parameters for human-like, non-robotic speech
      // Lower rate = more natural with better prosody and emphasis
      // Pitch variations handled by premium voices automatically
      ttsService.setDefaultRate(0.50);     // Optimal conversational speed (0.40-0.55 range)
      ttsService.setDefaultPitch(1.0);     // Natural pitch (0.5-2.0 range, 1.0 = normal)
      
      // iOS specific: Set high quality audio
      if (Platform.OS === 'ios') {
        ttsService.setDucking(true);       // Duck other audio when speaking
        ttsService.setIgnoreSilentSwitch('ignore'); // Play even if silent switch is on
      }
      
      console.log('[TTS] 🎚️ Speech params: Rate=0.50, Pitch=1.0, Ducking=ON');
    }); // FIXED: Added missing closing parenthesis for .then() callback
    
    ttsService.addEventListener('tts-start', () => {
      console.log('[TTS] 🔊 Started speaking');
      setVoiceState('speaking');
      voiceStateRef.current = 'speaking';
    });
    
    ttsService.addEventListener('tts-finish', () => {
      console.log('[TTS] ✅ Finished speaking');
      
      // Auto-restart listening only if still speaking AND user hasn't manually stopped
      if (voiceStateRef.current === 'speaking' && !userStoppedVoice.current) {
        console.log('[Voice] 🔄 TTS finished, restarting listening immediately...');
        setTimeout(() => {
          if (voiceStateRef.current === 'speaking' && !userStoppedVoice.current) {
            startVoiceConversation(false); // Fresh start after speaking, not a retry
          }
        }, 300); // Reduced from 800ms to 300ms for faster response
      } else {
        console.log('[Voice] 🛑 Not restarting - user stopped or state changed');
      }
    });
    
    ttsService.addEventListener('tts-cancel', () => {
      console.log('[TTS] ⛔ Cancelled');
      // Don't auto-restart, user stopped it
    });

    return () => {
      ttsService.removeAllListeners('tts-start');
      ttsService.removeAllListeners('tts-finish');
      ttsService.removeAllListeners('tts-cancel');
    };
  }, []); // Empty deps - setup only once

  // Initialize
  useEffect(() => {
    const init = async () => {
      await initializeApi();
      initializeVoice();
      
      // Check if device is already registered
      const registered = await checkRegistration();
      console.log('[Init] Registration check:', registered);
      
      // If NOT registered, automatically register device without voucher (free tier)
      if (!registered) {
        console.log('[Init] 📱 Auto-registering device (free tier)...');
        try {
          const success = await registerUser(); // No voucher = free tier
          if (success) {
            console.log('[Init] ✅ Device registered successfully (free tier)');
            // Save to local storage so we don't register again
            await saveRegistration('FREE_TIER');
          } else {
            console.log('[Init] ⚠️ Device registration failed');
          }
        } catch (error) {
          console.error('[Init] ❌ Registration error:', error);
        }
      } else {
        console.log('[Init] ✅ Device already registered');
      }
      
      // Check if user can send messages
      const canSend = await canSendMessage();
      console.log('[Init] Can send message:', canSend);

      // Bildirim durumunu yükle veya ilk kez açılıyorsa otomatik aç
      try {
        const notifEnabled = await AsyncStorage.getItem('notificationsEnabled');
        if (notifEnabled === null) {
          // İlk kez açılıyor, otomatik olarak bildirimleri aç
          const permissions = await NotificationService.requestPermissions();
          if (permissions) {
            setNotificationsEnabled(true);
            NotificationService.scheduleDailyReminders(selectedLanguage);
            await AsyncStorage.setItem('notificationsEnabled', 'true');
            console.log('[Notifications] 🔔 Auto-enabled on first launch');
          }
        } else if (notifEnabled === 'true') {
          setNotificationsEnabled(true);
          // Mevcut bildirimleri kontrol et, yoksa yeniden ayarla
          NotificationService.checkScheduledNotifications();
        }
      } catch (error) {
        console.error('[Notifications] Load error:', error);
      }
    };
    init();

    return () => {
      if (silenceTimer.current) {
        clearTimeout(silenceTimer.current);
      }
      destroyVoice();
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

  const renderMessage = useCallback(({ item }: { item: ChatMessage }) => {
    const isUser = item.role === 'user';
    const isTyping = typingMessageId === item.id;
    const textToShow = isTyping ? displayedText : item.content;
    const showMenu = messageContextMenu === item.id;
    
    return (
      <TouchableOpacity
        activeOpacity={0.9}
        onLongPress={() => {
          triggerHaptic('medium');
          setMessageContextMenu(item.id);
          setTimeout(() => setMessageContextMenu(null), 3000);
        }}
        delayLongPress={300}
      >
        <Animated.View style={[
          styles.bubble, 
          isUser ? (theme === 'dark' ? styles.userBubble : styles.userBubbleLight) : (theme === 'dark' ? styles.assistantBubble : styles.assistantBubbleLight),
          isTablet && { 
            maxWidth: 600, 
            alignSelf: isUser ? 'flex-end' : 'flex-start' 
          },
          showMenu && styles.bubbleHighlight,
        ]}>
          <Text style={[
            styles.messageText, 
            isUser && (theme === 'dark' ? styles.userMessageText : styles.userMessageTextLight),
            !isUser && theme === 'light' && styles.assistantMessageTextLight
          ]}>{textToShow}</Text>
          {showMenu && (
            <View style={[styles.contextMenu, isUser ? styles.contextMenuUser : styles.contextMenuAssistant]}>
              <TouchableOpacity 
                style={styles.contextMenuItem}
                onPress={() => {
                  triggerHaptic('light');
                  ttsService.speak(item.content);
                  setMessageContextMenu(null);
                }}
              >
                <Ionicons name="volume-high" size={16} color={theme === 'dark' ? '#7DD3C0' : '#4A6FA5'} />
                <Text style={[styles.contextMenuText, theme === 'light' && styles.contextMenuTextLight]}>{getTranslation('readAloud')}</Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
      </TouchableOpacity>
    );
  }, [typingMessageId, displayedText, messageContextMenu, theme, isTablet]);

  const renderEmpty = useCallback(() => (
    <View style={styles.empty}>
      <Ionicons name="chatbubbles-outline" size={64} color={theme === 'dark' ? 'rgba(125, 211, 192, 0.3)' : 'rgba(74, 111, 165, 0.3)'} />
      <Text style={[styles.emptyText, theme === 'light' && styles.emptyTextLight]}>{getTranslation('startConversation')}</Text>
      <Text style={[styles.emptySubtext, theme === 'light' && styles.emptySubtextLight]}>{getTranslation('askAnything')}</Text>
    </View>
  ), [theme, selectedLanguage]);

  return (
    <SafeAreaView style={[styles.container, theme === 'light' && styles.containerLight]} edges={['top', 'bottom']}>
      <VoucherModal 
        visible={showVoucherModal} 
        onSubmit={handleVoucherSubmit}
        onClose={() => setShowVoucherModal(false)}
      />

      {/* About Modal */}
      {showAboutModal && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, theme === 'light' && styles.modalContentLight]}>
            <View style={[styles.modalHeader, theme === 'light' && styles.modalHeaderLight]}>
              <Text style={[styles.modalTitle, theme === 'light' && styles.modalTitleLight]}>{getTranslation('about')}</Text>
              <TouchableOpacity onPress={() => setShowAboutModal(false)}>
                <Ionicons name="close" size={28} color={theme === 'dark' ? '#ECECEC' : '#1A1A1F'} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <Text style={styles.aboutTitle}>{getTranslation('aboutTitle')}</Text>
              <View style={styles.aboutSection}>
                <View style={styles.bulletPoint}>
                  <Ionicons name="checkmark-circle" size={20} color="#7DD3C0" />
                  <Text style={[styles.aboutText, theme === 'light' && styles.aboutTextLight]}>
                    {getTranslation('aboutBullet1')}
                  </Text>
                </View>
                <View style={styles.bulletPoint}>
                  <Ionicons name="checkmark-circle" size={20} color="#7DD3C0" />
                  <Text style={[styles.aboutText, theme === 'light' && styles.aboutTextLight]}>
                    {getTranslation('aboutBullet2')}
                  </Text>
                </View>
                <View style={styles.bulletPoint}>
                  <Ionicons name="checkmark-circle" size={20} color="#7DD3C0" />
                  <Text style={[styles.aboutText, theme === 'light' && styles.aboutTextLight]}>
                    {getTranslation('aboutBullet3')}
                  </Text>
                </View>
                <View style={styles.bulletPoint}>
                  <Ionicons name="checkmark-circle" size={20} color="#7DD3C0" />
                  <Text style={[styles.aboutText, theme === 'light' && styles.aboutTextLight]}>
                    {getTranslation('aboutBullet4')}
                  </Text>
                </View>
                <View style={styles.bulletPoint}>
                  <Ionicons name="checkmark-circle" size={20} color="#7DD3C0" />
                  <Text style={[styles.aboutText, theme === 'light' && styles.aboutTextLight]}>
                    {getTranslation('aboutBullet5')}
                  </Text>
                </View>
              </View>
              <Text style={styles.aboutFooter}>
                {getTranslation('aboutFooter')}
              </Text>
            </View>
          </View>
        </View>
      )}

      {/* Settings Modal */}
      {showSettingsModal && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, theme === 'light' && styles.modalContentLight]}>
            <View style={[styles.modalHeader, theme === 'light' && styles.modalHeaderLight]}>
              <Text style={[styles.modalTitle, theme === 'light' && styles.modalTitleLight]}>{getTranslation('settings')}</Text>
              <TouchableOpacity onPress={() => setShowSettingsModal(false)}>
                <Ionicons name="close" size={28} color={theme === 'dark' ? '#ECECEC' : '#1A1A1F'} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              {/* Günlük Hatırlatıcı */}
              <View style={styles.settingsItem}>
                <View style={styles.settingsItemLeft}>
                  <Ionicons name="notifications-outline" size={24} color={theme === 'dark' ? '#7DD3C0' : '#4A9B8F'} />
                  <Text style={[styles.settingsItemText, theme === 'light' && styles.settingsItemTextLight]}>
                    Günlük Hatırlatıcı
                  </Text>
                </View>
                <Switch
                  value={notificationsEnabled}
                  onValueChange={toggleNotifications}
                  trackColor={{ false: '#767577', true: '#7DD3C0' }}
                  thumbColor={notificationsEnabled ? '#FFFFFF' : '#f4f3f4'}
                  ios_backgroundColor="#3e3e3e"
                />
              </View>
              
              <View style={styles.settingsDivider} />
              
              {/* Tema */}
              <TouchableOpacity style={styles.settingsItem} onPress={toggleTheme}>
                <View style={styles.settingsItemLeft}>
                  <Ionicons name={theme === 'dark' ? 'sunny' : 'moon'} size={24} color={theme === 'dark' ? '#ECECEC' : '#1A1A1F'} />
                  <Text style={[styles.settingsItemText, theme === 'light' && styles.settingsItemTextLight]}>
                    {theme === 'dark' ? getTranslation('lightMode') : getTranslation('darkMode')}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme === 'dark' ? '#ECECEC' : '#1A1A1F'} />
              </TouchableOpacity>
              
              <View style={styles.settingsDivider} />
              
              {/* Dil */}
              <TouchableOpacity 
                style={styles.settingsItem} 
                onPress={() => {
                  setShowSettingsModal(false);
                  setShowLanguageModal(true);
                }}
              >
                <View style={styles.settingsItemLeft}>
                  <Ionicons name="language" size={24} color={theme === 'dark' ? '#ECECEC' : '#1A1A1F'} />
                  <Text style={[styles.settingsItemText, theme === 'light' && styles.settingsItemTextLight]}>
                    {getTranslation('language')}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color={theme === 'dark' ? '#ECECEC' : '#1A1A1F'} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Language Modal */}
      {showLanguageModal && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, theme === 'light' && styles.modalContentLight]}>
            <View style={[styles.modalHeader, theme === 'light' && styles.modalHeaderLight]}>
              <Text style={[styles.modalTitle, theme === 'light' && styles.modalTitleLight]}>{getTranslation('selectLanguage')}</Text>
              <TouchableOpacity onPress={() => setShowLanguageModal(false)}>
                <Ionicons name="close" size={28} color={theme === 'dark' ? '#ECECEC' : '#1A1A1F'} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalBody}>
              <TouchableOpacity 
                style={[
                  styles.languageOption,
                  theme === 'light' && styles.languageOptionLight,
                  selectedLanguage === 'en' && styles.languageOptionSelected
                ]}
                onPress={() => selectLanguage('en')}
              >
                <Text style={styles.languageFlag}>🇬🇧</Text>
                <Text style={[styles.languageText, theme === 'light' && styles.languageTextLight]}>English</Text>
                {selectedLanguage === 'en' && <Ionicons name="checkmark-circle" size={24} color="#7DD3C0" />}
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.languageOption,
                  theme === 'light' && styles.languageOptionLight,
                  selectedLanguage === 'tr' && styles.languageOptionSelected
                ]}
                onPress={() => selectLanguage('tr')}
              >
                <Text style={styles.languageFlag}>🇹🇷</Text>
                <Text style={[styles.languageText, theme === 'light' && styles.languageTextLight]}>Türkçe</Text>
                {selectedLanguage === 'tr' && <Ionicons name="checkmark-circle" size={24} color="#7DD3C0" />}
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.languageOption,
                  theme === 'light' && styles.languageOptionLight,
                  selectedLanguage === 'ar' && styles.languageOptionSelected
                ]}
                onPress={() => selectLanguage('ar')}
              >
                <Text style={styles.languageFlag}>🇸🇦</Text>
                <Text style={[styles.languageText, theme === 'light' && styles.languageTextLight]}>العربية</Text>
                {selectedLanguage === 'ar' && <Ionicons name="checkmark-circle" size={24} color="#7DD3C0" />}
              </TouchableOpacity>
              <TouchableOpacity 
                style={[
                  styles.languageOption,
                  theme === 'light' && styles.languageOptionLight,
                  selectedLanguage === 'ru' && styles.languageOptionSelected
                ]}
                onPress={() => selectLanguage('ru')}
              >
                <Text style={styles.languageFlag}>🇷🇺</Text>
                <Text style={[styles.languageText, theme === 'light' && styles.languageTextLight]}>Русский</Text>
                {selectedLanguage === 'ru' && <Ionicons name="checkmark-circle" size={24} color="#7DD3C0" />}
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* Error/Approval Modal */}
      {showApprovalModal && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, theme === 'light' && styles.modalContentLight]}>
            <View style={styles.approvalIconContainer}>
              <Ionicons 
                name={
                  errorMessage === getTranslation('rateLimitMessage') ? 'timer-outline' : 
                  errorMessage === getTranslation('quotaMessage') ? 'shield-checkmark-outline' :
                  'alert-circle-outline'
                }
                size={64} 
                color={
                  errorMessage === getTranslation('rateLimitMessage') ? '#3B82F6' : 
                  errorMessage === getTranslation('quotaMessage') ? '#10B981' :
                  (theme === 'dark' ? '#F59E0B' : '#EF4444')
                } 
              />
            </View>
            <Text style={[styles.approvalTitle, theme === 'light' && styles.approvalTitleLight]}>
              {
                errorMessage === getTranslation('rateLimitMessage') ? getTranslation('rateLimitTitle') : 
                errorMessage === getTranslation('quotaMessage') ? getTranslation('quotaExceeded') :
                getTranslation('waitingApproval')
              }
            </Text>
            <Text style={[styles.approvalMessage, theme === 'light' && styles.approvalMessageLight]}>
              {errorMessage || getTranslation('approvalMessage')}
            </Text>
            <TouchableOpacity 
              style={[styles.approvalButton, theme === 'light' && styles.approvalButtonLight]}
              onPress={() => {
                setShowApprovalModal(false);
                setErrorMessage('');
              }}
            >
              <Text style={styles.approvalButtonText}>{getTranslation('understood')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ADIM 3: FAQ Modal */}
      {showFaqModal && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, theme === 'light' && styles.modalContentLight]}>
            <View style={[styles.modalHeader, theme === 'light' && styles.modalHeaderLight]}>
              <Text style={[styles.modalTitle, theme === 'light' && styles.modalTitleLight]}>{getTranslation('faq')}</Text>
              <TouchableOpacity onPress={() => setShowFaqModal(false)}>
                <Ionicons name="close" size={28} color={theme === 'dark' ? '#ECECEC' : '#1A1A1F'} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              {/* FAQ Item 1 */}
              <View style={styles.faqItem}>
                <View style={styles.faqQuestion}>
                  <Ionicons name="help-circle" size={20} color="#7DD3C0" />
                  <Text style={[styles.faqQuestionText, theme === 'light' && styles.faqQuestionTextLight]}>
                    {getTranslation('faqQ1')}
                  </Text>
                </View>
                <Text style={[styles.faqAnswer, theme === 'light' && styles.faqAnswerLight]}>
                  {getTranslation('faqA1')}
                </Text>
              </View>

              {/* FAQ Item 2 */}
              <View style={styles.faqItem}>
                <View style={styles.faqQuestion}>
                  <Ionicons name="help-circle" size={20} color="#7DD3C0" />
                  <Text style={[styles.faqQuestionText, theme === 'light' && styles.faqQuestionTextLight]}>
                    {getTranslation('faqQ2')}
                  </Text>
                </View>
                <Text style={[styles.faqAnswer, theme === 'light' && styles.faqAnswerLight]}>
                  {getTranslation('faqA2')}
                </Text>
              </View>

              {/* FAQ Item 3 */}
              <View style={styles.faqItem}>
                <View style={styles.faqQuestion}>
                  <Ionicons name="help-circle" size={20} color="#7DD3C0" />
                  <Text style={[styles.faqQuestionText, theme === 'light' && styles.faqQuestionTextLight]}>
                    {getTranslation('faqQ3')}
                  </Text>
                </View>
                <Text style={[styles.faqAnswer, theme === 'light' && styles.faqAnswerLight]}>
                  {getTranslation('faqA3')}
                </Text>
              </View>

              {/* FAQ Item 4 */}
              <View style={styles.faqItem}>
                <View style={styles.faqQuestion}>
                  <Ionicons name="help-circle" size={20} color="#7DD3C0" />
                  <Text style={[styles.faqQuestionText, theme === 'light' && styles.faqQuestionTextLight]}>
                    {getTranslation('faqQ4')}
                  </Text>
                </View>
                <Text style={[styles.faqAnswer, theme === 'light' && styles.faqAnswerLight]}>
                  {getTranslation('faqA4')}
                </Text>
              </View>

              {/* FAQ Item 5 */}
              <View style={styles.faqItem}>
                <View style={styles.faqQuestion}>
                  <Ionicons name="help-circle" size={20} color="#7DD3C0" />
                  <Text style={[styles.faqQuestionText, theme === 'light' && styles.faqQuestionTextLight]}>
                    {getTranslation('faqQ5')}
                  </Text>
                </View>
                <Text style={[styles.faqAnswer, theme === 'light' && styles.faqAnswerLight]}>
                  {getTranslation('faqA5')}
                </Text>
              </View>

              {/* FAQ Item 6 */}
              <View style={styles.faqItem}>
                <View style={styles.faqQuestion}>
                  <Ionicons name="help-circle" size={20} color="#7DD3C0" />
                  <Text style={[styles.faqQuestionText, theme === 'light' && styles.faqQuestionTextLight]}>
                    {getTranslation('faqQ6')}
                  </Text>
                </View>
                <Text style={[styles.faqAnswer, theme === 'light' && styles.faqAnswerLight]}>
                  {getTranslation('faqA6')}
                </Text>
              </View>
            </ScrollView>
          </View>
        </View>
      )}

      {/* ADIM 3: Support Modal */}
      {showSupportModal && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, theme === 'light' && styles.modalContentLight]}>
            <View style={[styles.modalHeader, theme === 'light' && styles.modalHeaderLight]}>
              <Text style={[styles.modalTitle, theme === 'light' && styles.modalTitleLight]}>{getTranslation('support')}</Text>
              <TouchableOpacity onPress={() => {
                setShowSupportModal(false);
                setSupportEmail('');
                setSupportDescription('');
              }}>
                <Ionicons name="close" size={28} color={theme === 'dark' ? '#ECECEC' : '#1A1A1F'} />
              </TouchableOpacity>
            </View>
            <ScrollView style={styles.modalBody} showsVerticalScrollIndicator={false}>
              <Text style={[styles.supportLabel, theme === 'light' && styles.supportLabelLight]}>
                {getTranslation('supportEmailLabel')}
              </Text>
              <TextInput
                style={[styles.supportInput, theme === 'light' && styles.supportInputLight]}
                value={supportEmail}
                onChangeText={setSupportEmail}
                placeholder={getTranslation('supportEmailPlaceholder')}
                placeholderTextColor={theme === 'dark' ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)'}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
              />

              <Text style={[styles.supportLabel, theme === 'light' && styles.supportLabelLight, { marginTop: 20 }]}>
                {getTranslation('supportDescLabel')}
              </Text>
              <TextInput
                style={[styles.supportTextarea, theme === 'light' && styles.supportTextareaLight]}
                value={supportDescription}
                onChangeText={(text) => {
                  // Limit to 500 characters
                  if (text.length <= 500) {
                    setSupportDescription(text);
                  }
                }}
                placeholder={getTranslation('supportDescPlaceholder')}
                placeholderTextColor={theme === 'dark' ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)'}
                multiline
                numberOfLines={8}
                maxLength={500}
                textAlignVertical="top"
              />
              <Text style={[styles.characterCount, theme === 'light' && styles.characterCountLight]}>
                {supportDescription.length}/500 {getTranslation('supportCharCount')}
              </Text>

              <TouchableOpacity
                style={[
                  styles.supportButton,
                  (!supportEmail.trim() || !supportDescription.trim()) && styles.supportButtonDisabled
                ]}
                onPress={async () => {
                  if (supportEmail.trim() && supportDescription.trim()) {
                    // Email validation
                    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                    if (!emailRegex.test(supportEmail.trim())) {
                      Alert.alert(getTranslation('supportInvalidEmail'), getTranslation('supportInvalidEmailMsg'));
                      return;
                    }

                    try {
                      // Send support email
                      const result = await EmailService.sendSupportEmail(supportEmail, supportDescription);

                      if (result.success) {
                        // Show success message
                        Alert.alert(
                          getTranslation('supportSuccessTitle'),
                          getTranslation('supportSuccessMsg'),
                          [{ 
                            text: getTranslation('ok'), 
                            onPress: () => {
                              setShowSupportModal(false);
                              setSupportEmail('');
                              setSupportDescription('');
                            }
                          }]
                        );
                      } else {
                        // Show error message
                        Alert.alert('❌ Error', result.error || 'Failed to send support message. Please try again later.');
                      }
                    } catch (error) {
                      console.error('[Support] ❌ Error sending support message:', error);
                      Alert.alert('❌ Error', 'Failed to send support message. Please try again later.');
                    }
                  }
                }}
                disabled={!supportEmail.trim() || !supportDescription.trim()}
              >
                <Ionicons name="send" size={20} color="#FFFFFF" />
                <Text style={styles.supportButtonText}>{getTranslation('supportSendButton')}</Text>
              </TouchableOpacity>
            </ScrollView>
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
        theme === 'light' && styles.drawerLight,
      ]}>
        <View style={styles.drawerContent}>
          <TouchableOpacity style={styles.drawerItem} onPress={() => {
            setShowSettingsModal(true);
            toggleDrawer();
          }}>
            <Ionicons name="settings-outline" size={24} color={theme === 'dark' ? '#ECECEC' : '#1A1A1F'} />
            <Text style={[styles.drawerItemText, theme === 'light' && styles.drawerItemTextLight]}>{getTranslation('settings')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.drawerItem} onPress={openAboutModal}>
            <Ionicons name="information-circle-outline" size={24} color={theme === 'dark' ? '#ECECEC' : '#1A1A1F'} />
            <Text style={[styles.drawerItemText, theme === 'light' && styles.drawerItemTextLight]}>{getTranslation('about')}</Text>
          </TouchableOpacity>
          
          {/* ADIM 2: FAQ Button */}
          <TouchableOpacity style={styles.drawerItem} onPress={() => {
            closeDrawer();
            setTimeout(() => setShowFaqModal(true), 300);
          }}>
            <Ionicons name="help-circle-outline" size={24} color={theme === 'dark' ? '#ECECEC' : '#1A1A1F'} />
            <Text style={[styles.drawerItemText, theme === 'light' && styles.drawerItemTextLight]}>{getTranslation('faq')}</Text>
          </TouchableOpacity>
          
          {/* ADIM 2: Support Button */}
          <TouchableOpacity style={styles.drawerItem} onPress={() => {
            closeDrawer();
            setTimeout(() => setShowSupportModal(true), 300);
          }}>
            <Ionicons name="mail-outline" size={24} color={theme === 'dark' ? '#ECECEC' : '#1A1A1F'} />
            <Text style={[styles.drawerItemText, theme === 'light' && styles.drawerItemTextLight]}>{getTranslation('support')}</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.drawerItem} onPress={openLanguageModal}>
            <Ionicons name="language" size={24} color={theme === 'dark' ? '#ECECEC' : '#1A1A1F'} />
            <Text style={[styles.drawerItemText, theme === 'light' && styles.drawerItemTextLight]}>{getTranslation('language')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.drawerItem} onPress={toggleTheme}>
            <Ionicons name={theme === 'dark' ? 'sunny' : 'moon'} size={24} color={theme === 'dark' ? '#ECECEC' : '#1A1A1F'} />
            <Text style={[styles.drawerItemText, theme === 'light' && styles.drawerItemTextLight]}>
              {theme === 'dark' ? getTranslation('lightMode') : getTranslation('darkMode')}
            </Text>
          </TouchableOpacity>
          
          {/* Flash Cards */}
          <View style={styles.drawerDivider} />
          
          {/* Test Admin Voucher - REMOVED (kept for dev reference but disabled) */}
          {false && __DEV__ && (
            <TouchableOpacity 
              style={styles.drawerItem} 
              onPress={async () => {
                toggleDrawer();
                triggerHaptic('medium');
                
                try {
                  console.log('[Admin] 🎟️ Creating test voucher...');
                  Alert.alert('⏳ Creating Voucher...', 'Please wait...');
                  
                  // Create voucher with 1 month expiry
                  const expiresAt = new Date();
                  expiresAt.setMonth(expiresAt.getMonth() + 1);
                  
                  const voucherCode = await createVoucher(expiresAt.toISOString());
                  
                  if (voucherCode) {
                    console.log('[Admin] ✅ Voucher created:', voucherCode);
                    
                    // Automatically register with this voucher
                    const success = await saveRegistration(voucherCode);
                    
                    if (success) {
                      Alert.alert(
                        '🎉 Premium Activated!',
                        `Voucher Code: ${voucherCode}\n\nYou now have unlimited messages! The voucher has been automatically applied.`,
                        [{ text: 'Awesome!', style: 'default' }]
                      );
                    } else {
                      Alert.alert(
                        '⚠️ Voucher Created',
                        `Code: ${voucherCode}\n\nVoucher created but registration failed. Try adding it manually from "Add Voucher" menu.`,
                        [{ text: 'OK' }]
                      );
                    }
                  } else {
                    Alert.alert('❌ Error', 'Failed to create voucher. Check backend connection.');
                  }
                } catch (error: any) {
                  console.error('[Admin] ❌ Voucher creation error:', error);
                  Alert.alert('❌ Error', error.message || 'Failed to create voucher');
                }
              }}
            >
              <Ionicons name="gift-outline" size={24} color={theme === 'dark' ? '#10B981' : '#059669'} />
              <Text style={[styles.drawerItemText, theme === 'light' && styles.drawerItemTextLight, { color: theme === 'dark' ? '#10B981' : '#059669' }]}>
                🧪 Test Admin Voucher
              </Text>
            </TouchableOpacity>
          )}

          {/* Reset to Free Tier - REMOVED (kept for dev reference but disabled) */}
          {false && __DEV__ && (
            <TouchableOpacity 
              style={styles.drawerItem} 
              onPress={() => {
                toggleDrawer();
                resetToFreeTier();
              }}
            >
              <Ionicons name="refresh-outline" size={24} color={theme === 'dark' ? '#F59E0B' : '#D97706'} />
              <Text style={[styles.drawerItemText, theme === 'light' && styles.drawerItemTextLight, { color: theme === 'dark' ? '#F59E0B' : '#D97706' }]}>
                🔄 Reset to Free Tier
              </Text>
            </TouchableOpacity>
          )}
          
          {/* Add Voucher */}
          <TouchableOpacity 
            style={styles.drawerItem} 
            onPress={() => {
              toggleDrawer();
              setTimeout(() => setShowVoucherModal(true), 300);
            }}
          >
            <Ionicons name="ticket-outline" size={24} color={theme === 'dark' ? '#7DD3C0' : '#4A9B8F'} />
            <Text style={[styles.drawerItemText, theme === 'light' && styles.drawerItemTextLight, { color: theme === 'dark' ? '#7DD3C0' : '#4A9B8F' }]}>
              Add Voucher
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.drawerItem} 
            onPress={() => {
              toggleDrawer();
              // @ts-ignore
              navigation.navigate('LevelSelection');
            }}
          >
            <Ionicons name="layers-outline" size={24} color={theme === 'dark' ? '#7DD3C0' : '#4A9B8F'} />
            <Text style={[styles.drawerItemText, theme === 'light' && styles.drawerItemTextLight, { color: theme === 'dark' ? '#7DD3C0' : '#4A9B8F' }]}>
              Flash Cards
            </Text>
          </TouchableOpacity>
        </View>
      </Animated.View>

      {/* Header */}
      <View style={[styles.header, theme === 'light' && styles.headerLight]}>
        <TouchableOpacity onPress={toggleDrawer}>
          <Ionicons name="menu" size={24} color={theme === 'dark' ? '#FFF' : '#1A1A1F'} />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={[styles.headerTitle, theme === 'light' && styles.headerTitleLight]}>KSPEAKER</Text>
        </View>
        <View style={styles.logoContainer}>
          <Text style={[styles.logoText, theme === 'light' && styles.logoTextLight]}>KARTEZYA</Text>
          <Text style={[styles.plusSymbol, theme === 'light' && styles.plusSymbolLight]}>+</Text>
        </View>
      </View>

      {/* Messages */}
      <LinearGradient 
        colors={theme === 'dark' ? ['#000000', '#0A0A0A', '#000000'] : ['#F5F7FA', '#E8EEF5', '#F0F4F8']} 
        style={styles.gradient}
      >
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
          removeClippedSubviews={true}
          maxToRenderPerBatch={10}
          updateCellsBatchingPeriod={50}
          windowSize={10}
          initialNumToRender={10}
        />
      </LinearGradient>

      {/* Scroll to bottom button */}
      {showScrollButton && (
        <Animated.View 
          style={[
            styles.scrollToBottomButton,
            {
              opacity: scrollButtonAnim,
              transform: [
                {
                  scale: scrollButtonAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.3, 1],
                  }),
                },
                {
                  translateY: scrollButtonAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [20, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <TouchableOpacity
            style={[styles.scrollButton, theme === 'light' && styles.scrollButtonLight]}
            onPress={scrollToBottom}
            activeOpacity={0.8}
          >
            <Ionicons name="chevron-down" size={24} color={theme === 'dark' ? '#7DD3C0' : '#4A6FA5'} />
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Composer */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.composerKeyboard}
      >
        <View style={styles.composerContainer}>
          {/* Dropup Menu */}
          {showDropup && (
            <View style={[styles.dropupMenu, theme === 'light' && styles.dropupMenuLight]}>
              {showModeSelector ? (
                // Mode Selection List
                <>
                  <TouchableOpacity 
                    style={styles.dropupItem}
                    onPress={() => {
                      setShowModeSelector(false);
                      triggerHaptic('light');
                    }}
                  >
                    <Ionicons name="arrow-back" size={20} color={theme === 'dark' ? '#ECECEC' : '#1A1A1F'} />
                    <Text style={[styles.dropupItemText, theme === 'light' && styles.dropupItemTextLight]}>Back</Text>
                  </TouchableOpacity>
                  
                  {/* Mode Options */}
                  {['conversation', 'teacher', 'beginner', 'casual_friend', 'strict', 'roleplay', 'business'].map((mode) => (
                    <TouchableOpacity
                      key={mode}
                      style={[
                        styles.dropupItem,
                        conversationModeType === mode && styles.dropupItemActive
                      ]}
                      onPress={async () => {
                        setConversationModeType(mode);
                        setShowDropup(false);
                        setShowModeSelector(false);
                        triggerHaptic('medium');
                        
                        // If roleplay mode is selected, send intro message
                        if (mode === 'roleplay') {
                          try {
                            setIsLoadingResponse(true);
                            setRoleplayMode(true);
                            setRoleplayScenario(null);
                            const roleplayIntro = await sendChatMessage(
                              'Present 5 roleplay scenarios for English practice. Format each as: number, emoji, title, short description. Ask user to type a number 1-5 to choose.',
                              'roleplay'
                            );
                            
                            const assistantMsg: ChatMessage = {
                              id: Date.now().toString(),
                              role: 'assistant',
                              content: roleplayIntro,
                            };
                            setMessages(prev => [...prev, assistantMsg]);
                            setTypingMessageId(assistantMsg.id);
                            
                            // Speak the intro
                            ttsService.speak(roleplayIntro);
                          } catch (error) {
                            console.log('[Roleplay] Error loading intro:', error);
                            setRoleplayMode(false);
                          } finally {
                            setIsLoadingResponse(false);
                          }
                        } else {
                          // Clear roleplay mode if switching to another mode
                          setRoleplayMode(false);
                          setRoleplayScenario(null);
                        }
                      }}
                    >
                      <Ionicons 
                        name={conversationModeType === mode ? "checkmark-circle" : "radio-button-off"} 
                        size={20} 
                        color={conversationModeType === mode ? '#10B981' : (theme === 'dark' ? '#ECECEC' : '#1A1A1F')} 
                      />
                      <Text style={[
                        styles.dropupItemText,
                        theme === 'light' && styles.dropupItemTextLight,
                        conversationModeType === mode && styles.dropupItemTextActive
                      ]}>{getTranslation(mode)}</Text>
                    </TouchableOpacity>
                  ))}
                  
                  {/* Clear Mode */}
                  {conversationModeType && (
                    <TouchableOpacity
                      style={[styles.dropupItem, { backgroundColor: 'rgba(239, 68, 68, 0.1)' }]}
                      onPress={() => {
                        setConversationModeType(null);
                        triggerHaptic('medium');
                      }}
                    >
                      <Ionicons name="close-circle" size={20} color="#EF4444" />
                      <Text style={[styles.dropupItemText, { color: '#EF4444' }]}>{getTranslation('clearMode')}</Text>
                    </TouchableOpacity>
                  )}
                </>
              ) : (
                // Main Menu
                <>
                  {/* Mode Button */}
                  <TouchableOpacity 
                    style={[styles.dropupItem, conversationModeType && styles.dropupItemActive]}
                    onPress={() => {
                      setShowModeSelector(true);
                      triggerHaptic('light');
                    }}
                  >
                    <Ionicons 
                      name={conversationModeType ? "settings" : "settings-outline"} 
                      size={20} 
                      color={conversationModeType ? '#10B981' : (theme === 'dark' ? '#ECECEC' : '#1A1A1F')} 
                    />
                    <Text style={[
                      styles.dropupItemText, 
                      theme === 'light' && styles.dropupItemTextLight,
                      conversationModeType && styles.dropupItemTextActive
                    ]}>{getTranslation('mode')}</Text>
                    {conversationModeType && (
                      <Text style={styles.dropupItemBadge}>{getTranslation(conversationModeType)}</Text>
                    )}
                  </TouchableOpacity>
                  
                  {/* English Quiz */}
                  <TouchableOpacity 
                    style={styles.dropupItem}
                    onPress={() => {
                      setShowDropup(false);
                      startEnglishQuiz();
                    }}
                  >
                    <Ionicons name="trophy" size={20} color={theme === 'dark' ? '#ECECEC' : '#1A1A1F'} />
                    <Text style={[styles.dropupItemText, theme === 'light' && styles.dropupItemTextLight]}>{getTranslation('englishQuiz')}</Text>
                  </TouchableOpacity>
                </>
              )}
            </View>
          )}
          
          <View style={[styles.composerInner, { paddingBottom: Math.max(insets.bottom, 12) }]}>
            {Platform.OS === 'ios' ? (
              <BlurView style={styles.blur} blurType={theme === 'dark' ? 'dark' : 'light'} blurAmount={25}>
                <View style={[styles.inputRow, theme === 'light' && styles.inputRowLight]}>
                  <TouchableOpacity
                    style={styles.plusButton}
                    onPress={() => setShowDropup(!showDropup)}
                  >
                    <Ionicons name="add-circle" size={28} color="#4A6FA5" />
                  </TouchableOpacity>
                  <TextInput
                    ref={inputRef}
                    style={[styles.input, theme === 'light' && styles.inputLight]}
                    value={input}
                    onChangeText={setInput}
                    placeholder={getTranslation('askKspeaker')}
                    placeholderTextColor={theme === 'dark' ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)'}
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
                      {/* Clear button - show when has messages and NOT in voice mode */}
                      {messages.length > 0 && voiceState === 'idle' && (
                        <TouchableOpacity
                          style={styles.clearButton}
                          onPress={clearAll}
                        >
                          <Ionicons name="trash-outline" size={24} color="#EF4444" />
                        </TouchableOpacity>
                      )}
                      
                      {/* Stop button - only show during voice conversation */}
                      {voiceState !== 'idle' && (
                        <TouchableOpacity
                          style={styles.stopButton}
                          onPress={() => {
                            console.log('[Stop Button] 🛑 iOS Stop button pressed!');
                            stopVoiceConversation();
                          }}
                        >
                          <Ionicons name="stop-circle" size={32} color="#EF4444" />
                        </TouchableOpacity>
                      )}
                      
                      {/* Mic button - always visible */}
                      <TouchableOpacity
                        style={[
                          styles.micButton, 
                          voiceState === 'speaking' && styles.micButtonActive, 
                          voiceState !== 'idle' && styles.micButtonConversation,
                          theme === 'light' && styles.micButtonLight
                        ]}
                        onPress={handleMicButton}
                      >
                        {voiceState === 'idle' ? (
                          <Ionicons name="mic-outline" size={28} color={theme === 'dark' ? '#7DD3C0' : '#4A6FA5'} />
                        ) : voiceState === 'listening' ? (
                          <Ionicons name="mic" size={28} color="#10B981" />
                        ) : voiceState === 'processing' ? (
                          <Ionicons name="cloud-upload" size={28} color="#F59E0B" />
                        ) : (
                          <Ionicons name="volume-high" size={28} color="#3B82F6" />
                        )}
                      </TouchableOpacity>
                    </>
                  )}
                </View>
                
                {/* Voice State Indicator */}
                {voiceState !== 'idle' && (
                  <View style={styles.conversationModeIndicator}>
                    <View style={styles.conversationModeDot} />
                    <Text style={styles.conversationModeText}>
                      {voiceState === 'listening' ? getTranslation('listening') : voiceState === 'processing' ? getTranslation('processing') : getTranslation('speaking')}
                    </Text>
                    <Text style={styles.conversationModeHint}>
                      {voiceState === 'listening' ? 'Speak now or tap to stop' : voiceState === 'processing' ? 'Getting response...' : 'AI is responding'}
                    </Text>
                  </View>
                )}
                
                {/* Multi-layer pulse animation - Main composer */}
                {voiceState === 'listening' && (
                  <>
                    {/* Outer pulse - largest */}
                    <Animated.View 
                      style={[
                        styles.micPulse,
                        { 
                          transform: [{ scale: micPulseAnim }],
                          opacity: micPulseAnim.interpolate({
                            inputRange: [1, 1.8],
                            outputRange: [0.4, 0],
                          }),
                          backgroundColor: '#10B981',
                        }
                      ]} 
                    />
                    {/* Middle pulse */}
                    <Animated.View 
                      style={[
                        styles.micPulse,
                        { 
                          transform: [{ scale: micPulseAnim.interpolate({
                            inputRange: [1, 1.8],
                            outputRange: [1, 1.5],
                          }) }],
                          opacity: micPulseAnim.interpolate({
                            inputRange: [1, 1.8],
                            outputRange: [0.5, 0.1],
                          }),
                          backgroundColor: '#10B981',
                        }
                      ]} 
                    />
                    {/* Inner pulse - smallest, brightest */}
                    <Animated.View 
                      style={[
                        styles.micPulse,
                        { 
                          transform: [{ scale: micPulseAnim.interpolate({
                            inputRange: [1, 1.8],
                            outputRange: [1, 1.2],
                          }) }],
                          opacity: micPulseAnim.interpolate({
                            inputRange: [1, 1.8],
                            outputRange: [0.7, 0.3],
                          }),
                          backgroundColor: '#34D399',
                        }
                      ]} 
                    />
                  </>
                )}
                
                {/* Idle state - no pulse animation */}
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
                      {/* Clear button - show when has messages and NOT in voice mode */}
                      {messages.length > 0 && voiceState === 'idle' && (
                        <TouchableOpacity
                          style={styles.clearButton}
                          onPress={clearAll}
                        >
                          <Ionicons name="trash-outline" size={24} color="#EF4444" />
                        </TouchableOpacity>
                      )}
                      
                      {/* Stop button - only show during voice conversation */}
                      {voiceState !== 'idle' && (
                        <TouchableOpacity
                          style={styles.stopButton}
                          onPress={() => {
                            console.log('[Stop Button] 🛑 Android Stop button pressed!');
                            stopVoiceConversation();
                          }}
                        >
                          <Ionicons name="stop-circle" size={32} color="#EF4444" />
                        </TouchableOpacity>
                      )}
                      
                      {/* Mic button - always visible */}
                      <TouchableOpacity
                        style={[
                          styles.micButton, 
                          voiceState === 'speaking' && styles.micButtonActive,
                          voiceState !== 'idle' && styles.micButtonConversation
                        ]}
                        onPress={handleMicButton}
                      >
                        {voiceState === 'idle' ? (
                          <Ionicons name="mic-outline" size={28} color="#7DD3C0" />
                        ) : voiceState === 'listening' ? (
                          <Ionicons name="mic" size={28} color="#10B981" />
                        ) : voiceState === 'processing' ? (
                          <Ionicons name="cloud-upload" size={28} color="#F59E0B" />
                        ) : (
                          <Ionicons name="volume-high" size={28} color="#3B82F6" />
                        )}
                      </TouchableOpacity>
                    </>
                  )}
                </View>
                
                {/* Multi-layer pulse animation - Drawer */}
                {voiceState === 'listening' && (
                  <>
                    {/* Outer pulse */}
                    <Animated.View 
                      pointerEvents="none"
                      style={[
                        styles.micPulse,
                        { 
                          transform: [{ scale: micPulseAnim }],
                          opacity: micPulseAnim.interpolate({
                            inputRange: [1, 1.8],
                            outputRange: [0.4, 0],
                          }),
                          backgroundColor: '#10B981',
                        }
                      ]} 
                    />
                    {/* Middle pulse */}
                    <Animated.View 
                      pointerEvents="none"
                      style={[
                        styles.micPulse,
                        { 
                          transform: [{ scale: micPulseAnim.interpolate({
                            inputRange: [1, 1.8],
                            outputRange: [1, 1.5],
                          }) }],
                          opacity: micPulseAnim.interpolate({
                            inputRange: [1, 1.8],
                            outputRange: [0.5, 0.1],
                          }),
                          backgroundColor: '#10B981',
                        }
                      ]} 
                    />
                    {/* Inner pulse */}
                    <Animated.View 
                      pointerEvents="none"
                      style={[
                        styles.micPulse,
                        { 
                          transform: [{ scale: micPulseAnim.interpolate({
                            inputRange: [1, 1.8],
                            outputRange: [1, 1.2],
                          }) }],
                          opacity: micPulseAnim.interpolate({
                            inputRange: [1, 1.8],
                            outputRange: [0.7, 0.3],
                          }),
                          backgroundColor: '#34D399',
                        }
                      ]} 
                    />
                  </>
                )}
                
                {/* Idle state - no animation */}
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
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#000000',
    borderBottomWidth: 0.5,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
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
    color: '#FFFFFF',
    letterSpacing: 2.5,
    fontStyle: 'italic',
    textShadowColor: 'rgba(125, 211, 192, 0.3)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  logoContainer: {
    position: 'relative',
    paddingRight: 2,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  logoText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#7DD3C0',
    letterSpacing: 1.2,
    fontStyle: 'italic',
  },
  logoTextLight: {
    color: '#4A6FA5',
  },
  plusSymbol: {
    fontSize: 10,
    fontWeight: '900',
    color: '#7DD3C0',
    marginLeft: 1,
    marginTop: -2,
  },
  plusSymbolLight: {
    color: '#4A6FA5',
  },
  gradient: {
    flex: 1,
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingBottom: 120, // Extra space to clear composer
    maxWidth: Dimensions.get('window').width >= 768 ? 800 : '100%',
    alignSelf: 'center',
    width: '100%',
  },
  scrollToBottomButton: {
    position: 'absolute',
    right: 16,
    bottom: 120, // Above composer
    zIndex: 100,
  },
  scrollButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#1C1C1E',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(125, 211, 192, 0.3)',
    shadowColor: '#7DD3C0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 8,
  },
  scrollButtonLight: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
    shadowColor: '#4A6FA5',
  },
  bubble: {
    maxWidth: '85%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor: '#1C1C1E',
    borderBottomRightRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(125, 211, 192, 0.2)',
    shadowColor: '#7DD3C0',
    shadowOpacity: 0.2,
  },
  assistantBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#1C1C1E',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
  },
  messageText: {
    fontSize: 15,
    color: '#FFFFFF',
    lineHeight: 21,
  },
  userMessageText: {
    color: '#FFFFFF',
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
  stopButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#3E3E42',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#EF4444',
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
    backgroundColor: '#1C1C1E',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(125, 211, 192, 0.3)',
    shadowColor: '#7DD3C0',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  micButtonListening: {
    backgroundColor: '#3D2A3A',
    borderColor: '#8B4A6F',
  },
  micButtonActive: {
    backgroundColor: '#2A3D4A',
    borderColor: '#4A7A8B',
  },
  micButtonConversation: {
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    borderColor: '#06B6D4',
    borderWidth: 2,
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
    backgroundColor: '#000000',
    zIndex: 1000,
    borderRightWidth: 1,
    borderRightColor: 'rgba(255, 255, 255, 0.06)',
    shadowColor: '#000',
    shadowOffset: { width: 4, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 10,
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  drawerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  drawerContent: {
    paddingTop: 60,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 16,
  },
  drawerItemActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.15)',
    borderLeftWidth: 3,
    borderLeftColor: '#10B981',
  },
  drawerItemText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  drawerItemTextActive: {
    color: '#10B981',
    fontWeight: '600',
  },
  drawerItemBadge: {
    marginLeft: 'auto',
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#10B981',
    borderRadius: 12,
    fontSize: 11,
    color: '#FFFFFF',
    fontWeight: '600',
    textTransform: 'capitalize',
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
    padding: 24,
  },
  modalContentLight: {
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalHeaderLight: {
    borderBottomColor: '#E5E5E5',
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: '#ECECEC',
  },
  modalTitleLight: {
    color: '#1A1A1F',
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
  aboutTextLight: {
    color: '#1A1A1F',
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
  languageOptionLight: {
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
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
  languageTextLight: {
    color: '#1A1A1F',
  },
  approvalIconContainer: {
    alignItems: 'center',
    marginBottom: 24,
  },
  approvalTitle: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
  },
  approvalTitleLight: {
    color: '#1A1A1F',
  },
  approvalMessage: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
    paddingHorizontal: 8,
  },
  approvalMessageLight: {
    color: 'rgba(0, 0, 0, 0.7)',
  },
  approvalButton: {
    backgroundColor: '#7DD3C0',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 12,
    alignSelf: 'stretch',
    alignItems: 'center',
  },
  approvalButtonLight: {
    backgroundColor: '#4A6FA5',
  },
  approvalButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  plusButton: {
    marginRight: 8,
  },
  dropupMenu: {
    position: 'absolute',
    bottom: '100%',
    left: 20,
    right: 20,
    backgroundColor: '#1C1C1E',
    borderRadius: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  dropupItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 12,
    borderRadius: 16,
  },
  dropupItemActive: {
    backgroundColor: 'rgba(16, 185, 129, 0.12)',
  },
  dropupItemText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  dropupItemTextActive: {
    color: '#10B981',
  },
  dropupItemBadge: {
    marginLeft: 'auto',
    fontSize: 12,
    fontWeight: '700',
    color: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    textTransform: 'capitalize',
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
    backgroundColor: 'rgba(255, 255, 255, 0.06)',
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
  bubbleHighlight: {
    transform: [{ scale: 1.02 }],
    borderColor: 'rgba(125, 211, 192, 0.5)',
  },
  contextMenu: {
    position: 'absolute',
    bottom: -40,
    backgroundColor: '#1C1C1E',
    borderRadius: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: 'rgba(125, 211, 192, 0.3)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  contextMenuUser: {
    right: 0,
  },
  contextMenuAssistant: {
    left: 0,
  },
  contextMenuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  contextMenuText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  contextMenuTextLight: {
    color: '#1A1A1F',
  },
  // Light theme styles
  containerLight: {
    backgroundColor: '#FFFFFF',
  },
  headerLight: {
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitleLight: {
    color: '#1A1A1F',
  },
  drawerLight: {
    backgroundColor: '#FFFFFF',
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
  },
  drawerTitleLight: {
    color: '#1A1A1F',
  },
  drawerItemTextLight: {
    color: '#1A1A1F',
  },
  userBubbleLight: {
    alignSelf: 'flex-end',
    backgroundColor: '#4A6FA5',
    borderBottomRightRadius: 4,
    shadowColor: '#4A6FA5',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 2,
  },
  assistantBubbleLight: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 4,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  userMessageTextLight: {
    color: '#FFFFFF',
  },
  assistantMessageTextLight: {
    color: '#1F2937',
  },
  emptyTextLight: {
    color: 'rgba(31, 41, 55, 0.7)',
  },
  emptySubtextLight: {
    color: 'rgba(31, 41, 55, 0.5)',
  },
  inputRowLight: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  inputLight: {
    color: '#1A1A1F',
  },
  micButtonLight: {
    backgroundColor: '#F3F4F6',
    borderColor: '#D1D5DB',
  },
  dropupMenuLight: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  dropupItemTextLight: {
    color: '#1A1A1F',
  },
  conversationModeIndicator: {
    position: 'absolute',
    bottom: 80,
    left: 0,
    right: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    borderTopWidth: 1,
    borderTopColor: 'rgba(6, 182, 212, 0.3)',
  },
  conversationModeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#06B6D4',
    marginRight: 8,
  },
  conversationModeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#06B6D4',
    marginRight: 12,
  },
  conversationModeHint: {
    fontSize: 11,
    color: 'rgba(6, 182, 212, 0.7)',
  },
  settingsItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  settingsItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingsItemText: {
    fontSize: 16,
    color: '#ECECEC',
    marginLeft: 12,
  },
  settingsItemTextLight: {
    color: '#1A1A1F',
  },
  settingsDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    marginVertical: 4,
  },
  faqItem: {
    marginBottom: 20,
  },
  faqQuestion: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 10,
  },
  faqQuestionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ECECEC',
  },
  faqQuestionTextLight: {
    color: '#1A1A1F',
  },
  faqAnswer: {
    fontSize: 15,
    color: 'rgba(255, 255, 255, 0.8)',
    lineHeight: 22,
  },
  faqAnswerLight: {
    color: 'rgba(0, 0, 0, 0.7)',
  },
  supportLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ECECEC',
    marginBottom: 8,
  },
  supportLabelLight: {
    color: '#1A1A1F',
  },
  supportInput: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#ECECEC',
  },
  supportInputLight: {
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    color: '#1A1A1F',
  },
  supportTextarea: {
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#ECECEC',
    textAlignVertical: 'top',
  },
  supportTextareaLight: {
    backgroundColor: 'rgba(0, 0, 0, 0.03)',
    color: '#1A1A1F',
  },
  characterCount: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'right',
    marginTop: 4,
  },
  characterCountLight: {
    color: 'rgba(0, 0, 0, 0.4)',
  },
  supportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4A6FA5',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    marginTop: 20,
    gap: 8,
  },
  supportButtonDisabled: {
    backgroundColor: 'rgba(74, 111, 165, 0.5)',
  },
  supportButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default ChatScreen;
