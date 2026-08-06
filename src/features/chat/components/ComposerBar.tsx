import React, { RefObject, useEffect, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { BlurView } from '@react-native-community/blur';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { triggerHaptic } from '../../../platform/haptic';
import type { Theme, VoiceState } from '../types';
import { LiquidGlassButton } from './LiquidGlassButton';

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
  liveTranscript: string;
  messageCount: number;
  inputRef: RefObject<TextInput | null>;
  micPulseAnim: Animated.Value;
  placeholder: string;
  listeningLabel: string;
  processingLabel: string;
  speakingLabel: string;
}

/**
 * Tahoe-style frosted liquid glass composer.
 * Highly translucent so chat bubbles blur through behind the bar.
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
  liveTranscript,
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
  const accentIcon = isDark ? '#E8F7F3' : '#1A1A1F';
  const plusColor = isDark ? 'rgba(255, 255, 255, 0.9)' : 'rgba(26, 26, 31, 0.88)';

  const sendOpacity = useRef(new Animated.Value(hasInput ? 1 : 0)).current;
  const sendScale = useRef(new Animated.Value(hasInput ? 1 : 0.86)).current;
  const idleOpacity = useRef(new Animated.Value(hasInput ? 0 : 1)).current;
  const idleScale = useRef(new Animated.Value(hasInput ? 0.86 : 1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.spring(sendOpacity, {
        toValue: hasInput ? 1 : 0,
        useNativeDriver: true,
        friction: 8,
        tension: 80,
      }),
      Animated.spring(sendScale, {
        toValue: hasInput ? 1 : 0.86,
        useNativeDriver: true,
        friction: 8,
        tension: 80,
      }),
      Animated.spring(idleOpacity, {
        toValue: hasInput ? 0 : 1,
        useNativeDriver: true,
        friction: 8,
        tension: 80,
      }),
      Animated.spring(idleScale, {
        toValue: hasInput ? 0.86 : 1,
        useNativeDriver: true,
        friction: 8,
        tension: 80,
      }),
    ]).start();
  }, [hasInput, sendOpacity, sendScale, idleOpacity, idleScale]);

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
          : accentIcon;

  const micIconName =
    voiceState === 'idle'
      ? 'mic-outline'
      : voiceState === 'listening'
        ? 'mic'
        : voiceState === 'processing'
          ? 'cloud-upload'
          : 'volume-high';

  const blurType =
    Platform.OS === 'ios'
      ? isDark
        ? 'ultraThinMaterialDark'
        : 'ultraThinMaterialLight'
      : isDark
        ? 'dark'
        : 'light';

  return (
    <View style={styles.barWrap}>
      <View style={[styles.barSurface, { borderRadius: 28 }]}>
        {/* Frosted glass — chat content behind should show through */}
        <BlurView
          style={StyleSheet.absoluteFill}
          blurType={blurType}
          blurAmount={Platform.OS === 'android' ? 28 : 40}
          reducedTransparencyFallbackColor={
            isDark ? 'rgba(20, 22, 28, 0.72)' : 'rgba(255, 255, 255, 0.72)'
          }
        />
        {/* Ultra-light tint so blur remains visible */}
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
              ? ['rgba(255,255,255,0.22)', 'rgba(255,255,255,0.04)', 'rgba(0,0,0,0.14)']
              : ['rgba(255,255,255,0.55)', 'rgba(255,255,255,0.18)', 'rgba(0,0,0,0.04)']
          }
          locations={[0, 0.42, 1]}
          style={StyleSheet.absoluteFill}
        />
        {/* Specular crown */}
        <LinearGradient
          pointerEvents="none"
          colors={['rgba(255,255,255,0.38)', 'rgba(255,255,255,0.06)', 'transparent']}
          locations={[0, 0.4, 1]}
          start={{ x: 0.15, y: 0 }}
          end={{ x: 0.85, y: 0.7 }}
          style={styles.barSpecular}
        />
        {/* Bevel highlights */}
        <View
          pointerEvents="none"
          style={[
            styles.bevelLight,
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
            styles.bevelDark,
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
            styles.barRim,
            {
              borderColor: isDark
                ? 'rgba(255,255,255,0.32)'
                : 'rgba(255,255,255,0.75)',
            },
          ]}
        />

        <View style={styles.inputRow}>
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Open modes"
            hitSlop={{ top: 10, bottom: 10, left: 8, right: 8 }}
            activeOpacity={0.65}
            onPress={() => {
              triggerHaptic('light');
              onOpenModes();
            }}
            style={styles.plusHit}
          >
            <Ionicons name="add" size={28} color={plusColor} />
          </TouchableOpacity>

          <View style={styles.inputWrap}>
            {!hasInput && (
              <Text
                pointerEvents="none"
                numberOfLines={1}
                style={styles.animatedPlaceholder}
              >
                {placeholder}
              </Text>
            )}
            <TextInput
              ref={inputRef}
              style={[styles.input, !isDark && styles.inputLight]}
              value={input}
              onChangeText={onChangeText}
              placeholder=""
              onSubmitEditing={onSend}
              returnKeyType="send"
              multiline
              onFocus={onInputFocus}
            />
          </View>

          <View style={styles.trailingSlot}>
            <Animated.View
              pointerEvents={hasInput ? 'auto' : 'none'}
              style={[
                styles.trailingLayer,
                {
                  opacity: sendOpacity,
                  transform: [{ scale: sendScale }],
                },
              ]}
            >
              <LiquidGlassButton
                theme={theme}
                size="md"
                accessibilityLabel="Send message"
                onPress={() => {
                  triggerHaptic('medium');
                  onSend();
                }}
              >
                <Ionicons name="send" size={18} color={accentIcon} />
              </LiquidGlassButton>
            </Animated.View>

            <Animated.View
              pointerEvents={hasInput ? 'none' : 'auto'}
              style={[
                styles.trailingLayer,
                styles.idleRow,
                {
                  opacity: idleOpacity,
                  transform: [{ scale: idleScale }],
                },
              ]}
            >
              {messageCount > 0 && voiceState === 'idle' && (
                <TouchableOpacity style={styles.clearButton} onPress={onClear}>
                  <Ionicons name="trash-outline" size={22} color="#EF4444" />
                </TouchableOpacity>
              )}

              {voiceState !== 'idle' && (
                <TouchableOpacity style={styles.stopButton} onPress={onStopVoice}>
                  <Ionicons name="stop-circle" size={30} color="#EF4444" />
                </TouchableOpacity>
              )}

              <View style={styles.micWrap}>
                {voiceState === 'listening' && (
                  <>
                    <Animated.View
                      pointerEvents="none"
                      style={[
                        styles.micRing,
                        {
                          transform: [{ scale: micPulseAnim }],
                          opacity: micPulseAnim.interpolate({
                            inputRange: [1, 1.6],
                            outputRange: [0.55, 0],
                          }),
                        },
                      ]}
                    />
                    <Animated.View
                      pointerEvents="none"
                      style={[
                        styles.micRingInner,
                        {
                          transform: [
                            {
                              scale: micPulseAnim.interpolate({
                                inputRange: [1, 1.6],
                                outputRange: [1, 1.35],
                              }),
                            },
                          ],
                          opacity: micPulseAnim.interpolate({
                            inputRange: [1, 1.6],
                            outputRange: [0.7, 0.15],
                          }),
                        },
                      ]}
                    />
                  </>
                )}
                <LiquidGlassButton
                  theme={theme}
                  size="md"
                  accessibilityLabel="Voice"
                  onPress={onMicPress}
                >
                  <Ionicons name={micIconName} size={24} color={micIconColor} />
                </LiquidGlassButton>
              </View>
            </Animated.View>
          </View>
        </View>

        {voiceState === 'listening' && (
          <View style={styles.liveTranscriptBar}>
            <View style={styles.liveDot} />
            <Text style={styles.liveTranscriptText} numberOfLines={3}>
              {liveTranscript.trim()
                ? `"${liveTranscript.trim()}"`
                : '"…"'}
            </Text>
          </View>
        )}

        {(voiceState === 'processing' || voiceState === 'speaking') && (
          <View style={styles.conversationModeIndicator}>
            <View
              style={[
                styles.conversationModeDot,
                voiceState === 'processing'
                  ? styles.conversationModeDotProcessing
                  : styles.conversationModeDotSpeaking,
              ]}
            />
            <Text style={styles.conversationModeText}>{voiceStatusLabel}</Text>
            <Text style={styles.conversationModeHint}>{voiceHint}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  barWrap: {
    borderRadius: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.28,
    shadowRadius: 22,
    elevation: 14,
    // Transparent wrap so only the frosted pill blurs content
    backgroundColor: 'transparent',
  },
  barSurface: {
    borderRadius: 28,
    overflow: 'hidden',
    backgroundColor: 'transparent',
  },
  barSpecular: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: '55%',
  },
  bevelLight: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 28,
    borderTopWidth: StyleSheet.hairlineWidth * 2,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  bevelDark: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 28,
    borderBottomWidth: StyleSheet.hairlineWidth * 2,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderTopWidth: 0,
    borderLeftWidth: 0,
  },
  barRim: {
    ...StyleSheet.absoluteFillObject,
    borderRadius: 28,
    borderWidth: StyleSheet.hairlineWidth,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 6,
    zIndex: 2,
  },
  plusHit: {
    width: 32,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  inputWrap: {
    flex: 1,
    justifyContent: 'center',
    minHeight: 40,
  },
  animatedPlaceholder: {
    position: 'absolute',
    left: 0,
    right: 0,
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.92)',
    paddingVertical: Platform.OS === 'ios' ? 8 : 6,
  },
  input: {
    flex: 0,
    fontSize: 16,
    color: '#F5F5F7',
    maxHeight: 100,
    paddingVertical: Platform.OS === 'ios' ? 8 : 6,
  },
  inputLight: {
    color: '#1A1A1F',
  },  trailingSlot: {
    width: 96,
    height: 44,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  trailingLayer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
  idleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 6,
  },
  clearButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stopButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  micWrap: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  micRing: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 2,
    borderColor: '#10B981',
    backgroundColor: 'rgba(16, 185, 129, 0.18)',
  },
  micRingInner: {
    position: 'absolute',
    width: 44,
    height: 44,
    borderRadius: 22,
    borderWidth: 1.5,
    borderColor: 'rgba(52, 211, 153, 0.9)',
  },
  liveTranscriptBar: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#000000',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.1)',
    zIndex: 2,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#10B981',
    marginTop: 6,
  },
  liveTranscriptText: {
    flex: 1,
    fontSize: 15,
    lineHeight: 22,
    color: 'rgba(255, 255, 255, 0.92)',
    fontStyle: 'italic',
    fontWeight: '500',
  },
  conversationModeIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#000000',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.1)',
    zIndex: 2,
  },
  conversationModeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 8,
  },
  conversationModeDotProcessing: {
    backgroundColor: '#F59E0B',
  },
  conversationModeDotSpeaking: {
    backgroundColor: '#3B82F6',
  },
  conversationModeText: {
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.92)',
    marginRight: 12,
  },
  conversationModeHint: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.55)',
  },
});
