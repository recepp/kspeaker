import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { triggerHaptic } from '../../../platform/haptic';
import type { AppLanguage, Theme } from '../types';

export interface SideDrawerProps {
  theme: Theme;
  language: AppLanguage;
  isTablet: boolean;
  drawerAnim: Animated.Value;
  drawerOpen: boolean;
  t: (key: string) => string;
  onClose: () => void;
  onOpenSettings: () => void;
  onOpenAbout: () => void;
  onOpenFaq: () => void;
  onOpenSupport: () => void;
  onOpenLanguage: () => void;
  onToggleTheme: () => void;
  onOpenVoucher: () => void;
  onOpenFlashCards: () => void;
  onOpenDeleteAccount: () => void;
}

export function SideDrawer({
  theme,
  isTablet,
  drawerAnim,
  drawerOpen,
  t,
  onClose,
  onOpenSettings,
  onOpenAbout,
  onOpenFaq,
  onOpenSupport,
  onOpenLanguage,
  onToggleTheme,
  onOpenVoucher,
  onOpenFlashCards,
  onOpenDeleteAccount,
}: SideDrawerProps) {
  const isDark = theme === 'dark';
  const iconColor = isDark ? '#ECECEC' : '#1A1A1F';

  return (
    <>
      {drawerOpen && (
        <TouchableOpacity
          style={styles.drawerOverlay}
          activeOpacity={1}
          onPress={onClose}
        />
      )}
      <Animated.View
        style={[
          styles.drawer,
          { transform: [{ translateX: drawerAnim }] },
          isTablet && { width: 400 },
          !isDark && styles.drawerLight,
        ]}
      >
        <View style={styles.drawerContent}>
          <DrawerItem
            icon="settings-outline"
            label={t('settings')}
            color={iconColor}
            light={!isDark}
            onPress={() => {
              triggerHaptic('light');
              onOpenSettings();
            }}
          />
          <DrawerItem
            icon="information-circle-outline"
            label={t('about')}
            color={iconColor}
            light={!isDark}
            onPress={() => {
              triggerHaptic('light');
              onOpenAbout();
            }}
          />
          <DrawerItem
            icon="help-circle-outline"
            label={t('faq')}
            color={iconColor}
            light={!isDark}
            onPress={() => {
              triggerHaptic('light');
              onOpenFaq();
            }}
          />
          <DrawerItem
            icon="mail-outline"
            label={t('support')}
            color={iconColor}
            light={!isDark}
            onPress={() => {
              triggerHaptic('light');
              onOpenSupport();
            }}
          />
          <DrawerItem
            icon="language"
            label={t('language')}
            color={iconColor}
            light={!isDark}
            onPress={() => {
              triggerHaptic('light');
              onOpenLanguage();
            }}
          />
          <DrawerItem
            icon={isDark ? 'sunny' : 'moon'}
            label={isDark ? t('lightMode') : t('darkMode')}
            color={iconColor}
            light={!isDark}
            onPress={() => {
              triggerHaptic('medium');
              onToggleTheme();
            }}
          />

          <View style={styles.drawerDivider} />

          <DrawerItem
            icon="ticket-outline"
            label={t('addVoucher')}
            color={isDark ? '#F59E0B' : '#D97706'}
            light={!isDark}
            accent
            onPress={() => {
              triggerHaptic('medium');
              onOpenVoucher();
            }}
          />
          <DrawerItem
            icon="layers-outline"
            label={t('flashCards')}
            color={isDark ? '#7DD3C0' : '#4A9B8F'}
            light={!isDark}
            accent
            onPress={() => {
              triggerHaptic('medium');
              onOpenFlashCards();
            }}
          />

          <View style={styles.drawerDivider} />

          <DrawerItem
            icon="trash-outline"
            label={t('deleteAccount')}
            color="#EF4444"
            light={!isDark}
            accent
            onPress={() => {
              triggerHaptic('medium');
              onOpenDeleteAccount();
            }}
          />
        </View>
      </Animated.View>
    </>
  );
}

function DrawerItem({
  icon,
  label,
  color,
  light,
  accent,
  onPress,
}: {
  icon: string;
  label: string;
  color: string;
  light: boolean;
  accent?: boolean;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={styles.drawerItem}
      activeOpacity={0.7}
      onPress={onPress}
    >
      <Ionicons name={icon as never} size={24} color={color} />
      <Text
        style={[
          styles.drawerItemText,
          light && styles.drawerItemTextLight,
          accent && { color },
        ]}
      >
        {label}
      </Text>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
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
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 16,
  },
  drawerLight: {
    backgroundColor: '#FFFFFF',
    borderRightColor: '#E5E7EB',
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
    ...Platform.select({
      android: {
        elevation: 0,
        backgroundColor: 'transparent',
      },
    }),
  },
  drawerItemText: {
    fontSize: 16,
    color: '#FFFFFF',
    fontWeight: '500',
  },
  drawerItemTextLight: {
    color: '#1A1A1F',
  },
  drawerDivider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginVertical: 8,
    marginHorizontal: 20,
  },
});
