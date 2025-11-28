import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';

interface EmailModalProps {
  visible: boolean;
  onSubmit: (email: string) => Promise<boolean>;
}

export const EmailRegistrationModal: React.FC<EmailModalProps> = ({ visible, onSubmit }) => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async () => {
    // Basic email validation
    if (!email.includes('@') || !email.includes('.')) {
      setError('Please enter a valid email address');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const success = await onSubmit(email);
      if (!success) {
        setError('Registration failed. Please try again.');
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
    >
      <View style={styles.modalContainer}>
        <LinearGradient
          colors={['#212121', '#2F2F2F']}
          style={styles.modalContent}
        >
          {/* Logo/Icon Section */}
          <View style={styles.iconCircle}>
            <Ionicons name="mail-outline" size={48} color="#7DD3C0" />
          </View>

          {/* Title Section */}
          <Text style={styles.title}>Welcome to KSpeaker!</Text>
          <Text style={styles.subtitle}>
            Enter your email to start your AI-powered English practice journey
          </Text>
          
          {/* Email Input */}
          <View style={styles.inputContainer}>
            <Ionicons name="mail" size={20} color="#7DD3C0" style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="your.email@example.com"
              placeholderTextColor="rgba(255, 255, 255, 0.4)"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!isLoading}
            />
          </View>

          {error ? (
            <View style={styles.errorContainer}>
              <Ionicons name="alert-circle" size={16} color="#EF4444" />
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : null}

          {/* Continue Button */}
          <TouchableOpacity 
            style={[styles.button, isLoading && styles.buttonDisabled]}
            onPress={handleSubmit}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#212121" />
            ) : (
              <>
                <Text style={styles.buttonText}>Continue</Text>
                <Ionicons name="arrow-forward" size={20} color="#212121" />
              </>
            )}
          </TouchableOpacity>

          {/* Info Text */}
          <Text style={styles.infoText}>
            We'll use your email to personalize your learning experience
          </Text>
        </LinearGradient>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    paddingHorizontal: 24,
  },
  modalContent: {
    borderRadius: 24,
    paddingVertical: 40,
    paddingHorizontal: 24,
    alignSelf: 'stretch',
    maxWidth: 360,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 10,
  },
  iconCircle: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: 'rgba(125, 211, 192, 0.15)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(125, 211, 192, 0.3)',
    marginBottom: 24,
    alignSelf: 'center',
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: '#ECECEC',
    marginBottom: 12,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.7)',
    marginBottom: 28,
    textAlign: 'center',
    lineHeight: 20,
  },
  inputContainer: {
    alignSelf: 'stretch',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#1A1A1A',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#404040',
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    paddingVertical: 14,
    fontSize: 15,
    color: '#ECECEC',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 10,
    padding: 10,
    marginBottom: 16,
    alignSelf: 'stretch',
  },
  errorText: {
    color: '#EF4444',
    fontSize: 13,
    marginLeft: 8,
    flex: 1,
  },
  button: {
    backgroundColor: '#7DD3C0',
    paddingVertical: 15,
    paddingHorizontal: 32,
    borderRadius: 14,
    alignSelf: 'stretch',
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    shadowColor: '#7DD3C0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: '#212121',
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.5,
    marginRight: 8,
  },
  infoText: {
    fontSize: 11,
    color: 'rgba(255, 255, 255, 0.5)',
    marginTop: 16,
    textAlign: 'center',
    lineHeight: 16,
  },
});