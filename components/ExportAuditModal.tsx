import React, { useState } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { THEME } from '../constants/theme';
import {
  downloadJSONFile,
  generateTaxfixAuditJSON,
  TaxfixAuditExport,
} from '../utils/exportHelper';
import { TaxCalculationResult, TaxInputParameters } from '../types/tax';
import { AppIcon } from './Icon';

interface ExportAuditModalProps {
  visible: boolean;
  onClose: () => void;
  parameters: TaxInputParameters;
  calculation: TaxCalculationResult;
}

export const ExportAuditModal: React.FC<ExportAuditModalProps> = ({
  visible,
  onClose,
  parameters,
  calculation,
}) => {
  const [copied, setCopied] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [activeTab, setActiveTab] = useState<'json' | 'checklist'>('json');

  const auditData: TaxfixAuditExport = generateTaxfixAuditJSON(parameters, calculation);
  const jsonString = JSON.stringify(auditData, null, 2);

  const handleCopy = () => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        navigator.clipboard.writeText(jsonString);
      }
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleDownload = () => {
    const filename = `taxfix-werbungskosten-audit-${Date.now()}.json`;
    const ok = downloadJSONFile(auditData, filename);
    if (ok) {
      setDownloadSuccess(true);
      setTimeout(() => setDownloadSuccess(false), 2500);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <View style={styles.modalTitleRow}>
              <View style={styles.iconBox}>
                <AppIcon name="shield-checkmark" size={18} color={THEME.colors.primary} />
              </View>
              <View>
                <Text style={styles.modalTitle}>Taxfix Audit JSON Export</Text>
                <Text style={styles.modalSubtitle}>
                  Compliant for German Finanzamt Anlage N & Expat Verification
                </Text>
              </View>
            </View>

            <TouchableOpacity style={styles.closeBtn} onPress={onClose} activeOpacity={0.7}>
              <AppIcon name="close" size={18} color={THEME.colors.textMuted} />
            </TouchableOpacity>
          </View>

          {/* Meta Banner */}
          <View style={styles.metaBanner}>
            <View style={styles.metaCol}>
              <Text style={styles.metaLabel}>Total Werbungskosten</Text>
              <Text style={styles.metaVal}>€{calculation.grossWerbungskosten.toLocaleString('de-DE')}</Text>
            </View>
            <View style={styles.metaCol}>
              <Text style={styles.metaLabel}>Estimated Refund Boost</Text>
              <Text style={[styles.metaVal, { color: THEME.colors.primary }]}>
                +€{calculation.estimatedRefundBoost.toLocaleString('de-DE')}
              </Text>
            </View>
            <View style={styles.metaCol}>
              <Text style={styles.metaLabel}>Audit Safety</Text>
              <Text style={[styles.metaVal, { color: THEME.colors.accentBlue }]}>
                {calculation.auditSafetyScore}% Safe
              </Text>
            </View>
          </View>

          {/* Tab Selector */}
          <View style={styles.tabBar}>
            <TouchableOpacity
              style={[styles.tabItem, activeTab === 'json' && styles.tabItemActive]}
              onPress={() => setActiveTab('json')}
            >
              <AppIcon name="code-slash" size={14} color={activeTab === 'json' ? THEME.colors.primary : THEME.colors.textMuted} />
              <Text style={[styles.tabText, activeTab === 'json' && styles.tabTextActive]}>
                Audit JSON Payload
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tabItem, activeTab === 'checklist' && styles.tabItemActive]}
              onPress={() => setActiveTab('checklist')}
            >
              <AppIcon name="shield-checkmark" size={14} color={activeTab === 'checklist' ? THEME.colors.primary : THEME.colors.textMuted} />
              <Text style={[styles.tabText, activeTab === 'checklist' && styles.tabTextActive]}>
                Finanzamt Audit Defense ({auditData.auditDefencePackage.requiredDocuments.length} docs)
              </Text>
            </TouchableOpacity>
          </View>

          {/* Content Body */}
          <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
            {activeTab === 'json' ? (
              <View style={styles.codeContainer}>
                <View style={styles.checksumRow}>
                  <Text style={styles.checksumLabel}>Checksum:</Text>
                  <Text style={styles.checksumVal}>{auditData.auditChecksum}</Text>
                </View>
                <Text style={styles.jsonCodeText}>{jsonString}</Text>
              </View>
            ) : (
              <View style={styles.checklistContainer}>
                <Text style={styles.sectionHeader}>Required Documentation for Audit Defense:</Text>
                {auditData.auditDefencePackage.requiredDocuments.length > 0 ? (
                  auditData.auditDefencePackage.requiredDocuments.map((doc, idx) => (
                    <View key={idx} style={styles.checkItem}>
                      <AppIcon name="checkmark-circle" size={16} color={THEME.colors.primary} />
                      <Text style={styles.checkText}>{doc}</Text>
                    </View>
                  ))
                ) : (
                  <View style={styles.checkItem}>
                    <AppIcon name="checkmark-circle" size={16} color={THEME.colors.primary} />
                    <Text style={styles.checkText}>
                      All claimed items fall under statutory flat rates (Pauschbeträge). No individual receipts strictly required!
                    </Text>
                  </View>
                )}

                <Text style={[styles.sectionHeader, { marginTop: 18 }]}>
                  Finanzamt Submission & Anlage N Advice:
                </Text>
                {auditData.auditDefencePackage.finanzamtSubmissionTips.map((tip, idx) => (
                  <View key={idx} style={styles.tipItem}>
                    <Text style={styles.tipBullet}>§</Text>
                    <Text style={styles.tipText}>{tip}</Text>
                  </View>
                ))}
              </View>
            )}
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.footerRow}>
            <TouchableOpacity
              style={[styles.copyBtn, copied && styles.btnSuccess]}
              onPress={handleCopy}
              activeOpacity={0.7}
            >
              <AppIcon
                name={copied ? 'checkmark-circle' : 'copy'}
                size={16}
                color={copied ? '#FFFFFF' : THEME.colors.textPrimary}
              />
              <Text style={[styles.btnText, copied && { color: '#FFFFFF' }]}>
                {copied ? 'Copied to Clipboard!' : 'Copy Audit JSON'}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.downloadBtn, downloadSuccess && styles.btnSuccess]}
              onPress={handleDownload}
              activeOpacity={0.7}
            >
              <AppIcon
                name={downloadSuccess ? 'checkmark-circle' : 'download'}
                size={16}
                color="#000000"
              />
              <Text style={styles.downloadBtnText}>
                {downloadSuccess ? 'Downloaded!' : 'Download .JSON'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(5, 8, 14, 0.82)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
  },
  modalCard: {
    backgroundColor: THEME.colors.background,
    width: '100%',
    maxWidth: 680,
    maxHeight: '90%',
    borderRadius: THEME.radius.lg,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
    overflow: 'hidden',
    display: 'flex',
    flexDirection: 'column',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.cardBorder,
  },
  modalTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  iconBox: {
    width: 36,
    height: 36,
    borderRadius: THEME.radius.md,
    backgroundColor: THEME.colors.primarySubtle,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalTitle: {
    color: THEME.colors.textPrimary,
    fontSize: 16,
    fontWeight: '700',
  },
  modalSubtitle: {
    color: THEME.colors.textMuted,
    fontSize: 12,
  },
  closeBtn: {
    padding: 6,
    borderRadius: THEME.radius.sm,
    backgroundColor: THEME.colors.card,
  },
  metaBanner: {
    flexDirection: 'row',
    backgroundColor: THEME.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.cardBorder,
    paddingVertical: 10,
    paddingHorizontal: 16,
    justifyContent: 'space-around',
  },
  metaCol: {
    alignItems: 'center',
  },
  metaLabel: {
    color: THEME.colors.textMuted,
    fontSize: 10,
    textTransform: 'uppercase',
    fontWeight: '600',
  },
  metaVal: {
    color: THEME.colors.textPrimary,
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.cardBorder,
    backgroundColor: THEME.colors.backgroundAlt,
  },
  tabItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabItemActive: {
    borderBottomColor: THEME.colors.primary,
  },
  tabText: {
    color: THEME.colors.textMuted,
    fontSize: 12,
    fontWeight: '500',
  },
  tabTextActive: {
    color: THEME.colors.primary,
    fontWeight: '700',
  },
  scrollArea: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
  },
  codeContainer: {
    backgroundColor: THEME.colors.codeBg,
    borderRadius: THEME.radius.md,
    padding: 12,
    borderWidth: 1,
    borderColor: THEME.colors.codeBorder,
  },
  checksumRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.codeBorder,
  },
  checksumLabel: {
    color: THEME.colors.textMuted,
    fontSize: 10,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  checksumVal: {
    color: THEME.colors.accentBlue,
    fontSize: 11,
    fontFamily: THEME.fonts.mono,
    fontWeight: '600',
  },
  jsonCodeText: {
    color: THEME.colors.codeText,
    fontFamily: THEME.fonts.mono,
    fontSize: 11,
    lineHeight: 17,
  },
  checklistContainer: {
    backgroundColor: THEME.colors.card,
    borderRadius: THEME.radius.md,
    padding: 16,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
  },
  sectionHeader: {
    color: THEME.colors.textPrimary,
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 10,
  },
  checkItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    marginBottom: 10,
  },
  checkText: {
    color: THEME.colors.textSecondary,
    fontSize: 12,
    flex: 1,
    lineHeight: 18,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 8,
  },
  tipBullet: {
    color: THEME.colors.primary,
    fontSize: 14,
    fontWeight: '700',
  },
  tipText: {
    color: THEME.colors.textSecondary,
    fontSize: 12,
    flex: 1,
    lineHeight: 18,
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    padding: 14,
    backgroundColor: THEME.colors.backgroundAlt,
    borderTopWidth: 1,
    borderTopColor: THEME.colors.cardBorder,
    gap: 10,
  },
  copyBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.card,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: THEME.radius.md,
    borderWidth: 1,
    borderColor: THEME.colors.cardBorderLight,
    gap: 6,
  },
  downloadBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: THEME.colors.primary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: THEME.radius.md,
    gap: 6,
  },
  btnSuccess: {
    backgroundColor: '#059669',
  },
  btnText: {
    color: THEME.colors.textPrimary,
    fontSize: 12,
    fontWeight: '600',
  },
  downloadBtnText: {
    color: '#000000',
    fontSize: 12,
    fontWeight: '700',
  },
});
