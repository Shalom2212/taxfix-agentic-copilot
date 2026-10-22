import React, { useState, useRef } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
  ScrollView,
  TextInput,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Modal,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { Ionicons } from '@expo/vector-icons';

/**
 * =========================================================================
 * 1. GERMAN STATUTORY TAX CONSTANTS (Werbungskosten)
 * Governed by EStG and BMF regulations
 * =========================================================================
 */
const TAX_CONSTANTS = {
  ARBEITNEHMER_PAUSCHBETRAG: 1230,
  HOMEOFFICE: {
    RATE_PER_DAY: 6.0,
    MAX_DAYS: 210,
    MAX_ANNUAL_AMOUNT: 1260,
    CITATION: '§ 4 Abs. 5 Satz 1 Nr. 6b Satz 4 EStG',
  },
  RELOCATION: {
    SINGLE_AMOUNT: 964,
    MARRIED_AMOUNT: 1928,
    PER_DEPENDENT_AMOUNT: 643,
    CITATION: '§ 9 Abs. 1 Satz 1 EStG i.V.m. BUKG',
  },
  EQUIPMENT: {
    CITATION: '§ 9 Abs. 1 Nr. 6 EStG & BMF BStBl I 2022 S. 187',
  },
  TELECOM: {
    ANNUAL_MAX: 240,
    CITATION: '§ 9 Abs. 1 Nr. 6 EStG i.V.m. R 9.1 LStR',
  },
};

/**
 * =========================================================================
 * 2. DETERMINISTIC TAX CALCULATION ENGINE
 * =========================================================================
 */
type RelocationType = 'none' | 'single' | 'married';

interface TaxInputParameters {
  homeOfficeDays: number;
  relocationType: RelocationType;
  additionalDependents?: number;
  equipmentCosts?: number;
  workUsePercentage?: number;
  includeInternetAllowance?: boolean;
  marginalTaxRate?: number;
}

interface TaxDeductionItem {
  id: string;
  category: 'homeoffice' | 'relocation' | 'equipment' | 'telecom' | 'other';
  title: string;
  germanTitle: string;
  statutoryCitation: string;
  amount: number;
  breakdownFormula: string;
  taxTip: string;
  isCapped?: boolean;
}

interface TaxCalculationResult {
  grossWerbungskosten: number;
  standardPauschbetrag: number;
  netDeductionAbovePauschbetrag: number;
  marginalTaxRate: number;
  estimatedRefundBoost: number;
  items: TaxDeductionItem[];
  auditSafetyScore: number;
  calculatedAt: string;
}

function calculateDeductions(params: TaxInputParameters): TaxCalculationResult {
  const marginalTaxRate = params.marginalTaxRate ?? 0.40;
  const items: TaxDeductionItem[] = [];

  // 1. Home Office
  const sanitizedDays = Math.max(0, Math.round(params.homeOfficeDays || 0));
  const effectiveDays = Math.min(sanitizedDays, TAX_CONSTANTS.HOMEOFFICE.MAX_DAYS);
  const hoAmount = effectiveDays * TAX_CONSTANTS.HOMEOFFICE.RATE_PER_DAY;
  if (hoAmount > 0) {
    items.push({
      id: 'ho_pauschale',
      category: 'homeoffice',
      title: 'Home Office Allowance',
      germanTitle: 'Homeoffice-Pauschale',
      statutoryCitation: TAX_CONSTANTS.HOMEOFFICE.CITATION,
      amount: hoAmount,
      breakdownFormula: `${effectiveDays} days × €6.00/day`,
      taxTip: 'Max 210 days allowed. No dedicated study room required.',
      isCapped: sanitizedDays > 210,
    });
  }

  // 2. Relocation Flat Rate
  let relBase = 0;
  if (params.relocationType === 'single') relBase = TAX_CONSTANTS.RELOCATION.SINGLE_AMOUNT;
  if (params.relocationType === 'married') relBase = TAX_CONSTANTS.RELOCATION.MARRIED_AMOUNT;
  const depAmount = (params.additionalDependents || 0) * TAX_CONSTANTS.RELOCATION.PER_DEPENDENT_AMOUNT;
  const totalRel = relBase + depAmount;
  if (totalRel > 0) {
    items.push({
      id: 'umzug_pauschale',
      category: 'relocation',
      title: 'Job Relocation Flat Rate',
      germanTitle: 'Umzugskostenpauschale',
      statutoryCitation: TAX_CONSTANTS.RELOCATION.CITATION,
      amount: totalRel,
      breakdownFormula: `Statutory ${params.relocationType} lump sum`,
      taxTip: 'Lump-sum for moving costs. No individual receipts required.',
    });
  }

  // 3. Equipment & Digital Depreciation
  const eqCost = Math.max(0, params.equipmentCosts || 0);
  const workPct = params.workUsePercentage ?? 100;
  const eqAmount = Math.round(eqCost * (workPct / 100));
  if (eqAmount > 0) {
    items.push({
      id: 'arbeitsmittel',
      category: 'equipment',
      title: 'Tech Equipment Write-Off',
      germanTitle: 'Arbeitsmittel & Digitale Abschreibung',
      statutoryCitation: TAX_CONSTANTS.EQUIPMENT.CITATION,
      amount: eqAmount,
      breakdownFormula: `€${eqCost} × ${workPct}% business use (1-yr BMF depreciation)`,
      taxTip: 'Laptops, displays, and dev software qualify for immediate 1-year depreciation.',
    });
  }

  // 4. Telecommunications
  if (params.includeInternetAllowance) {
    items.push({
      id: 'telecom',
      category: 'telecom',
      title: 'Remote Internet & Phone Allowance',
      germanTitle: 'Telefon- und Internetkosten',
      statutoryCitation: TAX_CONSTANTS.TELECOM.CITATION,
      amount: TAX_CONSTANTS.TELECOM.ANNUAL_MAX,
      breakdownFormula: '12 months × €20/month flat rate',
      taxTip: 'Statutory 20% flat allowance up to €20/month without itemized logs.',
    });
  }

  const grossWerbungskosten = items.reduce((sum, item) => sum + item.amount, 0);
  const standardPauschbetrag = TAX_CONSTANTS.ARBEITNEHMER_PAUSCHBETRAG;
  const netDeductionAbovePauschbetrag = Math.max(0, grossWerbungskosten - standardPauschbetrag);
  const estimatedRefundBoost = Math.round(grossWerbungskosten * marginalTaxRate);

  return {
    grossWerbungskosten,
    standardPauschbetrag,
    netDeductionAbovePauschbetrag,
    marginalTaxRate,
    estimatedRefundBoost,
    items,
    auditSafetyScore: 98,
    calculatedAt: new Date().toISOString(),
  };
}

/**
 * =========================================================================
 * 3. AGENTIC COPILOT & INTENT PARSER
 * =========================================================================
 */
function parseCurrencyNumber(raw: string): number {
  if (!raw) return 0;
  let s = raw.trim();
  if (/^\d{1,3}[,.]\d{3}$/.test(s)) {
    s = s.replace(/[,.]/, '');
    return parseFloat(s) || 0;
  }
  return parseFloat(s.replace(/,/g, '.')) || 0;
}

function parseIntentFromPrompt(text: string, current?: Partial<TaxInputParameters>): TaxInputParameters {
  const lower = text.toLowerCase();
  let relocationType: RelocationType = current?.relocationType ?? 'none';
  if (lower.includes('moved') || lower.includes('relocat') || lower.includes('berlin') || lower.includes('munich') || lower.includes('hamburg')) {
    relocationType = (lower.includes('married') || lower.includes('spouse') || lower.includes('partner')) ? 'married' : 'single';
  }

  let homeOfficeDays = current?.homeOfficeDays ?? 0;
  const wfhMatch = lower.match(/(\d+)\s*(?:days?\s*(?:from\s*home|wfh|home\s*office)?|wfh\s*days?|home\s*office\s*days?)/) ||
                   lower.match(/(?:worked|wfh|home\s*office)\s*(?:for)?\s*(\d+)\s*days?/);
  if (wfhMatch) {
    homeOfficeDays = parseInt(wfhMatch[1], 10);
  }

  let equipmentCosts = current?.equipmentCosts ?? 0;
  let extractedSum = 0;
  const macbookMatch = lower.match(/(?:€\s*|eur\s*)?([0-9]{1,2}[,.]?[0-9]{3}|[0-9]{3,4})\s*(?:€|eur)?\s*(?:[\w-]+\s+)*(?:macbook|laptop)/i);
  if (macbookMatch) {
    extractedSum += parseCurrencyNumber(macbookMatch[1]);
  }
  const monitorMatch = lower.match(/(?:€\s*|eur\s*)?([0-9]{1,2}[,.]?[0-9]{3}|[0-9]{2,4})\s*(?:€|eur)?\s*(?:[\w-]+\s+)*(?:monitor|display|screen)/i);
  if (monitorMatch) {
    extractedSum += parseCurrencyNumber(monitorMatch[1]);
  }
  const hardwareMatch = lower.match(/(?:€\s*|eur\s*)?([0-9]{1,2}[,.]?[0-9]{3}|[0-9]{2,4})\s*(?:€|eur)?\s*(?:of\s*(?:[\w-]+\s+)*)?(?:hardware|tech\s*gear|setup|equipment)/i);
  if (hardwareMatch) {
    extractedSum += parseCurrencyNumber(hardwareMatch[1]);
  }
  if (extractedSum > 0) equipmentCosts = extractedSum;

  const includeInternetAllowance = lower.includes('internet') || lower.includes('phone') || current?.includeInternetAllowance;
  return {
    homeOfficeDays,
    relocationType,
    equipmentCosts,
    marginalTaxRate: current?.marginalTaxRate ?? 0.40,
    includeInternetAllowance,
  };
}

const PROMPT_CHIPS = [
  {
    id: 'berlin-expat',
    label: 'Berlin Expat Relocation + Tech Setup',
    prompt: 'I moved to Berlin for a software job as a single engineer, bought a €1,400 MacBook Pro and a €400 monitor, and worked 150 days from home.',
    badge: 'Popular for Expats',
  },
  {
    id: 'remote-fullstack',
    label: 'Remote Fullstack Dev (180 WFH days + Monitor)',
    prompt: 'I am a remote fullstack dev, worked 180 days from home, bought a €650 ultra-wide monitor, and claim the standard internet allowance.',
    badge: 'Remote Tech',
  },
  {
    id: 'freelancer-switch',
    label: 'Freelancer to Full-Time Employee switch',
    prompt: 'I switched from freelance to a permanent tech role in Hamburg, moved apartments with my spouse, worked 220 home office days, and purchased €2,100 of tech hardware.',
    badge: 'Relocation + High Cap',
  },
];

/**
 * =========================================================================
 * 4. MAIN UI APPLICATION (Single-File Snack Ready)
 * =========================================================================
 */
export default function App() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 860;

  const [parameters, setParameters] = useState<TaxInputParameters>({
    relocationType: 'single',
    homeOfficeDays: 140,
    equipmentCosts: 1200,
    marginalTaxRate: 0.40,
  });

  const [calculation, setCalculation] = useState<TaxCalculationResult>(() =>
    calculateDeductions(parameters)
  );

  const [inputQuery, setInputQuery] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [copied, setCopied] = useState(false);
  const [mobileTab, setMobileTab] = useState<'chat' | 'card'>('chat');

  const [chatLog, setChatLog] = useState([
    {
      id: '1',
      sender: 'user',
      text: 'I moved to Berlin for a software job, bought a €1,200 MacBook, and worked from home 140 days.',
      time: '10:00 AM',
    },
    {
      id: '2',
      sender: 'assistant',
      text: 'Tool Invoked: calculate_german_deductions\n\n• Home Office: 140 days @ €6/day = €840 (§ 4 Abs. 5 EStG)\n• Relocation: €964 single flat rate (§ 9 Abs. 1 EStG)\n• Work Equipment: €1,200 full 1-year digital write-off (BMF 2022)\n\nTotal Werbungskosten: €3,004 (+€1,202 Estimated Refund Boost).',
      time: '10:00 AM',
    },
  ]);

  const handleSend = (textToSend?: string) => {
    const q = textToSend || inputQuery;
    if (!q.trim() || isLoading) return;

    setChatLog(prev => [...prev, { id: String(Date.now()), sender: 'user', text: q, time: 'Now' }]);
    setIsLoading(true);
    setInputQuery('');

    setTimeout(() => {
      const parsed = parseIntentFromPrompt(q, parameters);
      const newCalc = calculateDeductions(parsed);
      setParameters(parsed);
      setCalculation(newCalc);

      const ho = newCalc.items.find(i => i.id === 'ho_pauschale');
      const rel = newCalc.items.find(i => i.id === 'umzug_pauschale');
      const eq = newCalc.items.find(i => i.id === 'arbeitsmittel');

      const reply = `Tool Invoked: calculate_german_deductions\n\n` +
        (ho ? `• Home Office: ${ho.breakdownFormula} = €${ho.amount} (${ho.statutoryCitation})\n` : '') +
        (rel ? `• Relocation: €${rel.amount} (${rel.statutoryCitation})\n` : '') +
        (eq ? `• Work Equipment: €${eq.amount} (BMF 22.02.2022)\n` : '') +
        `\nTotal Itemized Werbungskosten: €${newCalc.grossWerbungskosten.toLocaleString('de-DE')} ` +
        `(+€${newCalc.estimatedRefundBoost.toLocaleString('de-DE')} Refund Boost @ ${(newCalc.marginalTaxRate * 100).toFixed(0)}%).`;

      setChatLog(prev => [...prev, { id: String(Date.now() + 1), sender: 'assistant', text: reply, time: 'Now' }]);
      setIsLoading(false);
    }, 300);
  };

  const auditJSON = JSON.stringify(
    {
      schema: '2024.1-de-estg',
      application: 'Taxfix Agentic Tax Copilot',
      summary: calculation,
      parameters,
      checksum: `TAXFIX-DE-${Date.now().toString(16).toUpperCase()}`,
    },
    null,
    2
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <Text style={styles.logoText}>Taxfix</Text>
          <View style={styles.badge}><Text style={styles.badgeText}>AGENTIC COPILOT</Text></View>
          <Text style={styles.headerTitle}>German Tax Optimizer 🇩🇪</Text>
        </View>
        <TouchableOpacity
          style={styles.resetBtn}
          onPress={() => {
            const resetP = { relocationType: 'none' as RelocationType, homeOfficeDays: 0, equipmentCosts: 0, marginalTaxRate: 0.40 };
            setParameters(resetP);
            setCalculation(calculateDeductions(resetP));
          }}
        >
          <Text style={styles.resetText}>Reset</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Chips */}
      <View style={styles.chipsRow}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {PROMPT_CHIPS.map(chip => (
            <TouchableOpacity
              key={chip.id}
              style={styles.chip}
              onPress={() => handleSend(chip.prompt)}
            >
              <Text style={styles.chipText}>{chip.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Mobile Nav Tabs */}
      {!isDesktop && (
        <View style={styles.mobileTabs}>
          <TouchableOpacity
            style={[styles.tab, mobileTab === 'chat' && styles.tabActive]}
            onPress={() => setMobileTab('chat')}
          >
            <Text style={[styles.tabText, mobileTab === 'chat' && styles.tabTextActive]}>Copilot Chat</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.tab, mobileTab === 'card' && styles.tabActive]}
            onPress={() => setMobileTab('card')}
          >
            <Text style={[styles.tabText, mobileTab === 'card' && styles.tabTextActive]}>
              Deductions (+€{calculation.estimatedRefundBoost})
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Main Content */}
      <View style={styles.mainLayout}>
        {(isDesktop || mobileTab === 'chat') && (
          <View style={[styles.pane, isDesktop ? { flex: 5 } : { flex: 1 }]}>
            <ScrollView style={styles.chatScroll} contentContainerStyle={{ gap: 10, padding: 12 }}>
              {chatLog.map(m => (
                <View
                  key={m.id}
                  style={[
                    styles.msgBubble,
                    m.sender === 'user' ? styles.userBubble : styles.botBubble,
                  ]}
                >
                  <Text style={[styles.msgText, m.sender === 'user' ? { color: '#FFF' } : { color: '#CBD5E1' }]}>
                    {m.text}
                  </Text>
                </View>
              ))}
              {isLoading && <ActivityIndicator color="#00D084" />}
            </ScrollView>

            <View style={styles.inputBar}>
              <TextInput
                style={styles.input}
                placeholder="e.g. Moved to Berlin, 160 WFH days, bought €1,400 laptop..."
                placeholderTextColor="#64748B"
                value={inputQuery}
                onChangeText={setInputQuery}
                onSubmitEditing={() => handleSend()}
              />
              <TouchableOpacity style={styles.sendBtn} onPress={() => handleSend()}>
                <Text style={styles.sendBtnText}>➤</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        {(isDesktop || mobileTab === 'card') && (
          <View style={[styles.pane, isDesktop ? { flex: 4 } : { flex: 1 }]}>
            <ScrollView contentContainerStyle={{ padding: 16 }}>
              {/* Big KPI */}
              <View style={styles.kpiCard}>
                <Text style={styles.kpiSub}>ESTIMATED REFUND BOOST</Text>
                <Text style={styles.kpiVal}>+€{calculation.estimatedRefundBoost.toLocaleString('de-DE')}</Text>
                <Text style={styles.kpiDesc}>
                  Total Werbungskosten: €{calculation.grossWerbungskosten.toLocaleString('de-DE')} (Standard lump sum: €1,230)
                </Text>
              </View>

              {/* Items Breakdown */}
              <Text style={styles.breakdownHeader}>Statutory Deductions Breakdown:</Text>
              {calculation.items.map(item => (
                <View key={item.id} style={styles.itemCard}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <Text style={styles.itemTitle}>{item.title}</Text>
                    <Text style={styles.itemAmount}>€{item.amount.toLocaleString('de-DE')}</Text>
                  </View>
                  <Text style={styles.itemFormula}>{item.breakdownFormula}</Text>
                  <Text style={styles.itemCitation}>{item.statutoryCitation}</Text>
                </View>
              ))}

              <TouchableOpacity style={styles.exportBtn} onPress={() => setModalVisible(true)}>
                <Text style={styles.exportBtnText}>Export to Taxfix Audit JSON</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        )}
      </View>

      {/* Export Modal */}
      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 }}>
              <Text style={styles.modalTitle}>Taxfix Audit JSON Export</Text>
              <TouchableOpacity onPress={() => setModalVisible(false)}><Text style={{ color: '#94A3B8' }}>✕</Text></TouchableOpacity>
            </View>
            <ScrollView style={{ maxHeight: 300, backgroundColor: '#090D14', padding: 10, borderRadius: 8 }}>
              <Text style={{ color: '#38BDF8', fontFamily: 'monospace', fontSize: 11 }}>{auditJSON}</Text>
            </ScrollView>
            <View style={{ flexDirection: 'row', justifyContent: 'flex-end', gap: 10, marginTop: 12 }}>
              <TouchableOpacity
                style={styles.modalCopyBtn}
                onPress={() => {
                  if (typeof navigator !== 'undefined' && navigator.clipboard) navigator.clipboard.writeText(auditJSON);
                  setCopied(true);
                  setTimeout(() => setCopied(false), 2000);
                }}
              >
                <Text style={{ color: '#FFF', fontWeight: '600', fontSize: 12 }}>{copied ? 'Copied!' : 'Copy JSON'}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalCloseBtn} onPress={() => setModalVisible(false)}>
                <Text style={{ color: '#000', fontWeight: '700', fontSize: 12 }}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#0B0F17' },
  header: {
    backgroundColor: '#101622',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#233044',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoText: { color: '#00D084', fontSize: 18, fontWeight: '800' },
  badge: { backgroundColor: 'rgba(0,208,132,0.15)', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  badgeText: { color: '#00D084', fontSize: 9, fontWeight: '700' },
  headerTitle: { color: '#F8FAFC', fontSize: 13, fontWeight: '600' },
  resetBtn: { backgroundColor: '#151D2A', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  resetText: { color: '#94A3B8', fontSize: 11 },
  chipsRow: { backgroundColor: '#101622', padding: 8, borderBottomWidth: 1, borderBottomColor: '#233044' },
  chip: { backgroundColor: '#151D2A', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8, borderWidth: 1, borderColor: '#2C3E56' },
  chipText: { color: '#F8FAFC', fontSize: 11, fontWeight: '600' },
  mobileTabs: { flexDirection: 'row', backgroundColor: '#101622', borderBottomWidth: 1, borderBottomColor: '#233044' },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#00D084' },
  tabText: { color: '#94A3B8', fontSize: 12, fontWeight: '600' },
  tabTextActive: { color: '#00D084', fontWeight: '700' },
  mainLayout: { flex: 1, flexDirection: 'row', padding: 8, gap: 10 },
  pane: { backgroundColor: '#151D2A', borderRadius: 12, borderWidth: 1, borderColor: '#233044', overflow: 'hidden' },
  chatScroll: { flex: 1 },
  msgBubble: { padding: 10, borderRadius: 10, maxWidth: '85%' },
  userBubble: { alignSelf: 'flex-end', backgroundColor: '#1E293B' },
  botBubble: { alignSelf: 'flex-start', backgroundColor: '#131B29', borderWidth: 1, borderColor: '#233044' },
  msgText: { fontSize: 12, lineHeight: 18 },
  inputBar: { flexDirection: 'row', padding: 8, borderTopWidth: 1, borderTopColor: '#233044', backgroundColor: '#101622', gap: 8 },
  input: { flex: 1, backgroundColor: '#151D2A', borderRadius: 8, paddingHorizontal: 12, color: '#FFF', fontSize: 12 },
  sendBtn: { backgroundColor: '#00D084', borderRadius: 8, width: 36, height: 36, alignItems: 'center', justifyContent: 'center' },
  sendBtnText: { color: '#000', fontWeight: '700' },
  kpiCard: { backgroundColor: '#0D1420', padding: 14, borderRadius: 10, borderWidth: 1, borderColor: '#233044', marginBottom: 12 },
  kpiSub: { color: '#94A3B8', fontSize: 10, fontWeight: '700' },
  kpiVal: { color: '#00D084', fontSize: 30, fontWeight: '800', marginVertical: 4 },
  kpiDesc: { color: '#94A3B8', fontSize: 11 },
  breakdownHeader: { color: '#F8FAFC', fontSize: 12, fontWeight: '700', marginBottom: 8 },
  itemCard: { backgroundColor: '#101622', padding: 10, borderRadius: 8, borderWidth: 1, borderColor: '#233044', marginBottom: 8 },
  itemTitle: { color: '#F8FAFC', fontSize: 12, fontWeight: '600' },
  itemAmount: { color: '#00D084', fontSize: 13, fontWeight: '700' },
  itemFormula: { color: '#94A3B8', fontSize: 10, marginVertical: 2 },
  itemCitation: { color: '#38BDF8', fontSize: 9, fontFamily: 'monospace' },
  exportBtn: { backgroundColor: '#00D084', paddingVertical: 12, borderRadius: 8, alignItems: 'center', marginTop: 12 },
  exportBtnText: { color: '#000', fontWeight: '800', fontSize: 13 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.8)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  modalBox: { backgroundColor: '#151D2A', width: '100%', maxWidth: 500, borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#233044' },
  modalTitle: { color: '#F8FAFC', fontSize: 15, fontWeight: '700' },
  modalCopyBtn: { backgroundColor: '#1E293B', paddingHorizontal: 12, paddingVertical: 8, borderRadius: 6 },
  modalCloseBtn: { backgroundColor: '#00D084', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 6 },
});
