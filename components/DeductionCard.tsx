import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { THEME } from '../constants/theme';
import { TAX_CONSTANTS } from '../constants/taxConstants';
import {
  RelocationType,
  TaxCalculationResult,
  TaxInputParameters,
} from '../types/tax';
import { AppIcon, IconName } from './Icon';

interface DeductionCardProps {
  calculation: TaxCalculationResult;
  parameters: TaxInputParameters;
  onUpdateParameters: (newParams: Partial<TaxInputParameters>) => void;
  onOpenExportModal: () => void;
}

export const DeductionCard: React.FC<DeductionCardProps> = ({
  calculation,
  parameters,
  onUpdateParameters,
  onOpenExportModal,
}) => {
  const [showTuning, setShowTuning] = useState(false);

  // Category Icon Resolver
  const getCategoryIcon = (category: string): IconName => {
    switch (category) {
      case 'homeoffice':
        return 'home';
      case 'relocation':
        return 'airplane';
      case 'equipment':
        return 'laptop';
      case 'telecom':
        return 'swap-horizontal';
      default:
        return 'briefcase';
    }
  };

  // Progress percentage against standard Pauschbetrag (€1,230)
  const pauschbetragPercent = Math.min(
    100,
    Math.round((calculation.grossWerbungskosten / calculation.standardPauschbetrag) * 100)
  );

  return (
    <View style={styles.cardWrapper}>
      {/* KPI Top Hero */}
      <View style={styles.kpiContainer}>
        <View style={styles.kpiTopRow}>
          <View style={styles.kpiBadge}>
            <View style={styles.kpiDot} />
            <Text style={styles.kpiBadgeText}>LIVE ESTIMATE</Text>
          </View>
          <View style={styles.taxRateTag}>
            <Text style={styles.taxRateTagText}>
              {(calculation.marginalTaxRate * 100).toFixed(0)}% Marginal Bracket
            </Text>
          </View>
        </View>

        <Text style={styles.kpiLabel}>Estimated Refund Boost</Text>
        <Text style={styles.kpiValue}>
          +€{calculation.estimatedRefundBoost.toLocaleString('de-DE')}
        </Text>

        <Text style={styles.kpiSubtext}>
          Total Itemized Werbungskosten:{' '}
          <Text style={styles.kpiHighlight}>
            €{calculation.grossWerbungskosten.toLocaleString('de-DE')}
          </Text>
        </Text>

        {/* Comparison Bar: Itemized vs €1,230 Standard Pauschbetrag */}
        <View style={styles.comparisonBox}>
          <View style={styles.comparisonLabelRow}>
            <Text style={styles.compLabelText}>
              German Standard Pauschbetrag: €{calculation.standardPauschbetrag.toLocaleString('de-DE')}
            </Text>
            <Text style={styles.compValueText}>
              {calculation.grossWerbungskosten >= calculation.standardPauschbetrag
                ? `+€${calculation.netDeductionAbovePauschbetrag.toLocaleString('de-DE')} Net Benefit`
                : 'Below Pauschbetrag'}
            </Text>
          </View>
          <View style={styles.progressBarTrack}>
            <View
              style={[
                styles.progressBarFill,
                { width: `${Math.min(100, pauschbetragPercent)}%` },
                calculation.grossWerbungskosten > calculation.standardPauschbetrag && styles.progressBarSurpassed,
              ]}
            />
          </View>
        </View>
      </View>

      {/* Itemized Deductions List */}
      <View style={styles.sectionHeaderRow}>
        <View style={styles.sectionTitleWrap}>
          <AppIcon name="calculator" size={15} color={THEME.colors.primary} />
          <Text style={styles.sectionTitle}>Itemized Werbungskosten Breakdown</Text>
        </View>
        <TouchableOpacity
          style={styles.tuneToggleBtn}
          onPress={() => setShowTuning(!showTuning)}
          activeOpacity={0.7}
        >
          <AppIcon name="settings" size={12} color={THEME.colors.textSecondary} />
          <Text style={styles.tuneToggleText}>
            {showTuning ? 'Hide Controls' : 'Tune Values'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Direct Manipulation Tuning Panel */}
      {showTuning && (
        <View style={styles.tuningPanel}>
          <Text style={styles.tuningHeader}>Direct Statutory Parameters:</Text>

          {/* Home Office Days */}
          <View style={styles.controlRow}>
            <View>
              <Text style={styles.controlLabel}>Home Office Days (Max 210):</Text>
              <Text style={styles.controlSub}>{parameters.homeOfficeDays} days = €{(Math.min(210, parameters.homeOfficeDays) * 6)}</Text>
            </View>
            <View style={styles.stepperGroup}>
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() =>
                  onUpdateParameters({
                    homeOfficeDays: Math.max(0, parameters.homeOfficeDays - 10),
                  })
                }
              >
                <Text style={styles.stepBtnText}>-10</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.stepBtn}
                onPress={() =>
                  onUpdateParameters({
                    homeOfficeDays: Math.min(210, parameters.homeOfficeDays + 10),
                  })
                }
              >
                <Text style={styles.stepBtnText}>+10</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.stepBtn, styles.stepBtnCap]}
                onPress={() => onUpdateParameters({ homeOfficeDays: 210 })}
              >
                <Text style={styles.stepBtnTextCap}>Max (210)</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Relocation Status */}
          <View style={styles.controlRow}>
            <View>
              <Text style={styles.controlLabel}>Job Relocation (Umzug):</Text>
              <Text style={styles.controlSub}>
                {parameters.relocationType === 'single'
                  ? 'Single (€964)'
                  : parameters.relocationType === 'married'
                  ? 'Married (€1,928)'
                  : 'None (€0)'}
              </Text>
            </View>
            <View style={styles.stepperGroup}>
              {(['none', 'single', 'married'] as RelocationType[]).map(type => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.choiceBtn,
                    parameters.relocationType === type && styles.choiceBtnActive,
                  ]}
                  onPress={() => onUpdateParameters({ relocationType: type })}
                >
                  <Text
                    style={[
                      styles.choiceBtnText,
                      parameters.relocationType === type && styles.choiceBtnTextActive,
                    ]}
                  >
                    {type.toUpperCase()}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Marginal Tax Bracket */}
          <View style={styles.controlRow}>
            <View>
              <Text style={styles.controlLabel}>Marginal Tax Rate:</Text>
              <Text style={styles.controlSub}>
                Estimated bracket: {(parameters.marginalTaxRate || 0.4) * 100}%
              </Text>
            </View>
            <View style={styles.stepperGroup}>
              {[0.35, 0.40, 0.42].map(rate => (
                <TouchableOpacity
                  key={rate}
                  style={[
                    styles.choiceBtn,
                    parameters.marginalTaxRate === rate && styles.choiceBtnActive,
                  ]}
                  onPress={() => onUpdateParameters({ marginalTaxRate: rate })}
                >
                  <Text
                    style={[
                      styles.choiceBtnText,
                      parameters.marginalTaxRate === rate && styles.choiceBtnTextActive,
                    ]}
                  >
                    {(rate * 100).toFixed(0)}%
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>
      )}

      {/* Itemized Cards */}
      <ScrollView style={styles.itemsScroll} nestedScrollEnabled>
        {calculation.items.map(item => (
          <View key={item.id} style={styles.deductionItemCard}>
            <View style={styles.itemHeaderRow}>
              <View style={styles.itemTitleGroup}>
                <View style={styles.categoryIconWrap}>
                  <AppIcon
                    name={getCategoryIcon(item.category)}
                    size={15}
                    color={THEME.colors.primary}
                  />
                </View>
                <View>
                  <Text style={styles.itemTitle}>{item.title}</Text>
                  <Text style={styles.itemGermanTitle}>{item.germanTitle}</Text>
                </View>
              </View>

              <View style={styles.itemAmountBox}>
                <Text style={styles.itemAmount}>
                  €{item.amount.toLocaleString('de-DE')}
                </Text>
                {item.isCapped && (
                  <View style={styles.cappedTag}>
                    <Text style={styles.cappedTagText}>Legal Cap</Text>
                  </View>
                )}
              </View>
            </View>

            {/* Formula & Rule Citation */}
            <View style={styles.formulaRow}>
              <Text style={styles.formulaText}>{item.breakdownFormula}</Text>
            </View>

            <View style={styles.itemFooterRow}>
              <View style={styles.citationBadge}>
                <Text style={styles.citationBadgeText}>{item.statutoryCitation}</Text>
              </View>
              <Text style={styles.itemTipText}>{item.taxTip}</Text>
            </View>
          </View>
        ))}

        {calculation.items.length === 0 && (
          <View style={styles.emptyState}>
            <AppIcon name="information-circle" size={24} color={THEME.colors.textMuted} />
            <Text style={styles.emptyStateText}>
              No deductions claimed yet. Select a prompt chip above or describe your work scenario!
            </Text>
          </View>
        )}
      </ScrollView>

      {/* Bottom Export Action Area */}
      <View style={styles.actionContainer}>
        <View style={styles.auditScoreRow}>
          <AppIcon name="shield-checkmark" size={14} color={THEME.colors.primary} />
          <Text style={styles.auditScoreLabel}>Finanzamt Audit Safety Rating:</Text>
          <Text style={styles.auditScoreVal}>{calculation.auditSafetyScore}% Verified</Text>
        </View>

        <TouchableOpacity
          style={styles.exportButton}
          onPress={onOpenExportModal}
          activeOpacity={0.8}
        >
          <AppIcon name="download" size={17} color="#000000" />
          <Text style={styles.exportButtonText}>Export to Taxfix Audit JSON</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cardWrapper: {
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radius.lg,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
    overflow: 'hidden',
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  kpiContainer: {
    backgroundColor: '#0D1420',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.cardBorder,
  },
  kpiTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  kpiBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.primarySubtle,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: THEME.radius.pill,
    gap: 5,
  },
  kpiDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: THEME.colors.primary,
  },
  kpiBadgeText: {
    color: THEME.colors.primary,
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  taxRateTag: {
    backgroundColor: THEME.colors.background,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: THEME.radius.sm,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
  },
  taxRateTagText: {
    color: THEME.colors.textSecondary,
    fontSize: 11,
    fontWeight: '500',
  },
  kpiLabel: {
    color: THEME.colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  kpiValue: {
    color: THEME.colors.primary,
    fontSize: 34,
    fontWeight: '800',
    letterSpacing: -1,
    marginVertical: 4,
  },
  kpiSubtext: {
    color: THEME.colors.textSecondary,
    fontSize: 13,
    marginBottom: 12,
  },
  kpiHighlight: {
    color: THEME.colors.textPrimary,
    fontWeight: '700',
  },
  comparisonBox: {
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radius.md,
    padding: 10,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorderLight,
  },
  comparisonLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  compLabelText: {
    color: THEME.colors.textMuted,
    fontSize: 11,
    fontWeight: '500',
  },
  compValueText: {
    color: THEME.colors.accentBlue,
    fontSize: 11,
    fontWeight: '700',
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: '#090E17',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: THEME.colors.accentBlue,
    borderRadius: 3,
  },
  progressBarSurpassed: {
    backgroundColor: THEME.colors.primary,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.cardBorder,
    backgroundColor: THEME.colors.backgroundAlt,
  },
  sectionTitleWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionTitle: {
    color: THEME.colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  tuneToggleBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.card,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: THEME.radius.sm,
    gap: 4,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorderLight,
  },
  tuneToggleText: {
    color: THEME.colors.textSecondary,
    fontSize: 11,
    fontWeight: '600',
  },
  tuningPanel: {
    backgroundColor: '#0D1420',
    padding: 14,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.cardBorder,
  },
  tuningHeader: {
    color: THEME.colors.primary,
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    marginBottom: 10,
    letterSpacing: 0.5,
  },
  controlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
    flexWrap: 'wrap',
    gap: 8,
  },
  controlLabel: {
    color: THEME.colors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  controlSub: {
    color: THEME.colors.textMuted,
    fontSize: 11,
  },
  stepperGroup: {
    flexDirection: 'row',
    gap: 6,
  },
  stepBtn: {
    backgroundColor: THEME.colors.card,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: THEME.radius.sm,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorderLight,
  },
  stepBtnCap: {
    backgroundColor: THEME.colors.primarySubtle,
    borderColor: THEME.colors.primaryBorder,
  },
  stepBtnText: {
    color: THEME.colors.textPrimary,
    fontSize: 11,
    fontWeight: '600',
  },
  stepBtnTextCap: {
    color: THEME.colors.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  choiceBtn: {
    backgroundColor: THEME.colors.card,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: THEME.radius.sm,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorderLight,
  },
  choiceBtnActive: {
    backgroundColor: THEME.colors.primary,
    borderColor: THEME.colors.primary,
  },
  choiceBtnText: {
    color: THEME.colors.textSecondary,
    fontSize: 10,
    fontWeight: '600',
  },
  choiceBtnTextActive: {
    color: '#000000',
    fontWeight: '700',
  },
  itemsScroll: {
    flex: 1,
    padding: 12,
  },
  deductionItemCard: {
    backgroundColor: THEME.colors.backgroundAlt,
    borderRadius: THEME.radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorderLight,
    marginBottom: 10,
  },
  itemHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  itemTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  categoryIconWrap: {
    width: 30,
    height: 30,
    borderRadius: THEME.radius.sm,
    backgroundColor: THEME.colors.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemTitle: {
    color: THEME.colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
  },
  itemGermanTitle: {
    color: THEME.colors.textMuted,
    fontSize: 11,
    fontStyle: 'italic',
  },
  itemAmountBox: {
    alignItems: 'flex-end',
  },
  itemAmount: {
    color: THEME.colors.primary,
    fontSize: 15,
    fontWeight: '800',
  },
  cappedTag: {
    backgroundColor: THEME.colors.accentAmberSubtle,
    paddingHorizontal: 5,
    paddingVertical: 2,
    borderRadius: 3,
    marginTop: 2,
  },
  cappedTagText: {
    color: THEME.colors.accentAmber,
    fontSize: 9,
    fontWeight: '700',
  },
  formulaRow: {
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radius.sm,
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginVertical: 6,
  },
  formulaText: {
    color: THEME.colors.textSecondary,
    fontSize: 11,
    fontFamily: THEME.fonts.mono,
  },
  itemFooterRow: {
    gap: 4,
    marginTop: 4,
  },
  citationBadge: {
    alignSelf: 'flex-start',
    backgroundColor: THEME.colors.card,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: THEME.radius.xs,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
  },
  citationBadgeText: {
    color: THEME.colors.accentBlue,
    fontSize: 10,
    fontFamily: THEME.fonts.mono,
    fontWeight: '600',
  },
  itemTipText: {
    color: THEME.colors.textMuted,
    fontSize: 11,
    lineHeight: 15,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 40,
    gap: 10,
  },
  emptyStateText: {
    color: THEME.colors.textMuted,
    fontSize: 12,
    textAlign: 'center',
    maxWidth: 240,
  },
  actionContainer: {
    padding: 14,
    backgroundColor: THEME.colors.backgroundAlt,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.cardBorder,
    gap: 10,
  },
  auditScoreRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  auditScoreLabel: {
    color: THEME.colors.textMuted,
    fontSize: 11,
  },
  auditScoreVal: {
    color: THEME.colors.primary,
    fontSize: 11,
    fontWeight: '700',
  },
  exportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.colors.primary,
    paddingVertical: 12,
    borderRadius: THEME.radius.md,
    gap: 8,
    ...THEME.shadows.glow,
  },
  exportButtonText: {
    color: '#000000',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
});
