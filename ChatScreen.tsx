import React, { useState, useRef, useEffect, useCallback } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet, TouchableOpacity, Platform, KeyboardAvoidingView, Keyboard, Animated, Dimensions, useWindowDimensions } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { sendChatMessage, initializeApi, registerUser } from './api';
import { checkRegistration, saveRegistration } from './registration';
import { startListening, stopListening, primeVoiceSession } from './speech';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Tts from 'react-native-tts';
import LinearGradient from 'react-native-linear-gradient';
import { logError, logInfo, logWarning } from './logger';
import { ComposerBar, SideDrawer, ChatModals, ModeDropup } from './src/features/chat/components';
import { getErrorDisplayMessage } from './src/shared/chat/resolveApiErrorMessage';
import { preprocessTextForTTS } from './src/platform/ttsText';
import { getTranslation as translate } from './utils/translations';
import type { TranslationKey } from './utils/translations';
import { triggerHaptic } from './src/platform/haptic';
import { configureTtsEngine } from './src/platform/tts';
import { getSpeechLocale } from './src/shared/language/appLanguageConfig';
import { LISTENING_POLICY } from './src/shared/speech/listeningPolicy';
import { mergeTranscript } from './src/shared/speech/mergeTranscript';
import { useAppTheme, useAppLanguage, useNotificationSettings } from './src/features/chat/hooks';
import type { ChatMessage, VoiceState } from './src/features/chat/types';

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
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [liveTranscript, setLiveTranscript] = useState('');
  const { theme, toggleTheme } = useAppTheme('dark');
  const { selectedLanguage, selectLanguage: persistLanguage } = useAppLanguage('en');
  const { notificationsEnabled, toggleNotifications } = useNotificationSettings(selectedLanguage);
  
  // Simple state - GPT style
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isLoadingResponse, setIsLoadingResponse] = useState(false);
  const [typingMessageId, setTypingMessageId] = useState<string | null>(null);
  const [displayedText, setDisplayedText] = useState('');
  const [showAboutModal, setShowAboutModal] = useState(false);
  const [showFaqModal, setShowFaqModal] = useState(false);
  const [showSupportModal, setShowSupportModal] = useState(false);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const [showApprovalModal, setShowApprovalModal] = useState(false);
  const [supportEmail, setSupportEmail] = useState('');
  const [supportMessage, setSupportMessage] = useState('');
  const [showDeviceInfoModal, setShowDeviceInfoModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>(''); // Backend error message
  const [quizMode, setQuizMode] = useState(false);
  const [quizLevel, setQuizLevel] = useState<string | null>(null);
  const [quizQuestionCount, setQuizQuestionCount] = useState(0);
  const [roleplayMode, setRoleplayMode] = useState(false);
  const [roleplayScenario, setRoleplayScenario] = useState<string | null>(null);
  const [showDropup, setShowDropup] = useState(false);
  const [messageContextMenu, setMessageContextMenu] = useState<string | null>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [conversationModeType, setConversationModeType] = useState<string | null>(null); // conversation|teacher|beginner|casual_friend|strict|roleplay|business
  const [showSettingsModal, setShowSettingsModal] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
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
  const drawerAnim = useRef(new Animated.Value(-280)).current;
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const micPulseAnim = useRef(new Animated.Value(1)).current;
  /** Always-current screen language for voice/API closures (avoids stale 'en' after mount). */
  const selectedLanguageRef = useRef(selectedLanguage);
  const conversationModeRef = useRef(conversationModeType);
  const startVoiceConversationRef = useRef<(isRetry?: boolean, priority?: 'normal' | 'fast') => void>(() => {});

  // Removed verbose state logging - only log on specific actions

  // Sync voiceState / language / mode refs for long-lived listeners
  useEffect(() => {
    voiceStateRef.current = voiceState;
    if (__DEV__) {
      console.log('[Voice] State changed:', voiceState);
      console.log('[UI] Stop button should be visible:', voiceState !== 'idle');
    }
  }, [voiceState]);

  useEffect(() => {
    selectedLanguageRef.current = selectedLanguage;
  }, [selectedLanguage]);

  useEffect(() => {
    conversationModeRef.current = conversationModeType;
  }, [conversationModeType]);

  // Keyboard event listeners
  useEffect(() => {
    const keyboardWillShow = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      (e) => {
        setKeyboardHeight(e.endCoordinates.height);
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 100);
      }
    );
    
    const keyboardWillHide = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide',
      () => {
        setKeyboardHeight(0);
      }
    );
    
    return () => {
      keyboardWillShow.remove();
      keyboardWillHide.remove();
    };
  }, []);

  // Auto-register on app start (theme/language/notifications via hooks)
  useEffect(() => {
    const autoRegister = async () => {
      try {
        // Initialize API first
        await initializeApi();
        
        // Check if already registered
        const registration = await checkRegistration();
        if (registration) {
          console.log('[Registration] Already registered');
          return;
        }
        
        // Auto-register without email/voucher (free tier)
        console.log('[Registration] Auto-registering device...');
        const success = await registerUser();
        
        if (success) {
          // Save registration locally
          await saveRegistration('');
          console.log('[Registration] Auto-registration successful');
        } else {
          console.error('[Registration] Auto-registration failed');
        }
      } catch (error) {
        console.error('[Registration] Auto-registration error:', error);
      }
    };
    
    autoRegister();
  }, []);

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
          
          reply = await sendChatMessage(scenarioRoles[userInput], 'roleplay', selectedLanguageRef.current);
        } else {
          reply = 'Please type a number between 1-5 to select a roleplay scenario.';
        }
      } else if (roleplayMode && roleplayScenario) {
        // Roleplay in progress
        reply = await sendChatMessage(userInput, 'roleplay', selectedLanguageRef.current);
      } else if (quizMode && !quizLevel) {
        // Quiz level selection
        if (userInput === '1' || userInput.toLowerCase().includes('beginner')) {
          setQuizLevel('beginner');
          reply = await sendChatMessage('I want to take an English quiz at beginner level. Please give me 5 simple questions about basic English vocabulary and grammar. Number them 1-5.', conversationModeRef.current || undefined, selectedLanguageRef.current);
        } else if (userInput === '2' || userInput.toLowerCase().includes('intermediate')) {
          setQuizLevel('intermediate');
          reply = await sendChatMessage('I want to take an English quiz at intermediate level. Please give me 5 questions about English grammar, vocabulary and comprehension. Number them 1-5.', conversationModeRef.current || undefined, selectedLanguageRef.current);
        } else if (userInput === '3' || userInput.toLowerCase().includes('advanced')) {
          setQuizLevel('advanced');
          reply = await sendChatMessage('I want to take an English quiz at advanced level. Please give me 5 challenging questions about advanced English, idioms, and complex grammar. Number them 1-5.', conversationModeRef.current || undefined, selectedLanguageRef.current);
        } else {
          reply = 'Please type 1 for Beginner, 2 for Intermediate, or 3 for Advanced.';
        }
      } else if (quizMode && quizLevel) {
        // Quiz in progress
        setQuizQuestionCount(prev => prev + 1);
        reply = await sendChatMessage(userInput, conversationModeRef.current || undefined, selectedLanguageRef.current);
        
        if (quizQuestionCount >= 4) {
          // Quiz finished after 5 questions
          setQuizMode(false);
          setQuizLevel(null);
          setQuizQuestionCount(0);
        }
      } else {
        // Normal chat mode with conversation mode type
        reply = await sendChatMessage(userInput, conversationModeRef.current || undefined, selectedLanguageRef.current);
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
    } catch (e: any) {
      if (__DEV__) {
        console.log('[Send] ⚠️ Request error:', (e as Error).message || e);
      }
      setErrorMessage(getErrorDisplayMessage(e, getTranslation));
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
    
    try {
      const reply = await sendChatMessage(
        voiceText.trim(),
        conversationModeRef.current || undefined,
        selectedLanguageRef.current
      );
      
      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: reply,
      };
      
      setMessages(prev => [...prev, assistantMsg]);
      setTypingMessageId(assistantMsg.id);
      
      // Speak ASAP — no artificial lead-in (conversation turn-taking)
      const processedText = preprocessTextForTTS(reply);
      console.log('[TTS] 🔊 Speaking reply');
      Tts.speak(processedText);
      
    } catch (e: any) {
      if (__DEV__) {
        console.log('[Send] ⚠️ Request error:', (e as Error).message || e);
      }
      setErrorMessage(getErrorDisplayMessage(e, getTranslation));
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
    setMessages([]);
    setInput('');
    stopVoiceConversation();
  };

  // Scroll to bottom
  const scrollToBottom = () => {
    triggerHaptic('light');
    flatListRef.current?.scrollToEnd({ animated: true });
  };

  // Drawer functions (Open/Closed Principle - easy to extend)
  const toggleDrawer = () => {
    triggerHaptic('light'); // Haptic feedback on drawer toggle
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

  const openFaqModal = () => {
    closeDrawer();
    setTimeout(() => setShowFaqModal(true), 300);
  };

  const openSupportModal = () => {
    closeDrawer();
    setTimeout(() => setShowSupportModal(true), 300);
  };

  const openLanguageModal = () => {
    closeDrawer();
    setTimeout(() => setShowLanguageModal(true), 300);
  };

  const openDeviceInfoModal = () => {
    closeDrawer();
    setTimeout(() => setShowDeviceInfoModal(true), 300);
  };

  const selectLanguage = async (lang: 'en' | 'tr' | 'ar' | 'ru') => {
    await persistLanguage(lang);
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

  const getTranslation = (key: string) => translate(key as TranslationKey, selectedLanguage);

  // ========================================
  // VOICE CONVERSATION SYSTEM - ChatGPT Style
  // ========================================
  
  // State machine: idle → listening → processing → speaking → listening (loop)
  // Single button: Tap to start/stop entire conversation
  
  const startVoiceConversation = (
    isRetry = false,
    priority: 'normal' | 'fast' = 'normal'
  ) => {
    if (__DEV__) console.log('[Voice] 🎙️ Starting conversation mode, isRetry:', isRetry, 'priority:', priority);
    console.log('[Voice] 📍 Before setVoiceState - current:', voiceState);
    setVoiceState('listening');
    voiceStateRef.current = 'listening';
    console.log('[Voice] 📍 After setVoiceState - should be listening');
    
    // Only reset flags / transcript on fresh start, not on retry
    if (!isRetry) {
      userStoppedVoice.current = false;
      voiceRetryCount.current = 0;
      currentVoiceText.current = '';
      setLiveTranscript('');
    }
    
    console.log('[Voice] 📍 About to call startListening from speech.ts');
    
    let hasReceivedText = currentVoiceText.current.trim().length > 0;
    let hasFinalized = false;

    const finalizeAndSend = (source: string) => {
      const text = currentVoiceText.current.trim();
      if (hasFinalized) return;
      if (!text || voiceStateRef.current !== 'listening') return;

      hasFinalized = true;
      if (silenceTimer.current) {
        clearTimeout(silenceTimer.current);
        silenceTimer.current = null;
      }
      if (__DEV__) console.log('[Voice] ✅ Finalizing speech via', source, ':', text);
      stopListening();
      setLiveTranscript('');
      setVoiceState('processing');
      voiceStateRef.current = 'processing';
      currentVoiceText.current = '';
      sendVoiceMessage(text);
    };
    
    const resetTimer = () => {
      if (silenceTimer.current) {
        clearTimeout(silenceTimer.current);
      }
      
      const timeout = hasReceivedText
        ? LISTENING_POLICY.silenceAfterSpeechMs
        : LISTENING_POLICY.warmUpSilenceMs;
      
      silenceTimer.current = setTimeout(() => {
        const text = currentVoiceText.current.trim();
        
        if (text.length > 0 && voiceStateRef.current === 'listening') {
          finalizeAndSend('silence');
        } else {
          if (__DEV__) console.log('[Voice] ⏸️ Silence but no text, restarting...');
          if (voiceStateRef.current === 'listening' && !userStoppedVoice.current) {
            stopListening();
            setTimeout(() => {
              if (voiceStateRef.current === 'listening' && !userStoppedVoice.current) {
                startVoiceConversation(true, 'fast');
              }
            }, LISTENING_POLICY.emptyRestartDelayMs);
          }
        }
      }, timeout);
    };
    
    startListening(
      (text) => {
        const merged = mergeTranscript(currentVoiceText.current, text);
        console.log('[Voice] 📥 Got text:', merged.substring(0, 50));
        currentVoiceText.current = merged;
        setLiveTranscript(merged);
        
        if (!hasReceivedText && merged.length > 0) {
          hasReceivedText = true;
          console.log('[Voice] 🎬 First text received - user is speaking');
        }
        
        resetTimer();
      },
      () => {
        console.log('[Voice] ❌ Speech recognition error occurred');
        console.log('[Voice] 📊 Voice state:', voiceStateRef.current);
        console.log('[Voice] 📊 Retry count:', voiceRetryCount.current);
        
        if (silenceTimer.current) {
          clearTimeout(silenceTimer.current);
          silenceTimer.current = null;
        }
        
        voiceRetryCount.current++;
        if (voiceRetryCount.current >= 3) {
          console.log('[Voice] 🛑 Max retries reached (3), stopping voice mode');
          stopVoiceConversation();
          return;
        }
        
        setTimeout(() => {
          if (voiceStateRef.current === 'listening' && !userStoppedVoice.current) {
            console.log('[Voice] 🔄 Retrying after error... (attempt', voiceRetryCount.current, '/3)');
            startVoiceConversation(true, 'normal');
          } else {
            console.log('[Voice] 🛑 Not retrying - user stopped or state changed');
          }
        }, LISTENING_POLICY.errorRetryDelayMs);
      },
      () => {
        // Native speech ended — grace already applied in speech.ts
        finalizeAndSend('onEnd');
      },
      getSpeechLocale(selectedLanguageRef.current),
      { priority }
    );
    
    console.log('[Voice] 🔄 Reset timer initialized; locale:', getSpeechLocale(selectedLanguageRef.current));
    resetTimer();
  };

  startVoiceConversationRef.current = startVoiceConversation;
  
  const stopVoiceConversation = () => {
    console.log('[Voice] 🛑 Stopping conversation mode');
    
    userStoppedVoice.current = true;
    
    if (silenceTimer.current) {
      clearTimeout(silenceTimer.current);
      silenceTimer.current = null;
    }
    
    stopListening();
    Tts.stop();
    currentVoiceText.current = '';
    setLiveTranscript('');
    setVoiceState('idle');
    voiceStateRef.current = 'idle';
    
    console.log('[Voice] ✅ Voice conversation stopped, state set to idle');
  };
  
  const handleMicButton = () => {
    triggerHaptic('light');
    
    console.log('[Mic] 🔘 Button pressed, current state:', voiceState);
    console.log('[Mic] 🔘 Ref state:', voiceStateRef.current);
    console.log('[Mic] 🔘 User stopped flag:', userStoppedVoice.current);
    
    if (voiceStateRef.current === 'idle') {
      // Start conversation
      console.log('[Mic] ▶️ Starting voice conversation');
      console.log('[Mic] 🎤 Calling startVoiceConversation...');
      startVoiceConversation();
    } else {
      // Stop conversation (any state: listening, processing, or speaking)
      console.log('[Mic] ⏹️ Stopping voice conversation from state:', voiceStateRef.current);
      stopVoiceConversation();
    }
  };

  // Initialize Voice Recognition on mount (Android needs explicit initialization)
  useEffect(() => {
    const initVoice = async () => {
      try {
        console.log('[Voice] 🎤 Initializing voice recognition...');
        const { initializeVoice } = await import('./speech');
        const initialized = await initializeVoice();
        if (initialized) {
          console.log('[Voice] ✅ Voice recognition initialized successfully');
        } else {
          console.log('[Voice] ⚠️ Voice initialization failed - permissions may be denied');
        }
      } catch (error) {
        console.error('[Voice] ❌ Voice initialization error:', error);
      }
    };
    initVoice();
  }, []);

  // Keep TTS locale aligned with screen language (no event rebind cost)
  useEffect(() => {
    console.log('[TTS] 🔧 Configuring TTS for language:', selectedLanguage);
    configureTtsEngine(selectedLanguage).catch((error) => {
      console.error('[TTS] ❌ configureTtsEngine failed:', error);
    });
  }, [selectedLanguage]);

  // TTS Events - Integrated with voice conversation
  // Listeners registered once; always call latest startVoiceConversation via ref
  // so screen-language changes (TR/AR/RU) apply on every turn.
  useEffect(() => {
    Tts.addEventListener('tts-start', () => {
      console.log('[TTS] 🔊 Started speaking');
      setVoiceState('speaking');
      voiceStateRef.current = 'speaking';
      // Warm STT while AI talks so mic opens instantly on finish
      primeVoiceSession().catch(() => {});
    });
    
    Tts.addEventListener('tts-finish', () => {
      console.log('[TTS] ✅ Finished speaking');
      
      if (voiceStateRef.current === 'speaking' && !userStoppedVoice.current) {
        console.log('[Voice] 🔄 TTS finished — fast mic handoff');
        setTimeout(() => {
          if (voiceStateRef.current === 'speaking' && !userStoppedVoice.current) {
            // fast: skip availability/prepare lag so first words are not lost
            startVoiceConversationRef.current(false, 'fast');
          }
        }, LISTENING_POLICY.postTtsHandoffMs);
      } else {
        console.log('[Voice] 🛑 Not restarting - user stopped or state changed');
      }
    });
    
    Tts.addEventListener('tts-cancel', () => {
      console.log('[TTS] ⛔ Cancelled');
    });

    return () => {
      Tts.removeAllListeners('tts-start');
      Tts.removeAllListeners('tts-finish');
      Tts.removeAllListeners('tts-cancel');
    };
  }, []);

  // Cleanup voice silence timer
  useEffect(() => {
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

  const renderSkeletonLoader = () => {
    const shimmerTranslate = shimmerAnim.interpolate({
      inputRange: [0, 1],
      outputRange: [-200, 200],
    });

    return (
      <View style={[
        styles.assistantFlat,
        styles.skeletonFlat,
        isTablet && { maxWidth: 640, alignSelf: 'flex-start' },
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
          isUser
            ? [
                styles.bubble,
                theme === 'dark' ? styles.userBubble : styles.userBubbleLight,
                isTablet && { maxWidth: 600, alignSelf: 'flex-end' as const },
              ]
            : [
                styles.assistantFlat,
                theme === 'light' && styles.assistantFlatLight,
                isTablet && { maxWidth: 640, alignSelf: 'flex-start' as const },
              ],
          showMenu && styles.bubbleHighlight,
        ]}>
          <Text style={[
            styles.messageText,
            isUser && (theme === 'dark' ? styles.userMessageText : styles.userMessageTextLight),
            !isUser && styles.assistantFlatText,
            !isUser && theme === 'light' && styles.assistantFlatTextLight,
          ]}>{textToShow}</Text>
          {showMenu && (
            <View style={[styles.contextMenu, isUser ? styles.contextMenuUser : styles.contextMenuAssistant]}>
              <TouchableOpacity 
                style={styles.contextMenuItem}
                onPress={() => {
                  triggerHaptic('light');
                  Tts.speak(preprocessTextForTTS(item.content));
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
      <ChatModals
        theme={theme}
        selectedLanguage={selectedLanguage}
        t={getTranslation}
        notificationsEnabled={notificationsEnabled}
        onToggleNotifications={toggleNotifications}
        onToggleTheme={toggleTheme}
        onSelectLanguage={selectLanguage}
        showAbout={showAboutModal}
        onCloseAbout={() => setShowAboutModal(false)}
        showSettings={showSettingsModal}
        onCloseSettings={() => setShowSettingsModal(false)}
        onOpenLanguageFromSettings={() => {
          setShowSettingsModal(false);
          setShowLanguageModal(true);
        }}
        showLanguage={showLanguageModal}
        onCloseLanguage={() => setShowLanguageModal(false)}
        showApproval={showApprovalModal}
        onCloseApproval={() => {
          setShowApprovalModal(false);
          setErrorMessage('');
        }}
        errorMessage={errorMessage}
        showFaq={showFaqModal}
        onCloseFaq={() => setShowFaqModal(false)}
        showSupport={showSupportModal}
        onCloseSupport={() => {
          setShowSupportModal(false);
          setSupportEmail('');
          setSupportMessage('');
        }}
        showDeviceInfo={showDeviceInfoModal}
        onCloseDeviceInfo={() => setShowDeviceInfoModal(false)}
        supportEmail={supportEmail}
        setSupportEmail={setSupportEmail}
        supportMessage={supportMessage}
        setSupportMessage={setSupportMessage}
      />

      <SideDrawer
        theme={theme}
        language={selectedLanguage}
        isTablet={isTablet}
        drawerAnim={drawerAnim}
        drawerOpen={drawerOpen}
        t={getTranslation}
        onClose={closeDrawer}
        onOpenSettings={() => {
          setShowSettingsModal(true);
          toggleDrawer();
        }}
        onOpenAbout={openAboutModal}
        onOpenFaq={openFaqModal}
        onOpenSupport={openSupportModal}
        onOpenLanguage={openLanguageModal}
        onToggleTheme={toggleTheme}
        onOpenDeviceInfo={openDeviceInfoModal}
        onOpenFlashCards={() => {
          toggleDrawer();
          // @ts-ignore
          navigation.navigate('LevelSelection');
        }}
        onOpenDeleteAccount={() => {
          closeDrawer();
          setTimeout(() => { (navigation as any).navigate('AccountDeletion'); }, 300);
        }}
      />

      {/* Header */}
      <View style={[styles.header, theme === 'light' && styles.headerLight]}>
        <TouchableOpacity 
          onPress={toggleDrawer}
          activeOpacity={0.7}
        >
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
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: keyboardHeight > 0 ? keyboardHeight - 50 : 160 }
          ]}
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

      {/* Scroll to bottom — icon only */}
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
                    outputRange: [12, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <TouchableOpacity
            style={styles.scrollButton}
            onPress={scrollToBottom}
            activeOpacity={0.6}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
            accessibilityLabel="Scroll to latest message"
          >
            <Ionicons
              name="chevron-down"
              size={18}
              color={theme === 'dark' ? 'rgba(255,255,255,0.72)' : 'rgba(26,26,31,0.55)'}
            />
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* Composer */}
      <KeyboardAvoidingView
        behavior="padding"
        keyboardVerticalOffset={0}
        style={styles.composerKeyboard}
      >
        <View style={styles.composerContainer}>
          <ModeDropup
            visible={showDropup}
            theme={theme}
            language={selectedLanguage}
            conversationModeType={conversationModeType}
            t={getTranslation}
            onClose={() => setShowDropup(false)}
            onSelectMode={(mode) => setConversationModeType(mode)}
            onStartQuiz={startEnglishQuiz}
            setMessages={setMessages}
            setTypingMessageId={setTypingMessageId}
            setIsLoadingResponse={setIsLoadingResponse}
            setRoleplayMode={setRoleplayMode}
            setRoleplayScenario={setRoleplayScenario}
          />

          <View style={[styles.composerInner, { paddingBottom: Math.max(insets.bottom, 12) }]}>
            <ComposerBar
              theme={theme}
              input={input}
              onChangeText={setInput}
              onSend={handleSend}
              onClear={clearAll}
              onMicPress={handleMicButton}
              onStopVoice={stopVoiceConversation}
              onOpenModes={() => setShowDropup(true)}
              onInputFocus={() => {
                flatListRef.current?.scrollToEnd({ animated: true });
                setTimeout(() => {
                  flatListRef.current?.scrollToEnd({ animated: true });
                }, 300);
              }}
              voiceState={voiceState}
              liveTranscript={liveTranscript}
              messageCount={messages.length}
              inputRef={inputRef}
              micPulseAnim={micPulseAnim}
              placeholder={getTranslation('askKspeaker')}
              listeningLabel={getTranslation('listening')}
              processingLabel={getTranslation('processing')}
              speakingLabel={getTranslation('speaking')}
            />
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
    right: 18,
    bottom: 156, // Slightly above composer
    zIndex: 100,
  },
  scrollButton: {
    width: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'transparent',
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
  /** Kspeaker replies: flat text on chat background — no bubble chrome */
  assistantFlat: {
    alignSelf: 'stretch',
    maxWidth: '100%',
    paddingHorizontal: 4,
    paddingVertical: 8,
    marginBottom: 16,
    backgroundColor: 'transparent',
  },
  assistantFlatLight: {
    backgroundColor: 'transparent',
  },
  assistantFlatText: {
    color: 'rgba(255, 255, 255, 0.92)',
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '400',
  },
  assistantFlatTextLight: {
    color: '#1F2937',
  },
  bubbleHighlight: {
    transform: [{ scale: 1.01 }],
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
  userMessageTextLight: {
    color: '#FFFFFF',
  },
  messageText: {
    fontSize: 15,
    color: '#FFFFFF',
    lineHeight: 21,
  },
  userMessageText: {
    color: '#FFFFFF',
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
  emptyTextLight: {
    color: 'rgba(31, 41, 55, 0.7)',
  },
  emptySubtextLight: {
    color: 'rgba(31, 41, 55, 0.5)',
  },
  composerKeyboard: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'transparent',
  },
  composerContainer: {
    width: '100%',
    maxWidth: Dimensions.get('window').width >= 768 ? 800 : '100%',
    alignSelf: 'center',
    backgroundColor: 'transparent',
  },
  composerInner: {
    paddingHorizontal: 16,
    paddingTop: 8,
    backgroundColor: 'transparent',
  },
  skeletonFlat: {
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
});

export default ChatScreen;
