import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { THEME } from '../constants/theme';
import { AppIcon } from './Icon';

interface HeaderProps {
  onReset?: () => void;
  onOpenInfo?: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onReset, onOpenInfo }) => {
  return (
    <View style={styles.container}>
      <View style={styles.brandRow}>
        <View style={styles.logoBadge}>
          <Text style={styles.logoText}>Taxfix</Text>
          <View style={styles.aiTag}>
            <Text style={styles.aiTagText}>AI COPILOT</Text>
          </View>
        </View>

        <View style={styles.titleContainer}>
          <View style={styles.headlineWrapper}>
            <Text style={styles.title}>German Tax Deduction Copilot</Text>
            <View style={styles.countryBadge}>
              <Text style={styles.flag}>🇩🇪</Text>
              <Text style={styles.countryText}>DE § EStG</Text>
            </View>
          </View>
          <Text style={styles.subtitle}>
            Autonomous Werbungskosten & Relocation Optimizer for Tech Workers & Expats
          </Text>
        </View>
      </View>

      <View style={styles.actionsRow}>
        <View style={styles.statusPill}>
          <View style={styles.onlineDot} />
          <Text style={styles.statusText}>Tool Engine Active</Text>
        </View>

        {onReset && (
          <TouchableOpacity
            style={styles.resetButton}
            onPress={onReset}
            activeOpacity={0.7}
            accessibilityLabel="Reset calculation"
          >
            <AppIcon name="refresh" size={14} color={THEME.colors.textSecondary} />
            <Text style={styles.resetText}>Reset</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: THEME.colors.backgroundAlt,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.cardBorder,
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: 12,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
    minWidth: 280,
  },
  logoBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#000000',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: THEME.radius.md,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorderLight,
    gap: 6,
  },
  logoText: {
    color: THEME.colors.primary,
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  aiTag: {
    backgroundColor: THEME.colors.primarySubtle,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: THEME.radius.xs,
  },
  aiTagText: {
    color: THEME.colors.primary,
    fontSize: 9,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  titleContainer: {
    flex: 1,
  },
  headlineWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  title: {
    color: THEME.colors.textPrimary,
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: -0.2,
  },
  countryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.card,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: THEME.radius.pill,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
    gap: 4,
  },
  flag: {
    fontSize: 11,
  },
  countryText: {
    color: THEME.colors.textSecondary,
    fontSize: 10,
    fontWeight: '600',
  },
  subtitle: {
    color: THEME.colors.textMuted,
    fontSize: 12,
    marginTop: 2,
  },
  actionsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.card,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: THEME.radius.pill,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
    gap: 6,
  },
  onlineDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: THEME.colors.primary,
  },
  statusText: {
    color: THEME.colors.textSecondary,
    fontSize: 11,
    fontWeight: '500',
  },
  resetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.card,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: THEME.radius.pill,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
    gap: 4,
  },
  resetText: {
    color: THEME.colors.textSecondary,
    fontSize: 11,
    fontWeight: '500',
  },
});
