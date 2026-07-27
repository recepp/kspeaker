import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Modal, Pressable } from 'react-native';
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

export function ModeDropup({
  visible,
  theme,
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
  const isDark = theme === 'dark';

  const closeAll = () => {
    setShowModeSelector(false);
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
          'roleplay'
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

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={closeAll}>
      <Pressable style={dropupStyles.dropupBackdrop} onPress={closeAll}>
        <Pressable style={dropupStyles.dropupMenuContainer} onPress={(e) => e.stopPropagation()}>
          <View style={[dropupStyles.dropupMenu, !isDark && dropupStyles.dropupMenuLight]}>
            <TouchableOpacity
              style={dropupStyles.dropupCloseButton}
              onPress={() => {
                closeAll();
                triggerHaptic('light');
              }}
            >
              <Ionicons name="close" size={20} color="#EF4444" />
            </TouchableOpacity>

            {showModeSelector ? (
              <>
                <TouchableOpacity
                  style={dropupStyles.dropupItem}
                  onPress={() => {
                    setShowModeSelector(false);
                    triggerHaptic('light');
                  }}
                >
                  <Ionicons
                    name="arrow-back"
                    size={20}
                    color={isDark ? '#ECECEC' : '#1A1A1F'}
                  />
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
                        conversationModeType === mode ? 'checkmark-circle' : 'radio-button-off'
                      }
                      size={20}
                      color={
                        conversationModeType === mode
                          ? '#10B981'
                          : isDark
                            ? '#ECECEC'
                            : '#1A1A1F'
                      }
                    />
                    <Text
                      style={[
                        dropupStyles.dropupItemText,
                        !isDark && dropupStyles.dropupItemTextLight,
                        conversationModeType === mode && dropupStyles.dropupItemTextActive,
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
                    conversationModeType && dropupStyles.dropupItemActive,
                  ]}
                  onPress={() => {
                    setShowModeSelector(true);
                    triggerHaptic('light');
                  }}
                >
                  <Ionicons
                    name={conversationModeType ? 'settings' : 'settings-outline'}
                    size={20}
                    color={
                      conversationModeType ? '#10B981' : isDark ? '#ECECEC' : '#1A1A1F'
                    }
                  />
                  <Text
                    style={[
                      dropupStyles.dropupItemText,
                      !isDark && dropupStyles.dropupItemTextLight,
                      conversationModeType && dropupStyles.dropupItemTextActive,
                    ]}
                  >
                    {t('mode')}
                  </Text>
                  {conversationModeType && (
                    <Text style={dropupStyles.dropupItemBadge}>{t(conversationModeType)}</Text>
                  )}
                </TouchableOpacity>

                <TouchableOpacity
                  style={dropupStyles.dropupItem}
                  onPress={() => {
                    closeAll();
                    onStartQuiz();
                  }}
                >
                  <Ionicons
                    name="trophy"
                    size={20}
                    color={isDark ? '#ECECEC' : '#1A1A1F'}
                  />
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
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
