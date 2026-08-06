import React, { useRef } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Platform,
  type StyleProp,
  type ViewStyle,
} from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import { BlurView } from '@react-native-community/blur';
import type { Theme } from '../types';

type GlassSize = 'sm' | 'md' | 'lg';

export interface LiquidGlassButtonProps {
  theme: Theme;
  onPress: () => void;
  children: React.ReactNode;
  size?: GlassSize;
  style?: StyleProp<ViewStyle>;
  accessibilityLabel?: string;
  disabled?: boolean;
  /** @deprecated Ambient motion removed — kept for API compat. */
  ambient?: boolean;
}

const SIZE_MAP: Record<GlassSize, number> = {
  sm: 36,
  md: 44,
  lg: 52,
};

/**
 * Apple Tahoe–inspired liquid glass control (RN).
 * Specular rim + bevel layers over BlurView — no WebGL / SVG displacement.
 */
export function LiquidGlassButton({
  theme,
  onPress,
  children,
  size = 'md',
  style,
  accessibilityLabel,
  disabled,
}: LiquidGlassButtonProps) {
  const isDark = theme === 'dark';
  const dimension = SIZE_MAP[size];
  const radius = dimension / 2;
  const scale = useRef(new Animated.Value(1)).current;

  const blurType =
    Platform.OS === 'ios'
      ? isDark
        ? 'ultraThinMaterialDark'
        : 'ultraThinMaterialLight'
      : isDark
        ? 'dark'
        : 'light';

  const pressIn = () => {
    Animated.spring(scale, {
      toValue: 0.96,
      useNativeDriver: true,
      friction: 6,
      tension: 160,
    }).start();
  };

  const pressOut = () => {
    Animated.spring(scale, {
      toValue: 1,
      useNativeDriver: true,
      friction: 6,
      tension: 160,
    }).start();
  };

  return (
    <Animated.View
      style={[
        styles.wrap,
        {
          width: dimension,
          height: dimension,
          borderRadius: radius,
          transform: [{ scale }],
          shadowColor: '#000',
        },
        style,
      ]}
    >
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        activeOpacity={1}
        disabled={disabled}
        onPress={onPress}
        onPressIn={pressIn}
        onPressOut={pressOut}
        style={[styles.hit, { borderRadius: radius }]}
      >
        <View style={[styles.surface, { borderRadius: radius }]}>
          <BlurView
            style={StyleSheet.absoluteFill}
            blurType={blurType}
            blurAmount={Platform.OS === 'android' ? 18 : 24}
            reducedTransparencyFallbackColor={
              isDark ? 'rgba(40, 44, 56, 0.55)' : 'rgba(255, 255, 255, 0.55)'
            }
          />
          {/* Soft glass fill — keeps blur readable */}
          <View
            pointerEvents="none"
            style={[
              StyleSheet.absoluteFill,
              {
                backgroundColor: isDark
                  ? 'rgba(255,255,255,0.08)'
                  : 'rgba(255,255,255,0.28)',
              },
            ]}
          />
          {/* Specular highlight (top light) */}
          <LinearGradient
            pointerEvents="none"
            colors={['rgba(255,255,255,0.45)', 'rgba(255,255,255,0.08)', 'transparent']}
            locations={[0, 0.35, 1]}
            start={{ x: 0.2, y: 0 }}
            end={{ x: 0.8, y: 0.85 }}
            style={[styles.specular, { height: dimension * 0.62, borderRadius: radius }]}
          />
          {/* Inner bevel — light top-left */}
          <View
            pointerEvents="none"
            style={[
              styles.bevelLight,
              {
                borderRadius: radius,
                borderColor: isDark
                  ? 'rgba(255,255,255,0.38)'
                  : 'rgba(255,255,255,0.85)',
              },
            ]}
          />
          {/* Inner bevel — dark bottom-right */}
          <View
            pointerEvents="none"
            style={[
              styles.bevelDark,
              {
                borderRadius: radius,
                borderColor: isDark
                  ? 'rgba(0,0,0,0.35)'
                  : 'rgba(0,0,0,0.12)',
              },
            ]}
          />
          {/* Outer rim */}
          <View
            pointerEvents="none"
            style={[
              styles.rim,
              {
                borderRadius: radius,
                borderColor: isDark
                  ? 'rgba(255,255,255,0.28)'
                  : 'rgba(255,255,255,0.65)',
              },
            ]}
          />
          <View style={styles.content}>{children}</View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
}

/** Kept for barrel export compat — no-op shell. */
export function AmbientAiPattern(_props: {
  width: number;
  height: number;
  isDark: boolean;
  intensity?: number;
}) {
  return null;
}

const styles = StyleSheet.create({
  wrap: {
    justifyContent: 'center',
    alignItems: 'center',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.22,
    shadowRadius: 14,
    elevation: 8,
  },
  hit: {
    width: '100%',
    height: '100%',
    overflow: 'hidden',
  },
  surface: {
    flex: 1,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
  },
  specular: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  bevelLight: {
    ...StyleSheet.absoluteFillObject,
    borderTopWidth: StyleSheet.hairlineWidth * 2,
    borderLeftWidth: StyleSheet.hairlineWidth,
    borderRightWidth: 0,
    borderBottomWidth: 0,
  },
  bevelDark: {
    ...StyleSheet.absoluteFillObject,
    borderBottomWidth: StyleSheet.hairlineWidth * 2,
    borderRightWidth: StyleSheet.hairlineWidth,
    borderTopWidth: 0,
    borderLeftWidth: 0,
  },
  rim: {
    ...StyleSheet.absoluteFillObject,
    borderWidth: StyleSheet.hairlineWidth,
  },
  content: {
    zIndex: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
