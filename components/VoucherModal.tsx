import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  useColorScheme,
  Keyboard,
  TouchableWithoutFeedback,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';

interface VoucherModalProps {
  visible: boolean;
  onSubmit: (voucherCode: string) => Promise<boolean>;
  onClose: () => void;
}

export const VoucherModal: React.FC<VoucherModalProps> = ({ visible, onSubmit, onClose }) => {
  const [voucherCode, setVoucherCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isFocused, setIsFocused] = useState(false);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const formatVoucherCode = (text: string) => {
    // Remove all non-alphanumeric characters and keep only A-Z0-9
    const cleaned = text.toUpperCase().replace(/[^A-Z0-9]/g, '');
    
    // Allow up to 32 characters (backend voucher code length)
    return cleaned.slice(0, 32);
  };

  const handleSubmit = async () => {
    const cleanCode = voucherCode.replace(/[^A-Z0-9]/g, '');
    
    // Backend voucher codes are 32 characters
    if (cleanCode.length < 16) {
      setError('Voucher code is too short');
      return;
    }

    if (cleanCode.length > 32) {
      setError('Voucher code is too long');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      // Call backend API to register with voucher
      const success = await onSubmit(cleanCode);
      if (success) {
        setVoucherCode('');
        onClose();
      } else {
        setError('Invalid voucher code. Please check and try again.');
      }
    } catch (err) {
      setError('An error occurred. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.modalContainer}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <View style={styles.modalContainerInner}>
            <ScrollView
              contentContainerStyle={styles.scrollContent}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}
            >
              <View style={[
                styles.modalContent,
                isDark ? styles.modalContentDark : styles.modalContentLight
              ]}>
                {/* Close Button */}
                <TouchableOpacity 
                  onPress={onClose}
                  style={styles.closeButton}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                >
                  <Ionicons name="close" size={28} color={isDark ? '#FFFFFF' : '#1F1F1F'} />
                </TouchableOpacity>

                {/* Logo/Icon Section */}
                <View style={[
                  styles.iconCircle,
                  isDark ? styles.iconCircleDark : styles.iconCircleLight
                ]}>
                  <LinearGradient
                    colors={isDark ? ['#7DD3C0', '#5EBAAA'] : ['#4A6FA5', '#3A5A8A']}
                    style={styles.iconGradient}
                  >
                    <Ionicons 
                      name="ticket-outline" 
                      size={38} 
                      color="#FFFFFF" 
                    />
                  </LinearGradient>
                </View>

                {/* Title Section */}
                <Text style={[
                  styles.title,
                  isDark ? styles.titleDark : styles.titleLight
                ]}>
                  Add Voucher Code 🎟️
                </Text>
                <Text style={[
                  styles.subtitle,
                  isDark ? styles.subtitleDark : styles.subtitleLight
                ]}>
                  Enter your voucher code to unlock unlimited messages
                </Text>
                
                {/* Voucher Code Input */}
                <View style={[
                  styles.inputContainer,
                  isDark ? styles.inputContainerDark : styles.inputContainerLight,
                  isFocused && (isDark ? styles.inputContainerFocusedDark : styles.inputContainerFocusedLight),
                  error && styles.inputContainerError
                ]}>
                  <Ionicons 
                    name="ticket" 
                    size={20} 
                    color={isFocused ? (isDark ? '#7DD3C0' : '#4A6FA5') : (isDark ? '#888' : '#999')}
                    style={styles.inputIcon} 
                  />
                  <TextInput
                    style={[
                      styles.input,
                      isDark ? styles.inputDark : styles.inputLight
                    ]}
                    placeholder="Enter your voucher code"
                    placeholderTextColor={isDark ? 'rgba(255, 255, 255, 0.4)' : 'rgba(0, 0, 0, 0.4)'}
                    value={voucherCode}
                    onChangeText={(text) => {
                      setVoucherCode(formatVoucherCode(text));
                      setError('');
                    }}
                    autoCapitalize="characters"
                    autoCorrect={false}
                    editable={!isLoading}
                    onFocus={() => setIsFocused(true)}
                    onBlur={() => setIsFocused(false)}
                    returnKeyType="done"
                    onSubmitEditing={handleSubmit}
                    maxLength={32} // Max 32 characters
                  />
                  
                  {/* Submit Button */}
                  <TouchableOpacity 
                    onPress={handleSubmit}
                    disabled={isLoading || voucherCode.replace(/[^A-Z0-9]/g, '').length < 16}
                    style={styles.sendButton}
                    activeOpacity={0.7}
                  >
                    {isLoading ? (
                      <ActivityIndicator 
                        color={isDark ? '#7DD3C0' : '#4A6FA5'} 
                        size="small" 
                      />
                    ) : (
                      <LinearGradient
                        colors={isDark ? ['#7DD3C0', '#5EBAAA'] : ['#4A6FA5', '#3A5A8A']}
                        style={styles.sendButtonGradient}
                      >
                        <Ionicons 
                          name="checkmark" 
                          size={20} 
                          color="#FFFFFF" 
                        />
                      </LinearGradient>
                    )}
                  </TouchableOpacity>
                </View>

                {error ? (
                  <View style={[
                    styles.errorContainer,
                    isDark ? styles.errorContainerDark : styles.errorContainerLight
                  ]}>
                    <Ionicons name="alert-circle" size={16} color="#EF4444" />
                    <Text style={styles.errorText}>{error}</Text>
                  </View>
                ) : null}

                {/* Info Text */}
                <View style={styles.infoContainer}>
                  <Ionicons 
                    name="information-circle-outline" 
                    size={13} 
                    color={isDark ? 'rgba(255, 255, 255, 0.45)' : 'rgba(0, 0, 0, 0.45)'} 
                  />
                  <Text style={[
                    styles.infoText,
                    isDark ? styles.infoTextDark : styles.infoTextLight
                  ]}>
                    Get a voucher code from support@kspeaker.com
                  </Text>
                </View>
              </View>
            </ScrollView>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// ...existing styles...

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  modalContainerInner: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  modalContent: {
    borderRadius: 24,
    paddingTop: 24,
    paddingBottom: 32,
    paddingHorizontal: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 12,
    position: 'relative',
  },
  modalContentDark: {
    backgroundColor: '#1F1F1F',
  },
  modalContentLight: {
    backgroundColor: '#FFFFFF',
  },
  closeButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    zIndex: 10,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 6,
  },
  iconCircleDark: {
    backgroundColor: 'rgba(125, 211, 192, 0.1)',
  },
  iconCircleLight: {
    backgroundColor: 'rgba(74, 111, 165, 0.1)',
  },
  iconGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    marginBottom: 6,
    textAlign: 'center',
    letterSpacing: 0.3,
  },
  titleDark: {
    color: '#FFFFFF',
  },
  titleLight: {
    color: '#1F1F1F',
  },
  subtitle: {
    fontSize: 14,
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 20,
    fontWeight: '500',
  },
  subtitleDark: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  subtitleLight: {
    color: 'rgba(0, 0, 0, 0.6)',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 14,
    borderWidth: 2,
    paddingHorizontal: 16,
    marginBottom: 8,
    height: 56,
  },
  inputContainerDark: {
    backgroundColor: '#2A2A2A',
    borderColor: '#3A3A3A',
  },
  inputContainerLight: {
    backgroundColor: '#F5F5F5',
    borderColor: '#E0E0E0',
  },
  inputContainerFocusedDark: {
    borderColor: '#7DD3C0',
    backgroundColor: '#252525',
  },
  inputContainerFocusedLight: {
    borderColor: '#4A6FA5',
    backgroundColor: '#FAFAFA',
  },
  inputContainerError: {
    borderColor: '#EF4444',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 1,
  },
  inputDark: {
    color: '#FFFFFF',
  },
  inputLight: {
    color: '#1F1F1F',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  errorContainerDark: {
    backgroundColor: 'rgba(239, 68, 68, 0.15)',
  },
  errorContainerLight: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    marginLeft: 8,
    flex: 1,
    fontWeight: '600',
  },
  sendButton: {
    marginLeft: 8,
  },
  sendButtonGradient: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 5,
    paddingHorizontal: 20,
    marginTop: 12,
  },
  infoText: {
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
    fontWeight: '500',
  },
  infoTextDark: {
    color: 'rgba(255, 255, 255, 0.5)',
  },
  infoTextLight: {
    color: 'rgba(0, 0, 0, 0.5)',
  },
});