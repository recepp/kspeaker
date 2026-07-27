import React, { RefObject } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import { BlurView } from '@react-native-community/blur';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { triggerHaptic } from '../../../platform/haptic';
import type { Theme, VoiceState } from '../types';

export interface ComposerBarProps {
  theme: Theme;
  input: string;
  onChangeText: (text: string) => void;
  onSend: () => void;
  onClear: () => void;
  onMicPress: () => void;
  onStopVoice: () => void;
  onOpenModes: () => void;
  onInputFocus: () => void;
  voiceState: VoiceState;
  messageCount: number;
  inputRef: RefObject<TextInput | null>;
  micPulseAnim: Animated.Value;
  placeholder: string;
  listeningLabel: string;
  processingLabel: string;
  speakingLabel: string;
}

/**
 * Shared chat composer — iOS visual parity on Android (BlurView + voice indicator).
 */
export function ComposerBar({
  theme,
  input,
  onChangeText,
  onSend,
  onClear,
  onMicPress,
  onStopVoice,
  onOpenModes,
  onInputFocus,
  voiceState,
  messageCount,
  inputRef,
  micPulseAnim,
  placeholder,
  listeningLabel,
  processingLabel,
  speakingLabel,
}: ComposerBarProps) {
  const isDark = theme === 'dark';
  const hasInput = !!input.trim();

  const voiceStatusLabel =
    voiceState === 'listening'
      ? listeningLabel
      : voiceState === 'processing'
        ? processingLabel
        : speakingLabel;

  const voiceHint =
    voiceState === 'listening'
      ? 'Speak now or tap to stop'
      : voiceState === 'processing'
        ? 'Getting response...'
        : 'AI is responding';

  const micIconColor =
    voiceState === 'listening'
      ? '#10B981'
      : voiceState === 'processing'
        ? '#F59E0B'
        : voiceState === 'speaking'
          ? '#3B82F6'
          : isDark
            ? '#7DD3C0'
            : '#4A6FA5';

  const micIconName =
    voiceState === 'idle'
      ? 'mic-outline'
      : voiceState === 'listening'
        ? 'mic'
        : voiceState === 'processing'
          ? 'cloud-upload'
          : 'volume-high';

  const content = (
    <>
      <View style={[styles.inputRow, !isDark && styles.inputRowLight]}>
        <TouchableOpacity
          style={styles.plusButton}
          onPress={() => {
            triggerHaptic('light');
            onOpenModes();
          }}
        >
          <Ionicons name="add-circle" size={28} color="#4A6FA5" />
        </TouchableOpacity>

        <TextInput
          ref={inputRef}
          style={[styles.input, !isDark && styles.inputLight]}
          value={input}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={
            isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)'
          }
          onSubmitEditing={onSend}
          returnKeyType="send"
          multiline
          onFocus={onInputFocus}
        />

        {hasInput ? (
          <TouchableOpacity style={styles.sendButton} onPress={onSend}>
            <Ionicons name="send" size={24} color="#7DD3C0" />
          </TouchableOpacity>
        ) : (
          <>
            {messageCount > 0 && voiceState === 'idle' && (
              <TouchableOpacity style={styles.clearButton} onPress={onClear}>
                <Ionicons name="trash-outline" size={24} color="#EF4444" />
              </TouchableOpacity>
            )}

            {voiceState !== 'idle' && (
              <TouchableOpacity style={styles.stopButton} onPress={onStopVoice}>
                <Ionicons name="stop-circle" size={32} color="#EF4444" />
              </TouchableOpacity>
            )}

            <TouchableOpacity
              style={[
                styles.micButton,
                voiceState === 'speaking' && styles.micButtonActive,
                voiceState !== 'idle' && styles.micButtonConversation,
                !isDark && styles.micButtonLight,
              ]}
              onPress={onMicPress}
            >
              <Ionicons name={micIconName} size={28} color={micIconColor} />
            </TouchableOpacity>
          </>
        )}
      </View>

      {voiceState !== 'idle' && (
        <View style={styles.conversationModeIndicator}>
          <View style={styles.conversationModeDot} />
          <Text style={styles.conversationModeText}>{voiceStatusLabel}</Text>
          <Text style={styles.conversationModeHint}>{voiceHint}</Text>
        </View>
      )}

      {voiceState === 'listening' && (
        <>
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
              },
            ]}
          />
          <Animated.View
            pointerEvents="none"
            style={[
              styles.micPulse,
              {
                transform: [
                  {
                    scale: micPulseAnim.interpolate({
                      inputRange: [1, 1.8],
                      outputRange: [1, 1.5],
                    }),
                  },
                ],
                opacity: micPulseAnim.interpolate({
                  inputRange: [1, 1.8],
                  outputRange: [0.5, 0.1],
                }),
                backgroundColor: '#10B981',
              },
            ]}
          />
          <Animated.View
            pointerEvents="none"
            style={[
              styles.micPulse,
              {
                transform: [
                  {
                    scale: micPulseAnim.interpolate({
                      inputRange: [1, 1.8],
                      outputRange: [1, 1.2],
                    }),
                  },
                ],
                opacity: micPulseAnim.interpolate({
                  inputRange: [1, 1.8],
                  outputRange: [0.7, 0.3],
                }),
                backgroundColor: '#34D399',
              },
            ]}
          />
        </>
      )}
    </>
  );

  // BlurView works on both platforms; Android gets a solid fallback underlay for reliability.
  return (
    <View style={[styles.blur, !isDark && styles.blurLightUnderlay, isDark && styles.blurDarkUnderlay]}>
      <BlurView
        style={StyleSheet.absoluteFill}
        blurType={isDark ? 'dark' : 'light'}
        blurAmount={Platform.OS === 'android' ? 20 : 25}
        reducedTransparencyFallbackColor={isDark ? '#2F2F2F' : '#FFFFFF'}
      />
      {content}
    </View>
  );
}

const styles = StyleSheet.create({
  blur: {
    borderRadius: 24,
    overflow: 'hidden',
  },
  blurDarkUnderlay: {
    backgroundColor: Platform.OS === 'android' ? 'rgba(47, 47, 47, 0.92)' : 'transparent',
    borderWidth: Platform.OS === 'android' ? 1 : 0,
    borderColor: 'rgba(255, 255, 255, 0.08)',
    elevation: Platform.OS === 'android' ? 8 : 0,
  },
  blurLightUnderlay: {
    backgroundColor: Platform.OS === 'android' ? 'rgba(255, 255, 255, 0.92)' : 'transparent',
    borderWidth: Platform.OS === 'android' ? 1 : 0,
    borderColor: '#E5E7EB',
    elevation: Platform.OS === 'android' ? 8 : 0,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
  },
  inputRowLight: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#ECECEC',
    maxHeight: 100,
  },
  inputLight: {
    color: '#1A1A1F',
  },
  plusButton: {
    marginRight: 8,
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
  micButtonActive: {
    backgroundColor: '#2A3D4A',
    borderColor: '#4A7A8B',
  },
  micButtonConversation: {
    backgroundColor: 'rgba(6, 182, 212, 0.15)',
    borderColor: '#06B6D4',
    borderWidth: 2,
  },
  micButtonLight: {
    backgroundColor: '#F3F4F6',
    borderColor: '#D1D5DB',
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
  conversationModeIndicator: {
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
