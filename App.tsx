import React, { useState } from 'react';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
} from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { THEME } from './constants/theme';
import { Header } from './components/Header';
import { QuickChips } from './components/QuickChips';
import { CopilotChat } from './components/CopilotChat';
import { DeductionCard } from './components/DeductionCard';
import { ExportAuditModal } from './components/ExportAuditModal';
import { AppIcon } from './components/Icon';
import { calculateDeductions } from './services/taxEngine';
import { executeCopilotQuery, PROMPT_CHIPS } from './services/copilotService';
import { ChatMessage, TaxCalculationResult, TaxInputParameters } from './types/tax';

const INITIAL_PARAMS: TaxInputParameters = {
  relocationType: 'single',
  homeOfficeDays: 140,
  equipmentCosts: 1200,
  marginalTaxRate: 0.40,
  includeInternetAllowance: false,
};

export default function App() {
  const { width } = useWindowDimensions();
  const isDesktop = width >= 860;

  // Parameters & Calculations
  const [parameters, setParameters] = useState<TaxInputParameters>(INITIAL_PARAMS);
  const [calculation, setCalculation] = useState<TaxCalculationResult>(() =>
    calculateDeductions(INITIAL_PARAMS)
  );

  // Chat & Agent State
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    const initialCalc = calculateDeductions(INITIAL_PARAMS);
    return [
      {
        id: 'msg_init_user',
        sender: 'user',
        text: 'I moved to Berlin for a software job as a single engineer, bought a €1,200 MacBook, and worked from home 140 days.',
        timestamp: '10:00 AM',
      },
      {
        id: 'msg_init_assistant',
        sender: 'assistant',
        text:
          'I parsed your setup and executed statutory deduction calculations via **`calculate_german_deductions`**.\n\n' +
          '### Key Deductions Identified:\n' +
          '- 🏠 **Home Office (€840)**: 140 days @ €6.00/day (*§ 4 Abs. 5 EStG*). No dedicated study room required!\n' +
          '- 📦 **Relocation Flat Rate (€964)**: Claiming statutory *Umzugskostenpauschale* for single expat relocation (*§ 9 Abs. 1 EStG*).\n' +
          '- 💻 **Tech Work Equipment (€1,200)**: Under BMF 2022 guidelines (*BMF 22.02.2022*), software developer hardware is eligible for **100% immediate write-off** in year 1.\n\n' +
          'Your itemized total of **€3.004** exceeds the German standard employee allowance (*Arbeitnehmer-Pauschbetrag* of €1,230) by **€1.774**!\n\n' +
          '💡 **Estimated Refund Boost:** **+€1.202** (at a 40% marginal tax bracket). Audit safety rating is **95%**.',
        timestamp: '10:00 AM',
        toolCall: {
          name: 'calculate_german_deductions',
          parameters: {
            relocationType: 'single',
            homeOfficeDays: 140,
            equipmentCosts: 1200,
            marginalTaxRate: 0.40,
          },
          status: 'success',
          summary: 'Computed €3.004 deductions (+€1.202 refund boost)',
        },
        calculationSnapshot: initialCalc,
      },
    ];
  });

  const [isLoading, setIsLoading] = useState(false);
  const [activePrompt, setActivePrompt] = useState('');
  const [exportModalVisible, setExportModalVisible] = useState(false);
  const [mobileTab, setMobileTab] = useState<'chat' | 'card'>('chat');

  // Trigger agent tool execution
  const handleSendMessage = async (queryText: string) => {
    if (!queryText.trim() || isLoading) return;

    // 1. Add user message
    const userMessage: ChatMessage = {
      id: `msg_u_${Date.now()}`,
      sender: 'user',
      text: queryText,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // 2. Execute Copilot query (agent parsing + tool calling + tax calculation)
      const res = await executeCopilotQuery(queryText, parameters);

      // 3. Update state
      setParameters(res.toolCallPayload.parameters as TaxInputParameters);
      setCalculation(res.calculationResult);
      setMessages(prev => [...prev, res.copilotMessage]);
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  };

  // Direct parameter adjustments from DeductionCard sliders
  const handleUpdateParameters = (newParams: Partial<TaxInputParameters>) => {
    const updated = { ...parameters, ...newParams };
    setParameters(updated);
    const newCalc = calculateDeductions(updated);
    setCalculation(newCalc);
  };

  // Prompt chip click handler
  const handleSelectChip = (promptText: string) => {
    setActivePrompt(promptText);
    handleSendMessage(promptText);
    if (!isDesktop) {
      setMobileTab('chat');
    }
  };

  // Reset to initial clean state
  const handleReset = () => {
    const freshParams: TaxInputParameters = {
      relocationType: 'none',
      homeOfficeDays: 0,
      equipmentCosts: 0,
      marginalTaxRate: 0.40,
    };
    setParameters(freshParams);
    setCalculation(calculateDeductions(freshParams));
    setMessages([
      {
        id: `msg_reset_${Date.now()}`,
        sender: 'assistant',
        text: 'Deductions reset. Select a prompt chip above or describe your work scenario to re-calculate your German tax benefits.',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />

      {/* Main App Container */}
      <View style={styles.appContainer}>
        {/* Navigation Header */}
        <Header onReset={handleReset} />

        {/* Quick Expat & Tech Prompt Chips */}
        <QuickChips onSelectChip={handleSelectChip} disabled={isLoading} />

        {/* Mobile Tab Toggle (Width < 860px) */}
        {!isDesktop && (
          <View style={styles.mobileTabBar}>
            <TouchableOpacity
              style={[styles.mobileTabButton, mobileTab === 'chat' && styles.mobileTabActive]}
              onPress={() => setMobileTab('chat')}
            >
              <AppIcon
                name="sparkles"
                size={14}
                color={mobileTab === 'chat' ? THEME.colors.primary : THEME.colors.textMuted}
              />
              <Text style={[styles.mobileTabText, mobileTab === 'chat' && styles.mobileTabTextActive]}>
                Copilot Chat
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.mobileTabButton, mobileTab === 'card' && styles.mobileTabActive]}
              onPress={() => setMobileTab('card')}
            >
              <AppIcon
                name="trending-up"
                size={14}
                color={mobileTab === 'card' ? THEME.colors.primary : THEME.colors.textMuted}
              />
              <Text style={[styles.mobileTabText, mobileTab === 'card' && styles.mobileTabTextActive]}>
                Live Deductions (+€{calculation.estimatedRefundBoost.toLocaleString('de-DE')})
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Main Body: Desktop Dual-View or Mobile Tabbed View */}
        <View style={styles.bodyContainer}>
          {isDesktop ? (
            // Desktop Split Layout
            <View style={styles.desktopLayout}>
              <View style={styles.leftPane}>
                <CopilotChat
                  messages={messages}
                  onSendMessage={handleSendMessage}
                  isLoading={isLoading}
                  activePrompt={activePrompt}
                  onChangePrompt={setActivePrompt}
                />
              </View>

              <View style={styles.rightPane}>
                <DeductionCard
                  calculation={calculation}
                  parameters={parameters}
                  onUpdateParameters={handleUpdateParameters}
                  onOpenExportModal={() => setExportModalVisible(true)}
                />
              </View>
            </View>
          ) : (
            // Mobile Stack / Tabbed View
            <View style={styles.mobileLayout}>
              {mobileTab === 'chat' ? (
                <CopilotChat
                  messages={messages}
                  onSendMessage={handleSendMessage}
                  isLoading={isLoading}
                  activePrompt={activePrompt}
                  onChangePrompt={setActivePrompt}
                />
              ) : (
                <View style={styles.mobileCardContainer}>
                  <DeductionCard
                    calculation={calculation}
                    parameters={parameters}
                    onUpdateParameters={handleUpdateParameters}
                    onOpenExportModal={() => setExportModalVisible(true)}
                  />
                </View>
              )}
            </View>
          )}
        </View>

        {/* Export to Taxfix Audit JSON Modal */}
        <ExportAuditModal
          visible={exportModalVisible}
          onClose={() => setExportModalVisible(false)}
          parameters={parameters}
          calculation={calculation}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  appContainer: {
    flex: 1,
    backgroundColor: THEME.colors.background,
    display: 'flex',
    flexDirection: 'column',
  },
  mobileTabBar: {
    flexDirection: 'row',
    backgroundColor: THEME.colors.backgroundAlt,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.cardBorder,
  },
  mobileTabButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  mobileTabActive: {
    borderBottomColor: THEME.colors.primary,
    backgroundColor: 'rgba(0, 208, 132, 0.05)',
  },
  mobileTabText: {
    color: THEME.colors.textMuted,
    fontSize: 12,
    fontWeight: '600',
  },
  mobileTabTextActive: {
    color: THEME.colors.primary,
    fontWeight: '700',
  },
  bodyContainer: {
    flex: 1,
  },
  desktopLayout: {
    flex: 1,
    flexDirection: 'row',
    padding: 16,
    gap: 16,
    maxWidth: 1440,
    alignSelf: 'center',
    width: '100%',
  },
  leftPane: {
    flex: 5,
    borderRadius: THEME.radius.lg,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: THEME.colors.cardBorder,
  },
  rightPane: {
    flex: 4,
    borderRadius: THEME.radius.lg,
    overflow: 'hidden',
  },
  mobileLayout: {
    flex: 1,
  },
  mobileCardContainer: {
    flex: 1,
    padding: 12,
  },
});
