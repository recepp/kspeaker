import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator, useColorScheme } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { clearRegistration } from './registration';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface AccountDeletionScreenProps {
  navigation: any;
}

const AccountDeletionScreen: React.FC<AccountDeletionScreenProps> = ({ navigation }) => {
  const [isDeleting, setIsDeleting] = useState(false);
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const handleDeleteAccount = async () => {
    Alert.alert(
      'Delete Account',
      'Are you sure you want to delete your account? This action cannot be undone. All your data will be permanently removed.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsDeleting(true);
            try {
              // Clear all user data
              await clearRegistration();
              await AsyncStorage.clear();
              
              Alert.alert(
                'Account Deleted',
                'Your account has been successfully deleted.',
                [
                  {
                    text: 'OK',
                    onPress: () => navigation.replace('Chat'),
                  },
                ]
              );
            } catch (error) {
              console.error('Account deletion error:', error);
              Alert.alert('Error', 'Failed to delete account. Please try again.');
            } finally {
              setIsDeleting(false);
            }
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, isDark ? styles.containerDark : styles.containerLight]} edges={['top', 'bottom']}>
      {/* Header */}
      <View style={[styles.header, isDark ? styles.headerDark : styles.headerLight]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color={isDark ? '#FFFFFF' : '#1A1A1F'} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, isDark ? styles.headerTitleDark : styles.headerTitleLight]}>Delete Account</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Ionicons name="warning" size={64} color="#EF4444" />
        </View>

        <Text style={[styles.title, isDark ? styles.titleDark : styles.titleLight]}>
          Permanently Delete Account
        </Text>

        <Text style={[styles.description, isDark ? styles.descriptionDark : styles.descriptionLight]}>
          Deleting your account will:
        </Text>

        <View style={styles.bulletList}>
          <View style={styles.bulletItem}>
            <Ionicons name="close-circle" size={20} color="#EF4444" />
            <Text style={[styles.bulletText, isDark ? styles.bulletTextDark : styles.bulletTextLight]}>
              Remove all your personal data
            </Text>
          </View>
          <View style={styles.bulletItem}>
            <Ionicons name="close-circle" size={20} color="#EF4444" />
            <Text style={[styles.bulletText, isDark ? styles.bulletTextDark : styles.bulletTextLight]}>
              Delete your conversation history
            </Text>
          </View>
          <View style={styles.bulletItem}>
            <Ionicons name="close-circle" size={20} color="#EF4444" />
            <Text style={[styles.bulletText, isDark ? styles.bulletTextDark : styles.bulletTextLight]}>
              Cancel your account permanently
            </Text>
          </View>
        </View>

        <Text style={[styles.warning, isDark ? styles.warningDark : styles.warningLight]}>
          ⚠️ This action cannot be undone
        </Text>

        <TouchableOpacity
          style={[styles.deleteButton, isDeleting && styles.deleteButtonDisabled]}
          onPress={handleDeleteAccount}
          disabled={isDeleting}
        >
          {isDeleting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="trash" size={20} color="#FFFFFF" />
              <Text style={styles.deleteButtonText}>Delete My Account</Text>
            </>
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.cancelButton, isDark ? styles.cancelButtonDark : styles.cancelButtonLight]}
          onPress={() => navigation.goBack()}
          disabled={isDeleting}
        >
          <Text style={[styles.cancelButtonText, isDark ? styles.cancelButtonTextDark : styles.cancelButtonTextLight]}>
            Keep My Account
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  containerDark: {
    backgroundColor: '#000000',
  },
  containerLight: {
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 0.5,
  },
  headerDark: {
    backgroundColor: '#000000',
    borderBottomColor: 'rgba(255, 255, 255, 0.06)',
  },
  headerLight: {
    backgroundColor: '#FFFFFF',
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerTitleDark: {
    color: '#FFFFFF',
  },
  headerTitleLight: {
    color: '#1A1A1F',
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 40,
    alignItems: 'center',
  },
  iconContainer: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '900',
    marginBottom: 16,
    textAlign: 'center',
  },
  titleDark: {
    color: '#FFFFFF',
  },
  titleLight: {
    color: '#1A1A1F',
  },
  description: {
    fontSize: 16,
    marginBottom: 24,
    textAlign: 'center',
  },
  descriptionDark: {
    color: 'rgba(255, 255, 255, 0.7)',
  },
  descriptionLight: {
    color: 'rgba(0, 0, 0, 0.6)',
  },
  bulletList: {
    width: '100%',
    marginBottom: 32,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 12,
  },
  bulletText: {
    fontSize: 15,
    flex: 1,
  },
  bulletTextDark: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  bulletTextLight: {
    color: 'rgba(0, 0, 0, 0.7)',
  },
  warning: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 32,
    textAlign: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  warningDark: {
    color: '#EF4444',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  warningLight: {
    color: '#DC2626',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    gap: 8,
    marginBottom: 16,
  },
  deleteButtonDisabled: {
    opacity: 0.5,
  },
  deleteButtonText: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  cancelButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    borderWidth: 1,
  },
  cancelButtonDark: {
    backgroundColor: 'transparent',
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  cancelButtonLight: {
    backgroundColor: 'transparent',
    borderColor: '#E5E7EB',
  },
  cancelButtonText: {
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
  },
  cancelButtonTextDark: {
    color: '#FFFFFF',
  },
  cancelButtonTextLight: {
    color: '#1A1A1F',
  },
});

export default AccountDeletionScreen;
