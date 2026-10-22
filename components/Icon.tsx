import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { THEME } from '../constants/theme';

export type IconName =
  | 'airplane'
  | 'laptop'
  | 'swap-horizontal'
  | 'send'
  | 'sparkles'
  | 'download'
  | 'copy'
  | 'checkmark-circle'
  | 'alert-circle'
  | 'information-circle'
  | 'code-slash'
  | 'shield-checkmark'
  | 'calculator'
  | 'refresh'
  | 'close'
  | 'settings'
  | 'trending-up'
  | 'home'
  | 'briefcase';

interface IconProps {
  name: IconName;
  size?: number;
  color?: string;
}

const IONICONS_MAP: Record<IconName, keyof typeof Ionicons.glyphMap> = {
  airplane: 'airplane-outline',
  laptop: 'laptop-outline',
  'swap-horizontal': 'swap-horizontal-outline',
  send: 'send',
  sparkles: 'sparkles',
  download: 'download-outline',
  copy: 'copy-outline',
  'checkmark-circle': 'checkmark-circle',
  'alert-circle': 'alert-circle-outline',
  'information-circle': 'information-circle-outline',
  'code-slash': 'code-slash-outline',
  'shield-checkmark': 'shield-checkmark',
  calculator: 'calculator-outline',
  refresh: 'refresh-outline',
  close: 'close-outline',
  settings: 'settings-outline',
  'trending-up': 'trending-up-outline',
  home: 'home-outline',
  briefcase: 'briefcase-outline',
};

// Fallback Unicode symbols in case font asset is loading or in restricted snack sandbox
const UNICODE_FALLBACK: Record<IconName, string> = {
  airplane: '✈️',
  laptop: '💻',
  'swap-horizontal': '🔄',
  send: '➤',
  sparkles: '✨',
  download: '📥',
  copy: '📋',
  'checkmark-circle': '✅',
  'alert-circle': '⚠️',
  'information-circle': 'ℹ️',
  'code-slash': '⚙️',
  'shield-checkmark': '🛡️',
  calculator: '🧮',
  refresh: '↻',
  close: '✕',
  settings: '⚙️',
  'trending-up': '📈',
  home: '🏠',
  briefcase: '💼',
};

export const AppIcon: React.FC<IconProps> = ({
  name,
  size = 18,
  color = THEME.colors.textPrimary,
}) => {
  try {
    const ioniconName = IONICONS_MAP[name];
    if (ioniconName) {
      return <Ionicons name={ioniconName} size={size} color={color} />;
    }
  } catch {
    // Fallback gracefully to unicode
  }

  return (
    <Text style={{ fontSize: size * 0.85, color, lineHeight: size }}>
      {UNICODE_FALLBACK[name] || '•'}
    </Text>
  );
};
