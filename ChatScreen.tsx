import React, { useState, useRef, useEffect } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet, TouchableOpacity, Platform, KeyboardAvoidingView, Keyboard, Animated, Dimensions, useWindowDimensions, Vibration, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { sendChatMessage, initializeApi, registerUser } from './api';
import { checkRegistration, saveRegistration, clearRegistration } from './registration';
import { EmailRegistrationModal } from './components/EmailRegistrationModal';
import { startListening, stopListening } from './speech';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Tts from 'react-native-tts';
import LinearGradient from 'react-native-linear-gradient';
import { BlurView } from '@react-native-community/blur';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Theme = 'dark' | 'light';
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
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<'en' | 'tr' | 'ar' | 'ru'>('en');
  const [quizMode, setQuizMode] = useState(false);
  const [quizLevel, setQuizLevel] = useState<string | null>(null);
  const [quizQuestionCount, setQuizQuestionCount] = useState(0);
  const [showDropup, setShowDropup] = useState(false);
  const [showModeSelector, setShowModeSelector] = useState(false); // Mode selection menu
  const [theme, setTheme] = useState<Theme>('dark');
  const [messageContextMenu, setMessageContextMenu] = useState<string | null>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [conversationMode, setConversationMode] = useState(false); // Continuous listening mode
  const [conversationModeType, setConversationModeType] = useState<string | null>(null); // conversation|teacher|beginner|casual_friend|strict|roleplay|business
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const scrollButtonAnim = useRef(new Animated.Value(0)).current;
  
  const flatListRef = useRef<FlatList>(null);
  const inputRef = useRef<TextInput>(null);
  const silenceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isSending = useRef(false);
  const currentVoiceText = useRef('');
  const hasSentVoice = useRef(false);
  const conversationModeRef = useRef(false); // Ref for TTS event closures
  const speakingRef = useRef(false); // Ref for speaking state in closures
  const voiceErrorCount = useRef(0); // Track consecutive voice errors
  const drawerAnim = useRef(new Animated.Value(-280)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const micPulseAnim = useRef(new Animated.Value(1)).current;

  console.log('[ChatScreen] Current state - messages:', messages.length, 'listening:', listening, 'speaking:', speaking, 'conversation:', conversationMode);

  // Sync refs with state
  useEffect(() => {
    conversationModeRef.current = conversationMode;
    console.log('[Conversation] Ref synced:', conversationMode);
  }, [conversationMode]);

  useEffect(() => {
    speakingRef.current = speaking;
  }, [speaking]);

  // Load theme from storage
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
    loadTheme();
  }, []);

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
        
        // Auto-restart listening after typing completes (if conversation mode active)
        if (conversationModeRef.current && message.role === 'assistant') {
          console.log('[Typing] ✅ Typing finished in conversation mode');
          console.log('[Typing] Current state - speaking:', speakingRef.current, 'listening:', listening);
          
          // Wait a bit, then check if we should restart
          setTimeout(() => {
            const shouldRestart = conversationModeRef.current && !speakingRef.current && !listening;
            console.log('[Typing] Should restart?', shouldRestart, '(conversation:', conversationModeRef.current, 'speaking:', speakingRef.current, 'listening:', listening, ')');
            
            if (shouldRestart) {
              console.log('[Conversation] 🎤 Auto-restarting listening after response');
              startVoiceInput();
            }
          }, 500);
        }
      }
    }, 20); // 20ms per character for smooth typing

    return () => clearInterval(typingInterval);
  }, [typingMessageId, messages]);

  // Mic pulse animation when listening - ENHANCED
  useEffect(() => {
    if (listening) {
      // Active listening - fast and prominent pulse
      Animated.loop(
        Animated.sequence([
          Animated.timing(micPulseAnim, {
            toValue: 1.8, // Bigger pulse
            duration: 400, // Faster
            useNativeDriver: true,
          }),
          Animated.timing(micPulseAnim, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else if (conversationMode && !speaking) {
      // Conversation mode idle - subtle breathing pulse
      Animated.loop(
        Animated.sequence([
          Animated.timing(micPulseAnim, {
            toValue: 1.15, // Smaller
            duration: 1500, // Slower
            useNativeDriver: true,
          }),
          Animated.timing(micPulseAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      micPulseAnim.setValue(1);
    }
  }, [listening, conversationMode, speaking]);

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
      
      // Speak the reply with TTS
      console.log('[TTS] 🔊 Attempting to speak reply (length:', reply.length, 'chars)');
      console.log('[TTS] 🔊 Content preview:', reply.substring(0, 50) + '...');
      console.log('[TTS] 🎯 Conversation Mode:', conversationModeType || 'none');
      
      setTimeout(() => {
        console.log('[TTS] 🔊 Calling Tts.speak() now...');
        setSpeaking(true);
        speakingRef.current = true;
        Tts.speak(reply);
        console.log('[TTS] 🔊 Tts.speak() called - waiting for events...');
      }, 200);
    } catch (e: any) {
      // Check if error is waiting for approval
      if (e?.message === 'WAITING_APPROVAL') {
        setShowApprovalModal(true);
        // Remove the user message since it won't get a response
        setMessages(prev => prev.slice(0, -1));
      } else {
        const errorMsg: ChatMessage = {
          id: (Date.now() + 2).toString(),
          role: 'assistant',
          content: 'Sorry, error occurred.',
        };
        setMessages(prev => [...prev, errorMsg]);
      }
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
    
    // CRITICAL: Stop listening IMMEDIATELY to prevent TTS echo
    if (listening) {
      console.log('[Voice] 🛑 Stopping listening before TTS starts');
      stopListening();
      setListening(false);
    }
    
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
      const reply = await sendChatMessage(voiceText.trim(), conversationModeType || undefined);
      
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
      
      // Speak the reply after a small delay
      console.log('[TTS] 🔊 Attempting to speak reply (length:', reply.length, 'chars)');
      console.log('[TTS] 🔊 Content preview:', reply.substring(0, 50) + '...');
      console.log('[TTS] 🎯 Conversation Mode:', conversationModeType || 'none');
      
      setTimeout(() => {
        console.log('[TTS] 🔊 Calling Tts.speak() now...');
        setSpeaking(true);
        speakingRef.current = true;
        Tts.speak(reply);
        console.log('[TTS] 🔊 Tts.speak() called - waiting for events...');
      }, 200);
    } catch (e: any) {
      console.error('[Voice] Error:', e);
      
      // Check if error is waiting for approval
      if (e?.message === 'WAITING_APPROVAL') {
        setShowApprovalModal(true);
        // Remove the user message since it won't get a response
        setMessages(prev => prev.slice(0, -1));
      } else {
        setMessages(prev => [...prev, {
          id: (Date.now() + 2).toString(),
          role: 'assistant',
          content: 'Sorry, error occurred.',
        }]);
      }
    } finally {
      setIsLoadingResponse(false);
      isSending.current = false;
      hasSentVoice.current = false; // CRITICAL: Reset for next voice input
      console.log('[Voice] Request completed, hasSentVoice reset to false');
    }
  };

  // Stop speech immediately - NATIVE PATCHED VERSION
  const stopSpeech = () => {
    console.log('[TTS] ⛔ STOPPING with patched native method');
    
    // Update state and ref
    setSpeaking(false);
    speakingRef.current = false;
    
    // Call patched stop() - now works without parameters!
    Tts.stop();
    
    console.log('[TTS] ✅ Native stop called (AVSpeechBoundaryImmediate)');
    
    // If conversation mode active, restart listening after 3-4 seconds
    if (conversationModeRef.current) {
      console.log('[TTS] ⏰ Will restart listening in 3.5 seconds...');
      setTimeout(() => {
        if (conversationModeRef.current && !speakingRef.current && !listening) {
          console.log('[Conversation] 🎤 Auto-restarting listening after STOP');
          startVoiceInput();
        }
      }, 3500); // 3.5 saniye bekle
    }
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
      waitingApproval: { en: 'Waiting for Approval', tr: 'Onay Bekleniyor', ar: 'في انتظار الموافقة', ru: 'Ожидание одобрения' },
      approvalMessage: { en: 'Your account is pending admin approval. You will be able to use KSpeaker after approval.', tr: 'Hesabınız yönetici onayı bekliyor. Onay sonrasında KSpeaker\'ı kullanabileceksiniz.', ar: 'حسابك في انتظار موافقة المسؤول. ستتمكن من استخدام KSpeaker بعد الموافقة.', ru: 'Ваша учетная запись ожидает одобрения администратором. Вы сможете использовать KSpeaker после одобрения.' },
      understood: { en: 'Understood', tr: 'Anladım', ar: 'مفهوم', ru: 'Понятно' },
    };
    return translations[key]?.[selectedLanguage] || translations[key]?.en || key;
  };

  // Start voice listening - FIXED: Use refs for closure issues
  const startVoiceInput = () => {
    console.log('[Voice] 🎤 Starting voice input - CONVERSATION MODE');
    
    // Clear any existing timer first
    if (silenceTimer.current) {
      console.log('[Voice] 🧹 Clearing old timer');
      clearTimeout(silenceTimer.current);
      silenceTimer.current = null;
    }
    
    // Reset voice state - CRITICAL for conversation mode!
    currentVoiceText.current = '';
    hasSentVoice.current = false;
    console.log('[Voice] 🔄 Reset: hasSentVoice = false, currentVoiceText = empty');
    
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
        console.log('[Voice] Is speaking:', speakingRef.current);
        
        stopListening();
        setListening(false);
        
        // CRITICAL: Prevent double send - check ALL conditions
        const hasText = currentVoiceText.current.trim().length > 0;
        const notSending = !isSending.current;
        const notSent = !hasSentVoice.current;
        const notSpeaking = !speakingRef.current; // Don't send if TTS is speaking
        
        if (hasText && notSending && notSent && notSpeaking) {
          console.log('[Voice] ✅ SENDING message:', currentVoiceText.current);
          hasSentVoice.current = true; // Lock immediately
          const textToSend = currentVoiceText.current;
          currentVoiceText.current = ''; // Clear immediately
          sendVoiceMessage(textToSend);
        } else {
          console.log('[Voice] ❌ NOT SENDING - Reasons:');
          console.log('  - Empty:', !hasText);
          console.log('  - Already sending:', !notSending);
          console.log('  - Already sent:', !notSent);
          console.log('  - TTS speaking:', !notSpeaking);
        }
      }, timeout);
    };

    startListening((text) => {
      console.log('[Voice] 🎤 Received text update:', text);
      currentVoiceText.current = text;
      
      if (!hasReceivedAnyText) {
        console.log('[Voice] ✅ First text received, switching to 2s timeout');
        hasReceivedAnyText = true;
        voiceErrorCount.current = 0; // Reset error count on successful recognition
      }
      
      setTimer();
    }, () => {
      // Error callback - speech recognition failed
      voiceErrorCount.current += 1;
      console.log('[Voice] ⚠️ Speech recognition error #' + voiceErrorCount.current);
      
      // Clear timer
      if (silenceTimer.current) {
        clearTimeout(silenceTimer.current);
        silenceTimer.current = null;
      }
      
      // Reset state but keep conversation mode active
      setListening(false);
      
      // Stop retrying after 3 consecutive errors (likely Simulator or no mic)
      if (voiceErrorCount.current >= 3) {
        console.log('[Voice] ⛔ Too many errors, stopping conversation mode');
        console.log('[Voice] 💡 Tip: Voice recognition may not work in iOS Simulator');
        setConversationMode(false);
        conversationModeRef.current = false;
        return;
      }
      
      // Restart listening after 2 seconds if conversation mode still active
      if (conversationModeRef.current) {
        console.log('[Voice] 🔄 Will retry listening in 2 seconds...');
        setTimeout(() => {
          if (conversationModeRef.current && !speakingRef.current && !listening) {
            console.log('[Voice] 🎤 Retrying voice input...');
            startVoiceInput();
          }
        }, 2000);
      }
    });

    setTimer();
  };

  // Microphone button handler - Simplified conversation toggle
  const handleMic = () => {
    console.log('[Mic] 🎤 Pressed - speaking:', speaking, 'listening:', listening, 'conversation:', conversationMode);
    triggerHaptic('light'); // Haptic feedback hemen
    
    // If speaking, STOP TTS (keep conversation active, wait for typing to finish)
    if (speaking) {
      console.log('[Mic] 🛑 STOPPING TTS - Will resume after response typing completes');
      stopSpeech();
      triggerHaptic('medium');
      return;
    }

    // If listening, STOP and EXIT conversation mode
    if (listening) {
      console.log('[Mic] 🛑 Stopping listening - EXITING conversation mode');
      if (silenceTimer.current) {
        clearTimeout(silenceTimer.current);
        silenceTimer.current = null;
      }
      stopListening();
      setListening(false);
      setConversationMode(false);
      conversationModeRef.current = false;
      triggerHaptic('medium');
      return;
    }

    // Idle: Start conversation mode
    console.log('[Mic] 🎤 STARTING conversation mode');
    setConversationMode(true);
    conversationModeRef.current = true;
    voiceErrorCount.current = 0; // Reset error count when manually starting
    startVoiceInput();
  };

  // Long press removed - simple tap toggle is enough

  // TTS events - no dependencies on listening state
  useEffect(() => {
    console.log('[TTS] 🔧 Initializing TTS with premium neural voice');
    Tts.setDefaultLanguage('en-US');
    
    // Get and select best quality voice
    Tts.voices().then((voices: any[]) => {
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
        Tts.setDefaultVoice(selectedVoice.id);
      }
      
      // CRITICAL: Speech parameters for human-like, non-robotic speech
      // Lower rate = more natural with better prosody and emphasis
      // Pitch variations handled by premium voices automatically
      Tts.setDefaultRate(0.42);  // Slower = less robotic, more conversational
      
      console.log('[TTS] 🎚️ Speech params: Rate=0.42 (conversational)');
    });
    
    Tts.addEventListener('tts-start', () => {
      console.log('[TTS] 🔊 EVENT: Started speaking');
      setSpeaking(true);
      speakingRef.current = true;
    });
    
    Tts.addEventListener('tts-finish', () => {
      console.log('[TTS] ✅ EVENT: Finished naturally');
      setSpeaking(false);
      speakingRef.current = false;
      voiceErrorCount.current = 0; // Reset error count - successful TTS cycle
      
      // Auto-restart listening in conversation mode after TTS finishes
      if (conversationModeRef.current) {
        console.log('[Conversation] ✅ TTS finished, restarting listening in 1 second...');
        setTimeout(() => {
          if (conversationModeRef.current && !speakingRef.current && !listening) {
            console.log('[Conversation] 🎤 Auto-restarting listening after TTS finish');
            startVoiceInput();
          }
        }, 1000);
      }
    });
    
    Tts.addEventListener('tts-cancel', () => {
      console.log('[TTS] ⛔ EVENT: Cancelled/Stopped by user');
      setSpeaking(false);
      speakingRef.current = false;
      // Don't restart listening immediately - wait for typing effect to finish
      // Typing effect useEffect will handle restart
    });

    return () => {
      Tts.removeAllListeners('tts-start');
      Tts.removeAllListeners('tts-finish');
      Tts.removeAllListeners('tts-cancel');
    };
  }, []); // Empty deps - setup only once

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
    const showMenu = messageContextMenu === item.id;
    
    console.log('[Render] Message:', item.role, item.content.substring(0, 30));
    
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
                  Tts.speak(item.content);
                  setMessageContextMenu(null);
                }}
              >
                <Ionicons name="volume-high" size={16} color={theme === 'dark' ? '#7DD3C0' : '#4A6FA5'} />
                <Text style={[styles.contextMenuText, theme === 'light' && styles.contextMenuTextLight]}>Read Aloud</Text>
              </TouchableOpacity>
            </View>
          )}
        </Animated.View>
      </TouchableOpacity>
    );
  };

  const renderEmpty = () => (
    <View style={styles.empty}>
      <Ionicons name="chatbubbles-outline" size={64} color={theme === 'dark' ? 'rgba(125, 211, 192, 0.3)' : 'rgba(74, 111, 165, 0.3)'} />
      <Text style={[styles.emptyText, theme === 'light' && styles.emptyTextLight]}>{getTranslation('startConversation')}</Text>
      <Text style={[styles.emptySubtext, theme === 'light' && styles.emptySubtextLight]}>{getTranslation('askAnything')}</Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, theme === 'light' && styles.containerLight]} edges={['top', 'bottom']}>
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

      {/* Waiting Approval Modal */}
      {showApprovalModal && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, theme === 'light' && styles.modalContentLight]}>
            <View style={styles.approvalIconContainer}>
              <Ionicons 
                name="time-outline" 
                size={64} 
                color={theme === 'dark' ? '#7DD3C0' : '#4A6FA5'} 
              />
            </View>
            <Text style={[styles.approvalTitle, theme === 'light' && styles.approvalTitleLight]}>
              {getTranslation('waitingApproval')}
            </Text>
            <Text style={[styles.approvalMessage, theme === 'light' && styles.approvalMessageLight]}>
              {getTranslation('approvalMessage')}
            </Text>
            <TouchableOpacity 
              style={[styles.approvalButton, theme === 'light' && styles.approvalButtonLight]}
              onPress={() => setShowApprovalModal(false)}
            >
              <Text style={styles.approvalButtonText}>{getTranslation('understood')}</Text>
            </TouchableOpacity>
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
          <TouchableOpacity style={styles.drawerItem}>
            <Ionicons name="settings-outline" size={24} color={theme === 'dark' ? '#ECECEC' : '#1A1A1F'} />
            <Text style={[styles.drawerItemText, theme === 'light' && styles.drawerItemTextLight]}>{getTranslation('settings')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.drawerItem} onPress={openAboutModal}>
            <Ionicons name="information-circle-outline" size={24} color={theme === 'dark' ? '#ECECEC' : '#1A1A1F'} />
            <Text style={[styles.drawerItemText, theme === 'light' && styles.drawerItemTextLight]}>{getTranslation('about')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.drawerItem} onPress={openLanguageModal}>
            <Ionicons name="language" size={24} color={theme === 'dark' ? '#ECECEC' : '#1A1A1F'} />
            <Text style={[styles.drawerItemText, theme === 'light' && styles.drawerItemTextLight]}>{getTranslation('language')}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.drawerItem} onPress={toggleTheme}>
            <Ionicons name={theme === 'dark' ? 'sunny' : 'moon'} size={24} color={theme === 'dark' ? '#ECECEC' : '#1A1A1F'} />
            <Text style={[styles.drawerItemText, theme === 'light' && styles.drawerItemTextLight]}>
              {theme === 'dark' ? 'Light Mode' : 'Dark Mode'}
            </Text>
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
                      onPress={() => {
                        setConversationModeType(mode);
                        setShowDropup(false);
                        setShowModeSelector(false);
                        triggerHaptic('medium');
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
                      ]}>{mode.replace('_', ' ')}</Text>
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
                      <Text style={[styles.dropupItemText, { color: '#EF4444' }]}>Clear Mode</Text>
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
                    ]}>Mode</Text>
                    {conversationModeType && (
                      <Text style={styles.dropupItemBadge}>{conversationModeType.replace('_', ' ')}</Text>
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
                      {messages.length > 0 && (
                        <TouchableOpacity
                          style={styles.clearButton}
                          onPress={clearAll}
                        >
                          <Ionicons name="trash-outline" size={24} color="#EF4444" />
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity
                        style={[
                          styles.micButton, 
                          speaking && styles.micButtonActive, 
                          conversationMode && styles.micButtonConversation,
                          theme === 'light' && styles.micButtonLight
                        ]}
                        onPress={handleMic}
                      >
                        {speaking ? (
                          <Ionicons name="stop-circle" size={28} color="#EF4444" />
                        ) : listening ? (
                          <Ionicons name="mic" size={28} color="#10B981" />
                        ) : conversationMode ? (
                          <Ionicons name="mic" size={28} color="#06B6D4" />
                        ) : (
                          <Ionicons name="mic-outline" size={28} color={theme === 'dark' ? '#7DD3C0' : '#4A6FA5'} />
                        )}
                      </TouchableOpacity>
                    </>
                  )}
                </View>
                
                {/* Conversation Mode Indicator - Simplified */}
                {conversationMode && (
                  <View style={styles.conversationModeIndicator}>
                    <View style={styles.conversationModeDot} />
                    <Text style={styles.conversationModeText}>
                      {speaking ? 'Speaking...' : listening ? 'Listening...' : 'Conversation Active'}
                    </Text>
                    <Text style={styles.conversationModeHint}>
                      {listening ? 'Tap mic to stop' : speaking ? 'Waiting for response...' : 'Ready to listen'}
                    </Text>
                  </View>
                )}
                
                {/* Multi-layer pulse animation - Main composer */}
                {listening && (
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
                
                {/* Conversation mode idle breathing - subtle glow */}
                {conversationMode && !listening && !speaking && (
                  <Animated.View 
                    style={[
                      styles.micPulse,
                      { 
                        transform: [{ scale: micPulseAnim }],
                        opacity: micPulseAnim.interpolate({
                          inputRange: [1, 1.15],
                          outputRange: [0.2, 0.05],
                        }),
                        backgroundColor: '#06B6D4',
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
                        style={[
                          styles.micButton, 
                          speaking && styles.micButtonActive,
                          conversationMode && styles.micButtonConversation
                        ]}
                        onPress={handleMic}
                      >
                        {speaking ? (
                          <Ionicons name="stop-circle" size={28} color="#EF4444" />
                        ) : listening ? (
                          <Ionicons name="mic" size={28} color="#10B981" />
                        ) : conversationMode ? (
                          <Ionicons name="mic" size={28} color="#06B6D4" />
                        ) : (
                          <Ionicons name="mic-outline" size={28} color="#7DD3C0" />
                        )}
                      </TouchableOpacity>
                    </>
                  )}
                </View>
                
                {/* Multi-layer pulse animation - Drawer */}
                {listening && (
                  <>
                    {/* Outer pulse */}
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
                    {/* Inner pulse */}
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
                
                {/* Conversation mode idle breathing - drawer */}
                {conversationMode && !listening && !speaking && (
                  <Animated.View 
                    style={[
                      styles.micPulse,
                      { 
                        transform: [{ scale: micPulseAnim }],
                        opacity: micPulseAnim.interpolate({
                          inputRange: [1, 1.15],
                          outputRange: [0.2, 0.05],
                        }),
                        backgroundColor: '#06B6D4',
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
});

export default ChatScreen;
