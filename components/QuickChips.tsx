import React from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { THEME } from '../constants/theme';
import { PROMPT_CHIPS } from '../services/copilotService';
import { AppIcon, IconName } from './Icon';

interface QuickChipsProps {
  onSelectChip: (promptText: string) => void;
  disabled?: boolean;
}

export const QuickChips: React.FC<QuickChipsProps> = ({ onSelectChip, disabled }) => {
  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <AppIcon name="sparkles" size={13} color={THEME.colors.primary} />
        <Text style={styles.headerLabel}>Quick Expat & Tech Scenarios:</Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
      >
        {PROMPT_CHIPS.map(chip => (
          <TouchableOpacity
            key={chip.id}
            style={styles.chipButton}
            onPress={() => onSelectChip(chip.prompt)}
            disabled={disabled}
            activeOpacity={0.7}
          >
            <View style={styles.chipIconWrap}>
              <AppIcon name={chip.icon as IconName} size={14} color={THEME.colors.primary} />
            </View>
            <View style={styles.chipContent}>
              <Text style={styles.chipTitle}>{chip.label}</Text>
              <Text style={styles.chipBadge}>{chip.badge}</Text>
            </View>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: THEME.colors.backgroundAlt,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.cardBorder,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 8,
  },
  headerLabel: {
    color: THEME.colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  scrollContent: {
    flexDirection: 'row',
    gap: 8,
    paddingRight: 16,
  },
  chipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.card,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: THEME.radius.md,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorderLight,
    gap: 10,
    maxWidth: 290,
  },
  chipIconWrap: {
    width: 28,
    height: 28,
    borderRadius: THEME.radius.sm,
    backgroundColor: THEME.colors.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipContent: {
    flex: 1,
  },
  chipTitle: {
    color: THEME.colors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  chipBadge: {
    color: THEME.colors.primary,
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
  },
});
