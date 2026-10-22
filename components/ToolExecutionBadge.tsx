import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { THEME } from '../constants/theme';
import { AppIcon } from './Icon';

interface ToolExecutionBadgeProps {
  toolName: string;
  parameters: Record<string, any>;
  summary?: string;
  isStreaming?: boolean;
}

export const ToolExecutionBadge: React.FC<ToolExecutionBadgeProps> = ({
  toolName,
  parameters,
  summary,
  isStreaming,
}) => {
  const [expanded, setExpanded] = useState(false);

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.header}
        onPress={() => setExpanded(!expanded)}
        activeOpacity={0.8}
      >
        <View style={styles.leftRow}>
          <View style={styles.toolIconWrap}>
            <AppIcon name="code-slash" size={13} color={THEME.colors.primary} />
          </View>
          <View>
            <View style={styles.titleRow}>
              <Text style={styles.toolPrefix}>Tool Call:</Text>
              <Text style={styles.toolName}>{toolName}</Text>
            </View>
            {summary && <Text style={styles.summaryText}>{summary}</Text>}
          </View>
        </View>

        <View style={styles.rightRow}>
          <View style={[styles.statusBadge, isStreaming ? styles.statusStreaming : styles.statusSuccess]}>
            <View style={[styles.dot, isStreaming ? styles.dotStreaming : styles.dotSuccess]} />
            <Text style={[styles.statusLabel, isStreaming ? styles.statusLabelStreaming : styles.statusLabelSuccess]}>
              {isStreaming ? 'Executing...' : '200 OK'}
            </Text>
          </View>
          <Text style={styles.chevron}>{expanded ? '▲' : '▼'}</Text>
        </View>
      </TouchableOpacity>

      {expanded && (
        <View style={styles.expandedContent}>
          <Text style={styles.jsonHeader}>Structured Tool Arguments (JSON Schema):</Text>
          <View style={styles.codeBox}>
            <Text style={styles.codeText}>
              {JSON.stringify(parameters, null, 2)}
            </Text>
          </View>
          <View style={styles.citationFooter}>
            <AppIcon name="shield-checkmark" size={12} color={THEME.colors.primary} />
            <Text style={styles.citationText}>
              Deterministic Statutory Engine: § 4 Abs. 5 & § 9 EStG
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radius.md,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorderLight,
    marginVertical: 6,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'rgba(0, 208, 132, 0.04)',
  },
  leftRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
  },
  toolIconWrap: {
    width: 26,
    height: 26,
    borderRadius: THEME.radius.sm,
    backgroundColor: THEME.colors.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  toolPrefix: {
    color: THEME.colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  toolName: {
    color: THEME.colors.primary,
    fontSize: 12,
    fontWeight: '700',
    fontFamily: THEME.fonts.mono,
  },
  summaryText: {
    color: THEME.colors.textSecondary,
    fontSize: 11,
    marginTop: 2,
  },
  rightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: THEME.radius.pill,
    gap: 4,
  },
  statusSuccess: {
    backgroundColor: THEME.colors.primarySubtle,
  },
  statusStreaming: {
    backgroundColor: THEME.colors.accentAmberSubtle,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  dotSuccess: {
    backgroundColor: THEME.colors.primary,
  },
  dotStreaming: {
    backgroundColor: THEME.colors.accentAmber,
  },
  statusLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  statusLabelSuccess: {
    color: THEME.colors.primary,
  },
  statusLabelStreaming: {
    color: THEME.colors.accentAmber,
  },
  chevron: {
    color: THEME.colors.textMuted,
    fontSize: 10,
  },
  expandedContent: {
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.cardBorder,
    backgroundColor: THEME.colors.codeBg,
  },
  jsonHeader: {
    color: THEME.colors.textSecondary,
    fontSize: 10,
    fontWeight: '600',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  codeBox: {
    backgroundColor: '#05070B',
    padding: 10,
    borderRadius: THEME.radius.sm,
    borderWidth: 1,
    borderColor: THEME.colors.codeBorder,
  },
  codeText: {
    color: THEME.colors.codeText,
    fontFamily: THEME.fonts.mono,
    fontSize: 11,
    lineHeight: 16,
  },
  citationFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  citationText: {
    color: THEME.colors.textMuted,
    fontSize: 10,
    fontStyle: 'italic',
  },
});
