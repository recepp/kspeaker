import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Modal,
  Pressable,
  Animated,
  Platform,
  StyleSheet,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { BlurView } from '@react-native-community/blur';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { sendChatMessage } from '../../../../api';
import { triggerHaptic } from '../../../platform/haptic';
import { preprocessTextForTTS } from '../../../platform/ttsText';
import Tts from 'react-native-tts';
import type { ChatMessage, Theme } from '../types';
import { CONVERSATION_MODES, type ConversationMode } from '../constants';
import { dropupStyles } from './dropupStyles';

export interface ModeDropupProps {
  visible: boolean;
  theme: Theme;
  language: string;
  conversationModeType: string | null;
  t: (key: string) => string;
  onClose: () => void;
  onSelectMode: (mode: ConversationMode | null) => void;
  onStartQuiz: () => void;
  setMessages: React.Dispatch<React.SetStateAction<ChatMessage[]>>;
  setTypingMessageId: (id: string | null) => void;
  setIsLoadingResponse: (loading: boolean) => void;
  setRoleplayMode: (enabled: boolean) => void;
  setRoleplayScenario: (scenario: string | null) => void;
}

/**
 * Liquid-glass mode menu with soft spring open/close motion.
 */
export function ModeDropup({
  visible,
  theme,
  language,
  conversationModeType,
  t,
  onClose,
  onSelectMode,
  onStartQuiz,
  setMessages,
  setTypingMessageId,
  setIsLoadingResponse,
  setRoleplayMode,
  setRoleplayScenario,
}: ModeDropupProps) {
  const [showModeSelector, setShowModeSelector] = useState(false);
  const [mounted, setMounted] = useState(visible);
  const isDark = theme === 'dark';
  const progress = useRef(new Animated.Value(visible ? 1 : 0)).current;
  const contentFade = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (visible) {
      setMounted(true);
    }
  }, [visible]);

  useEffect(() => {
    if (!mounted) return;

    if (visible) {
      progress.setValue(0);
      Animated.spring(progress, {
        toValue: 1,
        useNativeDriver: true,
        friction: 9,
        tension: 68,
      }).start();
      return;
    }

    Animated.timing(progress, {
      toValue: 0,
      duration: 220,
      useNativeDriver: true,
    }).start(({ finished }) => {
      if (finished) {
        setMounted(false);
        setShowModeSelector(false);
      }
    });
  }, [visible, mounted, progress]);

  const swapContent = (next: boolean) => {
    Animated.sequence([
      Animated.timing(contentFade, {
        toValue: 0,
        duration: 120,
        useNativeDriver: true,
      }),
      Animated.timing(contentFade, {
        toValue: 1,
        duration: 180,
        useNativeDriver: true,
      }),
    ]).start();
    // Swap mid-fade
    setTimeout(() => setShowModeSelector(next), 120);
  };

  const closeAll = () => {
    onClose();
  };

  const handleModeSelect = async (mode: ConversationMode) => {
    onSelectMode(mode);
    closeAll();
    triggerHaptic('medium');

    if (mode === 'roleplay') {
      try {
        setIsLoadingResponse(true);
        setRoleplayMode(true);
        setRoleplayScenario(null);
        const roleplayIntro = await sendChatMessage(
          'Present 5 roleplay scenarios for English practice. Format each as: number, emoji, title, short description. Ask user to type a number 1-5 to choose.',
          'roleplay',
          language
        );

        const assistantMsg: ChatMessage = {
          id: Date.now().toString(),
          role: 'assistant',
          content: roleplayIntro,
        };
        setMessages((prev) => [...prev, assistantMsg]);
        setTypingMessageId(assistantMsg.id);
        Tts.speak(preprocessTextForTTS(roleplayIntro));
      } catch (error) {
        console.log('[Roleplay] Error loading intro:', error);
        setRoleplayMode(false);
      } finally {
        setIsLoadingResponse(false);
      }
    } else {
      setRoleplayMode(false);
      setRoleplayScenario(null);
    }
  };

  const blurType =
    Platform.OS === 'ios'
      ? isDark
        ? 'ultraThinMaterialDark'
        : 'ultraThinMaterialLight'
      : isDark
        ? 'dark'
        : 'light';

  const iconColor = isDark ? '#ECECEC' : '#1A1A1F';

  const backdropOpacity = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  const menuTranslateY = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [28, 0],
  });

  const menuScale = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.94, 1],
  });

  const menuOpacity = progress.interpolate({
    inputRange: [0, 0.4, 1],
    outputRange: [0, 0.85, 1],
  });

  if (!mounted) return null;

  return (
    <Modal visible={mounted} transparent animationType="none" onRequestClose={closeAll}>
      <View style={dropupStyles.dropupRoot} pointerEvents="box-none">
        <Pressable style={StyleSheet.absoluteFill} onPress={closeAll}>
          <Animated.View
            style={[
              dropupStyles.dropupBackdrop,
              { opacity: backdropOpacity },
            ]}
          />
        </Pressable>

        <Animated.View
          style={[
            dropupStyles.dropupMenuContainer,
            {
              opacity: menuOpacity,
              transform: [{ translateY: menuTranslateY }, { scale: menuScale }],
            },
          ]}
          pointerEvents="box-none"
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View style={dropupStyles.glassShell}>
              <BlurView
                style={StyleSheet.absoluteFill}
                blurType={blurType}
                blurAmount={Platform.OS === 'android' ? 26 : 36}
                reducedTransparencyFallbackColor={
                  isDark ? 'rgba(20, 22, 28, 0.78)' : 'rgba(255, 255, 255, 0.78)'
                }
              />
              <View
                pointerEvents="none"
                style={[
                  StyleSheet.absoluteFill,
                  {
                    backgroundColor: isDark
                      ? 'rgba(255,255,255,0.06)'
                      : 'rgba(255,255,255,0.22)',
                  },
                ]}
              />
              <LinearGradient
                pointerEvents="none"
                colors={
                  isDark
                    ? ['rgba(255,255,255,0.2)', 'rgba(255,255,255,0.04)', 'rgba(0,0,0,0.14)']
                    : ['rgba(255,255,255,0.55)', 'rgba(255,255,255,0.18)', 'rgba(0,0,0,0.04)']
                }
                locations={[0, 0.42, 1]}
                style={StyleSheet.absoluteFill}
              />
              <LinearGradient
                pointerEvents="none"
                colors={['rgba(255,255,255,0.35)', 'rgba(255,255,255,0.06)', 'transparent']}
                locations={[0, 0.4, 1]}
                start={{ x: 0.15, y: 0 }}
                end={{ x: 0.85, y: 0.7 }}
                style={dropupStyles.glassSpecular}
              />
              <View
                pointerEvents="none"
                style={[
                  dropupStyles.bevelLight,
                  {
                    borderColor: isDark
                      ? 'rgba(255,255,255,0.42)'
                      : 'rgba(255,255,255,0.9)',
                  },
                ]}
              />
              <View
                pointerEvents="none"
                style={[
                  dropupStyles.bevelDark,
                  {
                    borderColor: isDark
                      ? 'rgba(0,0,0,0.28)'
                      : 'rgba(0,0,0,0.08)',
                  },
                ]}
              />
              <View
                pointerEvents="none"
                style={[
                  dropupStyles.glassRim,
                  {
                    borderColor: isDark
                      ? 'rgba(255,255,255,0.32)'
                      : 'rgba(255,255,255,0.75)',
                  },
                ]}
              />

              <TouchableOpacity
                style={dropupStyles.dropupCloseButton}
                onPress={() => {
                  closeAll();
                  triggerHaptic('light');
                }}
              >
                <Ionicons name="close" size={20} color="#EF4444" />
              </TouchableOpacity>

              <Animated.View style={{ opacity: contentFade }}>
                {showModeSelector ? (
                  <>
                    <TouchableOpacity
                      style={dropupStyles.dropupItem}
                      onPress={() => {
                        swapContent(false);
                        triggerHaptic('light');
                      }}
                    >
                      <Ionicons name="arrow-back" size={20} color={iconColor} />
                      <Text
                        style={[
                          dropupStyles.dropupItemText,
                          !isDark && dropupStyles.dropupItemTextLight,
                        ]}
                      >
                        Back
                      </Text>
                    </TouchableOpacity>

                    {CONVERSATION_MODES.map((mode) => (
                      <TouchableOpacity
                        key={mode}
                        style={[
                          dropupStyles.dropupItem,
                          conversationModeType === mode && dropupStyles.dropupItemActive,
                        ]}
                        onPress={() => handleModeSelect(mode)}
                      >
                        <Ionicons
                          name={
                            conversationModeType === mode
                              ? 'checkmark-circle'
                              : 'radio-button-off'
                          }
                          size={20}
                          color={
                            conversationModeType === mode ? '#10B981' : iconColor
                          }
                        />
                        <Text
                          style={[
                            dropupStyles.dropupItemText,
                            !isDark && dropupStyles.dropupItemTextLight,
                            conversationModeType === mode &&
                              dropupStyles.dropupItemTextActive,
                          ]}
                        >
                          {t(mode)}
                        </Text>
                      </TouchableOpacity>
                    ))}

                    {conversationModeType && (
                      <TouchableOpacity
                        style={[
                          dropupStyles.dropupItem,
                          { backgroundColor: 'rgba(239, 68, 68, 0.1)' },
                        ]}
                        onPress={() => {
                          onSelectMode(null);
                          triggerHaptic('medium');
                        }}
                      >
                        <Ionicons name="close-circle" size={20} color="#EF4444" />
                        <Text style={[dropupStyles.dropupItemText, { color: '#EF4444' }]}>
                          {t('clearMode')}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </>
                ) : (
                  <>
                    <TouchableOpacity
                      style={[
                        dropupStyles.dropupItem,
                        conversationModeType ? dropupStyles.dropupItemActive : null,
                      ]}
                      onPress={() => {
                        swapContent(true);
                        triggerHaptic('light');
                      }}
                    >
                      <Ionicons
                        name={conversationModeType ? 'settings' : 'settings-outline'}
                        size={20}
                        color={conversationModeType ? '#10B981' : iconColor}
                      />
                      <Text
                        style={[
                          dropupStyles.dropupItemText,
                          !isDark && dropupStyles.dropupItemTextLight,
                          conversationModeType
                            ? dropupStyles.dropupItemTextActive
                            : null,
                        ]}
                      >
                        {t('mode')}
                      </Text>
                      {conversationModeType && (
                        <Text style={dropupStyles.dropupItemBadge}>
                          {t(conversationModeType)}
                        </Text>
                      )}
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={dropupStyles.dropupItem}
                      onPress={() => {
                        closeAll();
                        onStartQuiz();
                      }}
                    >
                      <Ionicons name="trophy" size={20} color={iconColor} />
                      <Text
                        style={[
                          dropupStyles.dropupItemText,
                          !isDark && dropupStyles.dropupItemTextLight,
                        ]}
                      >
                        {t('englishQuiz')}
                      </Text>
                    </TouchableOpacity>
                  </>
                )}
              </Animated.View>
            </View>
          </Pressable>
        </Animated.View>
      </View>
    </Modal>
  );
}
