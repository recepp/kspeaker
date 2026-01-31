import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
  Platform,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';

interface PremiumSuccessModalProps {
  visible: boolean;
  onClose: () => void;
}

export const PremiumSuccessModal: React.FC<PremiumSuccessModalProps> = ({ visible, onClose }) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const checkmarkAnim = useRef(new Animated.Value(0)).current;
  const sparkleAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Reset animations
      scaleAnim.setValue(0);
      fadeAnim.setValue(0);
      checkmarkAnim.setValue(0);
      sparkleAnim.setValue(0);

      // Start animations sequence
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 50,
          friction: 7,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Checkmark animation after modal appears
      setTimeout(() => {
        Animated.spring(checkmarkAnim, {
          toValue: 1,
          tension: 80,
          friction: 6,
          useNativeDriver: true,
        }).start();
      }, 200);

      // Sparkle animation loop
      Animated.loop(
        Animated.sequence([
          Animated.timing(sparkleAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(sparkleAnim, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    }
  }, [visible]);

  const checkmarkScale = checkmarkAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0, 1.2, 1],
  });

  const sparkleRotate = sparkleAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const sparkleOpacity = sparkleAnim.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 1, 0.3],
  });

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <Animated.View
          style={[
            styles.modalContainer,
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Sparkle Background */}
          <Animated.View
            style={[
              styles.sparkleBackground,
              {
                transform: [{ rotate: sparkleRotate }],
                opacity: sparkleOpacity,
              },
            ]}
          >
            <LinearGradient
              colors={['rgba(125, 211, 192, 0.1)', 'rgba(125, 211, 192, 0.3)', 'rgba(125, 211, 192, 0.1)']}
              style={styles.sparkleGradient}
            />
          </Animated.View>

          {/* Main Content */}
          <View style={styles.contentContainer}>
            {/* Success Icon */}
            <Animated.View
              style={[
                styles.iconContainer,
                {
                  transform: [{ scale: checkmarkScale }],
                },
              ]}
            >
              <LinearGradient
                colors={['#10B981', '#059669']}
                style={styles.iconGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="checkmark-circle" size={64} color="#FFFFFF" />
              </LinearGradient>
            </Animated.View>

            {/* Premium Badge */}
            <View style={styles.premiumBadge}>
              <LinearGradient
                colors={['#FFD700', '#FFA500']}
                style={styles.badgeGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Ionicons name="star" size={16} color="#FFFFFF" />
                <Text style={styles.badgeText}>PREMIUM</Text>
                <Ionicons name="star" size={16} color="#FFFFFF" />
              </LinearGradient>
            </View>

            {/* Title */}
            <Text style={styles.title}>
              3000₺ Kartezya Premium{'\n'}Aktif! 🎉
            </Text>

            {/* Subtitle */}
            <Text style={styles.subtitle}>
              Sınırsız mesaj hakkına kavuştunuz
            </Text>

            {/* Features List */}
            <View style={styles.featuresContainer}>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                <Text style={styles.featureText}>Sınırsız mesaj gönderimi</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                <Text style={styles.featureText}>Sesli konuşma modu</Text>
              </View>
              <View style={styles.featureItem}>
                <Ionicons name="checkmark-circle" size={20} color="#10B981" />
                <Text style={styles.featureText}>Gelişmiş AI özellikleri</Text>
              </View>
            </View>

            {/* Close Button */}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <LinearGradient
                colors={['#7DD3C0', '#5EBAAA']}
                style={styles.closeButtonGradient}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
              >
                <Text style={styles.closeButtonText}>Harika! 🚀</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>

          {/* Decorative Stars */}
          <View style={styles.starsContainer}>
            <Ionicons name="star" size={16} color="#FFD700" style={styles.star1} />
            <Ionicons name="star" size={12} color="#FFA500" style={styles.star2} />
            <Ionicons name="star" size={14} color="#FFD700" style={styles.star3} />
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.85)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#1F1F1F',
    borderRadius: 28,
    padding: 32,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
    position: 'relative',
    overflow: 'hidden',
  },
  sparkleBackground: {
    position: 'absolute',
    width: 300,
    height: 300,
    top: -150,
    left: -50,
  },
  sparkleGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 150,
  },
  contentContainer: {
    alignItems: 'center',
  },
  iconContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    marginBottom: 20,
    shadowColor: '#10B981',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 12,
    elevation: 8,
  },
  iconGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  premiumBadge: {
    marginBottom: 16,
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#FFD700',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 8,
    elevation: 4,
  },
  badgeGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 6,
  },
  badgeText: {
    fontSize: 13,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 1.5,
  },
  title: {
    fontSize: 26,
    fontWeight: '900',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 8,
    lineHeight: 34,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'center',
    marginBottom: 24,
  },
  featuresContainer: {
    width: '100%',
    backgroundColor: 'rgba(125, 211, 192, 0.08)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: 'rgba(125, 211, 192, 0.2)',
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
    gap: 10,
  },
  featureText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  closeButton: {
    width: '100%',
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#7DD3C0',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  closeButtonGradient: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  starsContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
  },
  star1: {
    position: 'absolute',
    top: 40,
    right: 30,
  },
  star2: {
    position: 'absolute',
    top: 60,
    left: 30,
  },
  star3: {
    position: 'absolute',
    bottom: 100,
    right: 40,
  },
});
